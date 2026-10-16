"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import { SubmissionModal } from "@/components/SubmissionModal";
import { ToolCard } from "@/components/ToolCard";
import { LakerAIAssistant } from "@/components/LakerAIAssistant";
import { NewsGrid } from "@/components/news/NewsGrid";
import {
  useFirestore,
  useCollection,
  useMemoFirebase
} from "@/firebase/hooks";
import {
  collection,
  query,
  where,
  limit,
  setDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { ToolSubmission, TOOL_CATEGORIES } from "@/app/lib/tool-types";
import { INITIAL_SEED_TOOLS } from "@/app/lib/seed-tools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowRight, Filter, LayoutGrid, ShieldCheck, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearch } from "@/lib/search-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const firestore = useFirestore();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [activeCategory, setActiveCategory] = useState("ALL TOOLS");
  const [mounted, setMounted] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [isSeeding, setIsSeeding] = useState(false);
  const [fallbackTools, setFallbackTools] = useState<ToolSubmission[]>(() =>
    INITIAL_SEED_TOOLS.map((t) => ({
      ...t,
      submitterEmail: "vanharkj@mail.gvsu.edu",
      submitterId: "admin-seed",
    })) as unknown as ToolSubmission[]
  );
  const seedTriggeredRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSeed = async () => {
    if (!firestore || !isAdmin || !user) return;
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload.tools) && payload.tools.length > 0) {
          setFallbackTools(payload.tools);
        }
      } else {
        for (const seed of INITIAL_SEED_TOOLS) {
          await setDoc(
            doc(firestore, "tools_published", seed.id),
            {
              ...seed,
              submitterEmail: user.email || "admin@gvsu.edu",
              submitterId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              publishedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
      toast({ title: "Seeds Planted", description: "20 baseline tools added to directory." });
    } catch {
      toast({ variant: "destructive", title: "Seeding Failed", description: "Permission denied or network error." });
    } finally {
      setIsSeeding(false);
    }
  };

  const toolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "tools_published"),
      where("status", "==", "Published"),
      limit(visibleCount)
    );
  }, [firestore, visibleCount]);

  const { data: allTools, isLoading, error } = useCollection<ToolSubmission>(toolsQuery);

  useEffect(() => {
    if (isLoading) return;
    if (allTools && allTools.length > 0) return;
    if (seedTriggeredRef.current) return;
    seedTriggeredRef.current = true;

    fetch("/api/seed")
      .then((res) => res.json())
      .then((payload) => {
        if (Array.isArray(payload?.tools) && payload.tools.length > 0) {
          setFallbackTools(payload.tools);
        } else {
          setFallbackTools(
            INITIAL_SEED_TOOLS.map((t) => ({
              ...t,
              submitterEmail: "vanharkj@mail.gvsu.edu",
              submitterId: "admin-seed",
            })) as ToolSubmission[]
          );
        }
      })
      .catch(() => {
        setFallbackTools(
          INITIAL_SEED_TOOLS.map((t) => ({
            ...t,
            submitterEmail: "vanharkj@mail.gvsu.edu",
            submitterId: "admin-seed",
          })) as ToolSubmission[]
        );
      });
  }, [allTools, isLoading, error]);

  const effectiveTools = useMemo(() => {
    if (allTools && allTools.length > 0) return allTools;
    return fallbackTools;
  }, [allTools, fallbackTools]);

  const categories = ["ALL TOOLS", ...TOOL_CATEGORIES];

  const filteredTools = useMemo(() => {
    if (!effectiveTools.length) return [];
    const queryLower = debouncedSearchQuery.toLowerCase();
    return effectiveTools
      .filter((tool) => {
        const toolCat = (tool.category || "").toUpperCase();
        const activeCat = activeCategory.toUpperCase();
        const matchesCategory =
          activeCategory === "ALL TOOLS" ||
          toolCat === activeCat ||
          toolCat.includes(activeCat) ||
          (toolCat.length > 0 && activeCat.includes(toolCat));
        const matchesSearch =
          !debouncedSearchQuery ||
          tool.title?.toLowerCase().includes(queryLower) ||
          tool.initialDescription?.toLowerCase().includes(queryLower) ||
          tool.pedagogicalNarrative?.toLowerCase().includes(queryLower) ||
          tool.category?.toLowerCase().includes(queryLower);
        const toolTagList = tool.tags ? Object.values(tool.tags).flat() : [];
        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.every((tag) => toolTagList.includes(tag));
        return matchesCategory && matchesSearch && matchesTags;
      })
      .sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0));
  }, [effectiveTools, activeCategory, debouncedSearchQuery, selectedTags]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <GVSUHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Compact Institutional Hero Section */}
      <section className="pt-8 sm:pt-12 pb-8 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-10 md:p-12 text-center border border-slate-200">
          <Badge className="mb-4 bg-gvsuBlue/10 text-gvsuBlue hover:bg-gvsuBlue/15 border border-gvsuBlue/20 px-3.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase inline-flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-gvsuBlue" />
            Grand Valley State University · Academic AI Directory
          </Badge>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-sans font-bold text-[#0F172A] leading-tight mb-4 tracking-tight">
            Institutional <span className="text-gvsuBlue">LakerAI Hub</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-2xl mx-auto mb-8 leading-relaxed">
            Discover, evaluate, and adopt AI tools vetted for{" "}
            <strong className="text-[#0F172A] font-semibold">pedagogical value</strong>,{" "}
            <strong className="text-gvsuBlue font-semibold">FERPA privacy compliance</strong>, and{" "}
            <strong className="text-[#0F172A] font-semibold">institutional stewardship</strong>.
          </p>

          <div className="max-w-2xl mx-auto mb-8">
            <LakerAIAssistant
              rightElement={
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilters(!showFilters);
                  }}
                  aria-label="Toggle compliance filters"
                  className={cn(
                    "h-full px-4 sm:px-5 rounded-none border-l border-slate-200 text-xs font-bold tracking-wider uppercase relative z-10 min-w-[44px]",
                    showFilters
                      ? "text-gvsuBlue bg-gvsuBlue/10"
                      : "text-slate-600 hover:text-gvsuBlue"
                  )}
                >
                  <Filter className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <SubmissionModal />
            <Button
              asChild
              variant="outline"
              className="border-slate-300 text-slate-800 font-bold h-11 px-6 rounded-lg text-xs tracking-wider uppercase hover:border-gvsuBlue hover:text-gvsuBlue transition-colors"
            >
              <Link href="/governance">
                GVSU AI Governance Guide <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isSeeding}
                    className="border-arboretum text-arboretum font-bold h-11 px-6 rounded-lg text-xs tracking-wider uppercase hover:bg-arboretum/10"
                  >
                    {isSeeding ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Pre-Seed Directory
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gvsuBlue font-sans font-bold tracking-tight text-xl">
                      Pre-Seed the LakerAI Directory?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will populate or overwrite the 20 baseline AI tool records in the published directory with default metadata and vote counts. Do you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-gvsuBlue hover:bg-midnight text-white font-bold"
                      onClick={handleSeed}
                    >
                      Confirm &amp; Seed Directory
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </section>

      {/* Scrollable Category Filter Bar (Mobile Horizontal Scroll + Desktop Wrap) */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:flex-wrap sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 min-h-[40px] text-xs font-bold tracking-wider transition-all rounded-lg border uppercase whitespace-nowrap shrink-0",
                activeCategory === cat
                  ? "bg-gvsuBlue text-white border-gvsuBlue shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-gvsuBlue hover:text-gvsuBlue"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Directory Grid & Compliance Filter Rail */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 flex-1 flex flex-col md:flex-row gap-8 mb-16">
        {showFilters && (
          <aside className="w-full md:w-64 shrink-0 space-y-6 animate-in slide-in-from-left duration-200">
            <div className="bg-white p-5 rounded-xl border border-slate-200 md:sticky md:top-28 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="font-sans font-bold tracking-tight text-slate-900 text-base">
                  Compliance Filters
                </h2>
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-xs font-semibold text-gvsuBlue hover:underline inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {["FERPA Compliant", "PII Safe", "IP Protected", "Laker Green"].map((t) => (
                  <div
                    key={t}
                    className="flex items-center space-x-3 group cursor-pointer min-h-[36px]"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                      )
                    }
                  >
                    <Checkbox
                      id={t}
                      checked={selectedTags.includes(t)}
                      className="border-slate-400 data-[state=checked]:bg-gvsuBlue data-[state=checked]:border-gvsuBlue"
                    />
                    <label
                      htmlFor={t}
                      className="text-xs text-slate-700 cursor-pointer font-semibold group-hover:text-gvsuBlue transition-colors"
                    >
                      {t}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1">
          {isLoading && effectiveTools.length === 0 ? (
            /* Compact Card Geometry Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between h-64 animate-pulse"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-13 h-13 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-slate-200 rounded" />
                      <div className="h-5 w-40 bg-slate-200 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-slate-200 rounded" />
                  </div>
                  <div className="space-y-2 my-4">
                    <div className="h-3 w-full bg-slate-200 rounded" />
                    <div className="h-3 w-5/6 bg-slate-200 rounded" />
                    <div className="h-3 w-4/6 bg-slate-200 rounded" />
                  </div>
                  <div className="h-9 w-full bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <LayoutGrid className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-sans text-xl font-bold tracking-tight text-slate-900 mb-1">
                No Matching Tools Found
              </h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Try clearing your active category or search filters to browse all vetted tools in the directory.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} variant="compact" />
                ))}
              </div>

              {allTools && allTools.length >= visibleCount && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    className="border-gvsuBlue text-gvsuBlue font-bold h-11 px-8 rounded-lg text-xs tracking-wider uppercase hover:bg-gvsuBlue hover:text-white transition-all shadow-xs"
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                  >
                    Load More Tools
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <NewsGrid />

      <GVSUFooter />
    </div>
  );
}
