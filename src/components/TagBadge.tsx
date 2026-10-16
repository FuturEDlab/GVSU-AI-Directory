"use client";

import { useState } from "react";
import { CheckCircle2, Info, ShieldCheck, BookOpen, Scale, Coins } from "lucide-react";
import { getTagDefinition, GovernancePillarId } from "@/app/lib/tag-definitions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TagBadgeProps {
  tag: string;
  className?: string;
}

const PILLAR_BADGE_STYLES: Record<GovernancePillarId, string> = {
  security_privacy: "bg-[#0032A0]/8 border-[#0032A0]/25 text-[#0032A0] hover:bg-[#0032A0]/15",
  ethics_stewardship: "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80",
  pedagogical_value: "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200/70",
  access_cost: "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/70",
};

const PILLAR_ICON: Record<GovernancePillarId, typeof ShieldCheck> = {
  security_privacy: ShieldCheck,
  pedagogical_value: BookOpen,
  ethics_stewardship: Scale,
  access_cost: Coins,
};

export function TagBadge({ tag, className }: TagBadgeProps) {
  const [open, setOpen] = useState(false);
  const def = getTagDefinition(tag);
  const Icon = PILLAR_ICON[def.categoryPillar] || Info;
  const isSecurityOrVetted =
    def.categoryPillar === "security_privacy" ||
    tag.includes("Laker Green") ||
    tag.includes("Vetted");

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-testid={`tag-badge-${def.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
            aria-label={`${def.label}: ${def.shortDefinition}`}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-tight border transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-gvsuBlue/40",
              PILLAR_BADGE_STYLES[def.categoryPillar],
              className
            )}
          >
            {isSecurityOrVetted ? (
              <CheckCircle2 className="w-3 h-3 shrink-0 text-current opacity-85" />
            ) : (
              <Icon className="w-3 h-3 shrink-0 text-current opacity-75" />
            )}
            <span>{def.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          sideOffset={6}
          data-testid="tag-tooltip-content"
          className="z-50 max-w-[290px] p-3.5 rounded-xl bg-[#0A1931] text-white border border-white/15 shadow-xl text-left font-sans space-y-2"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-1.5">
            <span className="font-bold text-xs text-white">{def.label}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0032A0] text-[#0ECBF0]">
              {def.pillarLabel}
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {def.shortDefinition}
          </p>
          <div className="pt-1 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-slate-300">
            <span className="line-clamp-2">{def.facultyImpact}</span>
          </div>
          <div className="pt-0.5">
            <Link
              href="/governance#tag-glossary"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-bold uppercase tracking-wider text-[#0ECBF0] hover:underline inline-flex items-center gap-1"
            >
              View Governance Rubric &rarr;
            </Link>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
