"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ToolSubmission } from "@/app/lib/tool-types";
import { ToolCard } from "@/components/ToolCard";
import { ToolCommunityPrompts } from "@/components/tools/ToolCommunityPrompts";
import { GVSUHeader } from "@/components/GVSUHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ToolPage() {
  const params = useParams();
  const toolId = params?.toolId as string;
  const router = useRouter();
  const [tool, setTool] = useState<ToolSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use auth context if it exists globally to trigger auth initialization
  useAuth();

  useEffect(() => {
    async function fetchTool() {
      if (!toolId) return;
      try {
        const toolRef = doc(db, "tools_published", toolId);
        const docSnap = await getDoc(toolRef);
        
        if (docSnap.exists()) {
          setTool({ id: docSnap.id, ...docSnap.data() } as ToolSubmission);
        } else {
          setError("Tool not found. It may have been removed or never existed.");
        }
      } catch (err) {
        console.error("Error fetching tool:", err);
        setError("Unable to load the tool right now. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchTool();
  }, [toolId]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <GVSUHeader />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="mb-8 text-slate-500 hover:text-gvsuBlue font-bold tracking-widest text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </Button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-gvsuBlue" />
            <p className="font-medium">Loading tool details...</p>
          </div>
        ) : error || !tool ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-lg mx-auto mt-10">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Tool Not Found</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/')} className="bg-gvsuBlue hover:bg-gvsuBlue/90">
              Return Home
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ToolCard tool={tool} />
            <ToolCommunityPrompts toolId={toolId} toolTitle={tool.title} />
          </div>
        )}
      </main>
    </div>
  );
}

