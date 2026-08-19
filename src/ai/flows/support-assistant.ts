'use server';

import { ai } from '@/ai/genkit';

export async function askSupportAssistant(question: string, chatHistory: { role: 'user' | 'model', content: string }[]) {
  try {
    const knowledgeBaseContext = `
GVSU LakerAI Directory Help Center Context:
1. **Overview**: LakerAI Directory is the definitive institutional directory for AI tools at Grand Valley State University (GVSU). It helps students, faculty, and staff discover approved AI tools, understand GVSU category grades (FERPA compliance, access/cost, institutional status, pedagogical value, ethics/stewardship), and review AI audits.
2. **Finding & Filtering Tools**: Users can search for tools on the homepage using the main search bar or filter by category tags like "FERPA Compliant", "SSO Supported", "PII Safe", "GVSU Sanctioned", or "Accessibility Approved".
3. **Submitting a Tool**: Lakers can recommend new tools via the "Recommend Tool" button in their dashboard. Submissions enter a Staging/Pending queue for administrator audit and compliance review before going live.
4. **Reporting a Mistake**: If a tool has outdated links, incorrect details, or privacy concerns, users can click "Report a Mistake" on any tool card or disclaimer. Admins review reports in the Governance Hub and update status to Resolved or Dismissed.
5. **Community Feedback**: The Feedback Board (/help/feedback) allows users to submit bugs, feature requests, and improvements. Other users can upvote feedback. Admins progress items through: OPEN -> IN_PROGRESS -> COMPLETED_PENDING_APPROVAL -> VERIFIED_CLOSED.
6. **Validating Completed Issues**: When a feedback item is marked as COMPLETED_PENDING_APPROVAL, only the original author and merged contributors can click [Validate Fix & Mark Complete] or [Reopen Issue].
7. **Theme Options**: Lakers can set theme preferences to Light, Dark, or System Default in the Settings page.
`;

    // Map history to prompt format
    const historyPrompt = chatHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `You are LakerAI Support Assistant, a friendly, helpful GVSU virtual assistant. You help GVSU users learn how to use LakerAI, search/filter tools, recommend new tools, report inaccuracies, check feedback status, and resolve issues. Use the provided help center context to answer user questions accurately. Keep your answers concise, formatted in markdown, and tailored to GVSU terminology.

${knowledgeBaseContext}

Chat History:
${historyPrompt}

User: ${question}
Assistant:`;

    const response = await ai.generate({ prompt });
    return response.text || "I'm sorry, I couldn't process that question. Can you try again?";
  } catch (error) {
    console.error("AI Assistant error:", error);
    return "The AI assistant is currently offline. Please try again later or browse the Knowledge Base articles.";
  }
}
