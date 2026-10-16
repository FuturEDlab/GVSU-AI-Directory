"use client";

import { useState } from "react";
import Link from "next/link";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeBase } from "@/components/help/KnowledgeBase";
import { AISupportTab } from "@/components/help/AISupportTab";
import { CommunityFeedbackTab } from "@/components/help/CommunityFeedbackTab";
import { ShieldCheck, ArrowRight, BookOpen } from "lucide-react";

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState("knowledge-base");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col transition-colors duration-200 font-sans">
      <GVSUHeader />
      <main className="flex-1 container mx-auto pt-10 sm:pt-12 pb-16 px-4 sm:px-8 max-w-5xl flex flex-col">
        <header className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue block mb-1">
            LakerAI Assistance &amp; Governance
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans text-[#0F172A] font-bold tracking-tight">
            Help &amp; Support
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Explore our institutional knowledge base, ask the LakerAI support assistant, or submit feedback to the governance team.
          </p>

          <div className="mt-6 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gvsuBlue/10 text-gvsuBlue flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-sans text-sm sm:text-base font-bold text-[#0F172A]">
                  Looking for the 4-Pillar Grading Rubric &amp; Compliance Tag Glossary?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Learn how GVSU scores tools on Security &amp; Privacy, Pedagogical Value, Ethics &amp; Stewardship, and Access &amp; Cost.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/governance"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[40px] rounded-lg bg-gvsuBlue hover:bg-midnight text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Governance Guide
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-slate-200/70 p-1.5 grid grid-cols-1 sm:grid-cols-3 h-auto sm:h-13 rounded-xl border border-slate-200 shrink-0 mb-6 gap-1">
            <TabsTrigger
              value="knowledge-base"
              className="rounded-lg data-[state=active]:bg-gvsuBlue data-[state=active]:text-white font-bold text-xs uppercase tracking-wider min-h-[40px] transition-all"
            >
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger
              value="ai-support"
              className="rounded-lg data-[state=active]:bg-gvsuBlue data-[state=active]:text-white font-bold text-xs uppercase tracking-wider min-h-[40px] transition-all"
            >
              AI Support Assistant
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="rounded-lg data-[state=active]:bg-gvsuBlue data-[state=active]:text-white font-bold text-xs uppercase tracking-wider min-h-[40px] transition-all"
            >
              Community Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge-base" className="flex-1 outline-none">
            <KnowledgeBase />
          </TabsContent>

          <TabsContent value="ai-support" className="flex-1 outline-none flex flex-col h-[600px]">
            <AISupportTab />
          </TabsContent>

          <TabsContent value="feedback" className="flex-1 outline-none">
            <CommunityFeedbackTab />
          </TabsContent>
        </Tabs>
      </main>
      <GVSUFooter />
    </div>
  );
}
