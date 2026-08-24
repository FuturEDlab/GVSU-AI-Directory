"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase/hooks";
import { collection, addDoc, serverTimestamp, query, orderBy, doc, getDocs, where, setDoc, deleteDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, ThumbsUp, MessageSquare, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL' | 'VERIFIED_CLOSED' | 'REOPENED';
type FeedbackCategory = 'BUG' | 'FEATURE' | 'IMPROVEMENT';

export interface FeedbackPost {
  id?: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  author: string;
  authorUid: string;
  authorEmail: string;
  createdAt: any;
  updatedAt: any;
  upvoteCount: number;
  contributors: string[];
  status: FeedbackStatus;
}

export function CommunityFeedbackTab() {
  const { user, signIn } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [filterCategory, setFilterCategory] = useState<FeedbackCategory | 'ALL'>('ALL');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  
  // Submit state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("FEATURE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Duplicate detection state
  const [similarPost, setSimilarPost] = useState<FeedbackPost | null>(null);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "feedbackPosts"), orderBy("upvoteCount", "desc"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<FeedbackPost>(postsQuery);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (filterCategory === 'ALL') return posts;
    return posts.filter(p => p.category === filterCategory);
  }, [posts, filterCategory]);

  const handleCreatePost = async () => {
    if (!user || !firestore) return;

    if (!title.trim() || !description.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Title and description are required." });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!similarPost) {
        // Step 1: Duplicate check before creating
        const duplicateQuery = query(
          collection(firestore, "feedbackPosts"),
          where("status", "in", ["OPEN", "IN_PROGRESS"]),
          where("category", "==", category)
        );
        const duplicateDocs = await getDocs(duplicateQuery);
        
        let foundSimilar = null;
        for (const d of duplicateDocs.docs) {
          const post = { id: d.id, ...d.data() } as FeedbackPost;
          // Simple keyword matching for demo purposes
          const words = title.toLowerCase().split(' ').filter(w => w.length > 3);
          const postWords = post.title.toLowerCase();
          if (words.some(w => postWords.includes(w))) {
            foundSimilar = post;
            break;
          }
        }

        if (foundSimilar) {
          setSimilarPost(foundSimilar);
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2: Create post
      const newPost = {
        title,
        description,
        category,
        author: user.displayName || "Laker User",
        authorUid: user.uid,
        authorEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvoteCount: 1,
        contributors: [],
        status: "OPEN" as FeedbackStatus
      };

      const docRef = await addDoc(collection(firestore, "feedbackPosts"), newPost);
      
      // Auto upvote
      const voteRef = doc(firestore, "feedbackUpvotes", `${docRef.id}_${user.uid}`);
      await setDoc(voteRef, { userId: user.uid, postId: docRef.id, createdAt: serverTimestamp() });

      toast({ title: "Feedback Submitted", description: "Thank you for contributing!" });
      setIsSubmitOpen(false);
      resetForm();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit feedback." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSimilar = async () => {
    if (!user || !firestore || !similarPost || !similarPost.id) return;
    setIsSubmitting(true);
    try {
      const postRef = doc(firestore, "feedbackPosts", similarPost.id);
      await updateDoc(postRef, {
        contributors: arrayUnion(user.uid),
        updatedAt: serverTimestamp()
      });
      
      // Auto vote if joining
      await handleUpvote(similarPost);
      
      toast({ title: "Joined Request", description: "You've been added as a contributor to the existing request." });
      setIsSubmitOpen(false);
      resetForm();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to join request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (post: FeedbackPost) => {
    if (!user || !firestore || !post.id) {
      toast({ title: "Sign In Required", description: "Please sign in to vote." });
      return;
    }
    const voteRef = doc(firestore, "feedbackUpvotes", `${post.id}_${user.uid}`);
    const postRef = doc(firestore, "feedbackPosts", post.id);

    try {
      // Simplistic upvote logic for the UI. Ideally needs a transaction.
      await setDoc(voteRef, { userId: user.uid, postId: post.id, createdAt: serverTimestamp() });
      await updateDoc(postRef, { upvoteCount: (post.upvoteCount || 0) + 1 });
      toast({ title: "Voted!", description: "Your vote has been counted." });
    } catch (err) {
      console.log(err);
      toast({ variant: "destructive", title: "Error", description: "Could not cast vote. You may have already voted." });
    }
  };

  const handleValidate = async (post: FeedbackPost, action: 'VERIFIED_CLOSED' | 'REOPENED') => {
    if (!firestore || !post.id) return;
    try {
      const postRef = doc(firestore, "feedbackPosts", post.id);
      await updateDoc(postRef, { status: action, updatedAt: serverTimestamp() });
      toast({ title: "Status Updated", description: `Feedback marked as ${action.replace('_', ' ')}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not update status." });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("FEATURE");
    setSimilarPost(null);
  };

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
      case 'COMPLETED_PENDING_APPROVAL': return 'bg-purple-100 text-purple-700';
      case 'VERIFIED_CLOSED': return 'bg-green-100 text-green-700';
      case 'REOPENED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          {(['ALL', 'BUG', 'FEATURE', 'IMPROVEMENT'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${filterCategory === cat ? 'bg-white dark:bg-slate-700 text-gvsuBlue shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Button onClick={() => user ? setIsSubmitOpen(true) : signIn()} className="bg-gvsuBlue hover:bg-midnight text-white font-bold h-11 px-6 rounded-xl text-xs uppercase tracking-widest shrink-0">
          <MessageSquare className="w-4 h-4 mr-2" />
          {user ? "New Feedback" : "Sign in to Post"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue mx-auto mb-4" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500">No feedback posts found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map(post => {
            const isOwnerOrContrib = user && (post.authorUid === user.uid || (post.contributors && post.contributors.includes(user.uid)));
            
            return (
              <Card key={post.id} className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm flex gap-6 hover:border-gvsuBlue/20 transition-all group">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleUpvote(post)}
                    className="w-12 h-12 rounded-xl bg-slate-50 hover:bg-gvsuBlue/10 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-600 hover:text-gvsuBlue transition-colors border border-slate-100 dark:border-slate-700"
                  >
                    <ThumbsUp className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold leading-none">{post.upvoteCount || 0}</span>
                  </button>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-slate-200 dark:border-slate-700">
                        {post.category}
                      </Badge>
                      <Badge variant="secondary" className={`text-[9px] font-bold uppercase tracking-widest border-none px-2 ${getStatusColor(post.status)}`}>
                        {post.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-gvsuBlue transition-colors">{post.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{post.description}</p>
                  
                  <div className="text-xs text-slate-400 flex items-center gap-4">
                    <span>By {post.author}</span>
                    {post.contributors?.length > 0 && <span>• {post.contributors.length} Contributors</span>}
                  </div>

                  {isOwnerOrContrib && post.status === 'COMPLETED_PENDING_APPROVAL' && (
                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                      <Button onClick={() => handleValidate(post, 'VERIFIED_CLOSED')} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs h-9">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Validate Fix & Close
                      </Button>
                      <Button onClick={() => handleValidate(post, 'REOPENED')} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 font-bold text-xs h-9">
                        <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reopen Issue
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={(open) => {
        setIsSubmitOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-gvsuBlue uppercase">Community Feedback</DialogTitle>
            <DialogDescription>Submit bugs, request features, or suggest improvements to the Directory.</DialogDescription>
          </DialogHeader>

          {similarPost ? (
            <div className="py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900">
                <div className="flex gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <h4 className="font-bold">I found a similar open request</h4>
                </div>
                <p className="text-sm mb-3">"{similarPost.title}"</p>
                <p className="text-xs opacity-80">Would you like to add your feedback to that request instead? This helps us prioritize!</p>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                <Button variant="outline" onClick={() => setSimilarPost(null)} className="w-full">No, create mine anyway</Button>
                <Button onClick={handleJoinSimilar} disabled={isSubmitting} className="w-full bg-gvsuBlue hover:bg-midnight text-white font-bold">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Join Existing Request
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Category</label>
                <div className="flex gap-2">
                  {(['BUG', 'FEATURE', 'IMPROVEMENT'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors ${category === c ? 'bg-gvsuBlue/10 border-gvsuBlue text-gvsuBlue' : 'border-slate-200 text-slate-500'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of your feedback..." className="h-12" />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details, use cases, or steps to reproduce..." className="min-h-[120px]" />
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePost} disabled={isSubmitting || !title || !description} className="w-full h-12 bg-gvsuBlue hover:bg-midnight text-white font-bold uppercase tracking-widest">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Check & Submit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
