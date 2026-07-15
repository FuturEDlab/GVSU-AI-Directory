
"use client";

import { ToolTags, TAG_OPTIONS } from "@/app/lib/tool-types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface TaggerProps {
  tags: ToolTags;
  onChange: (tags: ToolTags) => void;
}

export function Tagger({ tags, onChange }: TaggerProps) {
  const { user } = useAuth();
  const isAdmin = user?.email === "indrajis@mail.gvsu.edu";

  const handleToggle = (category: keyof ToolTags, option: string) => {
    const current = tags[category] || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    
    onChange({ ...tags, [category]: updated });
  };

  const isRestricted = (option: string) => {
    return !isAdmin && (option === "GVSU Sanctioned" || option === "FERPA Compliant");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border">
      {Object.entries(TAG_OPTIONS).map(([category, options]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-[10px] font-bold text-gvsuBlue uppercase tracking-widest border-b pb-1">
            {category.replace("_", " & ")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const checked = (tags[category as keyof ToolTags] || []).includes(option);
              const restricted = isRestricted(option);
              
              return (
                <div 
                  key={option} 
                  className={cn(
                    "flex items-center space-x-2 px-2 py-1 rounded bg-white border shadow-sm transition-all",
                    restricted && "opacity-50 grayscale cursor-not-allowed",
                    checked && "border-gvsuBlue ring-1 ring-gvsuBlue/20"
                  )}
                >
                  <Checkbox 
                    id={`${category}-${option}`}
                    checked={checked}
                    disabled={restricted}
                    onCheckedChange={() => handleToggle(category as keyof ToolTags, option)}
                  />
                  <Label 
                    htmlFor={`${category}-${option}`}
                    className={cn(
                      "text-[10px] font-medium cursor-pointer",
                      restricted && "cursor-not-allowed"
                    )}
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
