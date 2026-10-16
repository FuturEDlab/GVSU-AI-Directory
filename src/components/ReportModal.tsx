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
import { cn } from "@/lib/utils";

interface ReportModalProps {
  triggerClassName?: string;
  fullWidthMobile?: boolean;
  /** "onDark" (default) for the GVSU Blue utility bar; "onLight" for white/amber surfaces. */
  variant?: "onDark" | "onLight";
}

export function ReportModal({ triggerClassName, fullWidthMobile, variant = "onDark" }: ReportModalProps = {}) {
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
      .catch(async () => {
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
        {fullWidthMobile ? (
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold text-carillonBrick hover:bg-carillonBrick/10 transition-colors text-left",
              triggerClassName
            )}
          >
            <Flag className="w-4 h-4 shrink-0" />
            <span>Report a Mistake</span>
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider uppercase transition-colors whitespace-nowrap",
              variant === "onLight"
                ? "h-8 px-3 rounded-lg bg-white hover:bg-slate-50 text-gvsuBlue border border-gvsuBlue/40 hover:border-gvsuBlue shadow-xs"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20",
              triggerClassName
            )}
          >
            <Flag className={cn("w-3 h-3", variant === "onLight" ? "text-gvsuBlue" : "text-archway")} />
            <span>Report a Mistake</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-sans text-2xl font-bold text-gvsuBlue dark:text-linkBlue">
            Report Directory Issue
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Flag tools with privacy concerns, broken links, or academic integrity issues for review by the LakerAI Governance team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="toolName" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">App Name</Label>
            <Input id="toolName" name="toolName" placeholder="e.g. Microsoft Copilot" required className="h-11 rounded-lg" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="toolUrl" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Web Link (if known)</Label>
            <Input id="toolUrl" name="toolUrl" type="url" placeholder="https://..." className="h-11 rounded-lg" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Issue Category</Label>
            <Select name="reason" required>
              <SelectTrigger className="h-11 rounded-lg">
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
            <Label htmlFor="comments" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">What needs to be fixed?</Label>
            <Textarea 
              id="comments" 
              name="comments" 
              placeholder="Please provide details for our governance team..." 
              className="min-h-[100px] rounded-lg"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={loading} className="w-full bg-gvsuBlue hover:bg-midnight text-white font-bold h-11 rounded-lg uppercase tracking-wider text-xs">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Governance Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
