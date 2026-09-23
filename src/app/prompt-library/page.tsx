"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GVSUHeader } from "@/components/GVSUHeader";
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

  // Explicit default states ("All Models", "All Categories", "All Tools", empty search)
  const initialModelParam = searchParams?.get("model");
  const initialCategoryParam = searchParams?.get("category");
  const initialToolParam = searchParams?.get("tool");
  const initialQueryParam = searchParams?.get("q");

  const [searchQuery, setSearchQuery] = useState(initialQueryParam || "");
  const [selectedModel, setSelectedModel] = useState(initialModelParam && AI_MODELS.includes(initialModelParam) ? initialModelParam : "All Models");
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryParam && CATEGORIES.includes(initialCategoryParam) ? initialCategoryParam : "All Categories");
  const [selectedToolFilter, setSelectedToolFilter] = useState(initialToolParam || "All Tools");
  
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<PromptSubmission | null>(null);

  // Query published/approved prompts only
  const promptsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "promptLibrary"),
      where("status", "==", "APPROVED")
    );
  }, [firestore]);

  const { data: prompts, isLoading } = useCollection<PromptSubmission>(promptsQuery);

  // Query published AI tools for tool filter options
  const toolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "tools_published"));
  }, [firestore]);

  const { data: tools } = useCollection<ToolSubmission>(toolsQuery);

  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];
    
    const q = searchQuery.toLowerCase().trim();

    return prompts.filter((prompt) => {
      const title = (prompt.title || prompt.promptName || "").toLowerCase();
      const template = (prompt.promptTemplate || prompt.promptText || "").toLowerCase();
      const description = (prompt.description || "").toLowerCase();
      const category = (prompt.category || "").toLowerCase();
      const model = (prompt.targetModel || prompt.model || "").toLowerCase();
      const toolName = (prompt.associatedToolName || "").toLowerCase();
      const tagsStr = (prompt.tags || []).join(" ").toLowerCase();

      const matchesSearch = 
        q === "" || 
        title.includes(q) ||
        template.includes(q) ||
        description.includes(q) ||
        category.includes(q) ||
        model.includes(q) ||
        toolName.includes(q) ||
        tagsStr.includes(q);

      const matchesModel = 
        selectedModel === "All Models" || 
        (prompt.targetModel || prompt.model) === selectedModel;

      const matchesCategory = 
        selectedCategory === "All Categories" || 
        prompt.category === selectedCategory;

      const matchesTool =
        selectedToolFilter === "All Tools" ||
        prompt.associatedToolId === selectedToolFilter ||
        prompt.associatedToolName === selectedToolFilter;

      return matchesSearch && matchesModel && matchesCategory && matchesTool;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <GVSUHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-gvsu-blue dark:text-purple-400" />
              <h1 className="text-3xl md:text-4xl font-bold font-serif text-gvsu-blue dark:text-blue-400">
                Community Prompt Library
              </h1>
            </div>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Discover, copy, and share high-quality AI prompt templates for teaching, research, writing, productivity, and academic workflows.
            </p>
          </div>
          
          <Button 
            className="bg-[#003B5C] hover:bg-[#002C45] text-white font-bold shadow-md h-11 px-6 rounded-xl flex items-center gap-2 cursor-pointer w-full md:w-auto shrink-0 opacity-100"
            onClick={handleOpenSubmit}
          >
            <Plus className="w-4 h-4" />
            Submit Prompt
          </Button>
        </div>

        {/* SEARCH & FILTERS ROW */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-8 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by title, prompt text, tags, or tool..." 
                className="pl-9 h-10 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Model Filter */}
            <div className="md:col-span-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-10 text-xs font-medium">
                  <SelectValue placeholder="AI Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Models">All AI Models</SelectItem>
                  {AI_MODELS.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-10 text-xs font-medium">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tool Filter */}
            <div className="md:col-span-3">
              <Select value={selectedToolFilter} onValueChange={setSelectedToolFilter}>
                <SelectTrigger className="h-10 text-xs font-medium">
                  <SelectValue placeholder="Associated Tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Tools">All Associated Tools</SelectItem>
                  {tools?.map(t => (
                    <SelectItem key={t.id} value={t.id!}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
              <span>Showing {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} matching criteria</span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs text-slate-500 hover:text-slate-800">
                <X className="w-3.5 h-3.5 mr-1" /> Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* PROMPTS GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-gvsu-blue" />
            <p>Loading community prompts...</p>
          </div>
        ) : !prompts || prompts.length === 0 ? (
          /* TOTAL EMPTY LIBRARY STATE */
          <div className="text-center py-20 border rounded-2xl bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 text-muted-foreground p-8">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-80" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No prompts have been published yet.</h3>
            <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Be the first to share a useful prompt with the GVSU community.
            </p>
            <Button className="mt-6 bg-[#003B5C] hover:bg-[#002C45] text-white font-bold h-11 px-6 rounded-xl" onClick={handleOpenSubmit}>
              <Plus className="w-4 h-4 mr-2" /> Submit a Prompt
            </Button>
          </div>
        ) : filteredPrompts.length === 0 ? (
          /* FILTERED EMPTY STATE */
          <div className="text-center py-20 border rounded-2xl bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 text-muted-foreground p-8">
            <Filter className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">No prompts found matching your criteria</p>
            <p className="text-sm mt-1 max-w-md mx-auto">
              Try adjusting your search terms or filters, or clear your filters to view all prompts.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button className="bg-[#003B5C] hover:bg-[#002C45] text-white font-bold" onClick={handleOpenSubmit}>
                <Plus className="w-4 h-4 mr-2" /> Submit a Prompt
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPrompts.map(prompt => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                onClick={() => setActivePrompt(prompt)} 
              />
            ))}
          </div>
        )}
      </div>

      <PromptSubmitModal 
        isOpen={isSubmitModalOpen} 
        onClose={() => setIsSubmitModalOpen(false)} 
      />
      
      <PromptDetailModal 
        isOpen={!!activePrompt}
        onClose={() => setActivePrompt(null)}
        prompt={activePrompt}
      />
    </main>
  );
}

export default function PromptLibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
        <GVSUHeader />
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-gvsu-blue" />
          <p>Loading community prompts...</p>
        </div>
      </div>
    }>
      <PromptLibraryContent />
    </Suspense>
  );
}



