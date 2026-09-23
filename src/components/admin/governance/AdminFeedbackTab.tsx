"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase/hooks";
import { collection, query, orderBy, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X, Flag, MessageSquare, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FeedbackPost } from "@/components/help/CommunityFeedbackTab";

export function AdminFeedbackTab() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'BUG' | 'FEATURE' | 'IMPROVEMENT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL' | 'VERIFIED_CLOSED' | 'REOPENED'>('ALL');
  const [searchQuery, setSearchQuery] = useState("");
  const [activePost, setActivePost] = useState<FeedbackPost | null>(null);
  
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "feedbackPosts"), orderBy("createdAt", "desc"), limit(50));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<FeedbackPost>(postsQuery);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter(post => {
      const matchCat = filterCategory === 'ALL' || post.category === filterCategory;
      const matchStatus = filterStatus === 'ALL' || post.status === filterStatus;
      const term = searchQuery.toLowerCase();
      const matchSearch = !term || post.title.toLowerCase().includes(term) || post.description.toLowerCase().includes(term) || post.author.toLowerCase().includes(term);
      return matchCat && matchStatus && matchSearch;
    });
  }, [posts, filterCategory, filterStatus, searchQuery]);

  const handleUpdateStatus = async (postId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const postRef = doc(firestore, "feedbackPosts", postId);
      await updateDoc(postRef, { status: newStatus, updatedAt: serverTimestamp() });
      if (activePost && activePost.id === postId) {
        setActivePost({ ...activePost, status: newStatus as any });
      }
      toast({ title: "Status Updated", description: `Feedback marked as ${newStatus.replace(/_/g, ' ')}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
      case 'COMPLETED_PENDING_APPROVAL': return 'bg-purple-100 text-purple-700';
      case 'VERIFIED_CLOSED': return 'bg-green-100 text-green-700';
      case 'REOPENED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 bg-white/50 border border-dashed rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-8 min-h-0">
      <aside className="w-[380px] flex flex-col gap-4 shrink-0 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col gap-2">
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold uppercase text-slate-600 outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="BUG">Bugs</option>
            <option value="FEATURE">Features</option>
            <option value="IMPROVEMENT">Improvements</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold uppercase text-slate-600 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED_PENDING_APPROVAL">Pending Validation</option>
            <option value="VERIFIED_CLOSED">Verified Closed</option>
            <option value="REOPENED">Reopened</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search feedback..." 
            className="pl-9 pr-9 bg-white border-slate-200 h-10 focus-visible:ring-gvsuBlue rounded-xl text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gvsuBlue">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="space-y-4 pb-12">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl bg-white/50 text-slate-400 text-xs">
                No feedback matching filters.
              </div>
            ) : (
              filteredPosts.map(post => (
                <button
                  key={post.id}
                  onClick={() => setActivePost(post)}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border transition-all group flex flex-col gap-2",
                    activePost?.id === post.id
                      ? "bg-white border-gvsuBlue shadow-md ring-1 ring-gvsuBlue/10"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  )}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-[9px] font-bold text-gvsuBlue uppercase tracking-widest">
                      {post.category}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> {post.upvoteCount || 0}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-gvsuBlue truncate w-full">
                    {post.title}
                  </h4>
                  <div className="flex justify-between items-center w-full mt-1 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      By: {post.author}
                    </span>
                    <Badge className={cn("text-[8px] font-bold uppercase border-none px-2 py-0.5", getStatusColor(post.status))}>
                      {post.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Detail View */}
      <section className="flex-1 flex flex-col min-h-0">
        {activePost ? (
          <div className="bg-white border border-slate-200 rounded-3xl flex flex-col flex-1 overflow-hidden shadow-xl">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">{activePost.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn("text-[8px] font-bold uppercase px-2 py-0.5 border-none", getStatusColor(activePost.status))}>
                      {activePost.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </header>

            <ScrollArea className="flex-1 p-8">
              <div className="max-w-2xl space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Author</span>
                    <p className="font-bold text-slate-900 text-sm">{activePost.author}</p>
                    <p className="text-xs text-slate-500">{activePost.authorEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Votes & Contributors</span>
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-gvsuBlue" /> {activePost.upvoteCount} Votes
                    </p>
                    <p className="text-xs text-slate-500">{activePost.contributors?.length || 0} Contributors</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Description</span>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed text-sm text-slate-700 whitespace-pre-wrap font-medium">
                    {activePost.description}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {(['OPEN', 'IN_PROGRESS', 'COMPLETED_PENDING_APPROVAL', 'VERIFIED_CLOSED', 'REOPENED'] as const).map(s => (
                      <Button
                        key={s}
                        variant={activePost.status === s ? "default" : "outline"}
                        onClick={() => handleUpdateStatus(activePost.id!, s)}
                        className={cn("text-xs font-bold uppercase tracking-widest h-9", activePost.status === s ? "bg-gvsuBlue hover:bg-midnight" : "text-slate-500")}
                      >
                        {s.replace(/_/g, ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/50">
            <MessageSquare className="w-12 h-12 opacity-10 mb-4 animate-pulse" />
            <p className="font-bold text-[11px] uppercase tracking-widest">Select a feedback post</p>
          </div>
        )}
      </section>
    </div>
  );
}
