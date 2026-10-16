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

const FIRESTORE_BATCH_LIMIT = 450;

const ToolModerationTab = dynamic(
  () => import("@/components/admin/governance/ToolModerationTab").then((m) => m.ToolModerationTab),
  { loading: () => <AdminTabSkeleton /> }
);
const UserReportsTab = dynamic(
  () => import("@/components/admin/governance/UserReportsTab").then((m) => m.UserReportsTab),
  { loading: () => <AdminTabSkeleton /> }
);
const AdminFeedbackTab = dynamic(
  () => import("@/components/admin/governance/AdminFeedbackTab").then((m) => m.AdminFeedbackTab),
  { loading: () => <AdminTabSkeleton /> }
);
const AdminChatModerationTab = dynamic(
  () => import("@/components/admin/governance/AdminChatModerationTab").then((m) => m.AdminChatModerationTab),
  { loading: () => <AdminTabSkeleton /> }
);
const AdminPromptModerationTab = dynamic(
  () => import("@/components/admin/governance/AdminPromptModerationTab").then((m) => m.AdminPromptModerationTab),
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
  const [topTab, setTopTab] = useState<
    "moderation" | "reports" | "feedback" | "chat_moderation" | "prompt_library"
  >("moderation");
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
      chunk.forEach((op) => op(batch));
      await batch.commit();
    }
  };

  const handleRefreshAll = async () => {
    if (!firestore) return;
    setIsRefreshingNews(true);
    const startRefresh = performance.now();
    try {
      localStorage.removeItem("laker_ai_news_ts");

      const { fetchGlobalNews } = await import("@/ai/flows/fetch-global-news");
      const [articles, oldNews] = await Promise.all([
        fetchGlobalNews(),
        getDocs(collection(firestore, "global_news")),
      ]);

      const deleteOps = oldNews.docs.map(
        (d) => (batch: ReturnType<typeof writeBatch>) => batch.delete(d.ref)
      );

      const addOps = (articles ?? []).map(
        (article) => (batch: ReturnType<typeof writeBatch>) => {
          const artRef = doc(collection(firestore, "global_news"));
          batch.set(artRef, { ...article, publishedAt: new Date().toISOString() });
        }
      );

      await commitInChunks([...deleteOps, ...addOps]);

      perfLog("Hub Refresh Complete", startRefresh, { count: articles?.length || 0 });
      toast({ title: "Hub Refreshed", description: "Directories synchronized." });
    } catch (error) {
      console.error("Hub refresh failed:", error);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Could not sync global news. Try again shortly.",
      });
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const handleModerateAffectedTool = (tool: ToolSubmission) => {
    setSelectedToolForModerationId(tool.id || null);
    setTopTab("moderation");
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <GVSUHeader />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="max-w-[1440px] w-full mx-auto py-8 px-4 sm:px-8 flex-1 flex flex-col overflow-hidden">
            <header className="flex justify-between items-center mb-8 shrink-0">
              <div>
                <h1 className="text-3xl sm:text-4xl font-sans text-[#0F172A] dark:text-white font-bold tracking-tight">
                  Governance Hub
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
                  Authenticating Governance Desk...
                </p>
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
        <div className="max-w-[1440px] w-full mx-auto py-6 sm:py-8 px-4 sm:px-8 flex-1 flex flex-col overflow-hidden">
          <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6 sm:mb-8 shrink-0">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue dark:text-linkBlue block mb-0.5">
                GVSU Administration &amp; Compliance
              </span>
              <h1 className="text-3xl sm:text-4xl font-sans text-[#0F172A] dark:text-white font-bold tracking-tight">
                Governance Hub
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-sm">
                Institutional IT &amp; Academic Compliance Auditor.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Responsive Scrollable Top-Level Tabs Switcher */}
              <div className="bg-slate-200/70 dark:bg-slate-800 p-1 flex items-center h-11 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: "moderation", label: "Tool Moderation" },
                    { id: "reports", label: "User Reports" },
                    { id: "feedback", label: "Community Feedback" },
                    { id: "chat_moderation", label: "Chat Moderation" },
                    { id: "prompt_library", label: "Prompt Library" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTopTab(tab.id)}
                    className={cn(
                      "px-3.5 sm:px-4 h-9 rounded-lg font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                      topTab === tab.id
                        ? "bg-gvsuBlue text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-gvsuBlue"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <CronStatusIndicator />
                <Button
                  variant="outline"
                  className="border-gvsuBlue text-gvsuBlue font-bold h-11 px-4 sm:px-5 rounded-lg text-xs tracking-wider uppercase hover:bg-gvsuBlue hover:text-white shadow-2xs"
                  onClick={handleRefreshAll}
                  disabled={isRefreshingNews}
                >
                  {isRefreshingNews ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh Hub
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
