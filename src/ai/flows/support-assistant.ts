'use server';

import { ai } from '@/ai/genkit';

export async function askSupportAssistant(question: string, chatHistory: { role: 'user' | 'model', content: string }[]) {
  const trimmedQuestion = (question || '').trim();
  if (!trimmedQuestion) {
    return "Please enter a question so I can assist you.";
  }
  if (trimmedQuestion.length > 1000) {
    return "Your question is too long. Please limit your question to 1,000 characters.";
  }

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

    // Map bounded history to prompt format
    const historyPrompt = (chatHistory || [])
      .slice(-10)
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${(msg.content || '').substring(0, 500)}`)
      .join('\n');

    const prompt = `You are LakerAI Support Assistant, a friendly, helpful GVSU virtual assistant. You help GVSU users learn how to use LakerAI, search/filter tools, recommend new tools, report inaccuracies, check feedback status, and resolve issues. Use the provided help center context to answer user questions accurately. Keep your answers concise, formatted in markdown, and tailored to GVSU terminology.

${knowledgeBaseContext}

Chat History:
${historyPrompt}

User: ${trimmedQuestion}
Assistant:`;

    const response = await ai.generate({ prompt });
    return response.text || "I'm sorry, I couldn't process that question. Can you try again?";
  } catch (error) {
    console.warn("AI Support Assistant falling back to Knowledge Base:", error);
    const q = trimmedQuestion.toLowerCase();
    if (q.includes("submit") || q.includes("recommend") || q.includes("add")) {
      return "**Submitting a Tool to LakerAI Directory**\n\nLakers can recommend new AI tools using the **Submit New Tool** button on the Discovery Hub or from **My Tools** (`/dashboard`). Make sure you are signed in with a verified `@gvsu.edu` or `@mail.gvsu.edu` account. Submissions enter the Governance review queue before publication.";
    }
    if (q.includes("report") || q.includes("mistake") || q.includes("error") || q.includes("broken")) {
      return "**Reporting a Mistake or Inaccuracy**\n\nYou can flag outdated links, grading inaccuracies, or privacy concerns by clicking **Report a Mistake** in the top navigation bar or **Report Inaccuracy** inside any tool's Alignment Report Card.";
    }
    if (q.includes("ferpa") || q.includes("privacy") || q.includes("security") || q.includes("risk")) {
      return "**GVSU Compliance & Risk Grades**\n\nEvery tool in the LakerAI Directory is evaluated across **Security & Privacy**, **Pedagogical Value**, **Ethics & Stewardship**, and **Access & Cost** (scored 1–5). Use the **Audit Filters** (`FERPA Compliant`, `PII Safe`, `IP Protected`, `Laker Green`) on the Discovery Hub to filter tools by institutional compliance.";
    }
    if (q.includes("prompt")) {
      return "**Community Prompt Library**\n\nVisit the **Prompt Library** (`/prompt-library`) to browse, filter, and copy vetted academic prompts for ChatGPT, Claude, Gemini, Perplexity, and GitHub Copilot, or submit your own prompt templates for faculty review.";
    }
    return "**GVSU LakerAI Support Assistant**\n\nHere is how to get the most out of the LakerAI Directory:\n- **Search & Filter Tools**: Use the Discovery Hub search bar, category pills, or Audit Filters (`FERPA Compliant`, `PII Safe`).\n- **Recommend a Tool**: Click **Submit New Tool** on the homepage while signed in with your `@gvsu.edu` account.\n- **Report an Issue**: Click **Report a Mistake** in the header or use the **Community Feedback** tab to log feature requests and bug reports.";
  }
}
