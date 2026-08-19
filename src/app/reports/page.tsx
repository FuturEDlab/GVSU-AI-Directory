"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { GVSUHeader } from "@/components/GVSUHeader";
import {
  useFirestore,
  useCollection,
  useMemoFirebase
} from "@/firebase/hooks";
import { collection, query, where, limit } from "firebase/firestore";
import { UserReport } from "@/app/lib/tool-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Inbox, Flag, Calendar, AlignLeft, RefreshCw, CheckCircle2 } from "lucide-react";
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
        day: "numeric"
      });
    }
    try {
      return new Date(timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const showLoading = !mounted || authLoading;

  if (showLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-sky-400 mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading reports...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col">
        <GVSUHeader />
        <main className="flex-1 container mx-auto flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-3xl border dark:border-slate-700 shadow-xl max-w-md w-full">
            <Flag className="w-16 h-16 mx-auto mb-6 text-gvsuBlue opacity-20 dark:text-sky-400" />
            <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-slate-50 uppercase">Access Denied</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-4 mb-8 font-medium">Please sign in with your GVSU account to view your submitted reports.</p>
            <Button onClick={signIn} className="bg-gvsuBlue text-white font-bold w-full h-12 rounded-xl uppercase tracking-widest text-xs">SIGN IN TO VIEW</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col transition-colors duration-200">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-12 px-6 max-w-5xl">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-serif text-slate-900 dark:text-slate-50 font-black uppercase tracking-tight">Your Reports</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Track error corrections and inaccuracies you have flagged in the LakerAI Directory.</p>
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase">
            Total Filed: {sortedReports.length}
          </div>
        </header>

        {reportsLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gvsuBlue dark:text-sky-400 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading report logs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-dashed rounded-3xl text-red-500 bg-red-50/20 dark:bg-red-950/10">
            Failed to sync with Firestore. Please reload the page.
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="py-20 text-center border border-dashed dark:border-slate-700 rounded-3xl text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-800/30 flex flex-col items-center">
            <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="font-semibold text-sm">No reports filed yet.</p>
            <p className="text-xs text-slate-500 mt-1">If you spot any mistakes on the AI Directory, you can file them by clicking "Report a Mistake".</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedReports.map((report) => {
              const normStatus = getNormalizedStatus(report.status);
              return (
                <Card key={report.id} className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-gvsuBlue/20 dark:hover:border-sky-500/20 transition-all">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gvsuBlue dark:text-sky-400 uppercase tracking-widest">
                          {report.issueType || report.reason || "General Inaccuracy"}
                        </span>
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{formatReportDate(report.createdAt)}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-xl text-slate-900 dark:text-slate-50 mt-1">{report.toolName}</h4>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 flex gap-3">
                      <AlignLeft className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                      <p className="leading-relaxed whitespace-pre-wrap">{report.description || report.comments || "No details provided."}</p>
                    </div>

                    {report.toolUrl && (
                      <div className="text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-wider mr-2">Link:</span>
                        <a href={report.toolUrl} target="_blank" rel="noopener noreferrer" className="text-gvsuBlue dark:text-sky-400 hover:underline font-medium break-all">
                          {report.toolUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 self-end md:self-start">
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold uppercase py-1 px-4 rounded-full border-none",
                      normStatus === "pending" && "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400",
                      normStatus === "resolved" && "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400",
                      normStatus === "dismissed" && "bg-slate-100 text-slate-600 dark:bg-slate-950/20 dark:text-slate-400"
                    )}>
                      {report.status || "Pending"}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
