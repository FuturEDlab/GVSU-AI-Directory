
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { GVSUHeader } from "@/components/GVSUHeader";
import { SubmissionModal } from "@/components/SubmissionModal";
import { ToolCard } from "@/components/ToolCard";
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
  doc,
  serverTimestamp,
  getDocs,
  getDoc,
  limit,
  writeBatch,
  setDoc
} from "firebase/firestore";
import { ToolSubmission } from "@/app/lib/tool-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Filter, LayoutGrid, Sparkles, Activity, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { SEED_DATA } from "@/app/lib/seed-data";
import { useSearch } from "@/lib/search-context";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchGlobalNews } from "@/ai/flows/fetch-global-news";

const NEWS_CACHE_KEY = 'laker_ai_news_cache';
const NEWS_TIMESTAMP_KEY = 'laker_ai_news_ts';
const THIRTY_MINUTES = 30 * 60 * 1000;

export default function Home() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [activeCategory, setActiveCategory] = useState("ALL TOOLS");
  const [mounted, setMounted] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const seedingAttempted = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Professional 30-minute news caching logic
  useEffect(() => {
    if (!firestore || !mounted) return;

    const handleNewsRefresh = async () => {
      const savedTs = localStorage.getItem(NEWS_TIMESTAMP_KEY);
      const now = Date.now();
      
      if (savedTs && now - parseInt(savedTs) < THIRTY_MINUTES) {
        return; // Cache is still fresh
      }

      try {
        const articles = await fetchGlobalNews();
        if (articles && articles.length > 0) {
          const batch = writeBatch(firestore);
          const oldNews = await getDocs(collection(firestore, 'global_news'));
          oldNews.docs.forEach(d => batch.delete(d.ref));
          
          articles.forEach(article => {
            const artRef = doc(collection(firestore, 'global_news'));
            batch.set(artRef, { ...article, publishedAt: article.publishedAt || new Date().toISOString() });
          });
          
          await batch.commit();
          localStorage.setItem(NEWS_TIMESTAMP_KEY, now.toString());
        }
      } catch (e) {
        console.error("News sync delayed:", e);
      }
    };

    handleNewsRefresh();
  }, [firestore, mounted]);

  const toolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "tools_published"),
      where("status", "==", "Published")
    );
  }, [firestore]);

  const { data: allTools, isLoading } = useCollection<ToolSubmission>(toolsQuery);

  const categories = [
    "ALL TOOLS", "WRITING", "VIDEO", "IMAGE GEN", "DESIGN", "DEVELOPMENT", "CHAT/LLM", "PRODUCTIVITY"
  ];

  const filteredTools = useMemo(() => {
    if (!allTools) return [];
    const queryLower = debouncedSearchQuery.toLowerCase();
    return allTools
      .filter(tool => {
        const matchesCategory = activeCategory === "ALL TOOLS" || tool.category.toUpperCase().includes(activeCategory.toUpperCase());
        const matchesSearch = !debouncedSearchQuery || tool.title.toLowerCase().includes(queryLower) || tool.pedagogicalNarrative?.toLowerCase().includes(queryLower);
        const toolTagList = tool.tags ? Object.values(tool.tags).flat() : [];
        const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => toolTagList.includes(tag));
        return matchesCategory && matchesSearch && matchesTags;
      })
      .sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0));
  }, [allTools, activeCategory, debouncedSearchQuery, selectedTags]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <GVSUHeader />
      
      <section className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-5xl hero-glass-container p-12 md:p-16 text-center border-slate-200">
          <Badge className="mb-6 bg-slate-100 text-slate-500 hover:bg-slate-100 border-none px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase">
            <Activity className="w-3 h-3 mr-2 text-gvsuBlue" /> Global Higher Ed Intelligence
          </Badge>
          <h1 className="text-4xl md:text-7xl font-serif font-black text-[#1E293B] leading-tight mb-6 tracking-tight uppercase">
            Institutional <br /><span className="text-gvsuBlue">AI HUB</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            The unofficial directory for <span className="text-slate-900 font-bold">academic vetting</span> and <span className="text-gvsuBlue font-bold">peer experimentation</span>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <SubmissionModal />
            <Button variant="outline" className="border-slate-200 text-slate-600 font-bold h-12 px-8 rounded-xl text-xs tracking-widest hover:bg-slate-50" onClick={() => window.open('https://www.gvsu.edu/it/ai/', '_blank')}>
              GOVERNANCE GUIDE <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl h-14 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-gvsuBlue/20 transition-all overflow-hidden">
              <div className="px-5 flex items-center text-slate-400"><Search className="w-4 h-4" /></div>
              <Input 
                placeholder="Search institutional resources..." 
                className="bg-transparent border-none shadow-none text-base h-full focus-visible:ring-0 px-0 text-slate-900 placeholder:text-slate-400 font-sans" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} className={cn("h-full px-6 rounded-none border-l border-slate-100 text-[10px] font-bold tracking-widest uppercase", showFilters ? "text-gvsuBlue bg-slate-50" : "text-slate-400")}>
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 mb-12">
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={cn(
                "px-6 py-2.5 text-[10px] font-bold tracking-[0.1em] transition-all rounded-full border uppercase", 
                activeCategory === cat 
                  ? "bg-gvsuBlue text-white border-gvsuBlue shadow-sm" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-gvsuBlue/40 hover:text-gvsuBlue"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-6 flex-1 flex flex-col md:flex-row gap-10 mb-20">
        {showFilters && (
          <aside className="w-full md:w-64 space-y-6 animate-in slide-in-from-left duration-300">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 sticky top-32 shadow-sm">
              <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest mb-6 border-b border-slate-50 pb-3">Audit Filters</h3>
              <div className="space-y-4">
                {["FERPA Compliant", "PII Safe", "IP Protected", "Laker Green"].map(t => (
                  <div key={t} className="flex items-center space-x-3 group cursor-pointer" onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
                    <Checkbox id={t} checked={selectedTags.includes(t)} className="border-slate-300 data-[state=checked]:bg-gvsuBlue data-[state=checked]:border-gvsuBlue" />
                    <label className="text-xs text-slate-600 cursor-pointer font-bold uppercase tracking-tight group-hover:text-gvsuBlue transition-colors">{t}</label>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
              <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching tools in directory.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {filteredTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          )}
        </div>
      </main>

      <NewsGrid />

      <footer className="mt-auto border-t border-slate-100 py-16 pb-24 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gvsuBlue rounded flex items-center justify-center text-white font-bold text-base">GV</div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-serif font-bold text-lg uppercase tracking-tight">Grand Valley</span>
              <span className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em]">State University</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2024 LakerAI Hub | Unofficial Community Vetting</p>
        </div>
      </footer>
    </div>
  );
}
