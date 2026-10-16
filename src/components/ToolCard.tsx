"use client";

import { ToolSubmission } from "@/app/lib/tool-types";
import { INITIAL_SEED_TOOLS } from "@/app/lib/seed-tools";
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
import { TagBadge } from "./TagBadge";
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
  const [showAllTags, setShowAllTags] = useState(false);
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

  const seedFallback = useMemo(() => {
    const cleanId = (tool.id || "").replace(/-seed$/, "").toLowerCase();
    const cleanTitle = (tool.title || "").trim().toLowerCase();
    return INITIAL_SEED_TOOLS.find(
      (s) =>
        s.id.toLowerCase() === (tool.id || "").toLowerCase() ||
        s.id.replace(/-seed$/, "").toLowerCase() === cleanId ||
        s.title.trim().toLowerCase() === cleanTitle
    );
  }, [tool.id, tool.title]);

  const effectiveReportCard = tool.reportCard || seedFallback?.reportCard;
  const effectiveOverallVerdict = tool.overallVerdict || seedFallback?.overallVerdict;

  const { riskRating, avgScore } = useMemo(() => {
    if (tool.health === "At Risk") {
      return { riskRating: "High Risk" as const, avgScore: null };
    }
    const entries = Object.values(effectiveReportCard || {}).filter(
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
  }, [tool.health, effectiveReportCard, tool.isVerified, tool.aiVetted]);

  const complianceTags = useMemo(() => {
    const t = tool.tags;
    const s = seedFallback?.tags;
    const extract = (src: any): string[] => {
      if (!src) return [];
      if (Array.isArray(src)) return src;
      return [
        ...(src.security_privacy || []),
        ...(src.institutional_status || []),
        ...(src.pedagogical_value || []),
        ...(src.ethics_stewardship || []),
        ...(src.access_cost || []),
      ];
    };
    const merged = [...extract(t), ...extract(s)];
    return Array.from(new Set(merged));
  }, [tool.tags, seedFallback]);

  if (!mounted) {
    return (
      <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse p-5" />
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
        <Badge className="bg-bigLake/20 text-midnight border border-bigLake/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 rounded-md shadow-none shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-gvsuBlue shrink-0" />
          <span>Low Risk</span>
        </Badge>
      );
    }
    if (riskRating === "Moderate Risk") {
      return (
        <Badge className="bg-archway/30 text-[#5C3A21] border border-archway px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 rounded-md shadow-none shrink-0">
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

  const visibleTags =
    variant === "compact" && !showAllTags
      ? complianceTags.slice(0, 3)
      : complianceTags;

  return (
    <Card className="bg-white border border-slate-200/90 shadow-xs hover:border-gvsuBlue/40 hover:shadow-md transition-all duration-200 flex flex-col h-full rounded-xl overflow-hidden group">
      {/* Compact Header Row: 52px-56px Icon Avatar + Title/Category + Risk Rating Badge */}
      <div className="p-5 pb-4 flex items-start justify-between gap-3.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <Link
            href={`/tools/${tool.id}`}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-gvsuBlue/40 transition-colors"
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
              <div className="w-full h-full bg-gvsuBlue flex items-center justify-center text-white font-sans font-bold text-xl">
                {tool.title.substring(0, 1).toUpperCase()}
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-gvsuBlue uppercase tracking-widest">
                {tool.category}
              </span>
              {avgScore !== null && (
                <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded">
                  {avgScore}/5.0
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <Link
                href={`/tools/${tool.id}`}
                className="hover:text-gvsuBlue transition-colors min-w-0"
              >
                <h3
                  className={cn(
                    "font-sans font-bold tracking-tight text-[#0F172A] group-hover:text-gvsuBlue transition-colors leading-snug",
                    variant === "detail" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl truncate"
                  )}
                >
                  {tool.title}
                </h3>
              </Link>
              {(tool.isVerified || tool.aiVetted) && (
                <BadgeCheck
                  className="w-4 h-4 text-gvsuBlue shrink-0"
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
            <h4 className="text-xs font-bold uppercase tracking-widest text-gvsuBlue mb-2">
              Pedagogical &amp; FERPA Governance Summary
            </h4>
          )}
          <p
            className={cn(
              "text-sm text-slate-700 leading-relaxed",
              variant === "compact" && "line-clamp-3"
            )}
          >
            {tool.pedagogicalNarrative || tool.initialDescription}
          </p>
        </div>

        {/* Compliance & Stewardship Tags with Hover Tooltips & Expandable +N more */}
        {complianceTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4 mt-auto pt-1">
            {visibleTags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {variant === "compact" && complianceTags.length > 3 && !showAllTags && (
              <button
                type="button"
                onClick={() => setShowAllTags(true)}
                aria-expanded="false"
                aria-label={`Show ${complianceTags.length - 3} more compliance tags for ${tool.title}`}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-gvsuBlue/10 text-gvsuBlue border border-slate-200 hover:border-gvsuBlue/40 transition-colors cursor-pointer"
              >
                +{complianceTags.length - 3} more
              </button>
            )}
            {variant === "compact" && complianceTags.length > 3 && showAllTags && (
              <button
                type="button"
                onClick={() => setShowAllTags(false)}
                aria-expanded="true"
                aria-label={`Show fewer compliance tags for ${tool.title}`}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              >
                Show less
              </button>
            )}
          </div>
        )}

        {/* Full 4-Pillar Alignment Report Card (Expanded in Detail Mode) */}
        {variant === "detail" && effectiveReportCard && (
          <div className="space-y-5 mt-4 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-sans text-xl font-bold tracking-tight text-[#0F172A]">
                4-Pillar Institutional Alignment Scorecard
              </h4>
              <Link
                href="/governance"
                className="text-xs font-bold uppercase tracking-wider text-gvsuBlue hover:underline"
              >
                View GVSU Rubric &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(effectiveReportCard).map(([key, data]: any) => {
                if (!data || typeof data.score !== "number") return null;
                const label = PILLAR_LABELS[key] || key.replace(/_/g, " ");
                const pct = Math.min(100, Math.max(0, (data.score / 5) * 100));
                return (
                  <div
                    key={key}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {label}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-gvsuBlue text-white">
                        {data.score} / 5
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          data.score >= 4
                            ? "bg-gvsuBlue"
                            : data.score >= 3
                            ? "bg-archway"
                            : "bg-carillonBrick"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {data.summary}
                    </p>
                  </div>
                );
              })}
            </div>

            {effectiveOverallVerdict && (
              <div className="p-4 rounded-xl bg-midnight text-white border border-midnight flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-linkBlue block mb-1">
                    Institutional Verdict
                  </span>
                  <p className="font-sans text-base sm:text-lg font-semibold text-white leading-snug">
                    {effectiveOverallVerdict}
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
