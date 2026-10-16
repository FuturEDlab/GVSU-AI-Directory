"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import {
  useFirestore,
  useCollection,
  useMemoFirebase
} from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { ToolSubmission } from "@/app/lib/tool-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader2, UserX, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STATUS_PUBLISHED = "Published";

export default function Dashboard() {
  const { user, loading: authLoading, signIn } = useAuth();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [showRestricted, setShowRestricted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user && mounted) {
      const timer = setTimeout(() => setShowRestricted(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, mounted]);

  const userId = user?.uid || null;

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, "tools_submitted"), where("submitterId", "==", userId), limit(100));
  }, [firestore, userId]);

  const publishedQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, "tools_published"), where("submitterId", "==", userId), limit(100));
  }, [firestore, userId]);

  const { data: rawTools, isLoading: toolsLoading } = useCollection<ToolSubmission>(submissionsQuery);
  const { data: rawPublished, isLoading: pubLoading } = useCollection<ToolSubmission>(publishedQuery);

  const dataLoading = toolsLoading || pubLoading;

  const tools = useMemo(() => {
    const merged = new Map<string, ToolSubmission>();
    [...(rawTools || []), ...(rawPublished || [])].forEach((tool) => {
      if (tool.id) merged.set(tool.id, tool);
    });

    return Array.from(merged.values()).sort((a, b) => {
      const aTime = a.createdAt?.seconds ?? a.publishedAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? b.publishedAt?.seconds ?? 0;
      return bTime - aTime;
    });
  }, [rawTools, rawPublished]);

  const stats = useMemo(
    () => ({
      total: tools.length,
      published: tools.filter((t) => t.status === STATUS_PUBLISHED).length,
      pending: tools.filter((t) => t.status !== STATUS_PUBLISHED).length,
    }),
    [tools]
  );

  const showLoadingScreen = !mounted || authLoading || (!user && !showRestricted);

  if (showLoadingScreen) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Opening My Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-sans">
        <GVSUHeader />
        <main className="flex-1 container mx-auto flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md max-w-md w-full">
            <UserX className="w-14 h-14 mx-auto mb-5 text-gvsuBlue dark:text-linkBlue opacity-80" />
            <h1 className="text-2xl sm:text-3xl font-sans font-bold text-[#0F172A] dark:text-white">
              GVSU Laker Sign-In Required
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 mb-8 text-sm leading-relaxed">
              Tracking your AI tool submissions and governance status is available to GVSU faculty, staff, and students.
            </p>
            <Button
              onClick={signIn}
              className="bg-gvsuBlue hover:bg-midnight text-white font-bold w-full h-11 rounded-lg uppercase tracking-wider text-xs"
            >
              Sign In with GVSU
            </Button>
          </div>
        </main>
        <GVSUFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-sans">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-10 px-4 sm:px-8 max-w-6xl">
        <header className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue dark:text-linkBlue block mb-1">
            Contributor Workspace
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans text-[#0F172A] dark:text-white font-bold tracking-tight">
            My Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
            Track your recommended AI tools and governance review status for the Laker community.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
            <LayoutList className="w-8 h-8 text-gvsuBlue dark:text-linkBlue mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submitted</p>
            <p className="text-4xl sm:text-5xl font-sans font-bold text-[#0F172A] dark:text-white mt-2">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
            <CheckCircle2 className="w-8 h-8 text-bigLake mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published on Hub</p>
            <p className="text-4xl sm:text-5xl font-sans font-bold text-[#0F172A] dark:text-white mt-2">{stats.published}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
            <Clock className="w-8 h-8 text-carillonBrick mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Governance Review</p>
            <p className="text-4xl sm:text-5xl font-sans font-bold text-[#0F172A] dark:text-white mt-2">{stats.pending}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-sans text-2xl font-bold text-[#0F172A] dark:text-white mb-4">
            Recent Submission Activity
          </h2>
          {tools.length === 0 && !dataLoading ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-slate-500 text-sm">
              You haven&apos;t recommended any AI tools yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map((tool) => (
                <Card
                  key={tool.id}
                  className="p-5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-gvsuBlue/40 transition-all"
                >
                  <div>
                    <h3 className="font-sans font-bold text-xl text-[#0F172A] dark:text-white">{tool.title}</h3>
                    <p className="text-xs font-bold text-gvsuBlue dark:text-linkBlue uppercase tracking-wider mt-0.5">
                      {tool.category}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-bold uppercase py-1 px-4 rounded-md w-fit",
                      tool.status === STATUS_PUBLISHED
                        ? "bg-bigLake/20 text-midnight border-bigLake/60 dark:text-bigLake"
                        : "bg-archway/30 text-[#5C3A21] border-archway dark:text-archway"
                    )}
                  >
                    {tool.status}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <GVSUFooter />
    </div>
  );
}
