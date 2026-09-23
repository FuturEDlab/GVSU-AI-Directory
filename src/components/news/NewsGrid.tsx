
"use client";

import { useCollection, useMemoFirebase, useFirestore } from "@/firebase/hooks";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Clock, ExternalLink, ArrowRight } from "lucide-react";
import { NewsArticle } from "@/ai/flows/fetch-global-news";
import { formatDistanceToNow } from "date-fns";

export function NewsGrid() {
  const firestore = useFirestore();
  
  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'global_news'), orderBy('publishedAt', 'desc'), limit(4));
  }, [firestore]);

  const { data: news, isLoading } = useCollection<NewsArticle>(newsQuery);

  const getRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (e) {
      return "Live Now";
    }
  };

  return (
    <section className="py-24 bg-slate-50/30 border-t border-slate-100">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <Badge className="bg-gvsuBlue text-white border-none px-3 py-1 text-[9px] font-bold uppercase tracking-widest mb-4 flex w-fit items-center gap-2 shadow-sm">
              <Globe className="w-3 h-3" /> WORLD INTELLIGENCE
            </Badge>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-slate-900 uppercase tracking-tight">TECH INTELLIGENCE: WORLD STAGE</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Checking the world for Higher Ed AI updates...</p>
          </div>
        ) : (news || []).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 font-medium text-sm italic">Intelligence hub currently updating.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {news?.map((article) => (
              <a 
                key={article.id} 
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="flex flex-col h-full overflow-hidden border border-slate-100 transition-all rounded-3xl bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2">
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                    <img 
                      src={article.imageUrl || `https://picsum.photos/seed/${article.id}/600/400`} 
                      alt={article.title} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-black/80 backdrop-blur-md text-white border-none px-2.5 py-1 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                        {article.sourceName}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-3 h-3 text-gvsuBlue" />
                      <span className="text-[10px] font-bold text-gvsuBlue uppercase tracking-widest">
                        {getRelativeTime(article.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-gvsuBlue transition-colors line-clamp-3 mb-4">
                      {article.title}
                    </h3>
                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-gvsuBlue transition-colors">
                      <span className="flex items-center gap-2">READ FULL STORY <ExternalLink className="w-3 h-3" /></span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
