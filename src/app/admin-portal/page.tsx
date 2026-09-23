"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { GVSUHeader } from "@/components/GVSUHeader";
import { useFirestore } from "@/firebase/hooks";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { CronStatusIndicator } from "@/components/admin/governance/CronStatusIndicator";
import { AdminErrorBoundary } from "@/components/admin/governance/AdminErrorBoundary";
import { AdminTabSkeleton } from "@/components/admin/governance/AdminTabSkeleton";
import { cn } from "@/lib/utils";
import { perfLog } from "@/lib/perf-logger";
import { ToolSubmission } from "@/app/lib/tool-types";

// Firestore hard-caps a batch write at 500 operations.
const FIRESTORE_BATCH_LIMIT = 450;

// Lazy-load heavy tab components to ensure initial JS bundle remains ultra-light
const ToolModerationTab = dynamic(
  () => import("@/components/admin/governance/ToolModerationTab").then(m => m.ToolModerationTab),
  { loading: () => <AdminTabSkeleton /> }
);
const UserReportsTab = dynamic(
  () => import("@/components/admin/governance/UserReportsTab").then(m => m.UserReportsTab),
  { loading: () => <AdminTabSkeleton /> }
);
const AdminFeedbackTab = dynamic(
  () => import("@/components/admin/governance/AdminFeedbackTab").then(m => m.AdminFeedbackTab),
  { loading: () => <AdminTabSkeleton /> }
);
const AdminChatModerationTab = dynamic(
  () => import("@/components/admin/governance/AdminChatModerationTab").then(m => m.AdminChatModerationTab),
  { loading: () => <AdminTabSkeleton /> }
);
const AdminPromptModerationTab = dynamic(
  () => import("@/components/admin/governance/AdminPromptModerationTab").then(m => m.AdminPromptModerationTab),
  { loading: () => <AdminTabSkeleton /> }
);

export default function AdminPortal() {
  const [navStartTime] = useState(() => performance.now());
  const { isAdmin, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [topTab, setTopTab] = useState<"moderation" | "reports" | "feedback" | "chat_moderation" | "prompt_library">("moderation");
  const [selectedToolForModerationId, setSelectedToolForModerationId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    perfLog("AdminPortal Page Mounted", navStartTime);
  }, [navStartTime]);

  useEffect(() => {
    if (!authLoading) {
      perfLog("Admin Auth Resolved", navStartTime, { isAdmin });
      if (!isAdmin && mounted) {
        router.push("/");
      }
    }
  }, [authLoading, isAdmin, mounted, router, navStartTime]);

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
    const startRefresh = performance.now();
    try {
      localStorage.removeItem('laker_ai_news_ts');
      
      // Parallel execution of news fetch and old news snapshot read
      const { fetchGlobalNews } = await import("@/ai/flows/fetch-global-news");
      const [articles, oldNews] = await Promise.all([
        fetchGlobalNews(),
        getDocs(collection(firestore, 'global_news'))
      ]);

      const deleteOps = oldNews.docs.map(
        d => (batch: ReturnType<typeof writeBatch>) => batch.delete(d.ref)
      );

      const addOps = (articles ?? []).map(article => (batch: ReturnType<typeof writeBatch>) => {
        const artRef = doc(collection(firestore, 'global_news'));
        batch.set(artRef, { ...article, publishedAt: new Date().toISOString() });
      });

      await commitInChunks([...deleteOps, ...addOps]);

      perfLog("Hub Refresh Complete", startRefresh, { count: articles?.length || 0 });
      toast({ title: "Hub Refreshed", description: "Directories synchronized." });
    } catch (error) {
      console.error("Hub refresh failed:", error);
      toast({ variant: "destructive", title: "Refresh Failed", description: "Could not sync global news. Try again shortly." });
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const handleModerateAffectedTool = (tool: ToolSubmission) => {
    setSelectedToolForModerationId(tool.id || null);
    setTopTab("moderation");
  };

  // Immediate Shell Render with Loading fallback for Auth check
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <GVSUHeader />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="container mx-auto py-8 px-6 flex-1 flex flex-col overflow-hidden">
            <header className="flex justify-between items-center mb-8 shrink-0">
              <div>
                <h2 className="text-4xl font-serif text-slate-900 font-black uppercase tracking-tight">Governance Hub</h2>
                <p className="text-slate-500 mt-1 font-medium text-sm">Authenticating Governance Desk...</p>
              </div>
            </header>
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue" />
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                <button
                  onClick={() => setTopTab("chat_moderation")}
                  className={cn(
                    "px-5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5",
                    topTab === "chat_moderation" ? "bg-white text-gvsuBlue shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Chat Moderation
                </button>
                <button
                  onClick={() => setTopTab("prompt_library")}
                  className={cn(
                    "px-5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5",
                    topTab === "prompt_library" ? "bg-white text-gvsuBlue shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Prompt Library
                </button>
              </div>

              <div className="flex items-center gap-2">
                <CronStatusIndicator />
                <Button
                  variant="outline"
                  className="border-gvsuBlue text-gvsuBlue font-bold h-11 px-6 rounded-xl text-[10px] tracking-widest hover:bg-gvsuBlue hover:text-white shadow-sm"
                  onClick={handleRefreshAll}
                  disabled={isRefreshingNews}
                >
                  {isRefreshingNews ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  REFRESH HUB NOW
                </Button>
              </div>
            </div>
          </header>

          {/* Lazy-loaded tab content with Error Boundary & Skeleton Fallback */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {topTab === "moderation" && (
              <AdminErrorBoundary tabName="Tool Moderation">
                <Suspense fallback={<AdminTabSkeleton />}>
                  <ToolModerationTab initialSelectToolId={selectedToolForModerationId} />
                </Suspense>
              </AdminErrorBoundary>
            )}

            {topTab === "reports" && (
              <AdminErrorBoundary tabName="User Reports">
                <Suspense fallback={<AdminTabSkeleton />}>
                  <UserReportsTab onSelectToolToModerate={handleModerateAffectedTool} />
                </Suspense>
              </AdminErrorBoundary>
            )}

            {topTab === "feedback" && (
              <AdminErrorBoundary tabName="Community Feedback">
                <Suspense fallback={<AdminTabSkeleton />}>
                  <AdminFeedbackTab />
                </Suspense>
              </AdminErrorBoundary>
            )}

            {topTab === "chat_moderation" && (
              <AdminErrorBoundary tabName="Chat Moderation">
                <Suspense fallback={<AdminTabSkeleton />}>
                  <AdminChatModerationTab />
                </Suspense>
              </AdminErrorBoundary>
            )}

            {topTab === "prompt_library" && (
              <AdminErrorBoundary tabName="Prompt Library">
                <Suspense fallback={<AdminTabSkeleton />}>
                  <AdminPromptModerationTab />
                </Suspense>
              </AdminErrorBoundary>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
