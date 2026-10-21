'use client';

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useFirestore,
  useCollection,
  useMemoFirebase
} from "@/firebase/hooks";
import {
  collection,
  query,
  limit,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore";
import {
  ToolSubmission,
  ToolTags,
  ToolReportCard,
  ReportCardItem,
  ToolStatus
} from "@/app/lib/tool-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Upload,
  CheckCircle2,
  Bot,
  X,
  Search,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { useGovernanceHub } from "@/hooks/use-governance-hub";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tagger } from "@/components/admin/governance/Tagger";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { perfLog } from "@/lib/perf-logger";

const INITIAL_TAGS: ToolTags = {
  security_privacy: [],
  ethics_stewardship: [],
  pedagogical_value: [],
  institutional_status: ["Community Discovery"],
  access_cost: []
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const CANONICAL_PILLARS = [
  {
    key: "security_privacy" as const,
    legacyKey: "security" as const,
    label: "Security & Privacy"
  },
  {
    key: "pedagogical_value" as const,
    legacyKey: "pedagogy" as const,
    label: "Pedagogical Value"
  },
  {
    key: "ethics_stewardship" as const,
    legacyKey: "ethics" as const,
    label: "Ethics & Stewardship"
  },
  {
    key: "access_cost" as const,
    legacyKey: "readiness" as const,
    label: "Access & Cost"
  }
];

export interface NormalizedPillarEntry {
  key: "security_privacy" | "pedagogical_value" | "ethics_stewardship" | "access_cost";
  label: string;
  score: number;
  summary: string;
}

export function normalizeReportCard(
  raw?: Partial<ToolReportCard> | Record<string, any> | null
): {
  pillars: NormalizedPillarEntry[];
  canonical: ToolReportCard | undefined;
  avgScore: number | null;
  riskRating: "Low Risk" | "Moderate Risk" | "High Risk";
} {
  if (!raw || typeof raw !== "object") {
    return {
      pillars: [],
      canonical: undefined,
      avgScore: null,
      riskRating: "Moderate Risk"
    };
  }

  const pillars: NormalizedPillarEntry[] = [];
  for (const pillar of CANONICAL_PILLARS) {
    const entry: ReportCardItem | undefined =
      (raw as any)[pillar.key] || (raw as any)[pillar.legacyKey];
    if (entry && typeof entry.score === "number") {
      pillars.push({
        key: pillar.key,
        label: pillar.label,
        score: entry.score,
        summary: entry.summary || ""
      });
    }
  }

  if (pillars.length === 0) {
    return {
      pillars: [],
      canonical: undefined,
      avgScore: null,
      riskRating: "Moderate Risk"
    };
  }

  const avg = pillars.reduce((sum, p) => sum + p.score, 0) / pillars.length;
  const avgScore = Math.round(avg * 10) / 10;
  const riskRating: "Low Risk" | "Moderate Risk" | "High Risk" =
    avg >= 4.0 ? "Low Risk" : avg >= 2.8 ? "Moderate Risk" : "High Risk";

  const byKey = Object.fromEntries(pillars.map((p) => [p.key, { score: p.score, summary: p.summary }]));
  const canonical: ToolReportCard = {
    security_privacy: byKey.security_privacy || { score: 4, summary: "" },
    pedagogical_value: byKey.pedagogical_value || { score: 4, summary: "" },
    ethics_stewardship: byKey.ethics_stewardship || { score: 4, summary: "" },
    access_cost: byKey.access_cost || { score: 4, summary: "" }
  };

  return { pillars, canonical, avgScore, riskRating };
}

function mergeToolTags(current: ToolTags, recommended?: Partial<ToolTags> | null): ToolTags {
  const uniq = (a: string[] = [], b: string[] = []) => Array.from(new Set([...a, ...b]));
  return {
    security_privacy: uniq(current?.security_privacy, recommended?.security_privacy),
    ethics_stewardship: uniq(current?.ethics_stewardship, recommended?.ethics_stewardship),
    pedagogical_value: uniq(current?.pedagogical_value, recommended?.pedagogical_value),
    institutional_status: uniq(
      current?.institutional_status?.length ? current.institutional_status : ["Community Discovery"],
      recommended?.institutional_status
    ),
    access_cost: uniq(current?.access_cost, recommended?.access_cost)
  };
}

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );
}

