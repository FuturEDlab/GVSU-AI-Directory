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
import { ToolSubmission, ToolTags } from "@/app/lib/tool-types";
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
  Activity
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

interface ReportCardEntry {
  score: number;
  summary: string;
}
type ReportCard = Record<string, ReportCardEntry>;

interface ToolModerationTabProps {
  initialSelectToolId?: string | null;
}

export function ToolModerationTab({ initialSelectToolId }: ToolModerationTabProps) {
  const { isAdmin } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const gov = useGovernanceHub();

  const [activeTool, setActiveTool] = useState<ToolSubmission | null>(null);
  const [moderationTab, setModerationTab] = useState<string>("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVetting, setIsVetting] = useState(false);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
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
    setActiveTool(tool);
    setDraftTitle(tool.title || "");
    setDraftCategory(tool.category || "");
    setDraftUrl(tool.toolUrl || "");
    setDraftNarrative(tool.pedagogicalNarrative || tool.initialDescription || "");
    setDraftImage(tool.ogImageUrl || "");
    setDraftTags(tool.tags || INITIAL_TAGS);
    setDiscoveredImage(null);
  };

  const handleRunVettingAgent = async () => {
    if (!activeTool) return;
    setIsVetting(true);
    try {
      // Dynamic import to keep main bundle lean
      const { automatedVettingAgent } = await import("@/ai/flows/admin-generates-tool-narrative-and-image");
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
      await setDoc(subRef, {
        ...updatedTool,
        updatedAt: new Date()
      }, { merge: true });

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

  const avatarInitial = draftTitle.trim().charAt(0).toUpperCase() || "?";
  const reportCard = activeTool?.reportCard as ReportCard | undefined;
  const isToolsLoading = submittedLoading || publishedLoading;

  return (
    <div className="flex-1 flex gap-8 min-h-0">
      <aside className="w-[380px] flex flex-col gap-6 shrink-0">
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
                  pendingTools.map((tool) => (
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
                  ))
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
            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
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
