
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/firebase/hooks";
import { collection, addDoc } from "firebase/firestore";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ErrorReportLog } from "@/app/lib/tool-types";

interface ToolErrorModalProps {
  toolId: string;
  toolName: string;
}

export function ToolErrorModal({ toolId, toolName }: ToolErrorModalProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign In Required", description: "Please sign in with your Laker email to report mistakes." });
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const reportData: ErrorReportLog = {
      targetToolId: toolId,
      toolName: toolName,
      reporterEmail: user.email!,
      issueType: formData.get("issueType") as string,
      userFeedback: formData.get("userFeedback") as string,
      createdTimestamp: new Date().toISOString(),
      resolvedStatus: "pending",
    };

    try {
      await addDoc(collection(firestore, "tool_error_reports"), reportData);
      toast({
        title: "Thank you",
        description: "Your feedback has been delivered to the admin desk for manual validation.",
      });
      setIsOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not submit report." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 h-9 rounded-lg font-bold text-[11px] shrink-0 uppercase tracking-widest whitespace-nowrap">
          Report Inaccuracy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-slate-900 font-black uppercase">Report Mistake</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">Help our admins maintain the accuracy of the LakerAI Hub.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">What is incorrect?</Label>
            <Select name="issueType" required>
              <SelectTrigger className="rounded-xl border-slate-200 h-11">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Wrong Image">Wrong Image</SelectItem>
                <SelectItem value="Incorrect Grade Summary">Incorrect Grade Summary</SelectItem>
                <SelectItem value="Broken Links">Broken Links</SelectItem>
                <SelectItem value="Outdated App Details">Outdated App Details</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Additional Details</Label>
            <Textarea 
              name="userFeedback" 
              placeholder="Please describe what needs to be changed..." 
              className="min-h-[100px] rounded-xl border-slate-200"
              required
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full bg-gvsuBlue text-white font-bold h-12 rounded-xl uppercase tracking-widest text-xs shadow-lg">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} SUBMIT FEEDBACK
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
