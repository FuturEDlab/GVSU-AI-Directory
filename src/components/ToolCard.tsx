"use client";

import { ToolSubmission } from "@/app/lib/tool-types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  BadgeCheck,
  Send,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { AIDisclaimer } from "./AIDisclaimer";
import Link from "next/link";

interface ToolCardProps {
  tool: ToolSubmission;
  variant?: "compact" | "detail";
}

const PILLAR_LABELS: Record<string, string> = {
  security_privacy: "Security & Privacy",
  pedagogical_value: "Pedagogical Value",
  ethics_stewardship: "Ethics & Stewardship",
  access_cost: "Access & Cost",
  security: "Security & Privacy",
  pedagogy: "Pedagogical Value",
  ethics: "Ethics & Stewardship",
  readiness: "Institutional Readiness",
};

export function ToolCard({ tool, variant = "compact" }: ToolCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(variant === "detail");
  const [newComment, setNewComment] = useState("");
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Defer comments subscription until user opens comments UI (or on detail page)
  useEffect(() => {
    if (!tool.id || !mounted || !showComments) return;
    const q = query(
      collection(db, "tools_published", tool.id, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [tool.id, mounted, showComments]);

  const handleVote = async (type: "like" | "dislike") => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Use your GVSU email to interact.",
      });
      return;
    }
    const toolRef = doc(db, "tools_published", tool.id!);
    const voteRef = doc(db, "tools_published", tool.id!, "user_votes", user.uid);
    try {
      const voteSnap = await getDoc(voteRef);
      const existingVote = voteSnap.exists() ? voteSnap.data().type : null;
      if (existingVote === type) {
        await deleteDoc(voteRef);
        setUserVote(null);
        await updateDoc(toolRef, {
          [type === "like" ? "upvotes" : "downvotes"]: increment(-1),
        });
      } else if (existingVote) {
        await updateDoc(voteRef, { type });
        setUserVote(type);
        await updateDoc(toolRef, {
          upvotes: increment(type === "like" ? 1 : -1),
          downvotes: increment(type === "dislike" ? 1 : -1),
        });
      } else {
        await setDoc(voteRef, {
          type,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        setUserVote(type);
        await updateDoc(toolRef, {
          [type === "like" ? "upvotes" : "downvotes"]: increment(1),
        });
      }
    } catch {
      errorEmitter.emit(
        "permission-error",
        new FirestorePermissionError({
          path: voteRef.path,
          operation: "write",
          requestResourceData: { type },
        })
      );
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    const content = newComment;
    setNewComment("");
    addDoc(collection(db, "tools_published", tool.id!, "comments"), {
      toolId: tool.id,
      userId: user.uid,
      userDisplayName: user.displayName,
      content,
      createdAt: serverTimestamp(),
    }).catch(() => toast({ variant: "destructive", title: "Comment failed" }));
  };

  const { riskRating, avgScore } = useMemo(() => {
    if (tool.health === "At Risk") {
      return { riskRating: "High Risk" as const, avgScore: null };
    }
    const entries = Object.values(tool.reportCard || {}).filter(
      (item: any) => item && typeof item.score === "number"
    ) as { score: number; summary: string }[];

    if (entries.length > 0) {
      const avg =
        entries.reduce((acc, item) => acc + item.score, 0) / entries.length;
      const rounded = Math.round(avg * 10) / 10;
      if (avg >= 4.0) return { riskRating: "Low Risk" as const, avgScore: rounded };
      if (avg >= 2.8) return { riskRating: "Moderate Risk" as const, avgScore: rounded };
      return { riskRating: "High Risk" as const, avgScore: rounded };
    }

    if (tool.isVerified || tool.aiVetted) {
      return { riskRating: "Low Risk" as const, avgScore: null };
    }
    return { riskRating: "Moderate Risk" as const, avgScore: null };
  }, [tool.health, tool.reportCard, tool.isVerified, tool.aiVetted]);

  const complianceTags = useMemo(() => {
    if (!tool.tags) return [];
    const ordered = [
      ...(tool.tags.security_privacy || []),
      ...(tool.tags.institutional_status || []),
      ...(tool.tags.pedagogical_value || []),
      ...(tool.tags.ethics_stewardship || []),
      ...(tool.tags.access_cost || []),
    ];
    return Array.from(new Set(ordered));
  }, [tool.tags]);

  if (!mounted) {
    return (
      <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse p-5" />
    );
  }

  const fallbackLogoSrc =
    (tool as any).imageUrl || (tool.id ? `/logos/${tool.id}.svg` : undefined);
  const imageSrc = !imageError
    ? tool.ogImageUrl || fallbackLogoSrc
    : !fallbackError
    ? fallbackLogoSrc
    : undefined;

  const renderRiskBadge = () => {
    if (riskRating === "Low Risk") {
      return (
        <Badge className="bg-bigLake/20 text-midnight dark:bg-bigLake/20 dark:text-bigLake border border-bigLake/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 rounded-md shadow-none shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-gvsuBlue dark:text-bigLake shrink-0" />
          <span>Low Risk</span>
        </Badge>
      );
    }
    if (riskRating === "Moderate Risk") {
      return (
        <Badge className="bg-archway/30 text-[#5C3A21] dark:bg-archway/20 dark:text-archway border border-archway px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 rounded-md shadow-none shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-carillonBrick shrink-0" />
          <span>Moderate Risk</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-carillonBrick text-white border border-carillonBrick px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 rounded-md shadow-none shrink-0">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <span>High Risk</span>
      </Badge>
    );
  };

  return (
    <Card className="glass-card flex flex-col h-full rounded-xl overflow-hidden group">
      {/* Compact Header Row: 52px-56px Icon Avatar + Title/Category + Risk Rating Badge */}
      <div className="p-5 pb-4 flex items-start justify-between gap-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/50">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <Link
            href={`/tools/${tool.id}`}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-gvsuBlue/40 transition-colors"
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={`${tool.title} logo`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-1.5"
                onError={() => {
                  if (!imageError) setImageError(true);
                  else setFallbackError(true);
                }}
              />
            ) : (
              <div className="w-full h-full bg-gvsuBlue flex items-center justify-center text-white font-serif font-bold text-xl">
                {tool.title.substring(0, 1).toUpperCase()}
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-gvsuBlue dark:text-linkBlue uppercase tracking-widest">
                {tool.category}
              </span>
              {avgScore !== null && (
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                  {avgScore}/5.0
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <Link
                href={`/tools/${tool.id}`}
                className="hover:text-gvsuBlue dark:hover:text-linkBlue transition-colors min-w-0"
              >
                <h3
                  className={cn(
                    "font-serif font-bold text-[#0F172A] dark:text-white group-hover:text-gvsuBlue dark:group-hover:text-linkBlue transition-colors leading-snug",
                    variant === "detail" ? "text-2xl sm:text-3xl" : "text-xl truncate"
                  )}
                >
                  {tool.title}
                </h3>
              </Link>
              {(tool.isVerified || tool.aiVetted) && (
                <BadgeCheck
                  className="w-4 h-4 text-gvsuBlue dark:text-linkBlue shrink-0"
                  aria-label="Vetted tool"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {renderRiskBadge()}
          {variant === "detail" && (
            <a
              href={tool.toolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-gvsuBlue hover:bg-midnight text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Launch Tool <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Card Body: Pedagogical & FERPA Summary + Compliance Tags */}
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          {variant === "detail" && (
            <h4 className="text-xs font-bold uppercase tracking-widest text-gvsuBlue dark:text-linkBlue mb-2">
              Pedagogical &amp; FERPA Governance Summary
            </h4>
          )}
          <p
            className={cn(
              "text-sm text-slate-700 dark:text-slate-300 leading-relaxed",
              variant === "compact" && "line-clamp-3"
            )}
          >
            {tool.pedagogicalNarrative || tool.initialDescription}
          </p>
        </div>

        {/* Compliance & Stewardship Tags */}
        {complianceTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 mt-auto pt-1">
            {(variant === "compact" ? complianceTags.slice(0, 3) : complianceTags).map(
              (tag) => {
                const isSecurity =
                  tag.includes("FERPA") ||
                  tag.includes("PII") ||
                  tag.includes("Walled Garden") ||
                  tag.includes("Sanctioned");
                return (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-tight border",
                      isSecurity
                        ? "bg-archway/20 border-archway text-[#0F172A] dark:text-archway"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {isSecurity && <CheckCircle2 className="w-3 h-3 text-gvsuBlue dark:text-linkBlue shrink-0" />}
                    {tag}
                  </span>
                );
              }
            )}
            {variant === "compact" && complianceTags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                +{complianceTags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Full 4-Pillar Alignment Report Card (Expanded in Detail Mode) */}
        {variant === "detail" && tool.aiVetted && tool.reportCard && (
          <div className="space-y-5 mt-4 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-xl font-bold text-[#0F172A] dark:text-white">
                4-Pillar Institutional Alignment Scorecard
              </h4>
              <span className="text-xs font-bold uppercase tracking-wider text-gvsuBlue dark:text-linkBlue">
                GVSU Governance Audit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(tool.reportCard).map(([key, data]: any) => {
                if (!data || typeof data.score !== "number") return null;
                const label = PILLAR_LABELS[key] || key.replace(/_/g, " ");
                const pct = Math.min(100, Math.max(0, (data.score / 5) * 100));
                return (
                  <div
                    key={key}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {label}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-gvsuBlue text-white">
                        {data.score} / 5
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          data.score >= 4
                            ? "bg-gvsuBlue dark:bg-bigLake"
                            : data.score >= 3
                            ? "bg-archway"
                            : "bg-carillonBrick"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {data.summary}
                    </p>
                  </div>
                );
              })}
            </div>

            {tool.overallVerdict && (
              <div className="p-4 rounded-xl bg-midnight text-white border border-midnight flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-linkBlue block mb-1">
                    Institutional Verdict
                  </span>
                  <p className="font-serif text-base sm:text-lg font-medium text-white leading-snug">
                    {tool.overallVerdict}
                  </p>
                </div>
              </div>
            )}

            <AIDisclaimer toolId={tool.id!} toolName={tool.title} />
          </div>
        )}

        {/* Expandable Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Faculty &amp; Peer Notes ({comments.length})
            </h4>
            {comments.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-bold text-gvsuBlue dark:text-linkBlue block mb-0.5">
                      {c.userDisplayName}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{c.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No peer comments yet. Share how you use {tool.title} in your courses.
              </p>
            )}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                placeholder="Add a faculty or peer note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="h-10 text-xs bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-lg"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Submit comment"
                className="h-10 w-10 bg-gvsuBlue hover:bg-midnight rounded-lg shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>

      {/* Clean, Ergonomic 44px Minimum Touch-Target Footer */}
      <CardFooter className="px-4 py-1.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleVote("like")}
            aria-label={`Upvote ${tool.title}`}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-2.5 min-h-[44px] rounded-lg text-xs font-bold transition-colors",
              userVote === "like"
                ? "text-gvsuBlue bg-gvsuBlue/10"
                : "text-slate-600 dark:text-slate-400 hover:text-gvsuBlue hover:bg-slate-200/60 dark:hover:bg-slate-800"
            )}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{tool.upvotes || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => handleVote("dislike")}
            aria-label={`Downvote ${tool.title}`}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-2.5 min-h-[44px] rounded-lg text-xs font-bold transition-colors",
              userVote === "dislike"
                ? "text-carillonBrick bg-carillonBrick/10"
                : "text-slate-600 dark:text-slate-400 hover:text-carillonBrick hover:bg-slate-200/60 dark:hover:bg-slate-800"
            )}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{tool.downvotes || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            aria-label={`Toggle comments for ${tool.title}`}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-2.5 min-h-[44px] rounded-lg text-xs font-bold transition-colors",
              showComments
                ? "text-gvsuBlue bg-gvsuBlue/10"
                : "text-slate-600 dark:text-slate-400 hover:text-gvsuBlue hover:bg-slate-200/60 dark:hover:bg-slate-800"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{comments.length}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {variant === "compact" && (
            <Link
              href={`/tools/${tool.id}`}
              className="inline-flex items-center justify-center px-3 min-h-[44px] rounded-lg text-xs font-bold text-gvsuBlue dark:text-linkBlue hover:bg-gvsuBlue/10 transition-colors uppercase tracking-wider"
            >
              View Details
            </Link>
          )}
          <a
            href={tool.toolUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Launch ${tool.title} in new tab`}
            title={`Launch ${tool.title}`}
            className="inline-flex items-center justify-center w-11 min-h-[44px] rounded-lg bg-gvsuBlue hover:bg-midnight text-white transition-colors shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
