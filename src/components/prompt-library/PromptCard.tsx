import { useState } from "react";
import { PromptSubmission } from "@/app/lib/prompt-types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Tag, User, Wrench, Copy, CheckCircle2 } from "lucide-react";

interface PromptCardProps {
  prompt: PromptSubmission;
  onClick: () => void;
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const title = prompt.title || prompt.promptName;
  const model = prompt.targetModel || prompt.model;
  const authorDisplay = prompt.authorName || prompt.submittedByEmail?.split("@")[0] || "Community";
  const promptTemplateText = prompt.promptTemplate || prompt.promptText;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promptTemplateText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card 
      className="flex flex-col h-full hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200/80 dark:border-slate-800 hover:border-gvsu-blue/40 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-lg font-bold font-serif group-hover:text-gvsu-blue transition-colors">
            {title}
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-slate-400 hover:text-gvsu-blue hover:bg-gvsu-blue/10"
            title="Copy prompt text"
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <CardDescription className="line-clamp-2 text-xs text-muted-foreground min-h-[2.5rem]">
          {prompt.description || promptTemplateText}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="flex items-center gap-1 bg-gvsu-blue/10 text-gvsu-blue text-[10px] font-semibold">
            <Bot className="w-3 h-3" />
            {model}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
            <Tag className="w-3 h-3" />
            {prompt.category}
          </Badge>
          {prompt.associatedToolName && (
            <Badge variant="outline" className="flex items-center gap-1 text-[10px] border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
              <Wrench className="w-3 h-3" />
              {prompt.associatedToolName}
            </Badge>
          )}
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {prompt.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
            {prompt.tags.length > 3 && (
              <span className="text-[10px] font-mono text-muted-foreground px-1 py-0.5">
                +{prompt.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{authorDisplay}</span>
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-7 px-2 font-semibold text-gvsu-blue hover:text-gvsu-blue/80 hover:bg-transparent p-0">
          View Prompt &rarr;
        </Button>
      </CardFooter>
    </Card>
  );
}

