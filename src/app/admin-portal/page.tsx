"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { GVSUHeader } from "@/components/GVSUHeader";
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
  getDocs,
  writeBatch,
  updateDoc,
  setDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore";
import { ToolSubmission, ToolTags, UserReport } from "@/app/lib/tool-types";
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
  RefreshCw,
  Activity,
  Bot,
  Flag,
  X,
  Check,
  ExternalLink,
  Eye,
  Search,
  AlertCircle
} from "lucide-react";
import { useGovernanceHub } from "@/hooks/use-governance-hub";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tagger } from "@/components/admin/governance/Tagger";
import { cn } from "@/lib/utils";
import { fetchGlobalNews } from "@/ai/flows/fetch-global-news";
import { automatedVettingAgent } from "@/ai/flows/admin-generates-tool-narrative-and-image";
import { AdminFeedbackTab } from "@/components/admin/governance/AdminFeedbackTab";

const INITIAL_TAGS: ToolTags = {
  security_privacy: [],
  ethics_stewardship: [],
  pedagogical_value: [],
  institutional_status: ["Community Discovery"],
  access_cost: []
};

// Firestore hard-caps a batch write at 500 operations.
// Keep a safety margin below that so delete + add ops together never exceed the limit.
const FIRESTORE_BATCH_LIMIT = 450;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

interface ReportCardEntry {
  score: number;
  summary: string;
}

type ReportCard = Record<string, ReportCardEntry>;

