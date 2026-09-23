'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase/hooks';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Activity, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CronStatusIndicator() {
  const firestore = useFirestore();

  const cronDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'news_cron_status');
  }, [firestore]);

  const { data: cronStatus, isLoading } = useDoc<any>(cronDocRef);

  if (isLoading) {
    return (
      <Badge variant="outline" className="h-11 px-4 rounded-xl text-slate-400 border-slate-200">
        <Activity className="w-3.5 h-3.5 mr-2 animate-pulse" /> Loading Status...
      </Badge>
    );
  }

  if (!cronStatus) {
    return (
      <Badge variant="outline" className="h-11 px-4 rounded-xl text-slate-400 border-slate-200">
        <Info className="w-3.5 h-3.5 mr-2" /> No Cron Data
      </Badge>
    );
  }

  const isHealthy = cronStatus.status === 'Healthy';
  
  const lastSuccessDate = cronStatus.lastSuccessfulUpdate?.toDate?.() 
    ? cronStatus.lastSuccessfulUpdate.toDate().toLocaleString() 
    : 'Unknown';

  const lastFailedDate = cronStatus.lastFailedAttempt?.toDate?.()
    ? cronStatus.lastFailedAttempt.toDate().toLocaleString()
    : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 h-11 px-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
          isHealthy 
            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        )}>
          {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {cronStatus.status || "Unknown"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 shadow-xl border-slate-200 rounded-2xl" align="end">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gvsuBlue" /> Sync Status
        </h4>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Last successful update</span>
            <span className="text-slate-700 font-medium">{lastSuccessDate}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fetched</span>
              <span className="font-bold text-slate-700">{cronStatus.articlesFetched || 0}</span>
            </div>
            <div className="bg-gvsuBlue/5 p-2 rounded-lg text-center border border-gvsuBlue/10">
              <span className="text-[9px] font-bold text-gvsuBlue uppercase tracking-widest block mb-1">New</span>
              <span className="font-bold text-gvsuBlue">{cronStatus.newArticles || 0}</span>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg text-center border border-amber-100">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Updated</span>
              <span className="font-bold text-amber-600">{cronStatus.updatedArticles || 0}</span>
            </div>
          </div>

          {!isHealthy && lastFailedDate && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1">Last Error ({lastFailedDate})</span>
              <span className="text-xs text-red-700 block line-clamp-3">{cronStatus.lastError || "Unknown error"}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
