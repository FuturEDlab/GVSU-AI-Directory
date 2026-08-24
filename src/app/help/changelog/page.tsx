"use client";

import { useState, useEffect } from "react";
import { GVSUHeader } from "@/components/GVSUHeader";
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

  // Provide some default dummy data if none exists so the page isn't completely empty initially
  const releases = (rawReleases && rawReleases.length > 0) ? rawReleases : [
    {
      id: "demo-v1",
      version: "v1.1.0",
      title: "Help & Support Module",
      releaseDate: new Date(),
      highlights: [
        "Added 'Your Reports' dashboard",
        "Added Help & Support Knowledge Base",
        "Introduced the AI Support Assistant",
        "Launched the Community Feedback board",
        "Improved global navigation with Hamburger Menu"
      ],
      techNotes: [
        "Added Firestore feedbackPosts and feedbackUpvotes collections",
        "Integrated Genkit/Gemini for support assistance",
        "Implemented Shadcn/ui Sheet component for drawer navigation"
      ]
    }
  ];

  const formatReleaseDate = (timestamp: any) => {
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

  if (!mounted) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-sky-400 mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Changelog...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col transition-colors duration-200">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-12 px-6 max-w-4xl">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link href="/help" className="hover:text-gvsuBlue dark:hover:text-sky-400 transition-colors">Help & Support</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 dark:text-slate-100 font-bold">Changelog</span>
        </div>
        
        <header className="mb-12">
          <h2 className="text-4xl font-serif text-slate-900 dark:text-slate-50 font-black uppercase tracking-tight flex items-center gap-4">
            <FileText className="w-8 h-8 text-gvsuBlue dark:text-sky-400" />
            Release Changelog
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Track new features, improvements, and bug fixes to the LakerAI Directory.</p>
        </header>

        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-sky-400 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fetching Updates...</p>
          </div>
        ) : (
          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
            {releases.map((release, index) => (
              <div key={release.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <GitCommit className="w-5 h-5" />
                </div>
                
                <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm group-hover:border-gvsuBlue/30 dark:group-hover:border-sky-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="bg-gvsuBlue/5 text-gvsuBlue dark:bg-sky-900/20 dark:text-sky-400 border-none font-bold uppercase tracking-widest text-xs px-3 py-1">
                      {release.version}
                    </Badge>
                    <time className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatReleaseDate(release.releaseDate)}</time>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">{release.title}</h3>
                  
                  {release.highlights && release.highlights.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Highlights</h4>
                      <ul className="space-y-2">
                        {release.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="text-gvsuBlue dark:text-sky-400 mt-0.5">•</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {release.techNotes && release.techNotes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Developer Notes</h4>
                      <ul className="space-y-1">
                        {release.techNotes.map((note, i) => (
                          <li key={i} className="text-xs text-slate-500 dark:text-slate-500 font-mono">
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
    </div>
  );
}
