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
import { PlusCircle, Loader2 } from "lucide-react";
import { ToolStatus, TOOL_CATEGORIES } from "@/app/lib/tool-types";

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
        tags: {
          security_privacy: [],
          ethics_stewardship: [],
          pedagogical_value: [],
          institutional_status: ["Community Discovery"],
          access_cost: [],
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "tools_submitted", toolId), toolData);

      await setDoc(doc(collection(db, "mail"), crypto.randomUUID()), {
        to: user.email,
        message: {
          subject: "LakerAI: Tool Received",
          html: `Hello ${user.displayName},<br><br>Thanks for your help! We've received your tool (<b>${title}</b>) and will check it soon. Look out for an email from us!`,
        },
      });

      toast({
        title: "Thanks for your help!",
        description: "We've received your tool and will check it soon. Look out for an email from us!",
      });
      setIsOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Action Failed", description: "Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gvsuBlue hover:bg-midnight text-white font-bold h-11 px-6 rounded-lg text-xs tracking-wider uppercase shadow-xs transition-colors">
          Submit New Tool <PlusCircle className="ml-2 w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-sans text-2xl sm:text-3xl text-gvsuBlue dark:text-linkBlue font-bold">
            Recommend an AI Tool
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Submit an AI tool to the GVSU LakerAI governance &amp; peer review queue.
          </DialogDescription>
        </DialogHeader>
        {!user ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Please sign in with your GVSU account to recommend tools.
            </p>
            <Button onClick={signIn} className="bg-gvsuBlue hover:bg-midnight text-white font-bold px-8 h-11 rounded-lg uppercase tracking-wider text-xs">
              Sign In to Submit
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Tool Name</Label>
              <Input id="title" name="title" placeholder="e.g. NotebookLM" required className="rounded-lg border-slate-300 h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Category</Label>
              <Select name="category" required>
                <SelectTrigger className="rounded-lg border-slate-300 h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Web Link</Label>
              <Input id="url" name="url" type="url" placeholder="https://..." required className="rounded-lg border-slate-300 h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Pedagogical or Workflow Use Case</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="How does this tool support GVSU teaching, learning, research, or productivity?"
                className="min-h-[100px] rounded-lg border-slate-300"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={loading} className="w-full bg-gvsuBlue hover:bg-midnight text-white font-bold h-11 rounded-lg uppercase tracking-wider text-xs">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Confirm Submission
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
