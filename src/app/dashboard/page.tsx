"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { GVSUHeader } from "@/components/GVSUHeader";
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

  // Merge both collections and dedupe by id in case a tool briefly exists
  // in both tools_submitted and tools_published during a publish operation.
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

  const stats = useMemo(() => ({
    total: tools.length,
    published: tools.filter(t => t.status === STATUS_PUBLISHED).length,
    pending: tools.filter(t => t.status !== STATUS_PUBLISHED).length,
  }), [tools]);

  // Covers: still mounting, auth still resolving, or auth resolved to "no user"
  // but we haven't yet decided to show the sign-in wall. Without this last case,
  // the full dashboard would flash empty/zeroed-out content before the wall appears.
  const showLoadingScreen = !mounted || authLoading || (!user && !showRestricted);

  if (showLoadingScreen) return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Opening My Tools...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <GVSUHeader />
        <main className="flex-1 container mx-auto flex items-center justify-center p-6">
          <div className="bg-white p-12 text-center rounded-3xl border shadow-xl max-w-md w-full">
            <UserX className="w-16 h-16 mx-auto mb-6 text-gvsuBlue opacity-20" />
            <h3 className="text-2xl font-serif font-black text-slate-900 uppercase">Laker Only Area</h3>
            <p className="text-slate-500 mt-4 mb-8 font-medium">Tracking your AI submissions is for GVSU students and faculty only.</p>
            <Button onClick={signIn} className="bg-gvsuBlue text-white font-bold w-full h-12 rounded-xl uppercase tracking-widest text-xs">SIGN IN TO VIEW</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-12 px-6 max-w-6xl">
        <header className="mb-12">
          <h2 className="text-4xl font-serif text-slate-900 font-black uppercase tracking-tight">My Tools</h2>
          <p className="text-slate-500 mt-1 font-medium">Track your recommended AI tools for the Laker community.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm text-center">
            <LayoutList className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Submitted</p>
            <p className="text-5xl font-black text-slate-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500/30 mx-auto mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live on Hub</p>
            <p className="text-5xl font-black text-slate-900 mt-2">{stats.published}</p>
          </div>
          <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm text-center">
            <Clock className="w-10 h-10 text-amber-500/30 mx-auto mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Review</p>
            <p className="text-5xl font-black text-slate-900 mt-2">{stats.pending}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Recent Activity</h3>
          {tools.length === 0 && !dataLoading ? (
            <div className="py-20 text-center border border-dashed rounded-3xl text-slate-400 italic text-sm">
              You haven't recommended any tools yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map((tool) => (
                <Card key={tool.id} className="p-6 rounded-2xl border-slate-100 flex items-center justify-between shadow-sm hover:border-gvsuBlue/20 transition-all">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">{tool.title}</h4>
                    <p className="text-[10px] font-bold text-gvsuBlue uppercase tracking-widest mt-1">{tool.category}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-bold uppercase py-1.5 px-6 rounded-lg",
                    tool.status === STATUS_PUBLISHED ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                  )}>
                    {tool.status}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