interface ToolModerationTabProps {
  initialSelectToolId?: string | null;
}

export function ToolModerationTab({ initialSelectToolId }: ToolModerationTabProps) {
  const { user, isAdmin } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const gov = useGovernanceHub();

  const [selectedTool, setSelectedTool] = useState<ToolSubmission | null>(null);
  const activeTool = selectedTool;
  const setActiveTool = setSelectedTool;

  const [moderationTab, setModerationTab] = useState<string>("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVetting, setIsVetting] = useState(false);
  const [auditStageMessage, setAuditStageMessage] = useState<string>(
    "Scraping vendor metadata & running Gemini 3.1 Pro 4-Pillar Audit..."
  );
  const [auditSuccessMessage, setAuditSuccessMessage] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [discoveredImage, setDiscoveredImage] = useState<{ url: string; source: 'official' | 'generated' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor State
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftNarrative, setDraftNarrative] = useState("");
  const [draftImage, setDraftImage] = useState("");
  const [draftTags, setDraftTags] = useState<ToolTags>(INITIAL_TAGS);

  // Measure tab load time
  const [mountTime] = useState(() => performance.now());

  // Firestore queries for Tools — LIMITED to 50 items for optimal speed
  const submittedQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "tools_submitted"), orderBy("createdAt", "desc"), limit(50));
  }, [firestore, isAdmin]);

  const publishedQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "tools_published"), orderBy("publishedAt", "desc"), limit(50));
  }, [firestore, isAdmin]);

  const { data: submittedTools, isLoading: submittedLoading } = useCollection<ToolSubmission>(submittedQuery);
  const { data: publishedTools, isLoading: publishedLoading } = useCollection<ToolSubmission>(publishedQuery);

  useEffect(() => {
    if (!submittedLoading && !publishedLoading) {
      perfLog("ToolModerationTab Data Loaded", mountTime, {
        submittedCount: submittedTools?.length || 0,
        publishedCount: publishedTools?.length || 0
      });
    }
  }, [submittedLoading, publishedLoading, mountTime, submittedTools, publishedTools]);

  // Split tools into Pending, Live, and Rejected status groups (memoized)
  const pendingTools = useMemo(() => {
    return submittedTools?.filter(t => t.status !== "Rejected") || [];
  }, [submittedTools]);

  const liveTools = useMemo(() => {
    return publishedTools || [];
  }, [publishedTools]);

  const rejectedTools = useMemo(() => {
    return submittedTools?.filter(t => t.status === "Rejected") || [];
  }, [submittedTools]);

  // Handle deep-linked select tool if provided
  useEffect(() => {
    if (initialSelectToolId && (submittedTools || publishedTools)) {
      const match = publishedTools?.find(t => t.id === initialSelectToolId) ||
                    submittedTools?.find(t => t.id === initialSelectToolId);
      if (match) {
        handleSelectTool(match);
      }
    }
  }, [initialSelectToolId, submittedTools, publishedTools]);

  const handleSelectTool = (tool: ToolSubmission) => {
    setSelectedTool(tool);
    setDraftTitle(tool.title || "");
    setDraftCategory(tool.category || "");
    setDraftUrl(tool.toolUrl || "");
    setDraftNarrative(tool.pedagogicalNarrative || tool.initialDescription || "");
    setDraftImage(tool.ogImageUrl || "");
    setDraftTags(tool.tags || INITIAL_TAGS);
    setDiscoveredImage(null);
    setAuditError(null);
    const hasCompletedAudit =
      Boolean(tool.aiVetted) ||
      tool.status === "Audited - Ready for Approval" ||
      tool.status === "Review" ||
      Boolean(tool.reportCard);
    setAuditSuccessMessage(
      hasCompletedAudit && tool.status !== "Published"
        ? "AI Audit Complete: 4-Pillar Scorecard & Narrative generated. Review below and click 'Approve & Publish' to push live."
        : null
    );
  };

  const handleRunVettingAgent = async () => {
    if (!selectedTool) return;
    setIsVetting(true);
    setAuditError(null);
    setAuditSuccessMessage(null);
    setAuditStageMessage("Scraping vendor metadata & running Gemini 3.1 Pro 4-Pillar Audit...");

    const stageTimer = setTimeout(() => {
      setAuditStageMessage(
        "Evaluating FERPA, Pedagogy, Ethics & Access pillars with Gemini 3.1 Pro..."
      );
    }, 3000);

    try {
      const { automatedVettingAgent } = await import("@/ai/flows/admin-generates-tool-narrative-and-image");
      const result = await automatedVettingAgent({
        toolTitle: (draftTitle || selectedTool.title || "").trim(),
        toolDescription: (
          selectedTool.initialDescription ||
          draftNarrative ||
          selectedTool.pedagogicalNarrative ||
          draftTitle ||
          selectedTool.title
        ).trim(),
        toolUrl: (draftUrl || selectedTool.toolUrl || "").trim(),
        adminEmail: user?.email?.trim().toLowerCase() || undefined,
        isAdmin: Boolean(isAdmin),
      });

      clearTimeout(stageTimer);

      const { canonical: canonicalReportCard } = normalizeReportCard(result.reportCard);
      const nextReportCard = canonicalReportCard || result.reportCard;
      const nextImage = result.scrapedOgImage || result.ogImageUrl || draftImage || selectedTool.ogImageUrl || "";
      const nextTags = mergeToolTags(draftTags, result.tags);
      const isPublished = publishedTools?.some(t => t.id === selectedTool.id);
      const nextStatus: ToolStatus = isPublished ? "Published" : "Audited - Ready for Approval";

      const updatedTool: ToolSubmission = {
        ...selectedTool,
        title: draftTitle || selectedTool.title,
        category: draftCategory || selectedTool.category,
        toolUrl: draftUrl || selectedTool.toolUrl,
        pedagogicalNarrative: result.pedagogicalNarrative,
        ogImageUrl: nextImage,
        tags: nextTags,
        aiVetted: true,
        reportCard: nextReportCard,
        overallVerdict: result.overallVerdict,
        status: nextStatus,
        updatedAt: new Date(),
      };

      // Update local React state immediately so the inspector drawer reflects the audit right away
      setDraftNarrative(result.pedagogicalNarrative);
      if (nextImage) setDraftImage(nextImage);
      setDraftTags(nextTags);
      setSelectedTool(updatedTool);

      // Persist audit results to Firestore so they survive reloads and tab switches
      if (firestore && selectedTool.id) {
        setAuditStageMessage("Saving 4-Pillar Scorecard & Narrative to Firestore...");
        const targetCollection = isPublished ? "tools_published" : "tools_submitted";
        const targetRef = doc(firestore, targetCollection, selectedTool.id);
        await setDoc(
          targetRef,
          sanitizeForFirestore({
            title: updatedTool.title,
            category: updatedTool.category,
            toolUrl: updatedTool.toolUrl,
            pedagogicalNarrative: result.pedagogicalNarrative,
            ogImageUrl: nextImage || null,
            tags: nextTags,
            aiVetted: true,
            reportCard: nextReportCard,
            overallVerdict: result.overallVerdict,
            status: nextStatus,
            updatedAt: new Date(),
          }),
          { merge: true }
        );
      }

      const completionMsg =
        "AI Audit Complete: 4-Pillar Scorecard & Narrative generated. Review below and click 'Approve & Publish' to push live.";
      setAuditSuccessMessage(completionMsg);
      toast({
        title: "AI Audit Complete",
        description: "4-Pillar Scorecard & Narrative generated. Review below and click 'Approve & Publish' to push live.",
      });
    } catch (error: any) {
      clearTimeout(stageTimer);
      console.error("Vetting agent failed:", error);
      const errorReason =
        error instanceof Error && error.message
          ? error.message
          : typeof error === "string"
          ? error
          : "Could not complete the automated audit.";
      setAuditError(errorReason);
      toast({
        variant: "destructive",
        title: "AI Audit Failed",
        description: errorReason,
      });
    } finally {
      setIsVetting(false);
    }
  };

  const handleFindOfficialImage = async () => {
    if (!draftUrl) {
      toast({ variant: "destructive", title: "Missing URL", description: "Please enter an Institutional Link first." });
      return;
    }
    setIsSearchingImage(true);
    setDiscoveredImage(null);
    try {
      const { findOfficialImage } = await import("@/ai/flows/admin-image-management");
      const result = await findOfficialImage({ url: draftUrl });
      if (result.success && result.url) {
        setDiscoveredImage({ url: result.url, source: 'official' });
        toast({ title: "Official Image Found", description: "Review the image and click Use This Image." });
      } else {
        toast({ variant: "destructive", title: "Image Not Found", description: result.error || "No suitable official image found." });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to search for image." });
    } finally {
      setIsSearchingImage(false);
    }
  };

  const handleGenerateProfessionalImage = async () => {
    if (!draftTitle || !draftCategory) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter a title and category first." });
      return;
    }
    setIsGeneratingImage(true);
    setDiscoveredImage(null);
    try {
      const { generateProfessionalImage } = await import("@/ai/flows/admin-image-management");
      const result = await generateProfessionalImage({
        toolTitle: draftTitle,
        toolCategory: draftCategory,
        toolDescription: draftNarrative || activeTool?.initialDescription || ""
      });
      if (result.success && result.url) {
        setDiscoveredImage({ url: result.url, source: 'generated' });
        toast({ title: "Image Generated", description: "Review the generated image and click Use This Image." });
      } else {
        toast({ variant: "destructive", title: "Generation Failed", description: "Image generation failed. Your existing tool image has not been changed." });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Image generation failed. Your existing tool image has not been changed." });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTool) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Unsupported File", description: "Please upload a PNG, JPEG, WEBP, or GIF image." });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast({ variant: "destructive", title: "File Too Large", description: "Please upload an image under 5MB." });
      e.target.value = "";
      return;
    }

    setIsProcessing(true);
    try {
      const url = await gov.uploadToolImage(activeTool.id!, file);
      if (url) {
        setDraftImage(url);
        toast({ title: "Asset Uploaded" });
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload the image. Try again." });
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const handleSaveAndPublish = async () => {
    if (!activeTool) return;
    setIsProcessing(true);
    try {
      const isPublished = publishedTools?.some(t => t.id === activeTool.id);
      const sourceCollection = isPublished ? "tools_published" : "tools_submitted";

      const updatedTool: ToolSubmission = {
        ...activeTool,
        title: draftTitle,
        category: draftCategory,
        toolUrl: draftUrl,
        pedagogicalNarrative: draftNarrative,
        ogImageUrl: draftImage,
        tags: draftTags,
        aiVetted: activeTool.aiVetted ?? true,
      };

      await gov.publishTool(updatedTool, draftNarrative, draftImage, draftTags, sourceCollection);
      toast({
        title: "Tool Approved & Published",
        description: `${draftTitle || activeTool.title} is now live in the GVSU AI Directory.`
      });
      setAuditSuccessMessage(null);
      setActiveTool(null);
    } catch (error: any) {
      console.error("Save & publish failed:", error);
      const errMsg = error instanceof Error ? error.message : "Could not publish tool. Try again.";
      toast({ variant: "destructive", title: "Publish Failed", description: errMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTool = async () => {
    if (!activeTool || !firestore) return;
    setIsProcessing(true);
    try {
      const isPublished = publishedTools?.some(t => t.id === activeTool.id);
      const toolId = activeTool.id!;
      const submitterEmail = activeTool.submitterEmail;
      const submitterDisplayName = activeTool.submitterDisplayName;

      const updatedTool: ToolSubmission = {
        ...activeTool,
        title: draftTitle,
        category: draftCategory,
        toolUrl: draftUrl,
        pedagogicalNarrative: draftNarrative,
        ogImageUrl: draftImage,
        tags: draftTags,
        status: "Rejected",
        isVerified: false,
        updatedAt: new Date(),
      };

      if (isPublished) {
        await deleteDoc(doc(firestore, "tools_published", toolId));
      }

      const subRef = doc(firestore, "tools_submitted", toolId);
      await setDoc(subRef, sanitizeForFirestore({
        ...updatedTool,
        updatedAt: new Date()
      }), { merge: true });

      if (submitterEmail) {
        await addDoc(collection(firestore, "mail"), {
          to: submitterEmail,
          message: {
            subject: "Update on your LakerAI Tool Submission",
            html: `Hello ${submitterDisplayName || "Laker User"},<br><br>Thank you for submitting <b>${draftTitle}</b> to the GVSU LakerAI Directory.<br><br>After auditing the submission, our governance team has decided not to approve it at this time.<br><br>If you believe this was an error, please reach out to the governance desk.`
          }
        });
      }

      toast({ title: "Tool Rejected", description: "Submission has been marked as Rejected." });
      setActiveTool(null);
    } catch (error) {
      console.error("Reject tool failed:", error);
      toast({ variant: "destructive", title: "Action Failed", description: "Could not reject the tool. Try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkSyncImages = async () => {
    if (!firestore) return;
    const targetList = moderationTab === "live" ? liveTools : pendingTools;
    if (targetList.length === 0) return;

    setIsBulkSyncing(true);
    const targetCollection = moderationTab === "live" ? "tools_published" : "tools_submitted";
    let scrapedCount = 0;
    let fallbackCount = 0;

    try {
      const { findOfficialImage, generateProfessionalImage } = await import("@/ai/flows/admin-image-management");
      for (const tool of targetList) {
        if (!tool.id || !tool.toolUrl) continue;
        const found = await findOfficialImage({ url: tool.toolUrl });
        if (found.success && found.url) {
          await setDoc(doc(firestore, targetCollection, tool.id), { ogImageUrl: found.url, updatedAt: new Date() }, { merge: true });
          scrapedCount++;
        } else if (!tool.ogImageUrl) {
          const gen = await generateProfessionalImage({
            toolTitle: tool.title,
            toolCategory: tool.category,
            toolDescription: tool.initialDescription || "",
          });
          if (gen.success && gen.url) {
            await setDoc(doc(firestore, targetCollection, tool.id), { ogImageUrl: gen.url, updatedAt: new Date() }, { merge: true });
            fallbackCount++;
          }
        }
      }
      toast({
        title: "Bulk Image Sync Complete",
        description: `Updated ${scrapedCount} tools with live official images (${fallbackCount} generated SVG fallbacks).`,
      });
    } catch (err) {
      console.error("Bulk image sync failed:", err);
      toast({ variant: "destructive", title: "Bulk Sync Error", description: "Failed to complete bulk image discovery." });
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const avatarInitial = draftTitle.trim().charAt(0).toUpperCase() || "?";
  const normalizedScorecard = useMemo(
    () => normalizeReportCard(activeTool?.reportCard),
    [activeTool?.reportCard]
  );
  const hasScorecard = normalizedScorecard.pillars.length > 0;
  const isAuditedReady =
    Boolean(activeTool?.aiVetted) ||
    activeTool?.status === "Audited - Ready for Approval" ||
    activeTool?.status === "Review" ||
    hasScorecard;
  const isToolsLoading = submittedLoading || publishedLoading;

  const getHeaderStatusLabel = (tool: ToolSubmission) => {
    if (tool.status === "Published") return "LIVE ON HUB";
    if (tool.status === "Rejected") return "REJECTED";
    if (
      tool.aiVetted ||
      tool.status === "Audited - Ready for Approval" ||
      tool.status === "Review" ||
      Boolean(tool.reportCard)
    ) {
      return "AUDITED - READY FOR APPROVAL";
    }
    return "STAGING QUEUE";
  };

  return (
    <div className="flex-1 flex gap-8 min-h-0">
      <aside className="w-[380px] flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Directory Queue</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkSyncImages}
            disabled={isBulkSyncing || isToolsLoading}
            className="h-8 text-[9px] font-bold tracking-widest uppercase border-gvsuBlue/30 text-gvsuBlue hover:bg-gvsuBlue hover:text-white rounded-lg"
          >
            {isBulkSyncing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Search className="w-3 h-3 mr-1.5" />}
            Bulk Sync Official Images
          </Button>
        </div>
        <Tabs value={moderationTab} onValueChange={setModerationTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-slate-200/50 p-1 flex h-12 rounded-xl border border-slate-200 shrink-0">
            <TabsTrigger value="pending" className="flex-1 rounded-lg data-[state=active]:bg-white font-bold text-[10px] uppercase tracking-wider">
              Pending ({pendingTools.length})
            </TabsTrigger>
            <TabsTrigger value="live" className="flex-1 rounded-lg data-[state=active]:bg-white font-bold text-[10px] uppercase tracking-wider">
              Live Hub ({liveTools.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 rounded-lg data-[state=active]:bg-white font-bold text-[10px] uppercase tracking-wider">
              Rejected ({rejectedTools.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-12">
                {isToolsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-2xl border bg-white space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  ))
                ) : pendingTools.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-2xl bg-white/50 text-slate-400 text-xs">
                    No pending tools to review.
                  </div>
                ) : (
                  pendingTools.map((tool) => {
                    const toolAudited =
                      Boolean(tool.aiVetted) ||
                      tool.status === "Audited - Ready for Approval" ||
                      tool.status === "Review" ||
                      Boolean(tool.reportCard);
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleSelectTool(tool)}
                        className={cn(
                          "w-full text-left p-5 rounded-2xl border transition-all group",
                          activeTool?.id === tool.id
                            ? "bg-white border-gvsuBlue shadow-md ring-1 ring-gvsuBlue/10"
                            : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tool.category}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] font-bold uppercase border-none px-2 py-0.5",
                              toolAudited
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            )}
                          >
                            {toolAudited ? "Audited - Ready" : "Needs Audit"}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-gvsuBlue">{tool.title}</h4>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="live" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-12">
                {isToolsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-2xl border bg-white space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  ))
                ) : liveTools.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-2xl bg-white/50 text-slate-400 text-xs">
                    No live tools.
                  </div>
                ) : (
                  liveTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectTool(tool)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all group shadow-sm",
                        activeTool?.id === tool.id
                          ? "bg-white border-gvsuBlue shadow-md ring-1 ring-gvsuBlue/10"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{tool.category}</span>
                      <h4 className="font-bold text-slate-900 group-hover:text-gvsuBlue">{tool.title}</h4>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rejected" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-12">
                {isToolsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-2xl border bg-white space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  ))
                ) : rejectedTools.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-2xl bg-white/50 text-slate-400 text-xs">
                    No rejected tools.
                  </div>
                ) : (
                  rejectedTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectTool(tool)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all group shadow-sm",
                        activeTool?.id === tool.id
                          ? "bg-white border-gvsuBlue shadow-md ring-1 ring-gvsuBlue/10"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{tool.category}</span>
                      <h4 className="font-bold text-slate-900 group-hover:text-gvsuBlue">{tool.title}</h4>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </aside>

      <section className="flex-1 flex flex-col min-h-0">
        {activeTool ? (
          <div className="bg-white border border-slate-200 rounded-3xl flex flex-col flex-1 overflow-hidden shadow-xl">
            <header className="p-6 sm:p-8 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gvsuBlue rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden shrink-0">
                  {draftImage ? (
                    <img src={draftImage} alt={draftTitle || "Tool"} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    avatarInitial
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">{draftTitle || "Reviewing App"}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge
                      variant="outline"
                      data-testid="moderation-status-badge"
                      className={cn(
                        "text-[9px] font-bold uppercase border-none px-2.5 py-0.5",
                        activeTool.status === "Published" && "bg-green-100 text-green-700 hover:bg-green-100",
                        activeTool.status === "Rejected" && "bg-red-100 text-red-700 hover:bg-red-100",
                        activeTool.status !== "Published" &&
                          activeTool.status !== "Rejected" &&
                          isAuditedReady &&
                          "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
                        activeTool.status !== "Published" &&
                          activeTool.status !== "Rejected" &&
                          !isAuditedReady &&
                          "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      )}
                    >
                      {getHeaderStatusLabel(activeTool)}
                    </Badge>
                    {hasScorecard && (
                      <Badge
                        variant="outline"
                        data-testid="moderation-risk-badge"
                        className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5 flex items-center gap-1",
                          normalizedScorecard.riskRating === "Low Risk" &&
                            "bg-bigLake/20 text-midnight border-bigLake/60",
                          normalizedScorecard.riskRating === "Moderate Risk" &&
                            "bg-archway/30 text-[#5C3A21] border-archway",
                          normalizedScorecard.riskRating === "High Risk" &&
                            "bg-carillonBrick text-white border-carillonBrick"
                        )}
                      >
                        {normalizedScorecard.riskRating === "Low Risk" ? (
                          <ShieldCheck className="w-3 h-3 text-gvsuBlue" />
                        ) : normalizedScorecard.riskRating === "Moderate Risk" ? (
                          <AlertTriangle className="w-3 h-3 text-carillonBrick" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        {normalizedScorecard.riskRating}
                        {normalizedScorecard.avgScore !== null && ` (${normalizedScorecard.avgScore}/5.0)`}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-[10px] tracking-widest uppercase h-10 rounded-xl px-4"
                  onClick={handleRejectTool}
                  disabled={isProcessing || isVetting}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-3.5 h-3.5 mr-2" />}
                  REJECT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="run-audit-button"
                  className="text-gvsuBlue border-gvsuBlue font-bold text-[10px] tracking-widest uppercase hover:bg-gvsuBlue hover:text-white h-10 rounded-xl px-4"
                  onClick={handleRunVettingAgent}
                  disabled={isVetting || isProcessing}
                >
                  {isVetting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                      RUNNING 4-PILLAR AUDIT...
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 mr-2" />
                      RUN AUDIT
                    </>
                  )}
                </Button>
                <Button
                  data-testid="approve-publish-button"
                  className={cn(
                    "font-bold text-[10px] tracking-widest uppercase px-6 h-10 rounded-xl shadow-lg transition-all",
                    isAuditedReady && activeTool.status !== "Published"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50"
                      : "bg-gvsuBlue hover:bg-midnight text-white"
                  )}
                  onClick={handleSaveAndPublish}
                  disabled={isProcessing || isVetting}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                  )}
                  APPROVE &amp; PUBLISH
                </Button>
              </div>
            </header>

            {/* Live Audit Progress / Completion / Error Status Banner */}
            {isVetting && (
              <div
                role="status"
                aria-live="polite"
                data-testid="audit-progress-banner"
                className="px-8 py-4 bg-gvsuBlue/10 border-b border-gvsuBlue/20 flex items-center justify-between gap-4 shrink-0"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-gvsuBlue animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gvsuBlue uppercase tracking-wider">
                      Scraping vendor metadata &amp; running Gemini 3.1 Pro 4-Pillar Audit...
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{auditStageMessage}</p>
                  </div>
                </div>
                <Badge className="bg-gvsuBlue text-white border-none text-[9px] uppercase tracking-widest shrink-0">
                  In Progress
                </Badge>
              </div>
            )}

            {!isVetting && auditError && (
              <div
                role="alert"
                data-testid="audit-error-banner"
                className="px-8 py-4 bg-red-50 border-b border-red-200 flex items-center justify-between gap-4 shrink-0"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wider">
                      Automated Audit Failed
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">{auditError}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[9px] uppercase tracking-wider border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => setAuditError(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}

            {!isVetting && !auditError && (auditSuccessMessage || (isAuditedReady && activeTool.status !== "Published")) && (
              <div
                role="status"
                aria-live="polite"
                data-testid="audit-complete-banner"
                className="px-8 py-4 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-4 shrink-0"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      {auditSuccessMessage ||
                        "AI Audit Complete: 4-Pillar Scorecard & Narrative generated. Review below and click 'Approve & Publish' to push live."}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Status: <span className="font-bold">Audited - Ready for Approval</span> &bull; Saved to Firestore staging queue.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveAndPublish}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] tracking-widest uppercase h-8 px-4 rounded-lg shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Approve &amp; Publish Now
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1 p-8">
              <div className="max-w-2xl space-y-10">
                {/* 4-Pillar Institutional Vetting Scorecard placed at the top of the inspector so it is immediately visible */}
                {hasScorecard && (
                  <div
                    data-testid="moderation-scorecard"
                    className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6 shadow-2xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-gvsuBlue" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gvsuBlue">
                          4-Pillar Institutional Vetting Scorecard
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {normalizedScorecard.avgScore !== null && (
                          <Badge className="bg-gvsuBlue text-white border-none text-[10px] font-bold">
                            Avg Score: {normalizedScorecard.avgScore}/5.0
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            normalizedScorecard.riskRating === "Low Risk" &&
                              "bg-bigLake/20 text-midnight border-bigLake/60",
                            normalizedScorecard.riskRating === "Moderate Risk" &&
                              "bg-archway/30 text-[#5C3A21] border-archway",
                            normalizedScorecard.riskRating === "High Risk" &&
                              "bg-carillonBrick text-white border-carillonBrick"
                          )}
                        >
                          {normalizedScorecard.riskRating}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {normalizedScorecard.pillars.map((pillar) => {
                        const pct = Math.min(100, Math.max(0, (pillar.score / 5) * 100));
                        return (
                          <div
                            key={pillar.key}
                            data-testid={`scorecard-pillar-${pillar.key}`}
                            className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                                {pillar.label}
                              </span>
                              <Badge className="bg-gvsuBlue/10 text-gvsuBlue border-none text-[10px] font-bold">
                                {pillar.score}/5
                              </Badge>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                                                    pillar.score >= 4
                                    ? "bg-gvsuBlue"
                                    : pillar.score >= 3
                                    ? "bg-archway"
                                    : "bg-carillonBrick"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{pillar.summary}</p>
                          </div>
                        );
                      })}
                    </div>
                    {activeTool.overallVerdict && (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-900">
                          Institutional Verdict:{" "}
                          <span className="font-normal text-slate-700">{activeTool.overallVerdict}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gvsuBlue uppercase tracking-widest">
                    Academic &amp; FERPA Narrative
                  </label>
                  <Textarea
                    data-testid="moderation-narrative-input"
                    value={draftNarrative}
                    onChange={(e) => setDraftNarrative(e.target.value)}
                    className="min-h-[120px] border-slate-200 rounded-2xl leading-relaxed text-sm p-5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">App Name</label>
                    <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} className="h-12 border-slate-200 rounded-xl font-medium" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                    <Input value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} className="h-12 border-slate-200 rounded-xl font-medium" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Link</label>
                  <Input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} className="h-12 border-slate-200 rounded-xl font-medium" />
                </div>

                <div className="space-y-5 pt-6 border-t border-slate-200">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tool Image Management</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[9px] font-bold tracking-widest uppercase"
                        onClick={handleFindOfficialImage}
                        disabled={isSearchingImage || isGeneratingImage}
                      >
                        {isSearchingImage ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Search className="w-3 h-3 mr-1.5" />}
                        Find Official Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[9px] font-bold tracking-widest uppercase"
                        onClick={handleGenerateProfessionalImage}
                        disabled={isSearchingImage || isGeneratingImage}
                      >
                        {isGeneratingImage ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Bot className="w-3 h-3 mr-1.5" />}
                        Generate Professional Image
                      </Button>
                    </div>
                  </div>
                  
                  {discoveredImage && (
                    <div className="p-4 bg-gvsuBlue/5 border border-gvsuBlue/20 rounded-2xl flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-gvsuBlue">
                            {discoveredImage.source === 'official' ? 'Official Image Found' : 'Generated Image'}
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            {discoveredImage.source === 'official' ? 'Source: Extracted from Official URL' : 'Generated via Gemini SVG Engine'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[9px] uppercase tracking-wider" 
                            onClick={() => setDiscoveredImage(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-7 text-[9px] uppercase tracking-wider bg-gvsuBlue hover:bg-midnight" 
                            onClick={() => {
                              setDraftImage(discoveredImage.url);
                              setDiscoveredImage(null);
                              toast({ title: 'Image Applied', description: 'The image has been set as the draft image.' });
                            }}
                          >
                            Use This Image
                          </Button>
                        </div>
                      </div>
                      <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img src={discoveredImage.url} alt="Discovered preview" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div
                      className="group relative aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center transition-all hover:bg-slate-100 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {draftImage ? (
                        <img src={draftImage} alt="Current Approved Image" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Image: Placeholder</span>
                        </div>
                      )}
                      {draftImage && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 w-7 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDraftImage("");
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    />
                    <Input value={draftImage} onChange={(e) => setDraftImage(e.target.value)} placeholder="Or paste asset link..." className="h-10 text-xs border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Tags</label>
                  <Tagger tags={draftTags} onChange={setDraftTags} />
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/50">
            <Activity className="w-12 h-12 opacity-10 mb-4" />
            <p className="font-bold text-[11px] uppercase tracking-widest">Select an entry to audit</p>
          </div>
        )}
      </section>
    </div>
  );
}
