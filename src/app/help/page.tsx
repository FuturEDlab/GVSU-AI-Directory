"use client";

import { useState } from "react";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeBase } from "@/components/help/KnowledgeBase";
import { AISupportTab } from "@/components/help/AISupportTab";
import { CommunityFeedbackTab } from "@/components/help/CommunityFeedbackTab";

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState("knowledge-base");

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col transition-colors duration-200 font-sans">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-10 px-4 sm:px-8 max-w-5xl flex flex-col">
        <header className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue dark:text-linkBlue block mb-1">
            LakerAI Assistance &amp; Governance
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#0F172A] dark:text-white font-bold tracking-tight">
            Help &amp; Support
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm sm:text-base">
            Explore our institutional knowledge base, ask the LakerAI support assistant, or submit feedback to the governance team.
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-slate-200/70 dark:bg-slate-800 p-1.5 grid grid-cols-1 sm:grid-cols-3 h-auto sm:h-13 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 mb-6 gap-1">
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
