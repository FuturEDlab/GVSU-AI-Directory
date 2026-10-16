"use client";

import { useState, useEffect } from "react";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase/hooks";
import { collection, query, orderBy } from "firebase/firestore";
import { Loader2, GitCommit, FileText, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ReleaseChangelog {
  id?: string;
  version: string;
  title: string;
  releaseDate: any;
  highlights: string[];
  techNotes: string[];
}

export default function ChangelogPage() {
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const changelogQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "releaseChangelogs"), orderBy("releaseDate", "desc"));
  }, [firestore]);

  const { data: rawReleases, isLoading } = useCollection<ReleaseChangelog>(changelogQuery);

  const releases =
    rawReleases && rawReleases.length > 0
      ? rawReleases
      : [
          {
            id: "demo-v1",
            version: "v1.2.0",
            title: "GVSU Institutional Brand & UI/UX Overhaul",
            releaseDate: new Date(),
            highlights: [
              "Aligned typography and color tokens with official GVSU Identity Standards (EB Garamond & Open Sans)",
              "Redesigned high-density Academic Directory Cards with 4-Pillar Alignment Scorecards and Risk Rating badges",
              "Updated institutional header with faculty links (GVSU AI Hub, IT Services, Pew FTLC) and mobile drawer",
              "Removed redundant bottom news ticker for a cleaner mobile and desktop reading experience",
            ],
            techNotes: [
              "Generated canonical desktop and mobile reference screens via Google Stitch MCP",
              "Enforced WCAG 2.1 AA+ contrast ratios and 44px minimum mobile touch targets",
            ],
          },
        ];

  const formatReleaseDate = (timestamp: any) => {
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

  if (!mounted) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-linkBlue mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Changelog...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col transition-colors duration-200 font-sans">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-10 px-4 sm:px-8 max-w-4xl">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          <Link href="/help" className="hover:text-gvsuBlue dark:hover:text-linkBlue transition-colors">
            Help &amp; Support
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 dark:text-slate-100 font-bold">Release Changelog</span>
        </div>

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#0F172A] dark:text-white font-bold tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-gvsuBlue dark:text-linkBlue shrink-0" />
            Release Changelog
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm sm:text-base">
            Track new features, governance enhancements, and platform updates to the LakerAI Directory.
          </p>
        </header>

        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-linkBlue mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching Updates...</p>
          </div>
        ) : (
          <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
            {releases.map((release, index) => (
              <div
                key={release.id || index}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gvsuBlue text-white shadow-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <GitCommit className="w-5 h-5" />
                </div>

                <Card className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs group-hover:border-gvsuBlue/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className="bg-gvsuBlue/10 text-gvsuBlue dark:bg-linkBlue/15 dark:text-linkBlue border-gvsuBlue/20 font-bold uppercase tracking-wider text-xs px-2.5 py-0.5 rounded"
                    >
                      {release.version}
                    </Badge>
                    <time className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {formatReleaseDate(release.releaseDate)}
                    </time>
                  </div>

                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white mb-4">
                    {release.title}
                  </h2>

                  {release.highlights && release.highlights.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Highlights
                      </h3>
                      <ul className="space-y-2">
                        {release.highlights.map((highlight, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                          >
                            <span className="text-gvsuBlue dark:text-linkBlue font-bold mt-0.5">•</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {release.techNotes && release.techNotes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Technical Notes
                      </h3>
                      <ul className="space-y-1">
                        {release.techNotes.map((note, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                            &gt; {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>
      <GVSUFooter />
    </div>
  );
}
