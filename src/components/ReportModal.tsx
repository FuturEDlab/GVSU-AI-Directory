
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
import { Flag, Loader2 } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export function ReportModal() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign In Required", description: "Please sign in with your Laker email to report tools." });
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const reportData = {
      toolName: formData.get("toolName"),
      toolUrl: formData.get("toolUrl"),
      reason: formData.get("reason"),
      comments: formData.get("comments"),
      reporterName: user.displayName || "GVSU User",
      reporterEmail: user.email,
      status: "Pending",
      createdAt: serverTimestamp(),
    };
    
    addDoc(collection(db, "reports"), reportData)
      .then(() => {
        toast({
          title: "Report Submitted",
          description: "Thank you for helping keep our directory safe and accurate.",
        });
        setIsOpen(false);
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: "reports",
          operation: 'create',
          requestResourceData: reportData
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-amber-400 text-amber-900 hover:bg-amber-100 font-bold px-3 py-1.5 h-8 rounded-lg text-xs transition-all whitespace-nowrap"
        >
          Report a Mistake
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-gvsuBlue uppercase">Report Hub Error</DialogTitle>
          <DialogDescription>
            Flag tools with privacy concerns, broken links, or academic integrity issues.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="toolName">App Name</Label>
            <Input id="toolName" name="toolName" placeholder="e.g. Canva" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="toolUrl">Web Link (if known)</Label>
            <Input id="toolUrl" name="toolUrl" type="url" placeholder="https://..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Issue Category</Label>
            <Select name="reason" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incorrect Category Grade">Incorrect Category Grade</SelectItem>
                <SelectItem value="Broken External Link">Broken External Link</SelectItem>
                <SelectItem value="Outdated Application Image">Outdated Application Image</SelectItem>
                <SelectItem value="Flawed Summary Text">Flawed Summary Text</SelectItem>
                <SelectItem value="Privacy/Academic Integrity">Privacy/Academic Integrity</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comments">What needs to be fixed?</Label>
            <Textarea 
              id="comments" 
              name="comments" 
              placeholder="Please provide details for our governance team..." 
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full bg-gvsuBlue text-white font-bold h-12 rounded-xl">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              SEND REPORT
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
