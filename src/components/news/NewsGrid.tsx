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
    return query(collection(firestore, "global_news"), orderBy("publishedAt", "desc"), limit(4));
  }, [firestore]);

  const { data: news, isLoading } = useCollection<NewsArticle>(newsQuery);

  const getRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "Recent";
    }
  };

  return (
    <section className="py-16 bg-white border-t border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10">
          <div>
            <Badge className="bg-gvsuBlue text-white border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-3 inline-flex w-fit items-center gap-1.5 rounded-md">
              <Globe className="w-3 h-3 text-linkBlue" /> Higher Education Briefings
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-[#0F172A] tracking-tight">
              Tech Intelligence: World Stage
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Curated global developments in academic artificial intelligence, research policy, and classroom innovation.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Loader2 className="w-7 h-7 animate-spin text-gvsuBlue mb-3" />
            <p className="text-slate-600 font-semibold uppercase tracking-wider text-xs">
              Checking Higher Ed AI updates...
            </p>
          </div>
        ) : (news || []).length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200/70">
            <p className="text-slate-600 font-medium text-sm">
              Global higher-education intelligence feed is currently synchronized.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {news?.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full"
              >
                <Card className="bg-white border border-slate-200/90 shadow-xs hover:border-gvsuBlue/40 hover:shadow-md transition-all flex flex-col h-full overflow-hidden rounded-xl">
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100 relative border-b border-slate-100">
                    <img
                      src={article.imageUrl || `https://picsum.photos/seed/${article.id}/600/400`}
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-midnight/90 backdrop-blur-xs text-white border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
                        {article.sourceName}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Clock className="w-3.5 h-3.5 text-gvsuBlue" />
                      <span className="text-[11px] font-semibold text-gvsuBlue uppercase tracking-wider">
                        {getRelativeTime(article.publishedAt)}
                      </span>
                    </div>
                    <h3 className="font-sans text-lg font-bold tracking-tight text-[#0F172A] leading-snug group-hover:text-gvsuBlue transition-colors line-clamp-3 mb-4">
                      {article.title}
                    </h3>
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider group-hover:text-gvsuBlue transition-colors">
                      <span className="inline-flex items-center gap-1.5">
                        Read Article <ExternalLink className="w-3 h-3" />
                      </span>
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
