"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import { useAuth } from "@/lib/auth-context";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase/hooks";
import { collection, query, where } from "firebase/firestore";
import { PromptSubmission } from "@/app/lib/prompt-types";
import { ToolSubmission } from "@/app/lib/tool-types";
import { PromptCard } from "@/components/prompt-library/PromptCard";
import { PromptSubmitModal, AI_MODELS, CATEGORIES } from "@/components/prompt-library/PromptSubmitModal";
import { PromptDetailModal } from "@/components/prompt-library/PromptDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Loader2, Sparkles, Filter, X, BookOpen } from "lucide-react";

function PromptLibraryContent() {
  const { user, signIn } = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const initialModelParam = searchParams?.get("model");
  const initialCategoryParam = searchParams?.get("category");
  const initialToolParam = searchParams?.get("tool");
  const initialQueryParam = searchParams?.get("q");

  const [searchQuery, setSearchQuery] = useState(initialQueryParam || "");
  const [selectedModel, setSelectedModel] = useState(
    initialModelParam && AI_MODELS.includes(initialModelParam) ? initialModelParam : "All Models"
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategoryParam && CATEGORIES.includes(initialCategoryParam) ? initialCategoryParam : "All Categories"
  );
  const [selectedToolFilter, setSelectedToolFilter] = useState(initialToolParam || "All Tools");

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<PromptSubmission | null>(null);

  const promptsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "promptLibrary"), where("status", "==", "APPROVED"));
  }, [firestore]);

  const { data: prompts, isLoading } = useCollection<PromptSubmission>(promptsQuery);

  const toolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "tools_published"));
  }, [firestore]);

  const { data: tools } = useCollection<ToolSubmission>(toolsQuery);

  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];

    const q = searchQuery.toLowerCase().trim();

    return prompts
      .filter((prompt) => {
        const title = (prompt.title || prompt.promptName || "").toLowerCase();
        const template = (prompt.promptTemplate || prompt.promptText || "").toLowerCase();
        const description = (prompt.description || "").toLowerCase();
        const category = (prompt.category || "").toLowerCase();
        const model = (prompt.targetModel || prompt.model || "").toLowerCase();
        const customModelStr = (prompt.customModel || "").toLowerCase();
        const toolName = (prompt.associatedToolName || "").toLowerCase();
        const tagsStr = (prompt.tags || []).join(" ").toLowerCase();

        const matchesSearch =
          q === "" ||
          title.includes(q) ||
          template.includes(q) ||
          description.includes(q) ||
          category.includes(q) ||
          model.includes(q) ||
          customModelStr.includes(q) ||
          toolName.includes(q) ||
          tagsStr.includes(q);

        const matchesModel =
          selectedModel === "All Models" ||
          (prompt.targetModel || prompt.model) === selectedModel ||
          (selectedModel === "Other" && prompt.targetModel === "Other");

        const matchesCategory =
          selectedCategory === "All Categories" || prompt.category === selectedCategory;

        const matchesTool =
          selectedToolFilter === "All Tools" ||
          prompt.associatedToolId === selectedToolFilter ||
          prompt.associatedToolName === selectedToolFilter;

        return matchesSearch && matchesModel && matchesCategory && matchesTool;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [prompts, searchQuery, selectedModel, selectedCategory, selectedToolFilter]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedModel !== "All Models" ||
    selectedCategory !== "All Categories" ||
    selectedToolFilter !== "All Tools";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedModel("All Models");
    setSelectedCategory("All Categories");
    setSelectedToolFilter("All Tools");
  };

  const handleOpenSubmit = () => {
    if (!user) {
      signIn();
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <GVSUHeader />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 pt-10 sm:pt-12 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gvsuBlue">
              <Sparkles className="w-4 h-4" />
              <span>GVSU Faculty &amp; Student Prompt Repository</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-sans text-[#0F172A] tracking-tight">
              Community Prompt Library
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Discover, copy, and share vetted AI prompt templates for teaching, syllabus design, research synthesis, and academic workflows.
            </p>
          </div>

          <Button
            className="bg-gvsuBlue hover:bg-midnight text-white font-bold shadow-xs h-11 px-6 rounded-lg flex items-center gap-2 cursor-pointer w-full md:w-auto shrink-0 uppercase tracking-wider text-xs"
            onClick={handleOpenSubmit}
          >
            <Plus className="w-4 h-4" />
            Submit Prompt
          </Button>
        </div>

        {/* SEARCH & FILTERS ROW */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-8 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by title, prompt text, tags, or tool..."
                className="pl-10 h-11 text-sm rounded-lg border-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Model Filter */}
            <div className="md:col-span-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-11 text-xs font-semibold rounded-lg border-slate-300">
                  <SelectValue placeholder="AI Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Models">All AI Models</SelectItem>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11 text-xs font-semibold rounded-lg border-slate-300">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tool Filter */}
            <div className="md:col-span-3">
              <Select value={selectedToolFilter} onValueChange={setSelectedToolFilter}>
                <SelectTrigger className="h-11 text-xs font-semibold rounded-lg border-slate-300">
                  <SelectValue placeholder="Associated Tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Tools">All Associated Tools</SelectItem>
                  {tools?.map((t) => (
                    <SelectItem key={t.id} value={t.id!}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span>
                Showing {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? "s" : ""} matching criteria
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs font-semibold text-gvsuBlue hover:text-midnight"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* PROMPTS GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-gvsuBlue" />
            <p className="text-sm font-medium">Loading community prompts...</p>
          </div>
        ) : !prompts || prompts.length === 0 ? (
          <div className="text-center py-20 border rounded-2xl bg-white border-dashed border-slate-300 p-8">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gvsuBlue/60" />
            <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900">
              No Prompts Published Yet
            </h2>
            <p className="text-sm mt-2 text-slate-600 max-w-md mx-auto">
              Be the first to share a vetted prompt template with the GVSU academic community.
            </p>
            <Button
              className="mt-6 bg-gvsuBlue hover:bg-midnight text-white font-bold h-11 px-6 rounded-lg uppercase tracking-wider text-xs"
              onClick={handleOpenSubmit}
            >
              <Plus className="w-4 h-4 mr-2" /> Submit a Prompt
            </Button>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-20 border rounded-2xl bg-white border-dashed border-slate-300 p-8">
            <Filter className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900">
              No Prompts Found Matching Criteria
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Try adjusting your search terms or filters, or clear your filters to view all prompts.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button variant="outline" onClick={clearFilters} className="h-11 px-5 rounded-lg font-bold text-xs uppercase tracking-wider">
                Clear Filters
              </Button>
              <Button
                className="bg-gvsuBlue hover:bg-midnight text-white font-bold h-11 px-5 rounded-lg uppercase tracking-wider text-xs"
                onClick={handleOpenSubmit}
              >
                <Plus className="w-4 h-4 mr-2" /> Submit a Prompt
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} onClick={() => setActivePrompt(prompt)} />
            ))}
          </div>
        )}
      </main>

      <PromptSubmitModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} />

      <PromptDetailModal
        isOpen={!!activePrompt}
        onClose={() => setActivePrompt(null)}
        prompt={activePrompt}
      />

      <GVSUFooter />
    </div>
  );
}

export default function PromptLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
          <GVSUHeader />
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-gvsuBlue" />
            <p className="text-sm font-medium">Loading community prompts...</p>
          </div>
          <GVSUFooter />
        </div>
      }
    >
      <PromptLibraryContent />
    </Suspense>
  );
}
