import { PromptSubmission } from "@/app/lib/prompt-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Bot, Tag, User, CheckCircle2, Wrench, BarChart2, ShieldAlert, FileText, Code2, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: PromptSubmission | null;
}

export function PromptDetailModal({ isOpen, onClose, prompt }: PromptDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const promptTitle = prompt.title || prompt.promptName;
  const promptTemplateText = prompt.promptTemplate || prompt.promptText;
  const targetModel = prompt.targetModel || prompt.model;
  const authorDisplay = prompt.authorName || prompt.submittedByEmail || "Community Member";

  const handleCopy = () => {
    navigator.clipboard.writeText(promptTemplateText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 md:p-8">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
            {promptTitle}
          </DialogTitle>
          {prompt.description && (
            <DialogDescription className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {prompt.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* METADATA BADGES */}
        <div className="flex flex-wrap gap-2 my-3 shrink-0">
          <Badge variant="secondary" className="flex items-center gap-1.5 bg-gvsu-blue/10 text-gvsu-blue font-medium">
            <Bot className="w-3.5 h-3.5" />
            {targetModel}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {prompt.category}
          </Badge>
          {prompt.difficulty && (
            <Badge variant="outline" className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800">
              <BarChart2 className="w-3.5 h-3.5 text-purple-600" />
              {prompt.difficulty}
            </Badge>
          )}
          {prompt.associatedToolName && (
            <Badge variant="outline" className="flex items-center gap-1.5 border-gvsu-blue/30 bg-blue-50/50 dark:bg-blue-950/30 text-gvsu-blue dark:text-blue-300">
              <Wrench className="w-3.5 h-3.5" />
              {prompt.associatedToolId ? (
                <Link 
                  href={`/tools/${prompt.associatedToolId}`}
                  onClick={onClose}
                  className="hover:underline flex items-center gap-1"
                >
                  Tool: {prompt.associatedToolName} <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span>Tool: {prompt.associatedToolName}</span>
              )}
            </Badge>
          )}
          <Badge variant="outline" className="border-none shadow-none flex items-center gap-1.5 text-muted-foreground ml-auto">
            <User className="w-3.5 h-3.5" />
            By {authorDisplay}
          </Badge>
        </div>

        {/* TAGS */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
            {prompt.tags.map((tag, i) => (
              <span key={i} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <ScrollArea className="flex-1 pr-3 -mr-3 space-y-6">
          {/* PROMPT TEMPLATE BOX */}
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-gvsu-blue" />
                PROMPT TEMPLATE
              </span>
              <Button
                onClick={handleCopy}
                size="sm"
                className="h-7 text-xs bg-gvsu-blue hover:bg-gvsu-blue/90 text-white gap-1.5 transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Prompt
                  </>
                )}
              </Button>
            </div>
            <pre className="p-4 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-100 selection:bg-gvsu-blue selection:text-white">
              {promptTemplateText}
            </pre>
          </div>

          {/* SYSTEM PROMPT / CONTEXT */}
          {prompt.systemPrompt && (
            <div className="space-y-1.5 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-gvsu-blue" />
                System Prompt / Context
              </h4>
              <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {prompt.systemPrompt}
              </div>
            </div>
          )}

          {/* USAGE GUIDE & EXPECTED OUTPUT */}
          {(prompt.userInputGuide || prompt.expectedOutputFormat) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {prompt.userInputGuide && (
                <div className="p-3 rounded-lg border bg-slate-50/70 dark:bg-slate-900/70 space-y-1">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">User Input Guide</h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{prompt.userInputGuide}</p>
                </div>
              )}
              {prompt.expectedOutputFormat && (
                <div className="p-3 rounded-lg border bg-slate-50/70 dark:bg-slate-900/70 space-y-1">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expected Output Format</h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{prompt.expectedOutputFormat}</p>
                </div>
              )}
            </div>
          )}

          {/* EXAMPLES */}
          {(prompt.exampleInput || prompt.exampleOutput) && (
            <div className="space-y-3 mt-4 border-t pt-4 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Execution Examples</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompt.exampleInput && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Example Input</span>
                    <div className="p-3 rounded-lg border bg-white dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {prompt.exampleInput}
                    </div>
                  </div>
                )}
                {prompt.exampleOutput && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Example Output</span>
                    <div className="p-3 rounded-lg border bg-white dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {prompt.exampleOutput}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NEGATIVE CONSTRAINTS */}
          {prompt.negativeConstraints && (
            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs space-y-1 mt-4">
              <h5 className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                Negative Constraints
              </h5>
              <p className="leading-relaxed">{prompt.negativeConstraints}</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

