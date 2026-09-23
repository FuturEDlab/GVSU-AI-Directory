'use client';

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase/hooks";
import { collection, query, limit, orderBy, doc, updateDoc } from "firebase/firestore";
import { UserReport, ToolSubmission } from "@/app/lib/tool-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, X, Flag, Check, ExternalLink, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { perfLog } from "@/lib/perf-logger";

interface UserReportsTabProps {
  onSelectToolToModerate?: (tool: ToolSubmission) => void;
}

export function UserReportsTab({ onSelectToolToModerate }: UserReportsTabProps) {
  const { isAdmin } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [reportsFilter, setReportsFilter] = useState<"pending" | "resolved" | "dismissed" | "all">("pending");
  const [searchReportQuery, setSearchReportQuery] = useState("");
  const [activeReport, setActiveReport] = useState<UserReport | null>(null);

  const [mountTime] = useState(() => performance.now());

  // Firestore query for Reports — LIMITED to 50 items
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "reports"), orderBy("createdAt", "desc"), limit(50));
  }, [firestore, isAdmin]);

  const { data: rawReports, isLoading: reportsLoading } = useCollection<UserReport>(reportsQuery);

  // Tools query to resolve affected tools if needed within this tab
  const toolsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "tools_published"), limit(50));
  }, [firestore, isAdmin]);

  const { data: publishedTools } = useCollection<ToolSubmission>(toolsQuery);

  useEffect(() => {
    if (!reportsLoading) {
      perfLog("UserReportsTab Data Loaded", mountTime, { reportCount: rawReports?.length || 0 });
    }
  }, [reportsLoading, mountTime, rawReports]);

  // Clean-up activeReport if it's no longer in the retrieved reports list
  useEffect(() => {
    if (activeReport && rawReports) {
      const exists = rawReports.some(r => r.id === activeReport.id);
      if (!exists) {
        setActiveReport(null);
      }
    }
  }, [rawReports, activeReport]);

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

  const getAffectedToolForReport = (report: UserReport | null) => {
    if (!report) return null;
    if (report.toolId) {
      return publishedTools?.find(t => t.id === report.toolId) || null;
    }
    const name = report.toolName?.toLowerCase();
    if (!name) return null;
    return publishedTools?.find(t => t.title.toLowerCase() === name) || null;
  };

  const filteredReports = useMemo(() => {
    return (rawReports || []).filter(report => {
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
  }, [rawReports, reportsFilter, searchReportQuery]);

  const affectedTool = getAffectedToolForReport(activeReport);

  return (
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
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl border bg-white space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
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
                      {onSelectToolToModerate && (
                        <Button
                          variant="outline"
                          className="border-gvsuBlue text-gvsuBlue hover:bg-gvsuBlue hover:text-white font-bold text-[10px] tracking-widest uppercase h-9 px-4 rounded-xl shadow-sm"
                          onClick={() => onSelectToolToModerate(affectedTool)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Moderate Tool
                        </Button>
                      )}
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
  );
}