export default function AdminPortal() {
  const { isAdmin, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const gov = useGovernanceHub();

  const [mounted, setMounted] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolSubmission | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [isVetting, setIsVetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor State
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftNarrative, setDraftNarrative] = useState("");
  const [draftImage, setDraftImage] = useState("");
  const [draftTags, setDraftTags] = useState<ToolTags>(INITIAL_TAGS);

  // Top-level Navigation & Sub-tab navigation
  const [topTab, setTopTab] = useState<"moderation" | "reports" | "feedback">("moderation");
  const [moderationTab, setModerationTab] = useState<string>("pending");

  // User Reports State
  const [reportsFilter, setReportsFilter] = useState<"pending" | "resolved" | "dismissed" | "all">("pending");
  const [searchReportQuery, setSearchReportQuery] = useState("");
  const [activeReport, setActiveReport] = useState<UserReport | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin && mounted) {
      router.push("/");
    }
  }, [authLoading, isAdmin, mounted, router]);

  // Firestore queries for Tools
  const submittedQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "tools_submitted"), orderBy("createdAt", "desc"), limit(100));
  }, [firestore, isAdmin]);

  const publishedQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "tools_published"), orderBy("publishedAt", "desc"), limit(100));
  }, [firestore, isAdmin]);

  const { data: submittedTools } = useCollection<ToolSubmission>(submittedQuery);
  const { data: publishedTools } = useCollection<ToolSubmission>(publishedQuery);

  // Split tools into Pending, Live, and Rejected status groups client-side
  const pendingTools = submittedTools?.filter(t => t.status !== "Rejected") || [];
  const liveTools = publishedTools || [];
  const rejectedTools = submittedTools?.filter(t => t.status === "Rejected") || [];

  // Firestore queries for Reports
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "reports"), orderBy("createdAt", "desc"), limit(100));
  }, [firestore, isAdmin]);

  const { data: rawReports, isLoading: reportsLoading } = useCollection<UserReport>(reportsQuery);

  // Clean-up activeReport if it's no longer in the retrieved reports list
  useEffect(() => {
    if (activeReport && rawReports) {
      const exists = rawReports.some(r => r.id === activeReport.id);
      if (!exists) {
        setActiveReport(null);
      }
    }
  }, [rawReports, activeReport]);

  const handleSelectTool = (tool: ToolSubmission) => {
    setActiveTool(tool);
    setDraftTitle(tool.title || "");
    setDraftCategory(tool.category || "");
    setDraftUrl(tool.toolUrl || "");
    setDraftNarrative(tool.pedagogicalNarrative || tool.initialDescription || "");
    setDraftImage(tool.ogImageUrl || "");
    setDraftTags(tool.tags || INITIAL_TAGS);
  };

  const handleRunVettingAgent = async () => {
    if (!activeTool) return;
    setIsVetting(true);
    try {
      const result = await automatedVettingAgent({
        toolTitle: draftTitle,
        toolDescription: activeTool.initialDescription,
        toolUrl: draftUrl
      });

      setDraftNarrative(result.pedagogicalNarrative);
      if (result.scrapedOgImage) setDraftImage(result.scrapedOgImage);

      setActiveTool(prev => prev ? {
        ...prev,
        aiVetted: true,
        reportCard: result.reportCard,
        overallVerdict: result.overallVerdict
      } : null);

      toast({ title: "Vetting Complete", description: "Audit dimension scores generated." });
    } catch (error) {
      console.error("Vetting agent failed:", error);
      toast({ variant: "destructive", title: "Agent Failure", description: "Could not complete the automated audit. Try again." });
    } finally {
      setIsVetting(false);
    }
  };

  const commitInChunks = async (ops: Array<(batch: ReturnType<typeof writeBatch>) => void>) => {
    if (!firestore) return;
    for (let i = 0; i < ops.length; i += FIRESTORE_BATCH_LIMIT) {
      const chunk = ops.slice(i, i + FIRESTORE_BATCH_LIMIT);
      const batch = writeBatch(firestore);
      chunk.forEach(op => op(batch));
      await batch.commit();
    }
  };

  const handleRefreshAll = async () => {
    if (!firestore) return;
    setIsRefreshingNews(true);
    try {
      localStorage.removeItem('laker_ai_news_ts');
      const articles = await fetchGlobalNews();

      const oldNews = await getDocs(collection(firestore, 'global_news'));
      const deleteOps = oldNews.docs.map(
        d => (batch: ReturnType<typeof writeBatch>) => batch.delete(d.ref)
      );

      const addOps = (articles ?? []).map(article => (batch: ReturnType<typeof writeBatch>) => {
        const artRef = doc(collection(firestore, 'global_news'));
        batch.set(artRef, { ...article, publishedAt: new Date().toISOString() });
      });

      await commitInChunks([...deleteOps, ...addOps]);

      toast({ title: "Hub Refreshed", description: "Directories synchronized." });
    } catch (error) {
      console.error("Hub refresh failed:", error);
      toast({ variant: "destructive", title: "Refresh Failed", description: "Could not sync global news. Try again shortly." });
    } finally {
      setIsRefreshingNews(false);
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

      const updatedTool = {
        ...activeTool,
        title: draftTitle,
        category: draftCategory,
        toolUrl: draftUrl,
        pedagogicalNarrative: draftNarrative,
        ogImageUrl: draftImage,
        tags: draftTags
      };

      await gov.publishTool(updatedTool, draftNarrative, draftImage, draftTags, sourceCollection);
      toast({ title: "Tool Verified", description: "Changes are live." });
      setActiveTool(null);
    } catch (error) {
      console.error("Save & publish failed:", error);
      toast({ variant: "destructive", title: "Action Failed", description: "Could not save changes. Try again." });
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
      const submitterId = activeTool.submitterId;
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
        // Delete from tools_published
        await deleteDoc(doc(firestore, "tools_published", toolId));
      }

      // Save to tools_submitted with status "Rejected"
      const subRef = doc(firestore, "tools_submitted", toolId);
      await setDoc(subRef, {
        ...updatedTool,
        updatedAt: new Date()
      }, { merge: true });

      // Notify the user via email simulation
      if (submitterEmail) {
        await addDoc(collection(firestore, "mail"), {
          to: submitterEmail,
          message: {
            subject: "Update on your LakerAI Tool Submission",
            html: `Hello ${submitterDisplayName || "Laker User"},<br><br>Thank you for submitting <b>${draftTitle}</b> to the GVSU LakerAI Directory.<br><br>After auditing the submission, our governance team has decided not to approve it at this time. This may be due to security/privacy concerns, compliance policies, or duplicated entries.<br><br>If you believe this was an error or would like to request clarification, please reach out to the governance desk.`
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

  // Report status normalization
  const getNormalizedStatus = (status?: string) => {
    if (!status) return "pending";
    const s = status.toLowerCase();
    if (s === "resolved") return "resolved";
    if (s === "dismissed") return "dismissed";
    return "pending";
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: "Pending" | "Resolved" | "Dismissed") => {
    if (!firestore) return;
    try {
      const reportRef = doc(firestore, "reports", reportId);
      await updateDoc(reportRef, { status: newStatus });
      
      // Update local state if activeReport is updated
      if (activeReport && activeReport.id === reportId) {
        setActiveReport(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      toast({
        title: `Report Updated`,
        description: `Successfully marked report as ${newStatus}.`,
      });
    } catch (err) {
      console.error("Failed to update report status:", err);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not update the report status. Try again.",
      });
    }
  };

  const formatReportDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  // Find tool matches from pending or live lists for user reports mapping
  const getAffectedToolForReport = (report: UserReport | null) => {
    if (!report) return null;
    if (report.toolId) {
      return (
        publishedTools?.find(t => t.id === report.toolId) || 
        submittedTools?.find(t => t.id === report.toolId) || 
        null
      );
    }
    const name = report.toolName?.toLowerCase();
    if (!name) return null;
    return (
      publishedTools?.find(t => t.title.toLowerCase() === name) || 
      submittedTools?.find(t => t.title.toLowerCase() === name) || 
      null
    );
  };

  const handleModerateAffectedTool = (tool: ToolSubmission) => {
    setTopTab("moderation");
    if (tool.status === "Published") {
      setModerationTab("live");
    } else if (tool.status === "Rejected") {
      setModerationTab("rejected");
    } else {
      setModerationTab("pending");
    }
    handleSelectTool(tool);
  };

  // Filter & search logic for reports
  const filteredReports = (rawReports || []).filter(report => {
    const norm = getNormalizedStatus(report.status);
    const matchesFilter = reportsFilter === "all" ? true : norm === reportsFilter;
    
    const term = searchReportQuery.toLowerCase();
    const matchesSearch = term === "" || 
      (report.toolName || "").toLowerCase().includes(term) ||
      (report.reportedBy || report.reporterEmail || "").toLowerCase().includes(term) ||
      (report.description || report.comments || "").toLowerCase().includes(term) ||
      (report.issueType || report.reason || "").toLowerCase().includes(term);
      
    return matchesFilter && matchesSearch;
  });

  const pendingReportsCount = (rawReports || []).filter(r => getNormalizedStatus(r.status) === "pending").length;

  if (!mounted || authLoading) return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Opening The Back Room...</p>
    </div>
  );

  const avatarInitial = draftTitle.trim().charAt(0).toUpperCase() || "?";
  const reportCard = activeTool?.reportCard as ReportCard | undefined;
  const affectedTool = getAffectedToolForReport(activeReport);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <GVSUHeader />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="container mx-auto py-8 px-6 flex-1 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center mb-8 shrink-0">
            <div>
              <h2 className="text-4xl font-serif text-slate-900 font-black uppercase tracking-tight">Governance Hub</h2>
              <p className="text-slate-500 mt-1 font-medium text-sm">Institutional IT Compliance Auditor.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Top-Level Tabs Switcher */}
              <div className="bg-slate-200/50 p-1 flex h-11 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <button
                  onClick={() => setTopTab("moderation")}
                  className={cn(
                    "px-5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all",
                    topTab === "moderation" ? "bg-white text-gvsuBlue shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Tool Moderation
                </button>
                <button
                  onClick={() => setTopTab("reports")}
                  className={cn(
                    "px-5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5",
                    topTab === "reports" ? "bg-white text-gvsuBlue shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  User Reports
                  {pendingReportsCount > 0 && (
                    <span className="bg-amber-500 text-white border-none text-[8px] h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full font-bold">
                      {pendingReportsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setTopTab("feedback")}
                  className={cn(
                    "px-5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5",
                    topTab === "feedback" ? "bg-white text-gvsuBlue shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Community Feedback
                </button>
              </div>

              <Button
                variant="outline"
                className="border-gvsuBlue text-gvsuBlue font-bold h-11 px-6 rounded-xl text-[10px] tracking-widest hover:bg-gvsuBlue hover:text-white shadow-sm"
                onClick={handleRefreshAll}
                disabled={isRefreshingNews}
              >
                {isRefreshingNews ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                REFRESH HUB
              </Button>
            </div>
          </header>

          {topTab === "moderation" ? (
            <div className="flex-1 flex gap-8 min-h-0">
              <aside className="w-[380px] flex flex-col gap-6 shrink-0">
                <Tabs value={moderationTab} onValueChange={setModerationTab} className="flex-1 flex flex-col min-h-0">
                  <TabsList className="bg-slate-200/50 p-1 flex h-12 rounded-xl border border-slate-200 shrink-0">
                    <TabsTrigger value="pending" className="flex-1 rounded-lg data-[state=active]:bg-white font-bold text-[10px] uppercase tracking-wider">Pending ({pendingTools.length})</TabsTrigger>
                    <TabsTrigger value="live" className="flex-1 rounded-lg data-[state=active]:bg-white font-bold text-[10px] uppercase tracking-wider">Live Hub ({liveTools.length})</TabsTrigger>
                    <TabsTrigger value="rejected" className="flex-1 rounded-lg data-[state=active]:bg-white font-bold text-[10px] uppercase tracking-wider">Rejected ({rejectedTools.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="flex-1 mt-4 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4 pb-12">
                        {pendingTools.map((tool) => (
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
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{tool.category}</span>
                            <h4 className="font-bold text-slate-900 group-hover:text-gvsuBlue">{tool.title}</h4>
                          </button>
                        ))}
                        {pendingTools.length === 0 && (
                          <div className="text-center py-12 border border-dashed rounded-2xl bg-white/50 text-slate-400 text-xs">
                            No pending tools to review.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="live" className="flex-1 mt-4 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4 pb-12">
                        {liveTools.map((tool) => (
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
                        ))}
                        {liveTools.length === 0 && (
                          <div className="text-center py-12 border border-dashed rounded-2xl bg-white/50 text-slate-400 text-xs">
                            No live tools.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="rejected" className="flex-1 mt-4 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4 pb-12">
                        {rejectedTools.map((tool) => (
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
                        ))}
                        {rejectedTools.length === 0 && (
                          <div className="text-center py-12 border border-dashed rounded-2xl bg-white/50 text-slate-400 text-xs">
                            No rejected tools.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </aside>

              <section className="flex-1 flex flex-col min-h-0">
                {activeTool ? (
                  <div className="bg-white border border-slate-200 rounded-3xl flex flex-col flex-1 overflow-hidden shadow-xl">
                    <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gvsuBlue rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden shrink-0">
                          {draftImage ? (
                            <img src={draftImage} alt={draftTitle || "Tool"} className="w-full h-full object-cover" />
                          ) : (
                            avatarInitial
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-slate-900">{draftTitle || "Reviewing App"}</h3>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold uppercase mt-1 border-none px-2 py-0.5",
                            activeTool.status === "Published" && "bg-green-100 text-green-700 hover:bg-green-100",
                            activeTool.status === "Rejected" && "bg-red-100 text-red-700 hover:bg-red-100",
                            activeTool.status !== "Published" && activeTool.status !== "Rejected" && "bg-amber-100 text-amber-700 hover:bg-amber-100"
                          )}>
                            {activeTool.status === "Published" ? "LIVE ON HUB" : activeTool.status === "Rejected" ? "REJECTED" : "STAGING QUEUE"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-[10px] tracking-widest uppercase h-10 rounded-xl px-4"
                          onClick={handleRejectTool}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-3.5 h-3.5 mr-2" />}
                          REJECT
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gvsuBlue border-gvsuBlue font-bold text-[10px] tracking-widest uppercase hover:bg-gvsuBlue hover:text-white"
                          onClick={handleRunVettingAgent}
                          disabled={isVetting}
                        >
                          {isVetting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Bot className="w-3.5 h-3.5 mr-2" />}
                          RUN AUDIT
                        </Button>
                        <Button
                          className="bg-gvsuBlue hover:bg-midnight text-white font-bold text-[10px] tracking-widest uppercase px-6 h-10 rounded-xl shadow-lg"
                          onClick={handleSaveAndPublish}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                          VERIFY & SAVE
                        </Button>
                      </div>
                    </header>

                    <ScrollArea className="flex-1 p-8">
                      <div className="max-w-2xl space-y-10">
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

                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gvsuBlue uppercase tracking-widest">Academic Narrative</label>
                          <Textarea
                            value={draftNarrative}
                            onChange={(e) => setDraftNarrative(e.target.value)}
                            className="min-h-[120px] border-slate-200 rounded-2xl leading-relaxed text-sm p-5"
                          />
                        </div>

                        {reportCard && (
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className="w-4 h-4 text-gvsuBlue" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gvsuBlue">Institutional Vetting Scorecard</span>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              {Object.entries(reportCard).map(([key, data]) => (
                                <div key={key} className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{key.replace(/_/g, ' ')}</span>
                                    <Badge className="bg-gvsuBlue/10 text-gvsuBlue border-none text-[8px]">{data.score}/5</Badge>
                                  </div>
                                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{data.summary}</p>
                                </div>
                              ))}
                            </div>
                            {activeTool.overallVerdict && (
                              <div className="pt-4 border-t border-slate-200">
                                <p className="text-[11px] font-bold text-slate-900">Verdict: <span className="font-normal text-slate-600">{activeTool.overallVerdict}</span></p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand Visual</label>
                          <div className="flex flex-col gap-4">
                            <div
                              className="group relative aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center transition-all hover:bg-slate-100 cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {draftImage ? (
                                <img src={draftImage} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center">
                                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Asset</span>
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
          ) : topTab === "reports" ? (
            /* Tab 2: User Reports layout */
            <div className="flex-1 flex gap-8 min-h-0">
              <aside className="w-[380px] flex flex-col gap-4 shrink-0 overflow-hidden">
                {/* Reports Filter Tabs */}
                <div className="bg-slate-200/50 p-1 flex h-11 rounded-xl border border-slate-200 shrink-0">
                  {(["pending", "resolved", "dismissed", "all"] as const).map((filterOpt) => (
                    <button
                      key={filterOpt}
                      onClick={() => setReportsFilter(filterOpt)}
                      className={cn(
                        "flex-1 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all",
                        reportsFilter === filterOpt ? "bg-white text-gvsuBlue shadow-sm" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      {filterOpt}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search reports..." 
                    className="pl-9 pr-9 bg-white border-slate-200 h-10 focus-visible:ring-gvsuBlue rounded-xl text-xs"
                    value={searchReportQuery}
                    onChange={(e) => setSearchReportQuery(e.target.value)}
                  />
                  {searchReportQuery && (
                    <button 
                      onClick={() => setSearchReportQuery("")} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gvsuBlue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Reports List */}
                <ScrollArea className="flex-1 overflow-hidden">
                  <div className="space-y-4 pb-12">
                    {reportsLoading ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-gvsuBlue mx-auto mb-2" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loading Reports...</span>
                      </div>
                    ) : filteredReports.length === 0 ? (
                      <div className="text-center py-12 border border-dashed rounded-2xl bg-white/50 text-slate-400 text-xs">
                        No reports matching filters.
                      </div>
                    ) : (
                      filteredReports.map((report) => {
                        const normStatus = getNormalizedStatus(report.status);
                        return (
                          <button
                            key={report.id}
                            onClick={() => setActiveReport(report)}
                            className={cn(
                              "w-full text-left p-5 rounded-2xl border transition-all group flex flex-col gap-2",
                              activeReport?.id === report.id
                                ? "bg-white border-gvsuBlue shadow-md ring-1 ring-gvsuBlue/10"
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                            )}
                          >
                            <div className="flex justify-between items-start w-full">
                              <span className="text-[9px] font-bold text-gvsuBlue uppercase tracking-widest">
                                {report.issueType || report.reason || "General Issue"}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {formatReportDate(report.createdAt).split(",")[0]}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-gvsuBlue truncate w-full">
                              {report.toolName || "Unnamed Tool"}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {report.description || report.comments || "No details provided."}
                            </p>
                            <div className="flex justify-between items-center w-full mt-1 pt-2 border-t border-slate-100">
                              <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                By: {report.reportedBy || report.reporterEmail || "Anonymous"}
                              </span>
                              <Badge
                                className={cn(
                                  "text-[8px] font-bold uppercase border-none px-2 py-0.5 pointer-events-none",
                                  normStatus === "pending" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                                  normStatus === "resolved" && "bg-green-100 text-green-700 hover:bg-green-100",
                                  normStatus === "dismissed" && "bg-slate-100 text-slate-700 hover:bg-slate-100"
                                )}
                              >
                                {report.status || "Pending"}
                              </Badge>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </aside>

              <section className="flex-1 flex flex-col min-h-0">
                {activeReport ? (
                  <div className="bg-white border border-slate-200 rounded-3xl flex flex-col flex-1 overflow-hidden shadow-xl">
                    <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-md shrink-0">
                          <Flag className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-slate-900">{activeReport.toolName || "Unnamed Tool"}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={cn(
                              "text-[8px] font-bold uppercase px-2 py-0.5 border-none",
                              getNormalizedStatus(activeReport.status) === "pending" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                              getNormalizedStatus(activeReport.status) === "resolved" && "bg-green-100 text-green-700 hover:bg-green-100",
                              getNormalizedStatus(activeReport.status) === "dismissed" && "bg-slate-100 text-slate-700 hover:bg-slate-100"
                            )}>
                              {activeReport.status || "Pending"}
                            </Badge>
                            {activeReport.toolId && (
                              <span className="text-[10px] text-slate-400 font-mono">ID: {activeReport.toolId}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getNormalizedStatus(activeReport.status) === "pending" ? (
                          <>
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] tracking-widest uppercase px-4 h-10 rounded-xl shadow-md"
                              onClick={() => handleUpdateReportStatus(activeReport.id, "Resolved")}
                            >
                              <Check className="w-3.5 h-3.5 mr-2" /> Mark Resolved
                            </Button>
                            <Button
                              className="bg-slate-600 hover:bg-slate-700 text-white font-bold text-[10px] tracking-widest uppercase px-4 h-10 rounded-xl shadow-md"
                              onClick={() => handleUpdateReportStatus(activeReport.id, "Dismissed")}
                            >
                              <X className="w-3.5 h-3.5 mr-2" /> Dismiss
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            className="border-gvsuBlue text-gvsuBlue font-bold text-[10px] tracking-widest uppercase px-4 h-10 rounded-xl hover:bg-gvsuBlue hover:text-white"
                            onClick={() => handleUpdateReportStatus(activeReport.id, "Pending")}
                          >
                            Reopen Report
                          </Button>
                        )}
                      </div>
                    </header>

                    <ScrollArea className="flex-1 p-8">
                      <div className="max-w-2xl space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Reported By</span>
                            <p className="font-bold text-slate-900 text-sm">{activeReport.reporterName || "GVSU User"}</p>
                            <p className="text-xs text-slate-500">{activeReport.reportedBy || activeReport.reporterEmail || "No Email Provided"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Submission Time</span>
                            <p className="font-bold text-slate-900 text-sm">{formatReportDate(activeReport.createdAt)}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Issue Category</span>
                          <p className="font-bold text-slate-900 text-sm">{activeReport.issueType || activeReport.reason || "General Inaccuracy"}</p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Reported Problem Description</span>
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed text-sm text-slate-700 whitespace-pre-wrap font-medium">
                            {activeReport.description || activeReport.comments || "No detailed description provided."}
                          </div>
                        </div>

                        {activeReport.toolUrl && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Submitted URL Link</span>
                            <a
                              href={activeReport.toolUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-gvsuBlue hover:underline flex items-center gap-1 font-bold tracking-tight"
                            >
                              {activeReport.toolUrl} <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}

                        <div className="pt-6 border-t border-slate-100 space-y-4">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Affected Directory Tool</h4>
                          {affectedTool ? (
                            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex justify-between items-center shadow-sm">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{affectedTool.category}</span>
                                <h5 className="font-bold text-slate-900 text-base">{affectedTool.title}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className={cn(
                                    "text-[8px] font-bold uppercase px-2 py-0.5 border-none",
                                    affectedTool.status === "Published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                  )}>
                                    {affectedTool.status === "Published" ? "Live" : "Staging Queue"}
                                  </Badge>
                                  {affectedTool.status === "Rejected" && (
                                    <Badge variant="outline" className="text-[8px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700 border-none">
                                      Rejected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                className="border-gvsuBlue text-gvsuBlue hover:bg-gvsuBlue hover:text-white font-bold text-[10px] tracking-widest uppercase h-9 px-4 rounded-xl shadow-sm"
                                onClick={() => handleModerateAffectedTool(affectedTool)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Moderate Tool
                              </Button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/20 text-center text-slate-400 text-xs">
                              No matching tool found in directory by name: <span className="font-semibold text-slate-700">"{activeReport.toolName}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex-1 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/50">
                    <Flag className="w-12 h-12 opacity-10 mb-4 animate-pulse" />
                    <p className="font-bold text-[11px] uppercase tracking-widest">Select a report to inspect</p>
                  </div>
                )}
              </section>
            </div>
          ) : topTab === "feedback" ? (
            <AdminFeedbackTab />
          ) : null}
        </div>
      </main>
    </div>
  );
}

