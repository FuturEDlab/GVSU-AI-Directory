
"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReportModal } from "./ReportModal";

/**
 * @file GlobalAIDisclaimer.tsx
 * @description A centered, floating disclaimer banner sitting above the World Radar ticker.
 * informs users of AI evaluation limits and provides an immediate reporting channel.
 */
export function GlobalAIDisclaimer() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDismissed = localStorage.getItem("laker_ai_disclaimer_dismissed");
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("laker_ai_disclaimer_dismissed", "true");
  };

  if (!mounted || !isVisible) return null;

  return (
    <div className="fixed bottom-[52px] left-0 right-0 z-40 px-4 pointer-events-none">
      <div className={cn(
        "max-w-3xl mx-auto mb-2 bg-amber-50 border border-amber-300 p-3 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-500 pointer-events-auto",
      )}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 hidden sm:block" />
          <p className="text-slate-800 font-medium text-[11px] sm:text-xs leading-tight text-center sm:text-left">
            ⚠️ AI Notice: Initial evaluations are generated automatically by AI and can make mistakes. Please review carefully. If you see any error, please report it immediately so our team can fix it.
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 shrink-0">
          <ReportModal />
          <Button 
            onClick={handleDismiss}
            className="bg-[#0032A0] text-white hover:bg-[#002270] font-bold px-3 py-1.5 h-8 rounded-lg text-xs transition-all shadow-sm"
          >
            Okay, Got It
          </Button>
        </div>
      </div>
    </div>
  );
}
