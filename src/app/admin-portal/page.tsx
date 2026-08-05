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
  RefreshCw,
  Activity,
  Bot
} from "lucide-react";
import { useGovernanceHub } from "@/hooks/use-governance-hub";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tagger } from "@/components/admin/governance/Tagger";
import { cn } from "@/lib/utils";
import { fetchGlobalNews } from "@/ai/flows/fetch-global-news";
import { automatedVettingAgent } from "@/ai/flows/admin-generates-tool-narrative-and-image";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin && mounted) {
      router.push("/");
    }
  }, [authLoading, isAdmin, mounted, router]);

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

  // Commits an arbitrary list of Firestore write operations in chunks that
  // stay under Firestore's 500-operation-per-batch limit.
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

  if (!mounted || authLoading) return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Opening The Back Room...</p>
    </div>
  );

  const avatarInitial = draftTitle.trim().charAt(0).toUpperCase() || "?";
  const reportCard = activeTool?.reportCard as ReportCard | undefined;

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
            <Button
              variant="outline"
              className="border-gvsuBlue text-gvsuBlue font-bold h-11 px-6 rounded-xl text-[10px] tracking-widest hover:bg-gvsuBlue hover:text-white shadow-sm"
              onClick={handleRefreshAll}
              disabled={isRefreshingNews}
            >
              {isRefreshingNews ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              REFRESH HUB
            </Button>
          </header>

          <div className="flex-1 flex gap-8 min-h-0">
            <aside className="w-[380px] flex flex-col gap-6 shrink-0">
              <Tabs defaultValue="pending" className="flex-1 flex flex-col min-h-0">
                <TabsList className="bg-slate-200/50 p-1 flex h-12 rounded-xl border border-slate-200 shrink-0">
                  <TabsTrigger value="pending" className="flex-1 rounded-lg data-[state=active]:bg-white font-bold text-[10px] uppercase tracking-wider">Pending ({submittedTools?.length || 0})</TabsTrigger>
                  <TabsTrigger value="live" className="flex-1 rounded-lg data-[state=active]:bg-white font-bold text-[10px] uppercase tracking-wider">Live Hub ({publishedTools?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 pb-12">
                      {submittedTools?.map((tool) => (
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
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="live" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 pb-12">
                      {publishedTools?.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => handleSelectTool(tool)}
                          className={cn(
                            "w-full text-left p-5 rounded-2xl border transition-all group shadow-sm",
                            activeTool?.id === tool.id
                              ? "bg-white border-gvsuBlue shadow-md"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{tool.category}</span>
                          <h4 className="font-bold text-slate-900 group-hover:text-gvsuBlue">{tool.title}</h4>
                        </button>
                      ))}
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
                      <div className="w-12 h-12 bg-gvsuBlue rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden">
                        {draftImage ? (
                          <img src={draftImage} alt={draftTitle || "Tool"} className="w-full h-full object-cover" />
                        ) : (
                          avatarInitial
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-slate-900">{draftTitle || "Reviewing App"}</h3>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase mt-1">
                          {activeTool.status === "Published" ? "LIVE ON HUB" : "STAGING QUEUE"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
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
        </div>
      </main>
    </div>
  );
}
