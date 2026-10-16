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
    vendor: "OpenAI",
    bg1: "#0B3B2E",
    bg2: "#10A37F",
    accent: "#34D399",
    glyph: "AI",
    category: "Writing Assistants",
    initialDescription: "Generative AI assistant for text composition, drafting, and ideation.",
    pedagogicalNarrative: "Low Risk. Helpful for brainstorming, but caution should be used to avoid pasting non-public university data or proprietary research.",
    toolUrl: "https://chatgpt.com",
    ogImageUrl: "/logos/chatgpt-seed.svg",
    imageUrl: "/logos/chatgpt-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Recommended for general academic drafting and Socratic tutoring with standard FERPA precautions.",
    reportCard: {
      security_privacy: { score: 4, summary: "Enterprise/Edu controls available; avoid entering student PII in consumer tier." },
      pedagogical_value: { score: 5, summary: "Versatile assistant for brainstorming, outlining, and rubric generation." },
      ethics_stewardship: { score: 4, summary: "Clear attribution guidelines recommended in course syllabi." },
      access_cost: { score: 5, summary: "Robust free tier available to all students and faculty." },
    },
    tags: {
      security_privacy: ["PII Safe"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Writing Support"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "claude-seed",
    title: "Claude",
    vendor: "Anthropic",
    bg1: "#3D261C",
    bg2: "#D97757",
    accent: "#FDBA74",
    glyph: "CL",
    category: "Writing Assistants",
    initialDescription: "Advanced AI chatbot specializing in long-form writing, synthesis, and deep reasoning.",
    pedagogicalNarrative: "Low Risk. Exceptionally strong in contextual synthesis and rubrics. Avoid feeding protected student identifiers.",
    toolUrl: "https://claude.ai",
    ogImageUrl: "/logos/claude-seed.svg",
    imageUrl: "/logos/claude-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Highly recommended for long-context document analysis, syllabus design, and nuanced writing feedback.",
    reportCard: {
      security_privacy: { score: 4, summary: "Does not train on user conversations by default; observe FERPA rules." },
      pedagogical_value: { score: 5, summary: "Superior reasoning and large context window for academic literature." },
      ethics_stewardship: { score: 5, summary: "Constitutional AI alignment reduces harmful or biased outputs." },
      access_cost: { score: 4, summary: "Free tier available with daily message caps." },
    },
    tags: {
      security_privacy: ["PII Safe", "IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Deep Synthesis"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "gemini-seed",
    title: "Gemini",
    vendor: "Google",
    bg1: "#0F296B",
    bg2: "#4285F4",
    accent: "#93C5FD",
    glyph: "GM",
    category: "Writing Assistants",
    initialDescription: "Multimodal Google assistant integrated with Google Workspace search.",
    pedagogicalNarrative: "Low Risk. Excellent integration with research networks. Practice standard FERPA boundary limits.",
    toolUrl: "https://gemini.google.com",
    ogImageUrl: "/logos/gemini-seed.svg",
    imageUrl: "/logos/gemini-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Recommended for Google Workspace users seeking multimodal research and drafting support.",
    reportCard: {
      security_privacy: { score: 5, summary: "Enterprise data protection when accessed via institutional Google Workspace." },
      pedagogical_value: { score: 5, summary: "Seamless integration with Docs, Drive, and multimodal study workflows." },
      ethics_stewardship: { score: 4, summary: "Built-in double-check with Google Search reduces citation fabrication." },
      access_cost: { score: 5, summary: "Included with institutional Google accounts." },
    },
    tags: {
      security_privacy: ["FERPA Compliant", "PII Safe", "IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Workspace Integration"],
      institutional_status: ["Vetted"],
      access_cost: ["Free"],
    },
  },
  {
    id: "perplexity-seed",
    title: "Perplexity AI",
    vendor: "Perplexity",
    bg1: "#0F172A",
    bg2: "#20808D",
    accent: "#5EEAD4",
    glyph: "PX",
    category: "Research Assistant",
    initialDescription: "AI search engine providing conversational answers with inline citations.",
    pedagogicalNarrative: "Medium Risk. Great for preliminary literature reviews, but sources should be manually double-checked for potential hallucinations.",
    toolUrl: "https://www.perplexity.ai",
    ogImageUrl: "/logos/perplexity-seed.svg",
    imageUrl: "/logos/perplexity-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Strong exploratory discovery tool with live web citations; verify primary sources before citing.",
    reportCard: {
      security_privacy: { score: 4, summary: "Public web query tool; do not input confidential research data." },
      pedagogical_value: { score: 4, summary: "Grounds answers in numbered inline links for rapid fact verification." },
      ethics_stewardship: { score: 4, summary: "Promotes source transparency over ungrounded generation." },
      access_cost: { score: 5, summary: "Free tier supports unlimited standard searches." },
    },
    tags: {
      security_privacy: ["PII Safe"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Citation Grounded"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "elicit-seed",
    title: "Elicit",
    vendor: "Elicit Research",
    bg1: "#1E1B4B",
    bg2: "#4F46E5",
    accent: "#A5B4FC",
    glyph: "EL",
    category: "Research Assistant",
    initialDescription: "AI research assistant that automates systematic literature reviews and data synthesis.",
    pedagogicalNarrative: "Medium Risk. Highly beneficial for scanning academic papers. Verify all extracted data tables for absolute accuracy.",
    toolUrl: "https://elicit.com",
    ogImageUrl: "/logos/elicit-seed.svg",
    imageUrl: "/logos/elicit-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Recommended for graduate students and faculty conducting systematic literature reviews.",
    reportCard: {
      security_privacy: { score: 4, summary: "Uploaded PDFs remain private to the researcher's workspace." },
      pedagogical_value: { score: 5, summary: "Extracts methodologies, sample sizes, and findings across 200M+ papers." },
      ethics_stewardship: { score: 4, summary: "Links directly to DOI records to prevent fabricated references." },
      access_cost: { score: 4, summary: "Free trial credits provided; heavy extraction requires Plus plan." },
    },
    tags: {
      security_privacy: ["IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Literature Matrix"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "consensus-seed",
    title: "Consensus",
    vendor: "Consensus NLP",
    bg1: "#064E3B",
    bg2: "#059669",
    accent: "#6EE7B7",
    glyph: "CS",
    category: "Research Assistant",
    initialDescription: "Scientific search engine utilizing AI to extract consensus evidence from peer-reviewed papers.",
    pedagogicalNarrative: "Low Risk. Provides meta-analytical perspectives on scientific hypotheses by aggregating cited peer-reviewed studies.",
    toolUrl: "https://consensus.app",
    ogImageUrl: "/logos/consensus-seed.svg",
    imageUrl: "/logos/consensus-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Excellent evidence-synthesis search engine restricted strictly to peer-reviewed literature.",
    reportCard: {
      security_privacy: { score: 4, summary: "Safe for academic queries; no student data required." },
      pedagogical_value: { score: 5, summary: "Consensus Meter visualizes scientific agreement across published studies." },
      ethics_stewardship: { score: 5, summary: "Zero hallucinated citations; every claim maps to a Semantic Scholar record." },
      access_cost: { score: 4, summary: "Free tier available with discounted academic plans." },
    },
    tags: {
      security_privacy: ["PII Safe"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Peer-Reviewed"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "researchrabbit-seed",
    title: "ResearchRabbit",
    vendor: "Citation Graph",
    bg1: "#14532D",
    bg2: "#16A34A",
    accent: "#86EFAC",
    glyph: "RR",
    category: "Research Assistant",
    initialDescription: "Visual mapping tool for exploring bibliographic citation networks and paper connections.",
    pedagogicalNarrative: "Low Risk. Encourages literature discoverability by creating dynamic connection maps of academic authors.",
    toolUrl: "https://www.researchrabbit.ai",
    ogImageUrl: "/logos/researchrabbit-seed.svg",
    imageUrl: "/logos/researchrabbit-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Highly recommended visual bibliography explorer for undergraduate and graduate research.",
    reportCard: {
      security_privacy: { score: 5, summary: "Operates on public bibliographic metadata with Zotero sync support." },
      pedagogical_value: { score: 5, summary: "Visual citation graphs help students discover foundational and derivative works." },
      ethics_stewardship: { score: 5, summary: "Transparent bibliometric network mapping." },
      access_cost: { score: 5, summary: "Free for academic researchers and students." },
    },
    tags: {
      security_privacy: ["FERPA Compliant", "PII Safe"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Citation Mapping"],
      institutional_status: ["Vetted"],
      access_cost: ["Free"],
    },
  },
  {
    id: "grammarly-seed",
    title: "Grammarly",
    vendor: "Grammarly AI",
    bg1: "#064E3B",
    bg2: "#15803D",
    accent: "#4ADE80",
    glyph: "GR",
    category: "Writing Assistants",
    initialDescription: "AI-powered writing helper offering corrections, flow enhancements, and tone metrics.",
    pedagogicalNarrative: "Low Risk. A solid aid for students. Be mindful of setting clear academic guidelines regarding AI editing limits.",
    toolUrl: "https://www.grammarly.com",
    ogImageUrl: "/logos/grammarly-seed.svg",
    imageUrl: "/logos/grammarly-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Standard-bearer for mechanics and clarity; instructors should specify policy on generative rewrites.",
    reportCard: {
      security_privacy: { score: 5, summary: "SOC 2 & FERPA-aligned enterprise security controls." },
      pedagogical_value: { score: 4, summary: "Strengthens grammar and conciseness; generative features include authorship transparency." },
      ethics_stewardship: { score: 4, summary: "Supports citation auto-generation for AI assistance." },
      access_cost: { score: 5, summary: "Core grammar and spell-checking free on all platforms." },
    },
    tags: {
      security_privacy: ["FERPA Compliant", "PII Safe"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Writing Mechanics"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "canva-seed",
    title: "Canva Magic Studio",
    vendor: "Canva",
    bg1: "#2E1065",
    bg2: "#7C3AED",
    accent: "#C4B5FD",
    glyph: "CV",
    category: "Image Generation",
    initialDescription: "Suite of AI-driven tools for presentation design, templates, and generative imagery.",
    pedagogicalNarrative: "Low Risk. Empowers students to create high-quality academic presentations and infographics.",
    toolUrl: "https://www.canva.com",
    ogImageUrl: "/logos/canva-seed.svg",
    imageUrl: "/logos/canva-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Recommended for visual communication, poster sessions, and slide deck creation.",
    reportCard: {
      security_privacy: { score: 4, summary: "Canva Shield provides trust and safety controls for educational teams." },
      pedagogical_value: { score: 5, summary: "Lowers technical barriers for multimodal student projects and infographics." },
      ethics_stewardship: { score: 4, summary: "Creator compensation program backs training datasets." },
      access_cost: { score: 5, summary: "Generous free tier for students and educators." },
    },
    tags: {
      security_privacy: ["PII Safe"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Visual Design"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "midjourney-seed",
    title: "Midjourney",
    vendor: "Midjourney Lab",
    bg1: "#090D16",
    bg2: "#1E293B",
    accent: "#94A3B8",
    glyph: "MJ",
    category: "Image Generation",
    initialDescription: "High-fidelity text-to-image generator utilizing Discord interface for art composition.",
    pedagogicalNarrative: "Medium Risk. Great for creative design, but steep learning curve and requires subscription for serious usage.",
    toolUrl: "https://www.midjourney.com",
    ogImageUrl: "/logos/midjourney-seed.svg",
    imageUrl: "/logos/midjourney-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "High-caliber concept art and studio visualization tool; best suited for specialized design courses.",
    reportCard: {
      security_privacy: { score: 3, summary: "Generated images are public by default unless on higher subscription tiers." },
      pedagogical_value: { score: 4, summary: "Industry-leading aesthetic quality for storyboarding and visual prototyping." },
      ethics_stewardship: { score: 3, summary: "Discuss copyright and artist style attribution in studio critiques." },
      access_cost: { score: 3, summary: "Paid subscription required." },
    },
    tags: {
      security_privacy: [],
      ethics_stewardship: [],
      pedagogical_value: ["Studio Art"],
      institutional_status: ["Vetted"],
      access_cost: ["Paid"],
    },
  },
  {
    id: "dalle-seed",
    title: "DALL-E 3",
    vendor: "OpenAI",
    bg1: "#311042",
    bg2: "#9333EA",
    accent: "#F0ABFC",
    glyph: "DE",
    category: "Image Generation",
    initialDescription: "Highly descriptive text-to-image generator created by OpenAI, integrated into ChatGPT.",
    pedagogicalNarrative: "Low Risk. Excellent for creating custom lecture slides, figures, and student design layouts.",
    toolUrl: "https://openai.com/index/dall-e-3",
    ogImageUrl: "/logos/dalle-seed.svg",
    imageUrl: "/logos/dalle-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Accessible conversational image generator ideal for lecture illustrations and conceptual diagrams.",
    reportCard: {
      security_privacy: { score: 4, summary: "Follows OpenAI safety filters and C2PA provenance metadata standards." },
      pedagogical_value: { score: 4, summary: "Conversational prompt refinement makes visual ideation approachable." },
      ethics_stewardship: { score: 4, summary: "Embeds C2PA content credentials and declines living-artist style replication." },
      access_cost: { score: 4, summary: "Included in ChatGPT with daily generation allowance on free tier." },
    },
    tags: {
      security_privacy: ["PII Safe"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Visual Ideation"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "julius-seed",
    title: "Julius AI",
    vendor: "Julius Data",
    bg1: "#0C4A6E",
    bg2: "#0284C7",
    accent: "#7DD3FC",
    glyph: "JL",
    category: "Data Analysis",
    initialDescription: "AI data assistant that analyzes spreadsheets, runs Python scripts, and graphs results.",
    pedagogicalNarrative: "Medium Risk. Extremely powerful for statistics. Never upload student grading rosters or proprietary datasets.",
    toolUrl: "https://julius.ai",
    ogImageUrl: "/logos/julius-seed.svg",
    imageUrl: "/logos/julius-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Powerful conversational statistics and Python/R sandbox for de-identified academic datasets.",
    reportCard: {
      security_privacy: { score: 4, summary: "Isolated container execution; never upload FERPA-protected gradebooks." },
      pedagogical_value: { score: 5, summary: "Shows underlying Python/R code alongside regression plots and ANOVA tables." },
      ethics_stewardship: { score: 4, summary: "Inspectable code output ensures reproducible statistical analysis." },
      access_cost: { score: 4, summary: "Free monthly message allowance with academic discounts." },
    },
    tags: {
      security_privacy: ["IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Statistical Sandbox"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "tableau-seed",
    title: "Tableau AI",
    vendor: "Salesforce",
    bg1: "#002B5B",
    bg2: "#005FB2",
    accent: "#60A5FA",
    glyph: "TB",
    category: "Data Analysis",
    initialDescription: "Business intelligence analytics platform powered by Salesforce Einstein generative insights.",
    pedagogicalNarrative: "Low Risk. Highly secure. Excellent for visual analytics, but requires advanced training to integrate effectively.",
    toolUrl: "https://www.tableau.com/solutions/ai",
    ogImageUrl: "/logos/tableau-seed.svg",
    imageUrl: "/logos/tableau-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Enterprise-grade visual analytics platform suited for business, health, and data science curricula.",
    reportCard: {
      security_privacy: { score: 5, summary: "Salesforce Einstein Trust Layer enforces zero data retention with LLMs." },
      pedagogical_value: { score: 5, summary: "Prepares students for industry-standard business intelligence workflows." },
      ethics_stewardship: { score: 5, summary: "Strong governance, lineage tracking, and bias auditing features." },
      access_cost: { score: 5, summary: "Tableau for Students and Instructors provides free academic licenses." },
    },
    tags: {
      security_privacy: ["FERPA Compliant", "PII Safe", "IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Visual Analytics"],
      institutional_status: ["Vetted"],
      access_cost: ["Free for Education"],
    },
  },
  {
    id: "copilot-seed",
    title: "GitHub Copilot",
    vendor: "GitHub",
    bg1: "#0D1117",
    bg2: "#238636",
    accent: "#7EE787",
    glyph: "CP",
    category: "Coding Assistant",
    initialDescription: "Cloud-based AI pair programmer that provides autocomplete suggestions in IDEs.",
    pedagogicalNarrative: "Medium Risk. Critical tool for computer science students. Setting clear expectations on grading policies is paramount.",
    toolUrl: "https://github.com/features/copilot",
    ogImageUrl: "/logos/copilot-seed.svg",
    imageUrl: "/logos/copilot-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Essential IDE assistant for upper-level computing courses; define usage boundaries in intro programming.",
    reportCard: {
      security_privacy: { score: 5, summary: "Telemetry and code snippet retention can be disabled in GitHub settings." },
      pedagogical_value: { score: 5, summary: "Accelerates boilerplate coding, unit test writing, and debugging." },
      ethics_stewardship: { score: 4, summary: "Enable public code duplication filter in repository settings." },
      access_cost: { score: 5, summary: "100% free for verified students and faculty via GitHub Education." },
    },
    tags: {
      security_privacy: ["IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Pair Programming"],
      institutional_status: ["Vetted"],
      access_cost: ["Free for Education"],
    },
  },
  {
    id: "cursor-seed",
    title: "Cursor",
    vendor: "Anysphere",
    bg1: "#090A0F",
    bg2: "#2563EB",
    accent: "#93C5FD",
    glyph: "CR",
    category: "Coding Assistant",
    initialDescription: "An AI-first code editor fork of VS Code built to accelerate software development.",
    pedagogicalNarrative: "Medium Risk. Speeds up software engineering research. Check student licensing to ensure educational discounts.",
    toolUrl: "https://www.cursor.com",
    ogImageUrl: "/logos/cursor-seed.svg",
    imageUrl: "/logos/cursor-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Recommended for capstone software engineering and research software development with Privacy Mode enabled.",
    reportCard: {
      security_privacy: { score: 4, summary: "SOC 2 Type II certified; enable Privacy Mode for zero code storage." },
      pedagogical_value: { score: 5, summary: "Codebase-wide indexing teaches multi-file architectural refactoring." },
      ethics_stewardship: { score: 4, summary: "Transparent diff review requires developer verification before applying edits." },
      access_cost: { score: 4, summary: "Hobby tier is free; verified students receive discounted/free Pro access." },
    },
    tags: {
      security_privacy: ["IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Software Architecture"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "elevenlabs-seed",
    title: "ElevenLabs",
    vendor: "ElevenLabs Audio",
    bg1: "#18181B",
    bg2: "#3F3F46",
    accent: "#E4E4E7",
    glyph: "XI",
    category: "Video/Audio",
    initialDescription: "High-fidelity text-to-speech software and voice cloner for lecture narratives.",
    pedagogicalNarrative: "Medium Risk. Phenomenal quality for accessibility, but voice cloning carries minor ethical considerations.",
    toolUrl: "https://elevenlabs.io",
    ogImageUrl: "/logos/elevenlabs-seed.svg",
    imageUrl: "/logos/elevenlabs-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Excellent for accessible audio narration of course materials; require explicit consent for any voice cloning.",
    reportCard: {
      security_privacy: { score: 4, summary: "Voice captcha verification prevents unauthorized voice cloning." },
      pedagogical_value: { score: 4, summary: "Converts written lecture notes into natural multilingual audio for accessibility." },
      ethics_stewardship: { score: 4, summary: "Includes AI speech classifier tool to verify audio provenance." },
      access_cost: { score: 4, summary: "Free monthly character quota available." },
    },
    tags: {
      security_privacy: ["PII Safe"],
      ethics_stewardship: [],
      pedagogical_value: ["Accessibility Audio"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "notebooklm-seed",
    title: "NotebookLM",
    vendor: "Google Labs",
    bg1: "#0032A0",
    bg2: "#1D4ED8",
    accent: "#93C5FD",
    glyph: "NB",
    category: "Research Assistant",
    initialDescription: "Google's personalized AI notes app powered by Gemini, trained solely on uploaded source documents.",
    pedagogicalNarrative: "Low Risk. Ideal for aggregating literature and generating study guides. Safe to upload internal research drafts.",
    toolUrl: "https://notebooklm.google",
    ogImageUrl: "/logos/notebooklm-seed.svg",
    imageUrl: "/logos/notebooklm-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Top-tier source-grounded study and research synthesis assistant for GVSU students and faculty.",
    reportCard: {
      security_privacy: { score: 5, summary: "Never trains on uploaded PDFs, Google Docs, or lecture slides." },
      pedagogical_value: { score: 5, summary: "Every answer includes exact inline citations to the uploaded course readings." },
      ethics_stewardship: { score: 5, summary: "Source-constrained architecture virtually eliminates external hallucinations." },
      access_cost: { score: 5, summary: "100% free with a Google account." },
    },
    tags: {
      security_privacy: ["FERPA Compliant", "PII Safe", "IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Source Grounded"],
      institutional_status: ["Vetted"],
      access_cost: ["Free"],
    },
  },
  {
    id: "gradescope-seed",
    title: "Gradescope",
    vendor: "Turnitin",
    bg1: "#0F3D5E",
    bg2: "#0284C7",
    accent: "#7DD3FC",
    glyph: "GS",
    category: "Education",
    initialDescription: "AI-assisted grading platform that accelerates grading of paper and digital exams.",
    pedagogicalNarrative: "Low Risk. Backed by institutional standard contracts. Drastically reduces grading times for large courses.",
    toolUrl: "https://www.gradescope.com",
    ogImageUrl: "/logos/gradescope-seed.svg",
    imageUrl: "/logos/gradescope-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Institutionally vetted assessment platform that groups similar student answers for fair, consistent rubric grading.",
    reportCard: {
      security_privacy: { score: 5, summary: "Full FERPA compliance and LMS integration backed by Turnitin." },
      pedagogical_value: { score: 5, summary: "Dynamic rubric adjustments apply retroactively across all student submissions." },
      ethics_stewardship: { score: 5, summary: "Instructor retains 100% control over final scoring decisions; AI only groups answers." },
      access_cost: { score: 5, summary: "Institutionally supported for academic departments." },
    },
    tags: {
      security_privacy: ["FERPA Compliant", "PII Safe", "IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Assessment & Rubrics"],
      institutional_status: ["Vetted"],
      access_cost: ["Institutional"],
    },
  },
  {
    id: "quizlet-seed",
    title: "Quizlet Q-Chat",
    vendor: "Quizlet",
    bg1: "#1E1B4B",
    bg2: "#4255FF",
    accent: "#A5B4FC",
    glyph: "QZ",
    category: "Education",
    initialDescription: "Conversational AI study coach designed to quiz students through Socratic dialogue.",
    pedagogicalNarrative: "Low Risk. Fun and interactive study aid for reinforcing foundational terms and vocabulary.",
    toolUrl: "https://quizlet.com",
    ogImageUrl: "/logos/quizlet-seed.svg",
    imageUrl: "/logos/quizlet-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Recommended active-recall and Socratic study companion for foundational coursework.",
    reportCard: {
      security_privacy: { score: 4, summary: "Standard educational privacy protections; no sensitive data required." },
      pedagogical_value: { score: 5, summary: "Uses Socratic questioning rather than giving away answers directly." },
      ethics_stewardship: { score: 5, summary: "Promotes active recall and metacognitive self-testing." },
      access_cost: { score: 4, summary: "Core study sets are free; Plus features available." },
    },
    tags: {
      security_privacy: ["PII Safe"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Socratic Tutoring"],
      institutional_status: ["Vetted"],
      access_cost: ["Freemium"],
    },
  },
  {
    id: "zotero-seed",
    title: "Zotero AI",
    vendor: "Digital Scholarship",
    bg1: "#450A0A",
    bg2: "#DC2626",
    accent: "#FCA5A5",
    glyph: "ZT",
    category: "Research Assistant",
    initialDescription: "Reference manager utilizing AI extensions to organize, summarize, and cite academic articles.",
    pedagogicalNarrative: "Low Risk. Open source reference manager. The AI plugins run locally or via API, ensuring private custody.",
    toolUrl: "https://www.zotero.org",
    ogImageUrl: "/logos/zotero-seed.svg",
    imageUrl: "/logos/zotero-seed.svg",
    status: "Published",
    health: "Healthy",
    submitterDisplayName: "GVSU Admin",
    submitterEmail: "vanharkj@mail.gvsu.edu",
    submitterId: "admin-seed",
    upvotes: 0,
    downvotes: 0,
    isVerified: true,
    aiVetted: true,
    overallVerdict: "Gold-standard open-source citation manager with privacy-preserving local and API-based AI plugins.",
    reportCard: {
      security_privacy: { score: 5, summary: "Open-source local storage ensures complete researcher custody of PDFs." },
      pedagogical_value: { score: 5, summary: "Essential scholarly workflow for organizing literature and formatting bibliographies." },
      ethics_stewardship: { score: 5, summary: "Nonprofit, open-source stewardship aligned with academic library standards." },
      access_cost: { score: 5, summary: "100% free and open-source." },
    },
    tags: {
      security_privacy: ["FERPA Compliant", "PII Safe", "IP Protected"],
      ethics_stewardship: ["Laker Green"],
      pedagogical_value: ["Citation Management"],
      institutional_status: ["Vetted"],
      access_cost: ["Free"],
    },
  },
];

const INITIAL_SEED_PROMPTS = [
  {
    id: "prompt-socratic-tutor",
    title: "Socratic Concept Tutor for Undergraduate Courses",
    promptName: "Socratic Concept Tutor for Undergraduate Courses",
    promptTemplate: "Act as a Socratic university tutor for [Course Topic]. Ask me one diagnostic question at a time to test my understanding of [Concept], wait for my response, and provide constructive hints rather than giving the direct answer.",
    promptText: "Act as a Socratic university tutor for [Course Topic]. Ask me one diagnostic question at a time to test my understanding of [Concept], wait for my response, and provide constructive hints rather than giving the direct answer.",
    description: "Guides students through active recall and conceptual mastery using Socratic questioning without revealing solutions prematurely.",
    targetModel: "ChatGPT (GPT-4o)",
    model: "ChatGPT (GPT-4o)",
    category: "Education & Tutoring",
    tags: ["Socratic", "Active Recall", "Study Guide"],
    associatedToolId: "chatgpt-seed",
    associatedToolName: "ChatGPT",
    difficulty: "Beginner",
    authorName: "GVSU Faculty Fellow",
    submittedBy: "admin-seed",
    submittedByEmail: "vanharkj@mail.gvsu.edu",
    status: "APPROVED",
  },
  {
    id: "prompt-rubric-architect",
    title: "AAC&U VALUE Rubric & Assignment Alignment Builder",
    promptName: "AAC&U VALUE Rubric & Assignment Alignment Builder",
    promptTemplate: "Design a 4-level analytic grading rubric for a [Course Level] assignment on [Assignment Topic] aligned with learning outcomes: [Outcomes]. Include criteria for critical thinking, evidence synthesis, and APA 7th citation accuracy.",
    promptText: "Design a 4-level analytic grading rubric for a [Course Level] assignment on [Assignment Topic] aligned with learning outcomes: [Outcomes]. Include criteria for critical thinking, evidence synthesis, and APA 7th citation accuracy.",
    description: "Helps GVSU instructors rapidly draft transparent, outcome-aligned analytic rubrics for written and multimodal projects.",
    targetModel: "Claude 3.5 Sonnet",
    model: "Claude 3.5 Sonnet",
    category: "Education & Tutoring",
    tags: ["Rubrics", "Assessment", "Syllabus"],
    associatedToolId: "claude-seed",
    associatedToolName: "Claude",
    difficulty: "Intermediate",
    authorName: "GVSU FTLC",
    submittedBy: "admin-seed",
    submittedByEmail: "vanharkj@mail.gvsu.edu",
    status: "APPROVED",
  },
  {
    id: "prompt-lit-review-matrix",
    title: "Systematic Literature Synthesis & Methodology Matrix",
    promptName: "Systematic Literature Synthesis & Methodology Matrix",
    promptTemplate: "Compare the uploaded peer-reviewed abstracts on [Research Question]. Construct a markdown synthesis table with columns for Author/Year, Research Design, Sample Size, Key Findings, and Methodological Limitations.",
    promptText: "Compare the uploaded peer-reviewed abstracts on [Research Question]. Construct a markdown synthesis table with columns for Author/Year, Research Design, Sample Size, Key Findings, and Methodological Limitations.",
    description: "Structures multi-paper literature reviews into a side-by-side methodological comparison matrix.",
    targetModel: "Gemini 1.5 Pro",
    model: "Gemini 1.5 Pro",
    category: "Research & Analysis",
    tags: ["Literature Review", "Research", "Synthesis"],
    associatedToolId: "gemini-seed",
    associatedToolName: "Gemini",
    difficulty: "Intermediate",
    authorName: "GVSU Library Research",
    submittedBy: "admin-seed",
    submittedByEmail: "vanharkj@mail.gvsu.edu",
    status: "APPROVED",
  },
  {
    id: "prompt-unit-test-coach",
    title: "Edge-Case Unit Test & Complexity Auditor",
    promptName: "Edge-Case Unit Test & Complexity Auditor",
    promptTemplate: "Review the following function in [Language]: [Code]. Identify time/space complexity bottlenecks, boundary conditions, and generate a comprehensive unit test suite covering edge cases without modifying the function signature.",
    promptText: "Review the following function in [Language]: [Code]. Identify time/space complexity bottlenecks, boundary conditions, and generate a comprehensive unit test suite covering edge cases without modifying the function signature.",
    description: "Assists computing students in writing thorough unit tests and analyzing algorithmic complexity.",
    targetModel: "GitHub Copilot",
    model: "GitHub Copilot",
    category: "Coding & Technical",
    tags: ["Unit Testing", "Algorithms", "Debugging"],
    associatedToolId: "copilot-seed",
    associatedToolName: "GitHub Copilot",
    difficulty: "Intermediate",
    authorName: "GVSU Computing",
    submittedBy: "admin-seed",
    submittedByEmail: "vanharkj@mail.gvsu.edu",
    status: "APPROVED",
  },
];

function generateBrandLogos() {
  const logosDir = path.join(process.cwd(), 'public', 'logos');
  fs.mkdirSync(logosDir, { recursive: true });

  for (const t of INITIAL_SEED_TOOLS) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg-${t.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${t.bg1}" />
      <stop offset="100%" stop-color="${t.bg2}" />
    </linearGradient>
    <radialGradient id="glow-${t.id}" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${t.bg2}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg-${t.id})" />
  <rect width="800" height="450" fill="url(#glow-${t.id})" />
  <g opacity="0.1" stroke="#FFFFFF" stroke-width="1">
    <line x1="0" y1="90" x2="800" y2="90" />
    <line x1="0" y1="180" x2="800" y2="180" />
    <line x1="0" y1="270" x2="800" y2="270" />
    <line x1="0" y1="360" x2="800" y2="360" />
    <line x1="160" y1="0" x2="160" y2="450" />
    <line x1="320" y1="0" x2="320" y2="450" />
    <line x1="480" y1="0" x2="480" y2="450" />
    <line x1="640" y1="0" x2="640" y2="450" />
  </g>
  <rect x="56" y="52" width="108" height="108" rx="26" fill="#FFFFFF" fill-opacity="0.15" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2" />
  <text x="110" y="124" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" letter-spacing="1">${t.glyph}</text>
  <rect x="572" y="56" width="172" height="36" rx="18" fill="#0032A0" fill-opacity="0.9" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5" />
  <text x="658" y="79" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" letter-spacing="1.8">GVSU AI VETTED</text>
  <text x="56" y="252" fill="${t.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" letter-spacing="2.5">${t.category.toUpperCase()}</text>
  <text x="56" y="314" fill="#FFFFFF" font-family="Georgia, serif" font-size="50" font-weight="900">${t.title}</text>
  <text x="56" y="358" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="500" opacity="0.9">${t.vendor} • LakerAI Institutional Directory</text>
</svg>`;
    fs.writeFileSync(path.join(logosDir, `${t.id}.svg`), svg, 'utf8');
  }
  console.log(`✔ Generated ${INITIAL_SEED_TOOLS.length} SVG brand logos in public/logos/`);
}

function getFirebaseToolsAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const cfg = JSON.parse(raw);

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

function toStringArrayField(arr) {
  return {
    arrayValue: {
      values: (arr || []).map((v) => ({ stringValue: String(v) })),
    },
  };
}

function toFirestoreDocumentFields(tool, nowIso) {
  const rc = tool.reportCard || {};
  const tags = tool.tags || {};
  return {
    id: { stringValue: tool.id },
    title: { stringValue: tool.title },
    category: { stringValue: tool.category },
    initialDescription: { stringValue: tool.initialDescription },
    pedagogicalNarrative: { stringValue: tool.pedagogicalNarrative },
    toolUrl: { stringValue: tool.toolUrl },
    ogImageUrl: { stringValue: tool.ogImageUrl },
    imageUrl: { stringValue: tool.imageUrl || tool.ogImageUrl },
    status: { stringValue: tool.status },
    health: { stringValue: tool.health },
    submitterDisplayName: { stringValue: tool.submitterDisplayName },
    submitterEmail: { stringValue: tool.submitterEmail },
    submitterId: { stringValue: tool.submitterId },
    upvotes: { integerValue: String(tool.upvotes) },
    downvotes: { integerValue: String(tool.downvotes) },
    isVerified: { booleanValue: Boolean(tool.isVerified) },
    aiVetted: { booleanValue: Boolean(tool.aiVetted) },
    overallVerdict: { stringValue: tool.overallVerdict || '' },
    reportCard: {
      mapValue: {
        fields: {
          security_privacy: {
            mapValue: {
              fields: {
                score: { integerValue: String(rc.security_privacy?.score ?? 4) },
                summary: { stringValue: rc.security_privacy?.summary ?? '' },
              },
            },
          },
          pedagogical_value: {
            mapValue: {
              fields: {
                score: { integerValue: String(rc.pedagogical_value?.score ?? 5) },
                summary: { stringValue: rc.pedagogical_value?.summary ?? '' },
              },
            },
          },
          ethics_stewardship: {
            mapValue: {
              fields: {
                score: { integerValue: String(rc.ethics_stewardship?.score ?? 4) },
                summary: { stringValue: rc.ethics_stewardship?.summary ?? '' },
              },
            },
          },
          access_cost: {
            mapValue: {
              fields: {
                score: { integerValue: String(rc.access_cost?.score ?? 5) },
                summary: { stringValue: rc.access_cost?.summary ?? '' },
              },
            },
          },
        },
      },
    },
    tags: {
      mapValue: {
        fields: {
          security_privacy: toStringArrayField(tags.security_privacy),
          ethics_stewardship: toStringArrayField(tags.ethics_stewardship),
          pedagogical_value: toStringArrayField(tags.pedagogical_value),
          institutional_status: toStringArrayField(tags.institutional_status),
          access_cost: toStringArrayField(tags.access_cost),
        },
      },
    },
    createdAt: { timestampValue: nowIso },
    updatedAt: { timestampValue: nowIso },
    publishedAt: { timestampValue: nowIso },
  };
}

function toPromptDocumentFields(prompt, nowMs) {
  return {
    id: { stringValue: prompt.id },
    title: { stringValue: prompt.title },
    promptName: { stringValue: prompt.promptName },
    promptTemplate: { stringValue: prompt.promptTemplate },
    promptText: { stringValue: prompt.promptText },
    description: { stringValue: prompt.description },
    targetModel: { stringValue: prompt.targetModel },
    model: { stringValue: prompt.model },
    category: { stringValue: prompt.category },
    tags: toStringArrayField(prompt.tags),
    associatedToolId: { stringValue: prompt.associatedToolId },
    associatedToolName: { stringValue: prompt.associatedToolName },
    difficulty: { stringValue: prompt.difficulty },
    authorName: { stringValue: prompt.authorName },
    authorUid: { stringValue: prompt.submittedBy },
    submittedBy: { stringValue: prompt.submittedBy },
    submittedByEmail: { stringValue: prompt.submittedByEmail },
    createdAt: { integerValue: String(nowMs) },
    updatedAt: { integerValue: String(nowMs) },
    publishedAt: { integerValue: String(nowMs) },
    status: { stringValue: prompt.status },
  };
}

async function main() {
  generateBrandLogos();

  const { token, email } = getFirebaseToolsAccessToken();
  console.log(`Using firebase-tools token for: ${email}`);
  console.log(`Target Project : ${PROJECT_ID}`);
  console.log(`Target Database: ${DATABASE_ID}`);

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

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
    console.log(`  ✔ [${successCount}/${INITIAL_SEED_TOOLS.length}] Seeded ${tool.id} (${tool.title}) -> ${tool.ogImageUrl}`);
  }

  for (const prompt of INITIAL_SEED_PROMPTS) {
    const docUrl = `${baseUrl}/promptLibrary/${encodeURIComponent(prompt.id)}`;
    const res = await fetch(docUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: toPromptDocumentFields(prompt, nowMs),
      }),
    });
    if (!res.ok) {
      console.warn(`Failed to seed prompt ${prompt.id}: ${await res.text()}`);
    } else {
      console.log(`  ✔ Seeded community prompt: ${prompt.id} (${prompt.title})`);
    }
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
  const withImages = docs.filter((d) => d.fields?.ogImageUrl?.stringValue).length;
  console.log(`\n✔ Verification GET succeeded! Total documents in tools_published: ${docs.length} (${withImages}/20 with ogImageUrl)`);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
