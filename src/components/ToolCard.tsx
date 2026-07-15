
"use client";

import { ToolSubmission } from "@/app/lib/tool-types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ThumbsUp, ThumbsDown, MessageSquare, BadgeCheck, Send, ShieldCheck } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { AIDisclaimer } from "./AIDisclaimer";

interface ToolCardProps {
  tool: ToolSubmission;
}

export function ToolCard({ tool }: ToolCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!tool.id || !mounted) return;
    const q = query(collection(db, "tools_published", tool.id, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [tool.id, mounted]);

  useEffect(() => {
    if (!tool.id || !user || !mounted) {
      setUserVote(null);
      return;
    }
    const voteRef = doc(db, "tools_published", tool.id, "user_votes", user.uid);
    const unsubscribe = onSnapshot(voteRef, (docSnap) => {
      if (docSnap.exists()) setUserVote(docSnap.data().type);
      else setUserVote(null);
    });
    return () => unsubscribe();
  }, [tool.id, user, mounted]);

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!user) {
      toast({ title: "Sign In Required", description: "Use your GVSU email to interact." });
      return;
    }
    const toolRef = doc(db, "tools_published", tool.id!);
    const voteRef = doc(db, "tools_published", tool.id!, "user_votes", user.uid);
    try {
      const voteSnap = await getDoc(voteRef);
      const existingVote = voteSnap.exists() ? voteSnap.data().type : null;
      if (existingVote === type) {
        await deleteDoc(voteRef);
        await updateDoc(toolRef, { [type === 'like' ? 'upvotes' : 'downvotes']: increment(-1) });
      } else if (existingVote) {
        await updateDoc(voteRef, { type });
        await updateDoc(toolRef, {
          upvotes: increment(type === 'like' ? 1 : -1),
          downvotes: increment(type === 'dislike' ? 1 : -1)
        });
      } else {
        await setDoc(voteRef, { type, userId: user.uid, createdAt: serverTimestamp() });
        await updateDoc(toolRef, { [type === 'like' ? 'upvotes' : 'downvotes']: increment(1) });
      }
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: voteRef.path, operation: 'write', requestResourceData: { type }
      }));
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
      createdAt: serverTimestamp()
    }).catch(() => toast({ variant: "destructive", title: "Comment failed" }));
  };

  if (!mounted) return <div className="aspect-video bg-white border border-slate-100 rounded-xl animate-pulse" />;

  return (
    <Card className="glass-card flex flex-col h-full rounded-2xl overflow-hidden group">
      <div className="relative aspect-video w-full flex items-center justify-center bg-slate-50 overflow-hidden border-b border-slate-50">
        {tool.ogImageUrl && !imageError ? (
          <img 
            src={tool.ogImageUrl} 
            alt={tool.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            onError={() => setImageError(true)} 
          />
        ) : (
          <div className="w-full h-full bg-gvsuBlue flex flex-col items-center justify-center text-white">
            <span className="font-serif font-black text-4xl mb-1">{tool.title.substring(0, 1).toUpperCase()}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{tool.category}</span>
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/90 backdrop-blur-sm text-gvsuBlue border-none px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> Vetted
          </Badge>
        </div>
      </div>

      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="mb-3">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tool.category}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-lg font-bold font-sans text-slate-900">{tool.title}</h3>
            {tool.isVerified && <BadgeCheck className="w-4 h-4 text-gvsuBlue" />}
          </div>
        </div>
        
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {tool.pedagogicalNarrative || tool.initialDescription}
        </p>

        {tool.aiVetted && (
          <div className="space-y-4 mb-6 pt-4 border-t border-slate-50">
             <AIDisclaimer toolId={tool.id!} toolName={tool.title} />
             <div className="grid grid-cols-2 gap-4 mt-4">
                {Object.entries(tool.reportCard || {}).map(([key, data]: any) => (
                  <div key={key} className="space-y-1 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{key.replace('_', ' ')}</span>
                      <span className="text-[9px] font-black text-gvsuBlue">{data.score}/5</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{data.summary}</p>
                  </div>
                ))}
             </div>
             {tool.overallVerdict && (
               <p className="text-[10px] font-bold text-slate-900 mt-4 px-1">
                 Verdict: <span className="font-normal text-slate-500 italic">{tool.overallVerdict}</span>
               </p>
             )}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
          <div className="flex items-center gap-4">
            <button onClick={() => handleVote('like')} className={cn("flex items-center gap-1.5 text-[11px] font-bold transition-all", userVote === 'like' ? "text-gvsuBlue" : "text-slate-400 hover:text-slate-600")}>
              <ThumbsUp className="w-3.5 h-3.5" /> {tool.upvotes || 0}
            </button>
            <button onClick={() => handleVote('dislike')} className={cn("flex items-center gap-1.5 text-[11px] font-bold transition-all", userVote === 'dislike' ? "text-red-500" : "text-slate-400 hover:text-red-400")}>
              <ThumbsDown className="w-3.5 h-3.5" /> {tool.downvotes || 0}
            </button>
          </div>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-gvsuBlue transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> {comments.length}
          </button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-3 animate-in fade-in duration-200">
            <div className="max-h-32 overflow-y-auto space-y-2 no-scrollbar">
              {comments.map((c) => (
                <div key={c.id} className="text-[11px] p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-gvsuBlue block mb-0.5">{c.userDisplayName}</span>
                  <span className="text-slate-600">{c.content}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="h-8 text-[11px] bg-slate-50 border-slate-200 rounded-xl" />
              <Button type="submit" size="icon" className="h-8 w-8 bg-gvsuBlue hover:bg-midnight rounded-xl shrink-0">
                <Send className="w-3 h-3 text-white" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-0 border-t border-slate-50">
        <a 
          href={tool.toolUrl} 
          target="_blank" 
          className="w-full flex items-center justify-center gap-2 py-3.5 text-[10px] font-bold text-gvsuBlue hover:bg-slate-50 transition-all tracking-widest uppercase"
        >
          ACCESS TOOL <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </CardFooter>
    </Card>
  );
}
