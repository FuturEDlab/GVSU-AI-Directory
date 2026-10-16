"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ToolSubmission } from "@/app/lib/tool-types";
import { INITIAL_SEED_TOOLS } from "@/app/lib/seed-tools";
import { ToolCard } from "@/components/ToolCard";
import { ToolCommunityPrompts } from "@/components/tools/ToolCommunityPrompts";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ToolPage() {
  const params = useParams();
  const toolId = params?.toolId as string;
  const router = useRouter();
  const seedMatch = INITIAL_SEED_TOOLS.find(
    (t) => t.id === toolId || t.id === `${toolId}-seed` || t.id.replace(/-seed$/, "") === toolId
  );

  const [tool, setTool] = useState<ToolSubmission | null>(() =>
    seedMatch
      ? ({
          ...seedMatch,
          submitterEmail: "vanharkj@mail.gvsu.edu",
          submitterId: "admin-seed",
        } as unknown as ToolSubmission)
      : null
  );
  const [loading, setLoading] = useState(!seedMatch);
  const [error, setError] = useState<string | null>(null);

  useAuth();

  useEffect(() => {
    async function fetchTool() {
      if (!toolId) return;
      try {
        const toolRef = doc(db, "tools_published", toolId);
        const docSnap = await getDoc(toolRef);

        if (docSnap.exists()) {
          setTool({ id: docSnap.id, ...docSnap.data() } as ToolSubmission);
        } else if (seedMatch) {
          setTool({
            ...seedMatch,
            submitterEmail: "vanharkj@mail.gvsu.edu",
            submitterId: "admin-seed",
          } as unknown as ToolSubmission);
        } else {
          setError("Tool not found. It may have been removed or never existed.");
        }
      } catch (err) {
        console.error("Error fetching tool:", err);
        if (seedMatch) {
          setTool({
            ...seedMatch,
            submitterEmail: "vanharkj@mail.gvsu.edu",
            submitterId: "admin-seed",
          } as unknown as ToolSubmission);
        } else {
          setError("Unable to load the tool right now. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchTool();
  }, [toolId, seedMatch]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <GVSUHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-8 pt-10 sm:pt-12 pb-20 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 text-slate-600 hover:text-gvsuBlue font-bold tracking-wider text-xs uppercase min-h-[44px] px-3 -ml-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Discovery Hub
        </Button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-gvsuBlue" />
            <p className="font-semibold text-sm">Loading institutional scorecard...</p>
          </div>
        ) : error || !tool ? (
          <div className="bg-carillonBrick/10 border border-carillonBrick/30 rounded-2xl p-8 text-center max-w-lg mx-auto mt-10">
            <AlertTriangle className="w-12 h-12 text-carillonBrick mx-auto mb-4" />
            <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Tool Not Found
            </h2>
            <p className="text-slate-700 mb-6 text-sm">{error}</p>
            <Button onClick={() => router.push("/")} className="bg-gvsuBlue hover:bg-midnight text-white font-bold">
              Return to Discovery Hub
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ToolCard tool={tool} variant="detail" />
            <ToolCommunityPrompts toolId={toolId} toolTitle={tool.title} />
          </div>
        )}
      </main>

      <GVSUFooter />
    </div>
  );
}
