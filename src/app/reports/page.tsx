"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import {
  useFirestore,
  useCollection,
  useMemoFirebase
} from "@/firebase/hooks";
import { collection, query, where, limit } from "firebase/firestore";
import { UserReport } from "@/app/lib/tool-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Inbox, Flag, Calendar, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function YourReportsPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(
      collection(firestore, "reports"),
      where("reporterEmail", "==", user.email),
      limit(100)
    );
  }, [firestore, user?.email]);

  const { data: rawReports, isLoading: reportsLoading, error } = useCollection<UserReport>(reportsQuery);

  const sortedReports = useMemo(() => {
    if (!rawReports) return [];
    return [...rawReports].sort((a, b) => {
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return bTime - aTime;
    });
  }, [rawReports]);

  const getNormalizedStatus = (status?: string) => {
    if (!status) return "pending";
    const s = status.toLowerCase();
    if (s === "resolved") return "resolved";
    if (s === "dismissed") return "dismissed";
    return "pending";
  };

  const formatReportDate = (timestamp: any) => {
    if (!timestamp) return "Unknown Date";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    try {
      return new Date(timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const showLoading = !mounted || authLoading;

  if (showLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-linkBlue mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading reports...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <GVSUHeader />
        <main className="flex-1 container mx-auto flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md max-w-md w-full">
            <Flag className="w-14 h-14 mx-auto mb-5 text-gvsuBlue opacity-80 dark:text-linkBlue" />
            <h1 className="text-2xl sm:text-3xl font-sans font-bold text-[#0F172A] dark:text-white">
              GVSU Sign-In Required
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 mb-8 text-sm">
              Please sign in with your GVSU account to view your submitted governance reports.
            </p>
            <Button
              onClick={signIn}
              className="bg-gvsuBlue hover:bg-midnight text-white font-bold w-full h-11 rounded-lg uppercase tracking-wider text-xs"
            >
              Sign In to View
            </Button>
          </div>
        </main>
        <GVSUFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col transition-colors duration-200 font-sans">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-10 px-4 sm:px-8 max-w-5xl">
        <header className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue dark:text-linkBlue block mb-1">
              Directory Stewardship
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans text-[#0F172A] dark:text-white font-bold tracking-tight">
              Your Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
              Track error corrections and inaccuracies you have flagged in the LakerAI Directory.
            </p>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
            Total Filed: {sortedReports.length}
          </div>
        </header>

        {reportsLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-linkBlue mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading report logs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-dashed rounded-2xl text-carillonBrick bg-carillonBrick/10">
            Failed to sync with Firestore. Please reload the page.
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 flex flex-col items-center p-8">
            <Inbox className="w-12 h-12 text-slate-400 mb-3" />
            <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white">No Reports Filed Yet</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              If you spot any mistakes on the AI Directory, you can file them by clicking &quot;Report a Mistake&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedReports.map((report) => {
              const normStatus = getNormalizedStatus(report.status);
              return (
                <Card
                  key={report.id}
                  className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-gvsuBlue/40 transition-all"
                >
                  <div className="space-y-3 flex-1">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gvsuBlue dark:text-linkBlue uppercase tracking-wider">
                          {report.issueType || report.reason || "General Inaccuracy"}
                        </span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatReportDate(report.createdAt)}</span>
                        </div>
                      </div>
                      <h2 className="font-sans font-bold text-2xl text-[#0F172A] dark:text-white mt-1">
                        {report.toolName}
                      </h2>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 flex gap-3">
                      <AlignLeft className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {report.description || report.comments || "No details provided."}
                      </p>
                    </div>

                    {report.toolUrl && (
                      <div className="text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-wider mr-2">Link:</span>
                        <a
                          href={report.toolUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gvsuBlue dark:text-linkBlue hover:underline font-medium break-all"
                        >
                          {report.toolUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 self-end md:self-start">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-bold uppercase py-1 px-3.5 rounded-md",
                        normStatus === "pending" && "bg-archway/30 text-[#5C3A21] border-archway",
                        normStatus === "resolved" && "bg-bigLake/20 text-midnight border-bigLake/60",
                        normStatus === "dismissed" && "bg-slate-100 text-slate-700 border-slate-300"
                      )}
                    >
                      {report.status || "Pending"}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <GVSUFooter />
    </div>
  );
}
