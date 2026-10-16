export type GovernancePillarId =
  | "security_privacy"
  | "pedagogical_value"
  | "ethics_stewardship"
  | "access_cost";

export interface TagDefinition {
  label: string;
  categoryPillar: GovernancePillarId;
  pillarLabel: string;
  shortDefinition: string;
  facultyImpact: string;
}

export const PILLAR_METADATA: Record<
  GovernancePillarId,
  {
    id: GovernancePillarId;
    title: string;
    subtitle: string;
    description: string;
    rubric: {
      score5: string;
      score3: string;
      score1: string;
    };
  }
> = {
  security_privacy: {
    id: "security_privacy",
    title: "Security & Privacy",
    subtitle: "Data retention, model training policies, and student FERPA protection",
    description:
      "Evaluates how the tool handles user prompts, uploaded documents, personally identifiable information (PII), and institutional intellectual property.",
    rubric: {
      score5:
        "Zero data retention or enterprise walled-garden protection; never trains foundation models on user inputs; full FERPA alignment.",
      score3:
        "Consumer privacy controls available (opt-out of training required); safe for de-identified coursework but never upload student rosters or PII.",
      score1:
        "Unrestricted data harvesting, public-by-default outputs, or unclear third-party data brokerage. Not recommended for academic coursework.",
    },
  },
  pedagogical_value: {
    id: "pedagogical_value",
    title: "Pedagogical Value",
    subtitle: "Classroom utility, critical thinking, and learning outcome alignment",
    description:
      "Measures whether the tool genuinely scaffolds student inquiry, Socratic reasoning, and faculty instructional design rather than bypassing learning.",
    rubric: {
      score5:
        "Directly enhances critical inquiry, active recall, source synthesis, or accessible instructional design with transparent methodology.",
      score3:
        "Useful productivity or creative aid when paired with explicit syllabus boundaries and instructor framing.",
      score1:
        "Encourages passive answer generation with minimal cognitive engagement or high risk of academic integrity circumvention.",
    },
  },
  ethics_stewardship: {
    id: "ethics_stewardship",
    title: "Ethics & Stewardship",
    subtitle: "Citation transparency, hallucination controls, copyright/IP respect, and bias mitigation",
    description:
      "Audits epistemic reliability, source attribution, provenance metadata, and alignment with scholarly integrity standards.",
    rubric: {
      score5:
        "Strictly source-grounded or peer-reviewed citations (DOI/inline links), strong hallucination guardrails, and clear IP/copyright provenance.",
      score3:
        "General-purpose generative model with standard safety filters; outputs require human fact-checking and primary source verification.",
      score1:
        "Frequent fabricated citations, unmitigated bias, or unconsented replication of protected academic/artistic works.",
    },
  },
  access_cost: {
    id: "access_cost",
    title: "Access & Cost",
    subtitle: "Free student tiers, licensing clarity, and WCAG 2.1 AA accessibility",
    description:
      "Assesses financial equity for students, availability of academic/institutional licenses, cross-platform compatibility, and assistive technology support.",
    rubric: {
      score5:
        "100% free for students/educators or covered under a GVSU campus agreement, with strong web accessibility and cross-device support.",
      score3:
        "Functional freemium tier with daily/monthly usage caps; sufficient for single assignments without requiring student out-of-pocket payment.",
      score1:
        "Expensive mandatory paywall with no free academic tier, creating financial inequity in required coursework.",
    },
  },
};

