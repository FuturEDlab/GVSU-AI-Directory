
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, or } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Loader2, Info } from "lucide-react";
import { ToolStatus, ToolTags } from "@/app/lib/tool-types";

export function SubmissionModal() {
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkDuplicate = async (title: string, url: string) => {
    const collections = ["tools_submitted", "tools_published"];
    for (const coll of collections) {
      const q = query(
        collection(db, coll), 
        or(where("title", "==", title.trim()), where("toolUrl", "==", url.toLowerCase().trim()))
      );
      const snap = await getDocs(q);
      if (!snap.empty) return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign In Required", description: "You must use your Laker email to submit tools." });
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const url = formData.get("url") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    try {
      const isDuplicate = await checkDuplicate(title, url);
      if (isDuplicate) {
        toast({
          variant: "destructive",
          title: "Duplicate Found",
          description: "This app is already in the list!",
        });
        setLoading(false);
        return;
      }

      const toolId = crypto.randomUUID();
      const toolData = {
        id: toolId,
        title: title.trim(),
        category,
        initialDescription: description,
        toolUrl: url.toLowerCase().trim(),
        status: "Submitted" as ToolStatus,
        health: "Healthy",
        submitterDisplayName: user.displayName || "Laker User",
        submitterEmail: user.email,
        submitterId: user.uid,
        upvotes: 0,
        downvotes: 0,
        isVerified: false,
        tags: { security_privacy: [], ethics_stewardship: [], pedagogical_value: [], institutional_status: ["Community Discovery"], access_cost: [] },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "tools_submitted", toolId), toolData);
      
      // Trigger confirmation email
      await setDoc(doc(collection(db, "mail"), crypto.randomUUID()), {
        to: user.email,
        message: {
          subject: "LakerAI: Tool Received",
          html: `Hello ${user.displayName},<br><br>Thanks for your help! We've received your tool (<b>${title}</b>) and will check it soon. Look out for an email from us!`
        }
      });

      toast({
        title: "Thanks for your help!",
        description: "We've received your tool and will check it soon. Look out for an email from us!",
      });
      setIsOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed", description: "Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="border-gvsuBlue text-gvsuBlue font-bold h-14 px-8 rounded-xl text-xs tracking-widest hover:bg-gvsuBlue hover:text-white">
          SUBMIT NEW TOOL <PlusCircle className="ml-2 w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-slate-900 font-black uppercase">Recommend AI</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">Add a tool to the community review queue.</DialogDescription>
        </DialogHeader>
        {!user ? (
          <div className="py-8 text-center space-y-4">
             <p className="text-slate-500 text-sm">Please sign in with your GVSU account to recommend tools.</p>
             <Button onClick={signIn} className="bg-gvsuBlue text-white font-bold px-8 h-12 rounded-xl">SIGN IN TO SUBMIT</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tool Name</Label>
              <Input id="title" name="title" placeholder="e.g. Canva" required className="rounded-xl border-slate-200 h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</Label>
              <Select name="category" required>
                <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {["Writing", "Image Generation", "Coding", "Video/Audio", "Research", "Other"].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Web Link</Label>
              <Input id="url" name="url" type="url" placeholder="https://..." required className="rounded-xl border-slate-200 h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Brief Summary</Label>
              <Textarea id="description" name="description" placeholder="What does this tool help Lakers do?" className="min-h-[100px] rounded-xl border-slate-200" required />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={loading} className="w-full bg-gvsuBlue text-white font-bold h-12 rounded-xl uppercase tracking-widest text-xs">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} CONFIRM SUBMISSION
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
