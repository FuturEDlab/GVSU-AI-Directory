'use server';

import { ai, AI_MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb } from '@/lib/firebase-admin';
import {
  SimplifiedTool,
  retrieveCandidates,
  scoreTool,
  normalizeTokens,
} from '@/ai/utils/tool-retrieval';

// ---------------------------------------------------------
// 1. SCHEMAS & TYPES
// ---------------------------------------------------------
const ToolMatchSchema = z.object({
  toolId: z
    .string()
    .describe(
      'Exact tool ID copied verbatim from the <tool_catalog> list (e.g. "elicit-seed"). Never invent IDs.'
    ),
  toolName: z
    .string()
    .describe('Exact tool name copied from the <tool_catalog> list.'),
  matchPercentage: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      'Integer match score from 51 to 100 reflecting alignment with the user query.'
    ),
  whyThisMatches: z
    .string()
    .describe(
      'Concise 1-2 sentence explanation (max 35 words) tailored to GVSU students or faculty explaining why this tool fits their academic workflow.'
    ),
});

const DiscoveryOutputSchema = z.object({
  intent: z
    .string()
    .describe(
      'A crisp 3-8 word summary of the academic or productivity task the user wants to accomplish.'
    ),
  clarifyingQuestion: z
    .string()
    .optional()
    .describe(
      'Optional short clarifying question ONLY when the user query is completely ambiguous and no candidate tool scores above 50%.'
    ),
  recommendations: z
    .array(ToolMatchSchema)
    .describe(
      'Up to 5 recommended tools from <tool_catalog> sorted by matchPercentage descending.'
    ),
});

export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>;

// ---------------------------------------------------------
// 2. SERVER-SIDE CACHING
// ---------------------------------------------------------
interface CacheEntry {
  data: SimplifiedTool[];
  timestamp: number;
}
let toolCache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getPublishedToolsSafe(): Promise<SimplifiedTool[]> {
  const now = Date.now();
  if (toolCache && now - toolCache.timestamp < CACHE_TTL_MS) {
    return toolCache.data;
  }

  try {
    const snapshot = await adminDb.collection('tools_published').get();
    const fetchedTools: SimplifiedTool[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.title || data.name || 'Unnamed Tool',
        description: (data.initialDescription || data.summary || '').substring(0, 300),
        category: data.category || 'General',
        tags: data.tags
          ? Object.entries(data.tags)
              .filter(([_, v]) => v)
              .map(([k]) => k)
              .join(', ')
          : '',
      };
    });

    if (fetchedTools.length > 0) {
      toolCache = {
        data: fetchedTools,
        timestamp: now,
      };
      return fetchedTools;
    }
    throw new Error('Admin SDK returned 0 tools; falling back to REST API.');
  } catch {
    console.warn('Firestore Admin failed or empty, attempting REST API fallback...');
    try {
      const projectId =
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gvsu-ai-directory';
      const dbId =
        process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
        'ai-studio-gvsulakeraidirec-b9840b1c-2365-40d8-a6ec-8d6b200bdbfb';
      const apiKey =
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        'AIzaSyAsGfF8zdXJVl3jwDq3fUDtUFlPBxlb9oU';
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/tools_published?key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.documents) {
        const fetchedTools = data.documents.map((doc: any) => {
          const fields = doc.fields;
          return {
            id: doc.name.split('/').pop(),
            name: fields.title?.stringValue || fields.name?.stringValue || 'Unnamed',
            description: (
              fields.initialDescription?.stringValue ||
              fields.summary?.stringValue ||
              ''
            ).substring(0, 300),
            category: fields.category?.stringValue || 'General',
            tags: fields.tags?.mapValue?.fields
              ? Object.keys(fields.tags.mapValue.fields).join(', ')
              : '',
          };
        });
        toolCache = { data: fetchedTools, timestamp: now };
        return fetchedTools;
      }
    } catch (restErr) {
      console.error('REST fallback failed:', restErr);
    }

    if (toolCache) {
      console.warn('Falling back to expired tool cache.');
      return toolCache.data;
    }

    const { INITIAL_SEED_TOOLS } = await import('@/app/lib/seed-tools');
    const seedFallback: SimplifiedTool[] = INITIAL_SEED_TOOLS.map(t => ({
      id: t.id,
      name: t.title,
      description: (t.initialDescription || t.pedagogicalNarrative || '').substring(0, 300),
      category: t.category,
      tags: t.tags
        ? [
            ...Object.keys(t.tags),
            ...Object.values(t.tags).flat(),
          ].join(', ')
        : '',
    }));
    toolCache = { data: seedFallback, timestamp: now };
    return seedFallback;
  }
}