export const TAG_DEFINITIONS: Record<string, TagDefinition> = {
  // Security & Privacy Pillar
  "FERPA Compliant": {
    label: "FERPA Compliant",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "Meets federal Family Educational Rights and Privacy Act standards for safeguarding student educational records.",
    facultyImpact:
      "Approved for instructional workflows when accessed through institutional accounts or in accordance with GVSU IT data handling guidelines.",
  },
  "FERPA Considerations": {
    label: "FERPA Considerations",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "Requires faculty and students to omit student names, G-numbers, grades, or protected educational records from prompts.",
    facultyImpact:
      "Safe for de-identified assignments and public course materials, but never upload student rosters or graded work.",
  },
  "PII Safe": {
    label: "PII Safe",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "Does not require or expose sensitive Personally Identifiable Information during standard academic use.",
    facultyImpact:
      "Students can complete learning activities without exposing private personal data or biometric identifiers.",
  },
  "No Data Training": {
    label: "No Data Training",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "Vendor contractually or technically guarantees that user prompts and uploaded files are never used to train public AI models.",
    facultyImpact:
      "Protects unpublished faculty research, grant drafts, and course curricula from leaking into commercial foundation models.",
  },
  "IP Protected": {
    label: "IP Protected",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "User retains full intellectual property ownership of uploaded manuscripts, codebases, datasets, and generated outputs.",
    facultyImpact:
      "Safe for scholarly drafting, capstone software engineering, and proprietary lab research.",
  },
  "GVSU Walled Garden": {
    label: "GVSU Walled Garden",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "Isolated within GVSU's enterprise tenant boundary so institutional data never leaves university-governed cloud storage.",
    facultyImpact:
      "Highest tier of institutional data protection when signed in with your @gvsu.edu credentials.",
  },
  "SSO Supported": {
    label: "SSO Supported",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "Supports enterprise Single Sign-On authentication and institutional identity management.",
    facultyImpact:
      "Simplifies classroom onboarding and applies enterprise security policies automatically.",
  },
  "Enterprise Ready": {
    label: "Enterprise Ready",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "Backed by SOC 2 / ISO 27001 security certifications, tenant isolation, and administrative audit controls.",
    facultyImpact:
      "Meets institutional IT security benchmarks for departmental or campus-wide adoption.",
  },
  "FOIA Aware": {
    label: "FOIA Aware",
    categoryPillar: "security_privacy",
    pillarLabel: "Security & Privacy",
    shortDefinition:
      "Maintains clear audit logs and record retention aligned with public university Freedom of Information Act obligations.",
    facultyImpact:
      "Supports compliant administrative and committee documentation workflows.",
  },

  // Ethics & Stewardship Pillar
  "Laker Green": {
    label: "Laker Green",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Meets GVSU's holistic benchmark for ethical AI stewardship, source transparency, and responsible academic adoption.",
    facultyImpact:
      "Cleared by the LakerAI governance rubric as a trusted resource for teaching and scholarship.",
  },
  "Citation Grounded": {
    label: "Citation Grounded",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Anchors every generated claim in verifiable inline links, DOIs, or uploaded primary documents.",
    facultyImpact:
      "Dramatically reduces fabricated references and teaches students to verify primary scholarly sources.",
  },
  "Source Grounded": {
    label: "Source Grounded",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Restricts AI reasoning strictly to the documents, PDFs, and lecture notes uploaded by the user.",
    facultyImpact:
      "Virtually eliminates external web hallucinations and keeps study guides aligned with your syllabus readings.",
  },
  "Peer-Reviewed": {
    label: "Peer-Reviewed",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Queries only indexed, peer-reviewed academic journals and scholarly repositories rather than the open web.",
    facultyImpact:
      "Ensures literature reviews and evidence synthesis rely on vetted scientific publications.",
  },
  "Bias Audited": {
    label: "Bias Audited",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Undergoes documented red-teaming and algorithmic fairness evaluations to minimize demographic or ideological skew.",
    facultyImpact:
      "Supports inclusive classroom instruction and equitable evaluation.",
  },
  "Ethical Labor": {
    label: "Ethical Labor",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Compensates creators fairly or uses licensed/open-source datasets with transparent provenance.",
    facultyImpact:
      "Aligns creative and media coursework with ethical attribution and copyright stewardship.",
  },
  "Low Hallucination": {
    label: "Low Hallucination",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Engineered with retrieval-augmented generation (RAG) or deterministic checks to minimize factual fabrication.",
    facultyImpact:
      "Increases reliability for research synthesis, coding, and quantitative analysis.",
  },
  "Open Source": {
    label: "Open Source",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Source code or model weights are publicly inspectable under an open-source license, enabling local custody and auditability.",
    facultyImpact:
      "Ideal for reproducible academic research and long-term bibliographic stewardship.",
  },
  "Vetted": {
    label: "Vetted",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Reviewed against the GVSU 4-Pillar Alignment Scorecard for security, pedagogy, ethics, and accessibility.",
    facultyImpact:
      "Provides faculty with an instant governance baseline before adding a tool to a course syllabus.",
  },
  "GVSU Sanctioned": {
    label: "GVSU Sanctioned",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Officially licensed or endorsed by Grand Valley State University IT and academic leadership.",
    facultyImpact:
      "Supported by university help desks and covered by institutional agreements.",
  },
  "Community Discovery": {
    label: "Community Discovery",
    categoryPillar: "ethics_stewardship",
    pillarLabel: "Ethics & Stewardship",
    shortDefinition:
      "Submitted by GVSU faculty, staff, or students for peer experimentation and governance evaluation.",
    facultyImpact:
      "Highlights emerging disciplinary tools being tested across GVSU colleges.",
  },

  // Pedagogical Value Pillar
  "Process-Oriented": {
    label: "Process-Oriented",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Scaffolds step-by-step drafting, revision, and metacognitive reflection rather than one-click essay generation.",
    facultyImpact:
      "Preserves student agency and makes the learning process visible to instructors.",
  },
  "Critical Literacy": {
    label: "Critical Literacy",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Encourages students to interrogate AI outputs, compare perspectives, and evaluate methodological rigor.",
    facultyImpact:
      "Supports higher-order Bloom's taxonomy outcomes in writing and research seminars.",
  },
  "AI-Resistant": {
    label: "AI-Resistant",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Supports authentic assessment designs where students demonstrate personal reasoning and verifiable process.",
    facultyImpact:
      "Helps faculty uphold academic integrity without relying on error-prone AI detectors.",
  },
  "Citation Ready": {
    label: "Citation Ready",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Exports structured bibliographic metadata in APA, MLA, Chicago, or BibTeX formats.",
    facultyImpact:
      "Streamlines scholarly attribution and reference management in student papers.",
  },
  "Socratic Tutoring": {
    label: "Socratic Tutoring",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Guides learners with probing questions and hints instead of handing over final answers.",
    facultyImpact:
      "Acts as a 24/7 study coach that reinforces active recall and conceptual mastery.",
  },
  "Writing Support": {
    label: "Writing Support",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Assists with brainstorming, outlining, rhetorical structure, and thesis refinement.",
    facultyImpact:
      "Helps students overcome writer's block when paired with clear syllabus attribution rules.",
  },
  "Writing Mechanics": {
    label: "Writing Mechanics",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Focuses on grammar, syntax, conciseness, and tone adjustments without replacing the student's core argument.",
    facultyImpact:
      "Supports multilingual learners and polished professional communication.",
  },
  "Deep Synthesis": {
    label: "Deep Synthesis",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Processes long-context documents, syllabi, and multi-paper corpora to surface thematic connections.",
    facultyImpact:
      "Accelerates literature synthesis, curriculum mapping, and rubric design.",
  },
  "Literature Matrix": {
    label: "Literature Matrix",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Organizes research papers into structured comparison tables of methodology, sample size, and findings.",
    facultyImpact:
      "Ideal for systematic reviews, thesis preparation, and graduate research seminars.",
  },
  "Citation Mapping": {
    label: "Citation Mapping",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Visualizes networks of citing and cited papers to trace how academic conversations evolve.",
    facultyImpact:
      "Helps students discover seminal papers and recent follow-up studies visually.",
  },
  "Citation Management": {
    label: "Citation Management",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Organizes PDFs, annotations, and bibliographies across research projects.",
    facultyImpact:
      "Foundational research workflow tool for faculty and student scholars.",
  },
  "Assessment & Rubrics": {
    label: "Assessment & Rubrics",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Streamlines rubric creation, grouped answer grading, and consistent formative feedback.",
    facultyImpact:
      "Reduces grading turnaround time while improving rubric consistency across sections.",
  },
  "Statistical Sandbox": {
    label: "Statistical Sandbox",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Executes inspectable Python/R statistical code and visualizations on uploaded datasets.",
    facultyImpact:
      "Lets students focus on statistical interpretation while inspecting reproducible code.",
  },
  "Visual Analytics": {
    label: "Visual Analytics",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Transforms complex datasets into interactive dashboards and explanatory visual narratives.",
    facultyImpact:
      "Builds data literacy and business/scientific communication skills.",
  },
  "Pair Programming": {
    label: "Pair Programming",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Provides real-time IDE code completion, debugging explanations, and unit test scaffolding.",
    facultyImpact:
      "Prepares computing students for modern software engineering workflows.",
  },
  "Software Architecture": {
    label: "Software Architecture",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Indexes multi-file repositories to support system design, refactoring, and code review.",
    facultyImpact:
      "Supports upper-level capstone projects and research software engineering.",
  },
  "Visual Design": {
    label: "Visual Design",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Supports slide decks, academic posters, infographics, and multimodal communication.",
    facultyImpact:
      "Lowers technical barriers for students presenting research visually.",
  },
  "Visual Ideation": {
    label: "Visual Ideation",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Generates custom conceptual illustrations, diagrams, and storyboards from natural language prompts.",
    facultyImpact:
      "Enables rapid visual prototyping and custom lecture visuals.",
  },
  "Studio Art": {
    label: "Studio Art",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "High-fidelity generative imaging for concept art, aesthetic exploration, and design critique.",
    facultyImpact:
      "Useful in specialized art, media, and design courses exploring generative aesthetics.",
  },
  "Workspace Integration": {
    label: "Workspace Integration",
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition:
      "Embeds directly into Google Workspace or Microsoft 365 docs, slides, and spreadsheets.",
    facultyImpact:
      "Fits naturally into existing faculty and student campus productivity suites.",
  },

  // Access & Cost Pillar
  "Free": {
    label: "Free",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "100% free to use with no paywalls or credit card requirements for core functionality.",
    facultyImpact:
      "Zero financial barrier for required or recommended classroom activities.",
  },
  "Free Tier": {
    label: "Free Tier",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Provides a permanent free usage tier suitable for individual student assignments.",
    facultyImpact:
      "Ensures every student in a course can participate without purchasing a subscription.",
  },
  "Free for Education": {
    label: "Free for Education",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Waives subscription fees for verified university students and educators with a .edu email.",
    facultyImpact:
      "Unlocks professional-grade features at zero cost to GVSU students and faculty.",
  },
  "Freemium": {
    label: "Freemium",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Offers a free baseline tier alongside optional paid upgrades for higher rate limits or advanced models.",
    facultyImpact:
      "Faculty should design assignments around the free tier quota so no student is forced to pay.",
  },
  "Institutional License": {
    label: "Institutional License",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Covered under an active university or departmental site license.",
    facultyImpact:
      "Full enterprise access and support available to eligible GVSU members.",
  },
  "Institutional": {
    label: "Institutional",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Supported through institutional procurement and LMS integration contracts.",
    facultyImpact:
      "Ready for large-enrollment departmental courses and assessments.",
  },
  "Paid": {
    label: "Paid",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Requires a paid subscription with no permanent free tier.",
    facultyImpact:
      "Should not be mandated for general student purchase unless departmental funding or lab access is provided.",
  },
  "Accessibility Approved": {
    label: "Accessibility Approved",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Audited for screen-reader compatibility, keyboard navigation, and WCAG 2.1 AA contrast standards.",
    facultyImpact:
      "Supports equitable participation for students using assistive technologies.",
  },
  "Accessibility Audio": {
    label: "Accessibility Audio",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Provides natural text-to-speech narration and multilingual audio rendering for written materials.",
    facultyImpact:
      "Enhances Universal Design for Learning (UDL) across course readings and lectures.",
  },
  "Admin Efficiency": {
    label: "Admin Efficiency",
    categoryPillar: "access_cost",
    pillarLabel: "Access & Cost",
    shortDefinition:
      "Reduces administrative overhead in scheduling, summarization, or routine university workflows.",
    facultyImpact:
      "Frees up faculty time for direct student mentorship and research.",
  },
};

