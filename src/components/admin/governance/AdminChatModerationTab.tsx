'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase/hooks';
import { collection, query, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function AdminChatModerationTab() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch moderation reports (highest severity or newest first)
  const q = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'chatModerationReports'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);
  
  const { data: reports, isLoading, error } = useCollection(q);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await updateDoc(doc(firestore, 'chatModerationReports', id), {
        status: newStatus
      });
      toast({ title: 'Status updated', description: `Report marked as ${newStatus}` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-sky-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
        Failed to load moderation reports. Ensure you have admin privileges.
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed rounded-xl dark:border-slate-800 flex flex-col items-center">
        <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="font-bold text-slate-500 dark:text-slate-400">All Clear</h3>
        <p className="text-sm text-slate-400">No chat moderation events to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-50">Chat Moderation Queue</h2>
          <p className="text-sm text-slate-500">Review intercepted inappropriate chat requests.</p>
        </div>
        <Badge variant="destructive" className="px-3 py-1 font-bold">
          {reports.filter(r => r.status === 'new').length} Pending
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className={cn(
            "border dark:border-slate-800 transition-all",
            report.status === 'new' ? "bg-red-50/30 dark:bg-red-950/10 border-red-200 dark:border-red-900" : ""
          )}>
            <CardHeader className="pb-3 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className={cn(
                      "w-4 h-4",
                      report.severity === 'high' ? "text-red-600" : "text-amber-500"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {report.violationType || 'Profanity'}
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-[10px] py-0 h-5",
                      report.severity === 'high' ? "border-red-500 text-red-600" : "border-amber-500 text-amber-600"
                    )}>
                      {report.severity}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{report.userEmail}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    User ID: {report.userId} • Date: {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : 'Unknown'}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={
                    report.status === 'new' ? 'default' : 
                    report.status === 'dismissed' ? 'outline' : 'secondary'
                  } className={cn(
                    "uppercase text-[10px] font-bold tracking-widest",
                    report.status === 'new' && "bg-red-500 hover:bg-red-600",
                    report.status === 'dismissed' && "text-slate-400"
                  )}>
                    {report.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg p-4 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Intercepted Message</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">"{report.message}"</p>
                {report.matchedTerms && report.matchedTerms.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest self-center mr-1">Matched Terms:</span>
                    {report.matchedTerms.map((term: string) => (
                      <Badge key={term} variant="outline" className="text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200">
                        {term}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                {report.status !== 'dismissed' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={updating === report.id}
                    onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    {updating === report.id ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Dismiss
                  </Button>
                )}
                {report.status === 'new' && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    disabled={updating === report.id}
                    onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                    className="bg-gvsuBlue text-white hover:bg-gvsuBlue/90"
                  >
                    {updating === report.id ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Mark Reviewed
                  </Button>
                )}
                {report.status !== 'action_taken' && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    disabled={updating === report.id}
                    onClick={() => handleUpdateStatus(report.id, 'action_taken')}
                  >
                    {updating === report.id ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Take Action (Restrict)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
