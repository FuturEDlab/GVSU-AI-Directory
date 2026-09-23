import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase/hooks";
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { PromptSubmission } from "@/app/lib/prompt-types";
import { ToolSubmission } from "@/app/lib/tool-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Trash2, Eye, Edit, Undo2, Wrench, Bot, Tag, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptDetailModal } from "@/components/prompt-library/PromptDetailModal";
import { AI_MODELS, CATEGORIES } from "@/components/prompt-library/PromptSubmitModal";

export function AdminPromptModerationTab() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [activePrompt, setActivePrompt] = useState<PromptSubmission | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptSubmission | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Form state for admin editing
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    promptTemplate: "",
    targetModel: "",
    category: "",
    associatedToolId: "none"
  });

  const promptsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "promptLibrary"), orderBy("createdAt", "desc"), limit(100));
  }, [firestore]);

  const { data: prompts, isLoading } = useCollection<PromptSubmission>(promptsQuery);

  const toolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "tools_published"));
  }, [firestore]);

  const { data: tools } = useCollection<ToolSubmission>(toolsQuery);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue" />
      </div>
    );
  }

  const pendingPrompts = prompts?.filter((p) => p.status === "PENDING") || [];
  const approvedPrompts = prompts?.filter((p) => p.status === "APPROVED") || [];
  const rejectedPrompts = prompts?.filter((p) => p.status === "REJECTED") || [];

  const handleStatusChange = async (promptId: string, newStatus: "APPROVED" | "REJECTED" | "PENDING") => {
    if (!firestore) return;
    setIsProcessing(promptId);
    try {
      const docRef = doc(firestore, "promptLibrary", promptId);
      const updates: Partial<PromptSubmission> = { 
        status: newStatus,
        updatedAt: Date.now()
      };
      if (newStatus === "APPROVED") {
        updates.publishedAt = Date.now();
      }
      await updateDoc(docRef, updates);
      
      const label = newStatus === "APPROVED" ? "Approved" : newStatus === "REJECTED" ? "Rejected" : "Unpublished to Pending";
      toast({ title: `Prompt ${label}`, description: `The prompt status has been updated.` });
    } catch (err) {
      console.error("Failed to update prompt status:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to update prompt status." });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (promptId: string) => {
    if (!firestore || !confirm("Are you sure you want to permanently delete this prompt?")) return;
    setIsProcessing(promptId);
    try {
      await deleteDoc(doc(firestore, "promptLibrary", promptId));
      toast({ title: "Prompt Deleted" });
    } catch (err) {
      console.error("Failed to delete prompt:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete prompt." });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleStartEdit = (prompt: PromptSubmission) => {
    setEditingPrompt(prompt);
    setEditFormData({
      title: prompt.title || prompt.promptName || "",
      description: prompt.description || "",
      promptTemplate: prompt.promptTemplate || prompt.promptText || "",
      targetModel: prompt.targetModel || prompt.model || "",
      category: prompt.category || "",
      associatedToolId: prompt.associatedToolId || "none"
    });
  };

  const handleSaveEdit = async () => {
    if (!firestore || !editingPrompt?.id) return;
    setIsProcessing(editingPrompt.id);

    try {
      let associatedToolId: string | undefined = undefined;
      let associatedToolName: string | undefined = undefined;

      if (editFormData.associatedToolId && editFormData.associatedToolId !== "none") {
        const foundTool = tools?.find((t) => t.id === editFormData.associatedToolId);
        if (foundTool) {
          associatedToolId = foundTool.id;
          associatedToolName = foundTool.title;
        }
      }

      const docRef = doc(firestore, "promptLibrary", editingPrompt.id);
      await updateDoc(docRef, {
        title: editFormData.title,
        promptName: editFormData.title,
        description: editFormData.description,
        promptTemplate: editFormData.promptTemplate,
        promptText: editFormData.promptTemplate,
        targetModel: editFormData.targetModel,
        model: editFormData.targetModel,
        category: editFormData.category,
        associatedToolId,
        associatedToolName,
        updatedAt: Date.now()
      });

      toast({ title: "Prompt Updated", description: "Prompt details were successfully saved." });
      setEditingPrompt(null);
    } catch (err) {
      console.error("Failed to save edit:", err);
      toast({ variant: "destructive", title: "Edit Failed", description: "Could not save prompt changes." });
    } finally {
      setIsProcessing(null);
    }
  };

  const renderPromptList = (list: PromptSubmission[]) => (
    <div className="space-y-4">
      {list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          No prompts in this section.
        </div>
      ) : (
        list.map((prompt) => {
          const title = prompt.title || prompt.promptName;
          const model = prompt.targetModel || prompt.model;
          const author = prompt.authorName || prompt.submittedByEmail;
          const isPending = prompt.status === "PENDING";
          const isApproved = prompt.status === "APPROVED";
          const isRejected = prompt.status === "REJECTED";

          return (
            <div key={prompt.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{title}</h4>
                  <Badge 
                    variant={isApproved ? "default" : isRejected ? "destructive" : "secondary"}
                    className="text-[10px] uppercase font-bold shrink-0"
                  >
                    {prompt.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{prompt.description}</p>

                <div className="flex flex-wrap gap-2 mt-2 items-center text-xs">
                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                    <Bot className="w-3 h-3 text-gvsuBlue" /> {model}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {prompt.category}
                  </Badge>
                  {prompt.associatedToolName && (
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1 bg-blue-50 text-gvsuBlue border-blue-200">
                      <Wrench className="w-3 h-3" /> {prompt.associatedToolName}
                    </Badge>
                  )}
                  <span className="text-slate-500 text-[11px] flex items-center gap-1 ml-auto">
                    <User className="w-3 h-3" /> {author}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setActivePrompt(prompt)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>

                <Button size="sm" variant="outline" onClick={() => handleStartEdit(prompt)}>
                  <Edit className="w-3.5 h-3.5 mr-1 text-slate-600" /> Edit
                </Button>
                
                {isPending && (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange(prompt.id!, "APPROVED")}
                      disabled={isProcessing === prompt.id}
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>

                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleStatusChange(prompt.id!, "REJECTED")}
                      disabled={isProcessing === prompt.id}
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </>
                )}

                {isApproved && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-amber-500 text-amber-600 hover:bg-amber-50"
                    onClick={() => handleStatusChange(prompt.id!, "PENDING")}
                    disabled={isProcessing === prompt.id}
                  >
                    <Undo2 className="w-3.5 h-3.5 mr-1" /> Unpublish
                  </Button>
                )}

                {isRejected && (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange(prompt.id!, "APPROVED")}
                      disabled={isProcessing === prompt.id}
                    >
                      <Check className="w-4 h-4 mr-1" /> Re-Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(prompt.id!)}
                      disabled={isProcessing === prompt.id}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border shadow-sm p-6 overflow-hidden">
      <h3 className="text-2xl font-bold font-serif text-gvsuBlue mb-6">Prompt Library Moderation</h3>
      
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full max-w-md bg-slate-100 p-1 mb-6">
          <TabsTrigger value="PENDING" className="flex-1 text-xs">Pending ({pendingPrompts.length})</TabsTrigger>
          <TabsTrigger value="APPROVED" className="flex-1 text-xs">Approved ({approvedPrompts.length})</TabsTrigger>
          <TabsTrigger value="REJECTED" className="flex-1 text-xs">Rejected ({rejectedPrompts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="PENDING" className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">{renderPromptList(pendingPrompts)}</ScrollArea>
        </TabsContent>
        <TabsContent value="APPROVED" className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">{renderPromptList(approvedPrompts)}</ScrollArea>
        </TabsContent>
        <TabsContent value="REJECTED" className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">{renderPromptList(rejectedPrompts)}</ScrollArea>
        </TabsContent>
      </Tabs>

      {/* VIEW PROMPT MODAL */}
      <PromptDetailModal
        isOpen={!!activePrompt}
        onClose={() => setActivePrompt(null)}
        prompt={activePrompt}
      />

      {/* ADMIN EDIT DIALOG */}
      <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prompt Submission</DialogTitle>
            <DialogDescription>
              Modify prompt details before approving or publishing to the public library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Target AI Model</Label>
                <Select
                  value={editFormData.targetModel}
                  onValueChange={(val) => setEditFormData((prev) => ({ ...prev, targetModel: val }))}
                >
                  <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Primary Category</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(val) => setEditFormData((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Associated AI Tool</Label>
              <Select
                value={editFormData.associatedToolId}
                onValueChange={(val) => setEditFormData((prev) => ({ ...prev, associatedToolId: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Tool" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / No Tool</SelectItem>
                  {tools?.map((t) => (
                    <SelectItem key={t.id} value={t.id!}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Prompt Template</Label>
              <Textarea
                rows={6}
                className="font-mono text-sm"
                value={editFormData.promptTemplate}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, promptTemplate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingPrompt(null)}>Cancel</Button>
            <Button className="bg-gvsuBlue hover:bg-gvsuBlue/90" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

