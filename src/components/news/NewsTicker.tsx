
"use client";

import { useEffect, useState } from "react";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase/hooks";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Activity, ExternalLink } from "lucide-react";
import { NewsArticle } from "@/ai/flows/fetch-global-news";

export function NewsTicker() {
  const [mounted, setMounted] = useState(false);
  const firestore = useFirestore();

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'global_news'), orderBy('publishedAt', 'desc'), limit(12));
  }, [firestore]);

  const { data: news } = useCollection<NewsArticle>(newsQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const headlines = news && news.length > 0 
    ? news.map(n => ({ text: n.title, source: n.sourceName, url: n.url }))
    : [{ text: "Checking the world for Higher Ed AI updates...", source: "WORLD RADAR", url: "#" }];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-11 flex items-center overflow-hidden z-[60] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
      <div className="bg-gvsuBlue text-white h-full px-5 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase z-10 shrink-0 border-r border-white/10">
        <Activity className="w-3.5 h-3.5 animate-pulse" />
        WORLD RADAR
      </div>
      <div className="flex-1 overflow-hidden relative bg-slate-50/50">
        <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused] cursor-default">
          {Array(3).fill(headlines).flat().map((item, i) => (
            <a 
              key={i} 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-10 text-[11px] font-bold text-slate-600 uppercase tracking-tight group hover:text-gvsuBlue transition-colors"
            >
              <span className="text-gvsuBlue/40 text-[9px] mr-2 font-black">[{item.source}]</span>
              {item.text}
              <ExternalLink className="w-2.5 h-2.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="ml-10 w-1.5 h-1.5 rounded-full bg-slate-200" />
            </a>
          ))}
        </div>
      </div>
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 120s linear infinite;
        }
      `}</style>
    </div>
  );
}
