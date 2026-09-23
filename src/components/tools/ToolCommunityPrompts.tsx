"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase/hooks";
import { collection, query, where } from "firebase/firestore";
import { PromptSubmission } from "@/app/lib/prompt-types";
import { PromptCard } from "@/components/prompt-library/PromptCard";
import { PromptDetailModal } from "@/components/prompt-library/PromptDetailModal";
import { PromptSubmitModal } from "@/components/prompt-library/PromptSubmitModal";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Loader2, BookOpen } from "lucide-react";

interface ToolCommunityPromptsProps {
  toolId: string;
  toolTitle: string;
}

export function ToolCommunityPrompts({ toolId, toolTitle }: ToolCommunityPromptsProps) {
  const firestore = useFirestore();

  const [activePrompt, setActivePrompt] = useState<PromptSubmission | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const promptsQuery = useMemoFirebase(() => {
    if (!firestore || !toolId) return null;
    return query(
      collection(firestore, "promptLibrary"),
      where("associatedToolId", "==", toolId),
      where("status", "==", "APPROVED")
    );
  }, [firestore, toolId]);

  const { data: prompts, isLoading } = useCollection<PromptSubmission>(promptsQuery);

  return (
    <div className="mt-12 space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gvsu-blue dark:text-purple-400" />
            <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Community Prompts
            </h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Community-created prompt templates tailored for <strong className="text-slate-700 dark:text-slate-300">{toolTitle}</strong>.
          </p>
        </div>

        <Button 
          size="sm" 
          className="bg-gvsu-blue hover:bg-gvsu-blue/90 text-white gap-1.5 shadow-sm font-semibold shrink-0"
          onClick={() => setIsSubmitModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Submit Prompt
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-gvsu-blue" />
          <span className="text-sm">Loading tool prompts...</span>
        </div>
      ) : !prompts || prompts.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-80" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No community prompts attached to {toolTitle} yet.
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Be the first to share a prompt template for using this tool in teaching, research, or productivity!
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 border-gvsu-blue text-gvsu-blue hover:bg-gvsu-blue hover:text-white"
            onClick={() => setIsSubmitModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Submit First Prompt
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prompts.map((prompt) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              onClick={() => setActivePrompt(prompt)} 
            />
          ))}
        </div>
      )}

      <PromptDetailModal
        isOpen={!!activePrompt}
        onClose={() => setActivePrompt(null)}
        prompt={activePrompt}
      />

      <PromptSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
    </div>
  );
}
