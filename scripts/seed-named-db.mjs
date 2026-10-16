import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gvsu-ai-directory';
const DATABASE_ID =
  process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
  'ai-studio-gvsulakeraidirec-b9840b1c-2365-40d8-a6ec-8d6b200bdbfb';

export const INITIAL_SEED_TOOLS = [
  {
    id: "chatgpt-seed",
    title: "ChatGPT",
    category: "Writing Assistants",
    initialDescription: "Generative AI assistant for text composition, drafting, and ideation.",
    pedagogicalNarrative: "Low Risk. Helpful for brainstorming, but caution should be used to avoid pasting non-public university data or proprietary research.",
    toolUrl: "https://chatgpt.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "claude-seed",
    title: "Claude",
    category: "Writing Assistants",
    initialDescription: "Advanced AI chatbot specializing in long-form writing, synthesis, and deep reasoning.",
    pedagogicalNarrative: "Low Risk. Exceptionally strong in contextual synthesis and rubrics. Avoid feeding protected student identifiers.",
    toolUrl: "https://claude.ai",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "gemini-seed",
    title: "Gemini",
    category: "Writing Assistants",
    initialDescription: "Multimodal Google assistant integrated with Google Workspace search.",
    pedagogicalNarrative: "Low Risk. Excellent integration with research networks. Practice standard FERPA boundary limits.",
    toolUrl: "https://gemini.google.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "perplexity-seed",
    title: "Perplexity AI",
    category: "Research Assistant",
    initialDescription: "AI search engine providing conversational answers with inline citations.",
    pedagogicalNarrative: "Medium Risk. Great for preliminary literature reviews, but sources should be manually double-checked for potential hallucinations.",
    toolUrl: "https://www.perplexity.ai",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "elicit-seed",
    title: "Elicit",
    category: "Research Assistant",
    initialDescription: "AI research assistant that automates systematic literature reviews and data synthesis.",
    pedagogicalNarrative: "Medium Risk. Highly beneficial for scanning academic papers. Verify all extracted data tables for absolute accuracy.",
    toolUrl: "https://elicit.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "consensus-seed",
    title: "Consensus",
    category: "Research Assistant",
    initialDescription: "Scientific search engine utilizing AI to extract consensus evidence from peer-reviewed papers.",
    pedagogicalNarrative: "Low Risk. Provides meta-analytical perspectives on scientific hypotheses by aggregating cited peer-reviewed studies.",
    toolUrl: "https://consensus.app",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "researchrabbit-seed",
    title: "ResearchRabbit",
    category: "Research Assistant",
    initialDescription: "Visual mapping tool for exploring bibliographic citation networks and paper connections.",
    pedagogicalNarrative: "Low Risk. Encourages literature discoverability by creating dynamic connection maps of academic authors.",
    toolUrl: "https://www.researchrabbit.ai",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "grammarly-seed",
    title: "Grammarly",
    category: "Writing Assistants",
    initialDescription: "AI-powered writing helper offering corrections, flow enhancements, and tone metrics.",
    pedagogicalNarrative: "Low Risk. A solid aid for students. Be mindful of setting clear academic guidelines regarding AI editing limits.",
    toolUrl: "https://www.grammarly.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "canva-seed",
    title: "Canva Magic Studio",
    category: "Image Generation",
    initialDescription: "Suite of AI-driven tools for presentation design, templates, and generative imagery.",
    pedagogicalNarrative: "Low Risk. Empowers students to create high-quality academic presentations and infographics.",
    toolUrl: "https://www.canva.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "midjourney-seed",
    title: "Midjourney",
    category: "Image Generation",
    initialDescription: "High-fidelity text-to-image generator utilizing Discord interface for art composition.",
    pedagogicalNarrative: "Medium Risk. Great for creative design, but steep learning curve and requires subscription for serious usage.",
    toolUrl: "https://www.midjourney.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "dalle-seed",
    title: "DALL-E 3",
    category: "Image Generation",
    initialDescription: "Highly descriptive text-to-image generator created by OpenAI, integrated into ChatGPT.",
    pedagogicalNarrative: "Low Risk. Excellent for creating custom lecture slides, figures, and student design layouts.",
    toolUrl: "https://openai.com/index/dall-e-3",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "julius-seed",
    title: "Julius AI",
    category: "Data Analysis",
    initialDescription: "AI data assistant that analyzes spreadsheets, runs Python scripts, and graphs results.",
    pedagogicalNarrative: "Medium Risk. Extremely powerful for statistics. Never upload student grading rosters or proprietary datasets.",
    toolUrl: "https://julius.ai",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "tableau-seed",
    title: "Tableau AI",
    category: "Data Analysis",
    initialDescription: "Business intelligence analytics platform powered by Salesforce Einstein generative insights.",
    pedagogicalNarrative: "Low Risk. Highly secure. Excellent for visual analytics, but requires advanced training to integrate effectively.",
    toolUrl: "https://www.tableau.com/solutions/ai",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "copilot-seed",
    title: "GitHub Copilot",
    category: "Coding Assistant",
    initialDescription: "Cloud-based AI pair programmer that provides autocomplete suggestions in IDEs.",
    pedagogicalNarrative: "Medium Risk. Critical tool for computer science students. Setting clear expectations on grading policies is paramount.",
    toolUrl: "https://github.com/features/copilot",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "cursor-seed",
    title: "Cursor",
    category: "Coding Assistant",
    initialDescription: "An AI-first code editor fork of VS Code built to accelerate software development.",
    pedagogicalNarrative: "Medium Risk. Speeds up software engineering research. Check student licensing to ensure educational discounts.",
    toolUrl: "https://www.cursor.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "elevenlabs-seed",
    title: "ElevenLabs",
    category: "Video/Audio",
    initialDescription: "High-fidelity text-to-speech software and voice cloner for lecture narratives.",
    pedagogicalNarrative: "Medium Risk. Phenomenal quality for accessibility, but voice cloning carries minor ethical considerations.",
    toolUrl: "https://elevenlabs.io",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "notebooklm-seed",
    title: "NotebookLM",
    category: "Research Assistant",
    initialDescription: "Google's personalized AI notes app powered by Gemini, trained solely on uploaded source documents.",
    pedagogicalNarrative: "Low Risk. Ideal for aggregating literature and generating study guides. Safe to upload internal research drafts.",
    toolUrl: "https://notebooklm.google",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "gradescope-seed",
    title: "Gradescope",
    category: "Education",
    initialDescription: "AI-assisted grading platform that accelerates grading of paper and digital exams.",
    pedagogicalNarrative: "Low Risk. Backed by institutional standard contracts. Drastically reduces grading times for large courses.",
    toolUrl: "https://www.gradescope.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "quizlet-seed",
    title: "Quizlet Q-Chat",
    category: "Education",
    initialDescription: "Conversational AI study coach designed to quiz students through Socratic dialogue.",
    pedagogicalNarrative: "Low Risk. Fun and interactive study aid for reinforcing foundational terms and vocabulary.",
    toolUrl: "https://quizlet.com",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  },
  {
    id: "zotero-seed",
    title: "Zotero AI",
    category: "Research Assistant",
    initialDescription: "Reference manager utilizing AI extensions to organize, summarize, and cite academic articles.",
    pedagogicalNarrative: "Low Risk. Open source reference manager. The AI plugins run locally or via API, ensuring private custody.",
    toolUrl: "https://www.zotero.org",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
  }
];

function getFirebaseToolsAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const cfg = JSON.parse(raw);

  // Check active/default tokens first, then additionalAccounts if needed
  if (cfg.tokens?.access_token) {
    return { token: cfg.tokens.access_token, email: cfg.user?.email || 'unknown' };
  }
  if (Array.isArray(cfg.additionalAccounts)) {
    const gvsuAcct = cfg.additionalAccounts.find((a) =>
      a.user?.email?.toLowerCase().includes('gvsu.edu')
    );
    if (gvsuAcct?.tokens?.access_token) {
      return { token: gvsuAcct.tokens.access_token, email: gvsuAcct.user.email };
    }
  }
  throw new Error('No access_token found in ~/.config/configstore/firebase-tools.json');
}

function toFirestoreDocumentFields(tool, nowIso) {
  return {
    id: { stringValue: tool.id },
    title: { stringValue: tool.title },
    category: { stringValue: tool.category },
    initialDescription: { stringValue: tool.initialDescription },
    pedagogicalNarrative: { stringValue: tool.pedagogicalNarrative },
    toolUrl: { stringValue: tool.toolUrl },
    status: { stringValue: tool.status },
    health: { stringValue: tool.health },
    submitterDisplayName: { stringValue: tool.submitterDisplayName },
    submitterEmail: { stringValue: tool.submitterEmail },
    submitterId: { stringValue: tool.submitterId },
    upvotes: { integerValue: String(tool.upvotes) },
    downvotes: { integerValue: String(tool.downvotes) },
    isVerified: { booleanValue: Boolean(tool.isVerified) },
    createdAt: { timestampValue: nowIso },
    updatedAt: { timestampValue: nowIso },
    publishedAt: { timestampValue: nowIso },
  };
}

async function main() {
  const { token, email } = getFirebaseToolsAccessToken();
  console.log(`Using firebase-tools token for: ${email}`);
  console.log(`Target Project : ${PROJECT_ID}`);
  console.log(`Target Database: ${DATABASE_ID}`);

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
  const nowIso = new Date().toISOString();

  let successCount = 0;
  for (const tool of INITIAL_SEED_TOOLS) {
    const docUrl = `${baseUrl}/tools_published/${encodeURIComponent(tool.id)}`;
    const res = await fetch(docUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: toFirestoreDocumentFields(tool, nowIso),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to write ${tool.id} (HTTP ${res.status}): ${errText}`);
    }
    successCount++;
    console.log(`  ✔ [${successCount}/${INITIAL_SEED_TOOLS.length}] Seeded ${tool.id} (${tool.title})`);
  }

  // Verify via GET query
  const verifyRes = await fetch(`${baseUrl}/tools_published?pageSize=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!verifyRes.ok) {
    throw new Error(`Verification GET failed with status ${verifyRes.status}: ${await verifyRes.text()}`);
  }
  const verifyData = await verifyRes.json();
  const docs = verifyData.documents || [];
  console.log(`\n✔ Verification GET succeeded! Total documents in tools_published: ${docs.length}`);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
