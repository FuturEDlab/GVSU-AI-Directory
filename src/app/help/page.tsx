"use client";

import { useState } from "react";
import { GVSUHeader } from "@/components/GVSUHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeBase } from "@/components/help/KnowledgeBase";
import { AISupportTab } from "@/components/help/AISupportTab";
import { CommunityFeedbackTab } from "@/components/help/CommunityFeedbackTab";

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState("knowledge-base");

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col transition-colors duration-200">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-12 px-6 max-w-5xl flex flex-col">
        <header className="mb-10">
          <h2 className="text-4xl font-serif text-slate-900 dark:text-slate-50 font-black uppercase tracking-tight">Help & Support</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Get assistance, ask our AI, or submit feedback to the community.</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-slate-200/50 dark:bg-slate-800 p-1 flex h-14 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0 mb-6">
            <TabsTrigger value="knowledge-base" className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 font-bold text-xs uppercase tracking-wider h-full">Knowledge Base</TabsTrigger>
            <TabsTrigger value="ai-support" className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 font-bold text-xs uppercase tracking-wider h-full">AI Support Assistant</TabsTrigger>
            <TabsTrigger value="feedback" className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 font-bold text-xs uppercase tracking-wider h-full">Community Feedback</TabsTrigger>
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
    </div>
  );
}
