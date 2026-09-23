import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase/hooks";
import { collection, addDoc, query, orderBy } from "firebase/firestore";
import { PromptSubmission, PromptDifficulty } from "@/app/lib/prompt-types";
import { ToolSubmission } from "@/app/lib/tool-types";
import { Loader2, Info, Sparkles, Code2, Tag, Wrench, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AI_MODELS = [
  "GPT-4 / GPT-4o",
  "Claude",
  "Gemini",
  "Llama",
  "Image Generation",
  "Other"
];

export const CATEGORIES = [
  "Teaching",
  "Research",
  "Writing",
  "Education",
  "Productivity",
  "Coding",
  "Presentation",
  "Image Generation",
  "Data Analysis",
  "Other"
];

export const DIFFICULTY_LEVELS: PromptDifficulty[] = [
  "All Levels",
  "Beginner",
  "Intermediate",
  "Advanced"
];

export function PromptSubmitModal({ isOpen, onClose }: PromptSubmitModalProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    promptTemplate: "",
    systemPrompt: "",
    targetModel: "",
    category: "",
    tagsInput: "",
    associatedToolId: "none",
    userInputGuide: "",
    expectedOutputFormat: "",
    exampleInput: "",
    exampleOutput: "",
    negativeConstraints: "",
    difficulty: "All Levels" as PromptDifficulty
  });

  // Fetch published AI tools from tools_published for dropdown selection
  const toolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "tools_published"), orderBy("title", "asc"));
  }, [firestore]);

  const { data: publishedTools, isLoading: toolsLoading } = useCollection<ToolSubmission>(toolsQuery);

  const handleReset = () => {
    setFormData({
      title: "",
      description: "",
      promptTemplate: "",
      systemPrompt: "",
      targetModel: "",
      category: "",
      tagsInput: "",
      associatedToolId: "none",
      userInputGuide: "",
      expectedOutputFormat: "",
      exampleInput: "",
      exampleOutput: "",
      negativeConstraints: "",
      difficulty: "All Levels"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to submit a prompt."
      });
      return;
    }

    // Validation
    const cleanTitle = formData.title.trim();
    const cleanPrompt = formData.promptTemplate.trim();
    const cleanDescription = formData.description.trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Prompt Title must be at least 3 characters long."
      });
      return;
    }

    if (!cleanPrompt || cleanPrompt.length < 10) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Prompt Template must be at least 10 characters long."
      });
      return;
    }

    if (!formData.targetModel) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a Target AI Model."
      });
      return;
    }

    if (!formData.category) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a Primary Category."
      });
      return;
    }

    // Process tags
    const tags = formData.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Associated Tool lookup
    let associatedToolId: string | undefined = undefined;
    let associatedToolName: string | undefined = undefined;

    if (formData.associatedToolId && formData.associatedToolId !== "none") {
      const selectedTool = publishedTools?.find((t) => t.id === formData.associatedToolId);
      if (selectedTool) {
        associatedToolId = selectedTool.id;
        associatedToolName = selectedTool.title;
      }
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const authorEmail = user.email || "Unknown Author";
      const authorName = user.displayName || user.email?.split("@")[0] || "Anonymous";

      const promptData: PromptSubmission = {
        // Core fields (supporting both new & legacy naming)
        title: cleanTitle,
        promptName: cleanTitle,
        promptTemplate: cleanPrompt,
        promptText: cleanPrompt,
        description: cleanDescription || cleanTitle,
        systemPrompt: formData.systemPrompt.trim() || undefined,

        // Classification
        targetModel: formData.targetModel,
        model: formData.targetModel,
        category: formData.category,
        tags: tags.length > 0 ? tags : undefined,
        associatedToolId,
        associatedToolName,

        // Usage
        userInputGuide: formData.userInputGuide.trim() || undefined,
        expectedOutputFormat: formData.expectedOutputFormat.trim() || undefined,
        exampleInput: formData.exampleInput.trim() || undefined,
        exampleOutput: formData.exampleOutput.trim() || undefined,
        negativeConstraints: formData.negativeConstraints.trim() || undefined,
        difficulty: formData.difficulty,

        // Author (Always bound to authenticated user)
        submittedBy: user.uid,
        submittedByEmail: authorEmail,
        authorUid: user.uid,
        authorName: authorName,

        createdAt: now,
        updatedAt: now,
        status: "PENDING"
      };

      await addDoc(collection(firestore, "promptLibrary"), promptData);

      toast({
        title: "Prompt Submitted for Review!",
        description: "Thank you! Your prompt has been sent to administrators for moderation."
      });

      handleReset();
      onClose();
    } catch (error) {
      console.error("Error submitting prompt:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error saving your prompt. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gvsu-blue dark:text-purple-400" />
            <DialogTitle className="text-2xl font-serif font-bold">Submit a Community Prompt</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Share high-quality, reusable AI prompts with the GVSU community. Submissions are reviewed by admins before appearing in the directory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 mt-6">
          {/* SECTION 1: PROMPT */}
          <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-gvsu-blue font-bold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
              <FileText className="w-4 h-4" />
              <span>1. Prompt Details</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                required
                maxLength={150}
                placeholder="e.g. Socratic Teaching Assistant for Essay Feedback"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-semibold">Short Description</Label>
              <Input
                id="description"
                maxLength={300}
                placeholder="Brief summary of what this prompt accomplishes"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="promptTemplate" className="font-semibold">
                  Prompt Template <span className="text-red-500">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {formData.promptTemplate.length}/10000
                </span>
              </div>

              {/* Helper text for variables */}
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg p-3 text-xs text-blue-900 dark:text-blue-200 flex gap-2.5 items-start">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Use variable placeholders for dynamic user input:</p>
                  <p className="font-mono text-[11px] bg-white/70 dark:bg-slate-900/80 p-1.5 rounded border border-blue-200/50 dark:border-blue-900">
                    {"Act as an expert tutor in {{topic}}. Review this draft for a {{target_audience}} audience and provide 3 constructive suggestions for {{company_name}}."}
                  </p>
                  <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">
                    Users will replace variables inside double curly braces <code>{"{{variable}}"}</code> when applying your prompt.
                  </p>
                </div>
              </div>

              <Textarea
                id="promptTemplate"
                required
                rows={7}
                maxLength={10000}
                placeholder="Paste your prompt template here..."
                className="font-mono text-sm leading-relaxed"
                value={formData.promptTemplate}
                onChange={(e) => setFormData((prev) => ({ ...prev, promptTemplate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt" className="font-semibold">System Prompt / Context <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
              <Textarea
                id="systemPrompt"
                rows={3}
                maxLength={3000}
                placeholder="e.g. You are a patient, encouraging academic writing advisor at Grand Valley State University."
                className="font-mono text-xs"
                value={formData.systemPrompt}
                onChange={(e) => setFormData((prev) => ({ ...prev, systemPrompt: e.target.value }))}
              />
            </div>
          </div>

          {/* SECTION 2: CLASSIFICATION */}
          <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-gvsu-blue font-bold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
              <Tag className="w-4 h-4" />
              <span>2. Classification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="targetModel" className="font-semibold">
                  Target AI Model <span className="text-red-500">*</span>
                </Label>
                <Select
                  required
                  value={formData.targetModel}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, targetModel: val }))}
                >
                  <SelectTrigger id="targetModel">
                    <SelectValue placeholder="Select target AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="font-semibold">
                  Primary Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  required
                  value={formData.category}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select primary category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tagsInput" className="font-semibold">Use Case / Tags <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                <Input
                  id="tagsInput"
                  placeholder="e.g. grading, syllabus, brainstorm (comma separated)"
                  value={formData.tagsInput}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tagsInput: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="associatedToolId" className="font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                  Associated AI Tool <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Select
                  value={formData.associatedToolId}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, associatedToolId: val }))}
                >
                  <SelectTrigger id="associatedToolId">
                    <SelectValue placeholder="Select from AI Tool Directory..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General / No specific tool</SelectItem>
                    {toolsLoading ? (
                      <SelectItem value="loading" disabled>Loading tools...</SelectItem>
                    ) : (
                      publishedTools?.map((t) => (
                        <SelectItem key={t.id} value={t.id!}>
                          {t.title} ({t.category})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Connect your prompt to an existing tool in the directory. Users viewing that tool will see this prompt.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: USAGE */}
          <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-gvsu-blue font-bold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
              <Code2 className="w-4 h-4" />
              <span>3. Usage & Examples <span className="text-xs text-muted-foreground font-normal capitalize">(Optional)</span></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="font-semibold">Difficulty Level</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(val: PromptDifficulty) => setFormData((prev) => ({ ...prev, difficulty: val }))}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((diff) => (
                      <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userInputGuide" className="font-semibold">User Input Guide</Label>
                <Input
                  id="userInputGuide"
                  placeholder="e.g. Provide a raw essay text or assignment description"
                  value={formData.userInputGuide}
                  onChange={(e) => setFormData((prev) => ({ ...prev, userInputGuide: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedOutputFormat" className="font-semibold">Expected Output Format</Label>
              <Input
                id="expectedOutputFormat"
                placeholder="e.g. Markdown bullet points with key action items"
                value={formData.expectedOutputFormat}
                onChange={(e) => setFormData((prev) => ({ ...prev, expectedOutputFormat: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="exampleInput" className="font-semibold">Example Input</Label>
                <Textarea
                  id="exampleInput"
                  rows={3}
                  placeholder="Sample input text supplied to the model"
                  value={formData.exampleInput}
                  onChange={(e) => setFormData((prev) => ({ ...prev, exampleInput: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exampleOutput" className="font-semibold">Example Output</Label>
                <Textarea
                  id="exampleOutput"
                  rows={3}
                  placeholder="Sample response generated by the model"
                  value={formData.exampleOutput}
                  onChange={(e) => setFormData((prev) => ({ ...prev, exampleOutput: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="negativeConstraints" className="font-semibold">Negative Constraints</Label>
              <Input
                id="negativeConstraints"
                placeholder="e.g. Do not use jargon; do not write the essay for the student"
                value={formData.negativeConstraints}
                onChange={(e) => setFormData((prev) => ({ ...prev, negativeConstraints: e.target.value }))}
              />
            </div>
          </div>

          {/* AUTHOR DISPLAY */}
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs flex justify-between items-center text-muted-foreground">
            <span>Author: <strong className="text-foreground">{user?.email || "Not signed in"}</strong></span>
            <span>Submission Status: <strong className="text-yellow-600 dark:text-yellow-400">PENDING ADMIN REVIEW</strong></span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gvsu-blue hover:bg-gvsu-blue/90 text-white font-semibold" disabled={isSubmitting || !user}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Submit Prompt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

