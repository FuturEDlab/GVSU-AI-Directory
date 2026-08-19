
export type ToolStatus = 
  | "Submitted" 
  | "In Progress" 
  | "Review" 
  | "Pending" 
  | "Updated" 
  | "Completed" 
  | "Published"
  | "Suspended"
  | "Rejected";

export const TOOL_STAGES: ToolStatus[] = [
  "Submitted",
  "In Progress",
  "Review",
  "Pending",
  "Updated",
  "Completed",
  "Published",
  "Suspended",
  "Rejected"
];

export type ToolHealth = "Healthy" | "At Risk";

export interface ToolTags {
  security_privacy: string[];
  ethics_stewardship: string[];
  pedagogical_value: string[];
  institutional_status: string[];
  access_cost: string[];
}

export const TAG_OPTIONS = {
  security_privacy: ["FERPA Compliant", "GVSU Walled Garden", "PII Safe", "SSO Supported", "FOIA Aware"],
  ethics_stewardship: ["Laker Green", "Bias Audited", "IP Protected", "Ethical Labor"],
  pedagogical_value: ["Process-Oriented", "Critical Literacy", "AI-Resistant", "Citation Ready", "Low Hallucination"],
  institutional_status: ["GVSU Sanctioned", "Community Discovery", "Accessibility Approved", "Admin Efficiency"],
  access_cost: ["Free", "Institutional License", "Freemium"]
};

export interface ReportCardItem {
  score: number;
  summary: string;
}

export interface ToolReportCard {
  security: ReportCardItem;
  ethics: ReportCardItem;
  pedagogy: ReportCardItem;
  readiness: ReportCardItem;
}

export interface ToolSubmission {
  id?: string;
  title: string;
  category: string;
  initialDescription: string;
  toolUrl: string;
  status: ToolStatus;
  health: ToolHealth;
  submitterDisplayName: string;
  submitterEmail: string;
  submitterId: string;
  pedagogicalNarrative?: string;
  ogImageUrl?: string;
  upvotes: number;
  downvotes: number;
  createdAt: any;
  updatedAt: any;
  publishedAt?: any;
  isVerified: boolean;
  tags?: ToolTags;
  aiVetted?: boolean;
  reportCard?: ToolReportCard;
  overallVerdict?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  notificationPending?: boolean;
}

export interface ErrorReportLog {
  reportId?: string;
  targetToolId: string;
  toolName: string;
  reporterEmail: string;
  issueType: string;
  userFeedback: string;
  createdTimestamp: string;
  resolvedStatus: "pending" | "reviewed";
}

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  isAdmin: boolean;
  createdAt: any;
}

export interface UserReport {
  id: string;
  reportId?: string;
  toolId?: string;
  toolName?: string;
  toolUrl?: string;
  reportedBy?: string;
  reporterEmail?: string;
  reporterName?: string;
  issueType?: string;
  reason?: string;
  description?: string;
  comments?: string;
  status: "Pending" | "pending" | "Resolved" | "resolved" | "Dismissed" | "dismissed";
  createdAt: any;
}

export interface FeedbackPost {
  id: string;
  title: string;
  description: string;
  category: "BUG" | "FEATURE" | "IMPROVEMENT";
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED_PENDING_APPROVAL" | "VERIFIED_CLOSED" | "REOPENED";
  authorId: string;
  authorName: string;
  authorEmail: string;
  upvotesCount: number;
  contributors: string[]; // List of user UIDs merged into this feedback post
  createdAt: any;
  updatedAt: any;
}

export interface ReleaseChangelog {
  id: string;
  version: string;
  releaseDate: any;
  title: string;
  highlights: string[];
  techNotes: string[];
  createdAt: any;
}