// ---------------------------------------------------------
// 3. GEMINI 3 FLASH RERANKING PROMPT
// ---------------------------------------------------------
const toolDiscoveryPrompt = ai.definePrompt({
  name: 'toolDiscoveryPrompt',
  model: AI_MODELS.FAST,
  input: {
    schema: z.object({
      question: z.string(),
      chatHistory: z.string(),
      toolsString: z.string(),
    }),
  },
  output: { schema: DiscoveryOutputSchema },
  config: { temperature: 0.1 },
  prompt: `<system_role>
You are the LakerAI Tool Discovery Assistant for Grand Valley State University (GVSU).
Your mission is to analyze the user's academic, research, or creative goal and recommend the best-matching vetted AI tools strictly from the <tool_catalog> below.
</system_role>

<tool_catalog>
{{{toolsString}}}
</tool_catalog>

<conversation_history>
{{{chatHistory}}}
</conversation_history>

<user_query>
{{{question}}}
</user_query>

<scoring_rubric>
1. Parse the user's core academic or workflow intent (use <conversation_history> if the query is a follow-up).
2. Score each candidate in <tool_catalog> using these integer brackets:
   - 90-100: Direct, primary tool for the exact task requested.
   - 80-89: Strong match with closely aligned capabilities.
   - 70-79: Good secondary match or complementary workflow tool.
   - 51-69: Partial or tangential relevance.
   - 0-50: Irrelevant (exclude from recommendations).
3. Return up to 5 tools scoring > 50, ordered highest matchPercentage first.
4. ONLY if the query is completely unintelligible or no tool in <tool_catalog> scores > 50, return an empty recommendations array and populate clarifyingQuestion.
5. NEVER invent or alter toolId or toolName values outside <tool_catalog>.
</scoring_rubric>`,
});

// ---------------------------------------------------------
// 4. SERVER ACTION ENTRY POINT
// ---------------------------------------------------------
export async function discoverTools(
  question: string,
  chatHistoryMsgs: { role: 'user' | 'assistant'; content: string }[]
): Promise<DiscoveryOutput> {
  if (!question || question.trim().length === 0) {
    throw new Error('Question cannot be empty.');
  }

  if (question.length > 500) {
    throw new Error('Question is too long. Please limit to 500 characters.');
  }

  try {
    const allTools = await getPublishedToolsSafe();
    if (!allTools.length) {
      return { intent: 'No tools available', recommendations: [] };
    }

    const candidates = retrieveCandidates(allTools, question);

    const safeHistory = chatHistoryMsgs.slice(-4);
    const historyPrompt = safeHistory
      .map(
        msg =>
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 300)}`
      )
      .join('\n');

    const toolsString = candidates
      .map(
        t =>
          `<tool id="${t.id}" name="${t.name}" category="${t.category}" tags="${t.tags || 'none'}">${t.description}</tool>`
      )
      .join('\n');

    try {
      const { output } = await toolDiscoveryPrompt({
        question,
        chatHistory: historyPrompt,
        toolsString,
      });

      if (output) {
        const validCandidateIds = new Set(candidates.map(c => c.id));
        const filteredRecs = (output.recommendations || [])
          .filter(rec => validCandidateIds.has(rec.toolId))
          .filter(
            rec =>
              typeof rec.matchPercentage === 'number' &&
              rec.matchPercentage > 50 &&
              rec.matchPercentage <= 100
          )
          .sort((a, b) => b.matchPercentage - a.matchPercentage)
          .slice(0, 5);

        if (filteredRecs.length > 0 || output.clarifyingQuestion) {
          return {
            intent: output.intent || question,
            clarifyingQuestion: output.clarifyingQuestion,
            recommendations: filteredRecs,
          };
        }
      }
    } catch (geminiErr) {
      console.warn(
        'Gemini 3 Flash reranking unavailable; using deterministic candidate scoring fallback:',
        geminiErr
      );
    }

    const queryTokens = normalizeTokens(question);
    const scoredFallback = candidates
      .map((t, idx) => {
        const rawScore = scoreTool(t, queryTokens);
        const matchPercentage =
          rawScore > 0 ? Math.min(96, 74 + rawScore * 3) : Math.max(62, 82 - idx * 5);
        return {
          toolId: t.id,
          toolName: t.name,
          matchPercentage,
          whyThisMatches: `${t.category} — ${t.description || 'Vetted institutional AI tool matching your query.'}`,
          rawScore,
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 4)
      .map(({ rawScore: _, ...rec }) => rec);

    return {
      intent: question,
      recommendations: scoredFallback,
    };
  } catch (error) {
    console.error('AI Discovery error:', error);
    throw new Error('Unable to complete tool search. Please try again.');
  }
}
