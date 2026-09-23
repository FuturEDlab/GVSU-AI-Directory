export type PromptStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PromptDifficulty = "Beginner" | "Intermediate" | "Advanced" | "All Levels";

export interface PromptSubmission {
  id?: string;
  
  // Prompt Section
  title: string;           // Title (synced with promptName)
  promptName: string;      // Backwards-compatible prompt title
  promptTemplate: string;  // Prompt template content (synced with promptText)
  promptText: string;      // Backwards-compatible prompt text
  description: string;     // Short description
  systemPrompt?: string;   // Optional system prompt / context

  // Classification Section
  targetModel: string;     // Target AI Model (synced with model)
  model: string;           // Backwards-compatible model field
  category: string;        // Primary category
  tags?: string[];         // Use Case / Tags array
  associatedToolId?: string;   // Optional linked AI tool ID
  associatedToolName?: string; // Optional linked AI tool name

  // Usage Section (Optional)
  userInputGuide?: string;
  expectedOutputFormat?: string;
  exampleInput?: string;
  exampleOutput?: string;
  negativeConstraints?: string;
  difficulty?: PromptDifficulty;

  // Author & System Metadata
  authorUid?: string;       // Synced with submittedBy
  authorName?: string;      // Synced with submittedByEmail
  submittedBy: string;      // User UID
  submittedByEmail: string; // User Email
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  status: PromptStatus;
}

