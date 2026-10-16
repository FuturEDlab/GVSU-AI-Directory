'use server';

import { ai, AI_MODELS } from '@/ai/genkit';

const GVSU_KNOWLEDGE_BASE = `
1. **Overview**: LakerAI Directory is the definitive institutional directory for AI tools at Grand Valley State University (GVSU). It helps students, faculty, and staff discover vetted AI tools, understand GVSU 4-pillar alignment grades (Security & Privacy, Pedagogical Value, Ethics & Stewardship, and Access & Cost), and browse the Community Prompt Library.
2. **Finding & Filtering Tools**: Users can search via the AI-powered Discovery Hub search bar on the homepage, filter by category pills (Writing Assistants, Image Generation, Data Analysis, Research Assistant, Coding Assistant, Video/Audio, Education, Other), or toggle Audit Filters ("FERPA Compliant", "PII Safe", "IP Protected", "Laker Green").
3. **Submitting a Tool**: Lakers signed in with a verified @gvsu.edu or @mail.gvsu.edu account can recommend new tools via the "Submit New Tool" button on the homepage or in "My Tools" (/dashboard). Submissions enter the Governance Hub Pending queue for administrator compliance review before going live.
4. **Prompt Library**: Visit /prompt-library to search, filter, and copy vetted academic prompts for ChatGPT, Claude, Gemini, Perplexity, and GitHub Copilot, or submit new prompt templates for faculty moderation.
5. **Reporting a Mistake**: If a tool has outdated links, grading inaccuracies, or privacy concerns, users can click "Report a Mistake" in the header or inside any tool's Alignment Report Card.
6. **Community Feedback**: The Feedback tab (/help) allows users to submit and upvote bugs, feature requests, and improvements tracked from OPEN -> IN_PROGRESS -> COMPLETED_PENDING_APPROVAL -> VERIFIED_CLOSED.
`;

export async function askSupportAssistant(
  question: string,
  chatHistory: { role: 'user' | 'model'; content: string }[]
) {
  const trimmedQuestion = (question || '').trim();
  if (!trimmedQuestion) {
    return 'Please enter a question so I can assist you.';
  }
  if (trimmedQuestion.length > 1000) {
    return 'Your question is too long. Please limit your question to 1,000 characters.';
  }

  try {
    const historyPrompt = (chatHistory || [])
      .slice(-8)
      .map(
        msg =>
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${(msg.content || '').substring(0, 500)}`
      )
      .join('\n');

    const prompt = `<system_role>
You are the LakerAI Support Assistant, the official virtual help desk agent for Grand Valley State University's LakerAI Directory.
Answer user questions accurately and concisely using ONLY the <gvsu_knowledge_base> below. Format your response in clean GitHub-flavored Markdown.
If a user asks for general academic homework completion unrelated to the LakerAI Directory, politely redirect them to browse vetted tools in the Discovery Hub.
</system_role>

<gvsu_knowledge_base>
${GVSU_KNOWLEDGE_BASE}
</gvsu_knowledge_base>

<conversation_history>
${historyPrompt || 'None'}
</conversation_history>

<user_query>
${trimmedQuestion}
</user_query>`;

    const response = await ai.generate({
      model: AI_MODELS.FAST,
      prompt,
      config: { temperature: 0.2 },
    });
    return (
      response.text ||
      "I'm sorry, I couldn't process that question. Can you try again?"
    );
  } catch (error) {
    console.warn('AI Support Assistant falling back to Knowledge Base:', error);
    const q = trimmedQuestion.toLowerCase();
    if (q.includes('submit') || q.includes('recommend') || q.includes('add')) {
      return '**Submitting a Tool to LakerAI Directory**\n\nLakers can recommend new AI tools using the **Submit New Tool** button on the Discovery Hub or from **My Tools** (`/dashboard`). Make sure you are signed in with a verified `@gvsu.edu` or `@mail.gvsu.edu` account. Submissions enter the Governance review queue before publication.';
    }
    if (
      q.includes('report') ||
      q.includes('mistake') ||
      q.includes('error') ||
      q.includes('broken')
    ) {
      return "**Reporting a Mistake or Inaccuracy**\n\nYou can flag outdated links, grading inaccuracies, or privacy concerns by clicking **Report a Mistake** in the top navigation bar or **Report Inaccuracy** inside any tool's Alignment Report Card.";
    }
    if (
      q.includes('ferpa') ||
      q.includes('privacy') ||
      q.includes('security') ||
      q.includes('risk')
    ) {
      return '**GVSU Compliance & Risk Grades**\n\nEvery tool in the LakerAI Directory is evaluated across **Security & Privacy**, **Pedagogical Value**, **Ethics & Stewardship**, and **Access & Cost** (scored 1–5). Use the **Audit Filters** (`FERPA Compliant`, `PII Safe`, `IP Protected`, `Laker Green`) on the Discovery Hub to filter tools by institutional compliance.';
    }
    if (q.includes('prompt')) {
      return '**Community Prompt Library**\n\nVisit the **Prompt Library** (`/prompt-library`) to browse, filter, and copy vetted academic prompts for ChatGPT, Claude, Gemini, Perplexity, and GitHub Copilot, or submit your own prompt templates for faculty review.';
    }
    return '**GVSU LakerAI Support Assistant**\n\nHere is how to get the most out of the LakerAI Directory:\n- **Search & Filter Tools**: Use the Discovery Hub search bar, category pills, or Audit Filters (`FERPA Compliant`, `PII Safe`).\n- **Recommend a Tool**: Click **Submit New Tool** on the homepage while signed in with your `@gvsu.edu` account.\n- **Report an Issue**: Click **Report a Mistake** in the header or use the **Community Feedback** tab to log feature requests and bug reports.';
  }
}
