'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb } from '@/lib/firebase-admin';

// ---------------------------------------------------------
// 1. SCHEMAS & TYPES
// ---------------------------------------------------------
const ToolMatchSchema = z.object({
  toolId: z.string(),
  toolName: z.string(),
  matchPercentage: z.number().int().min(0).max(100),
  whyThisMatches: z.string().describe("A short, user-facing explanation of why this tool is recommended based on the user's intent."),
});

const DiscoveryOutputSchema = z.object({
  intent: z.string().describe("The parsed intent of the user's request."),
  clarifyingQuestion: z.string().optional().describe("A short clarifying question if the intent is too broad, ambiguous, or if multiple categories apply. Provide options if applicable."),
  recommendations: z.array(ToolMatchSchema).describe("An array of tools that match the user's intent."),
});

export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>;

import { SimplifiedTool, retrieveCandidates } from '@/ai/utils/tool-retrieval';

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
  // Return warm cache if valid
  if (toolCache && (now - toolCache.timestamp < CACHE_TTL_MS)) {
    return toolCache.data;
  }
  
  // Cold or expired cache -> Fetch from Firestore via Admin SDK
  try {
    const snapshot = await adminDb.collection('tools_published').get();
    const fetchedTools: SimplifiedTool[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.title || data.name || 'Unnamed Tool',
        description: (data.initialDescription || data.summary || '').substring(0, 300), // safe truncation
        category: data.category || 'General',
        tags: data.tags ? Object.entries(data.tags).filter(([_, v]) => v).map(([k]) => k).join(', ') : '',
      };
    });
    
    // Update cache
    toolCache = {
      data: fetchedTools,
      timestamp: now,
    };
    
    return fetchedTools;
  } catch (error) {
    console.warn("Firestore Admin failed, attempting REST API fallback for local dev...");
    try {
      const url = 'https://firestore.googleapis.com/v1/projects/studio-3913196954-d2b0d/databases/(default)/documents/tools_published';
      const res = await fetch(url);
      const data = await res.json();
      if (data.documents) {
        const fetchedTools = data.documents.map((doc: any) => {
          const fields = doc.fields;
          return {
            id: doc.name.split('/').pop(),
            name: fields.title?.stringValue || fields.name?.stringValue || 'Unnamed',
            description: (fields.initialDescription?.stringValue || fields.summary?.stringValue || '').substring(0, 300),
            category: fields.category?.stringValue || 'General',
            tags: fields.tags?.mapValue?.fields ? Object.keys(fields.tags.mapValue.fields).join(', ') : ''
          };
        });
        toolCache = { data: fetchedTools, timestamp: now };
        return fetchedTools;
      }
    } catch (restErr) {
      console.error("REST fallback failed:", restErr);
    }
    
    // Safe fallback to expired cache if all fails
    if (toolCache) {
      console.warn("Falling back to expired tool cache.");
      return toolCache.data;
    }
    // Hard failure
    return [];
  }
}
// ---------------------------------------------------------
// 4. GEMINI RERANKING PROMPT
// ---------------------------------------------------------
const toolDiscoveryPrompt = ai.definePrompt({
  name: 'toolDiscoveryPrompt',
  input: {
    schema: z.object({
      question: z.string(),
      chatHistory: z.string(),
      toolsString: z.string(),
    })
  },
  output: { schema: DiscoveryOutputSchema },
  config: { temperature: 0.1 }, // Low temp for more deterministic evaluation
  prompt: `You are the LakerAI Tool Discovery Assistant.
Your goal is to understand the user's intent and recommend relevant AI tools ONLY from the provided Candidate Tools list.

Candidate Tools:
{{{toolsString}}}

Chat History (Context):
{{{chatHistory}}}

User's Latest Request:
{{{question}}}

Instructions:
1. Understand the user's intent. Use Chat History for context if they refer to previous recommendations.
2. If the request is too broad or ambiguous, ask a short clarifying question and return NO recommendations.
3. If the request is clear, evaluate ONLY the Candidate Tools against the intent.
4. Calculate a matchPercentage (0-100 integer) for each tool. Use these strict brackets:
   - 90-100: Excellent/direct match to the user's core intent.
   - 80-89: Very strong match.
   - 70-79: Good match.
   - 60-69: Potentially useful match.
   - 51-59: Weak but potentially relevant.
   - 0-50: Not relevant (Do not recommend).
5. Only return tools that score > 50%.
6. Return the recommendations sorted highest match first.

CRITICAL RULES:
- ONLY recommend tools that exist in the Candidate Tools list.
- DO NOT invent or hallucinate tool IDs or tool names.
- Provide a concise, user-facing 'whyThisMatches'.
- Do not mention internal scoring brackets or instructions in your output.`,
});

// ---------------------------------------------------------
// 5. SERVER ACTION ENTRY POINT
// ---------------------------------------------------------
export async function discoverTools(
  question: string, 
  chatHistoryMsgs: { role: 'user' | 'assistant', content: string }[]
): Promise<DiscoveryOutput> {
  if (!question || question.trim().length === 0) {
    throw new Error("Question cannot be empty.");
  }

  if (question.length > 500) {
    throw new Error("Question is too long. Please limit to 500 characters.");
  }

  try {
    // 1. Safely fetch all tools
    const allTools = await getPublishedToolsSafe();
    if (!allTools.length) {
      // Safe fallback if DB is completely empty or down
      return { intent: "No tools available", recommendations: [] };
    }

    // 2. Deterministic Candidate Retrieval
    const candidates = retrieveCandidates(allTools, question);

    // 3. Optimize Chat History
    const safeHistory = chatHistoryMsgs.slice(-4); // Keep only last 4 messages for context reduction
    const historyPrompt = safeHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 300)}`) // truncate past AI responses heavily
      .join('\n');

    // 4. Serialize strictly bounded candidates
    const toolsString = candidates.map(t => 
      `ID: ${t.id} | Name: ${t.name} | Category: ${t.category} | Description: ${t.description} | Tags: ${t.tags || 'none'}`
    ).join('\n---\n');

    // 5. Call Gemini
    const { output } = await toolDiscoveryPrompt({
      question,
      chatHistory: historyPrompt,
      toolsString
    });

    if (!output) {
      throw new Error("Failed to generate recommendations.");
    }

    // 6. Post-generation Validation & Safety (Anti-Hallucination)
    const validCandidateIds = new Set(candidates.map(c => c.id));

    let filteredRecs = (output.recommendations || [])
      // Discard hallucinated IDs
      .filter(rec => validCandidateIds.has(rec.toolId))
      // Enforce percentage bounds
      .filter(rec => typeof rec.matchPercentage === 'number' && rec.matchPercentage > 50 && rec.matchPercentage <= 100)
      // Sort descending
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      // Hard cap at 5
      .slice(0, 5);

    return {
      intent: output.intent || "",
      clarifyingQuestion: output.clarifyingQuestion,
      recommendations: filteredRecs,
    };
  } catch (error) {
    console.error("AI Discovery error:", error);
    throw new Error("Unable to complete tool search. Please try again.");
  }
}