export function getTagDefinition(tag: string): TagDefinition {
  const trimmed = tag.trim();
  if (TAG_DEFINITIONS[trimmed]) {
    return TAG_DEFINITIONS[trimmed];
  }

  const lower = trimmed.toLowerCase();
  const match = Object.values(TAG_DEFINITIONS).find(
    (def) => def.label.toLowerCase() === lower
  );
  if (match) return match;

  if (lower.includes("ferpa") || lower.includes("pii") || lower.includes("ip") || lower.includes("security") || lower.includes("privacy")) {
    return {
      label: trimmed,
      categoryPillar: "security_privacy",
      pillarLabel: "Security & Privacy",
      shortDefinition: `Institutional data protection indicator for ${trimmed}.`,
      facultyImpact: "Review tool privacy settings and avoid inputting protected student educational records.",
    };
  }

  if (lower.includes("free") || lower.includes("cost") || lower.includes("license") || lower.includes("access")) {
    return {
      label: trimmed,
      categoryPillar: "access_cost",
      pillarLabel: "Access & Cost",
      shortDefinition: `Licensing and student accessibility classification (${trimmed}).`,
      facultyImpact: "Ensure all students in your course have equitable access before requiring tool usage.",
    };
  }

  if (lower.includes("green") || lower.includes("vetted") || lower.includes("citation") || lower.includes("ethic")) {
    return {
      label: trimmed,
      categoryPillar: "ethics_stewardship",
      pillarLabel: "Ethics & Stewardship",
      shortDefinition: `Academic stewardship and reliability indicator (${trimmed}).`,
      facultyImpact: "Supports responsible, transparent AI adoption aligned with GVSU standards.",
    };
  }

  return {
    label: trimmed,
    categoryPillar: "pedagogical_value",
    pillarLabel: "Pedagogical Value",
    shortDefinition: `Instructional and disciplinary capability classification (${trimmed}).`,
    facultyImpact: "Indicates primary classroom, research, or workflow utility for GVSU faculty and students.",
  };
}
