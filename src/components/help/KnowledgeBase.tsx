import { useState } from "react";
import { Search, Book, FileText, Settings, ShieldCheck, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const KNOWLEDGE_CATEGORIES = [
  {
    title: "Getting Started",
    icon: <Book className="w-5 h-5" />,
    articles: [
      { q: "What is the LakerAI Directory?", a: "The LakerAI Directory is GVSU's central hub for discovering, vetting, and requesting AI tools for academic and professional use." },
      { q: "Who can use the directory?", a: "All active GVSU students, faculty, and staff with a valid @gvsu.edu or @mail.gvsu.edu email address." }
    ]
  },
  {
    title: "Finding AI Tools",
    icon: <Search className="w-5 h-5" />,
    articles: [
      { q: "How do I filter tools by compliance?", a: "Use the tags on the left side of the dashboard to filter by FERPA compliance, PII safety, and Institutional Status." },
      { q: "What does 'Community Discovery' mean?", a: "These are tools that have been submitted by the community but have not yet undergone a full institutional audit." }
    ]
  },
  {
    title: "Submitting & Reporting",
    icon: <ShieldCheck className="w-5 h-5" />,
    articles: [
      { q: "How do I submit a new tool?", a: "Navigate to your Dashboard and click the 'Recommend Tool' button. Fill out the application and submit it for review." },
      { q: "How do I report incorrect information?", a: "Click the 'Report a Mistake' button found on any tool card or in the site header. Admins will review the report and make necessary changes." }
    ]
  },
  {
    title: "Account & Settings",
    icon: <Settings className="w-5 h-5" />,
    articles: [
      { q: "How do I change the theme?", a: "Go to the Settings page from the sidebar menu to toggle between Light, Dark, or System themes." },
      { q: "How can I check my reports?", a: "Navigate to the 'Your Reports' page via the sidebar menu to see the status of any mistakes you have reported." }
    ]
  }
];

export function KnowledgeBase() {
  const [search, setSearch] = useState("");

  const filteredCategories = KNOWLEDGE_CATEGORIES.map(category => ({
    ...category,
    articles: category.articles.filter(article => 
      article.q.toLowerCase().includes(search.toLowerCase()) || 
      article.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(category => category.articles.length > 0);

  return (
    <div className="space-y-8">
      <div className="relative max-w-xl mx-auto mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input 
          placeholder="Search for answers..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 bg-white dark:bg-slate-800 rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm text-base"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            No articles found for "{search}".
          </div>
        ) : (
          filteredCategories.map((category, idx) => (
            <Card key={idx} className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gvsuBlue/10 text-gvsuBlue dark:text-sky-400 rounded-lg">
                  {category.icon}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">{category.title}</h3>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {category.articles.map((article, i) => (
                  <AccordionItem value={`item-${idx}-${i}`} key={i} className="border-b-0 border-t border-slate-100 dark:border-slate-700">
                    <AccordionTrigger className="text-left font-medium text-sm text-slate-700 dark:text-slate-300 hover:text-gvsuBlue dark:hover:text-sky-400 transition-colors py-3">
                      {article.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                      {article.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          ))
        )}
      </div>
      
      <div className="mt-12 p-6 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center text-center">
        <Mail className="w-8 h-8 text-gvsuBlue dark:text-sky-400 mb-3" />
        <h4 className="font-bold text-slate-900 dark:text-slate-50 mb-1">Still need help?</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
          If you couldn't find what you were looking for, try asking our AI Support Assistant or submit a request on the Community Feedback board.
        </p>
      </div>
    </div>
  );
}
