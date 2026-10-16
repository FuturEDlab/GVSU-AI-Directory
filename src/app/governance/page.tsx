"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import {
  PILLAR_METADATA,
  TAG_DEFINITIONS,
  GovernancePillarId,
} from "@/app/lib/tag-definitions";
import { TagBadge } from "@/components/TagBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  BookOpen,
  Scale,
  Coins,
  Search,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PILLAR_ICONS: Record<GovernancePillarId, typeof ShieldCheck> = {
  security_privacy: ShieldCheck,
  pedagogical_value: BookOpen,
  ethics_stewardship: Scale,
  access_cost: Coins,
};

export default function GovernanceGuidePage() {
  const [selectedPillar, setSelectedPillar] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allTags = useMemo(() => Object.values(TAG_DEFINITIONS), []);

  const filteredTags = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allTags.filter((tag) => {
      const matchesPillar =
        selectedPillar === "all" || tag.categoryPillar === selectedPillar;
      const matchesQuery =
        !q ||
        tag.label.toLowerCase().includes(q) ||
        tag.shortDefinition.toLowerCase().includes(q) ||
        tag.facultyImpact.toLowerCase().includes(q) ||
        tag.pillarLabel.toLowerCase().includes(q);
      return matchesPillar && matchesQuery;
    });
  }, [allTags, selectedPillar, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-[#0F172A]">
      <GVSUHeader />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 pt-8 pb-16 space-y-14">
        {/* Hero / Header Banner */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-gvsuBlue font-bold tracking-wider text-xs uppercase h-10 px-3 -ml-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Discovery Hub
              </Button>
            </Link>
            <a
              href="https://www.gvsu.edu/ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gvsuBlue hover:underline"
            >
              Official GVSU AI Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="max-w-3xl space-y-4">
            <Badge className="bg-gvsuBlue/10 text-gvsuBlue border border-gvsuBlue/20 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Institutional Evaluation Methodology
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans font-extrabold tracking-tight text-[#0F172A] leading-tight">
              GVSU AI Governance &amp; 4-Pillar Grading Guide
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Every tool listed in the <strong className="text-[#0F172A]">LakerAI Directory</strong> is evaluated across four institutional pillars on a <strong className="text-gvsuBlue">1 to 5 rubric</strong>. This guide explains how scores, risk ratings, and compliance tags are determined so GVSU faculty and students can adopt AI responsibly.
            </p>
          </div>
        </section>

        {/* Section 1: The 4 Evaluation Pillars & 1–5 Grading Rubric */}
        <section id="pillars" className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue">
              Part 1 · Core Evaluation Framework
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-[#0F172A]">
              The 4 Evaluation Pillars &amp; 1–5 Grading Rubric
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
              Each published tool receives a 1–5 score in four distinct governance dimensions. Below is the rubric used during automated and human administrative review.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(Object.keys(PILLAR_METADATA) as GovernancePillarId[]).map((key) => {
              const pillar = PILLAR_METADATA[key];
              const Icon = PILLAR_ICONS[key];
              return (
                <Card
                  key={pillar.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col"
                >
                  <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gvsuBlue">
                          <Icon className="w-4 h-4" />
                          <span>Pillar · {pillar.id.replace("_", " & ")}</span>
                        </div>
                        <CardTitle className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[#0F172A]">
                          {pillar.title}
                        </CardTitle>
                        <p className="text-xs font-semibold text-slate-500">
                          {pillar.subtitle}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-gvsuBlue text-white text-xs font-bold shrink-0">
                        1–5 Scale
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>

                    <div className="space-y-2.5 pt-2 mt-auto">
                      <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                            Score 5 / 5 · Exemplary Institutional Alignment
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {pillar.rubric.score5}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                            Score 3 / 5 · Conditional / Standard Precautions
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {pillar.rubric.score3}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-red-50/70 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-red-900">
                            Score 1 / 5 · High Risk / Unverified
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {pillar.rubric.score1}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Section 2: Risk Rating Thresholds */}
        <section id="risk-thresholds" className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue">
              Part 2 · Directory Risk Classifications
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-[#0F172A]">
              Risk Rating Thresholds
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
              To help faculty make quick decisions while browsing the directory, each card displays a composite Risk Rating badge derived from its 4-Pillar Alignment Scorecard and health status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-bigLake/20 text-[#0A1931] border border-bigLake/60 px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-md shadow-none">
                  <ShieldCheck className="w-4 h-4 text-gvsuBlue" />
                  Low Risk
                </Badge>
                <span className="text-xs font-bold text-slate-500">Avg Score 4.0 – 5.0</span>
              </div>
              <h3 className="text-lg font-sans font-bold text-[#0F172A]">
                Safe for Standard Classroom &amp; Faculty Use
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tools earning an average score of <strong>4.0 or higher</strong> across the 4 Pillars. They offer strong privacy controls, clear academic utility, and accessible free or institutional tiers. Standard FERPA rules still apply unless explicitly marked <em>GVSU Walled Garden</em>.
              </p>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-archway/30 text-[#5C3A21] border border-archway px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-md shadow-none">
                  <AlertTriangle className="w-4 h-4 text-carillonBrick" />
                  Moderate Risk
                </Badge>
                <span className="text-xs font-bold text-slate-500">Avg Score 2.8 – 3.9</span>
              </div>
              <h3 className="text-lg font-sans font-bold text-[#0F172A]">
                Use with Syllabus Guidance &amp; Privacy Opt-Outs
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tools scoring between <strong>2.8 and 3.9</strong>. They may default to public galleries (e.g., consumer image generators), require paid subscriptions after a trial, or require manual source verification. Instructors should provide clear assignment guidelines.
              </p>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-carillonBrick text-white border border-carillonBrick px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-md shadow-none">
                  <ShieldAlert className="w-4 h-4" />
                  High Risk
                </Badge>
                <span className="text-xs font-bold text-slate-500">Avg Score &lt; 2.8 or Flagged</span>
              </div>
              <h3 className="text-lg font-sans font-bold text-[#0F172A]">
                Restricted · Do Not Input Institutional or Student Data
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tools scoring below <strong>2.8</strong> or flagged as <em>At Risk</em> by governance moderators due to invasive data harvesting, unmitigated hallucinations, or security vulnerabilities. Not recommended for required student coursework.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 3: Interactive Compliance Tag Glossary */}
        <section id="tag-glossary" className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue">
              Part 3 · Interactive Tag Dictionary
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-[#0F172A]">
              Compliance &amp; Capability Tag Glossary
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
              Hover over or tap any tag badge across the directory to inspect its definition. Use the filter bar below to browse all {allTags.length} official tags and see which Governance Pillar they support.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {[
                  { id: "all", label: "All Pillars" },
                  { id: "security_privacy", label: "Security & Privacy" },
                  { id: "pedagogical_value", label: "Pedagogical Value" },
                  { id: "ethics_stewardship", label: "Ethics & Stewardship" },
                  { id: "access_cost", label: "Access & Cost" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedPillar(tab.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border",
                      selectedPillar === tab.id
                        ? "bg-gvsuBlue text-white border-gvsuBlue"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-gvsuBlue hover:text-gvsuBlue"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search tags (e.g. FERPA, PII Safe, Free)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-lg border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filteredTags.map((tag) => (
                <div
                  key={tag.label}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-gvsuBlue/40 transition-colors flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <TagBadge tag={tag.label} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {tag.pillarLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {tag.shortDefinition}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-200/80 flex items-start gap-1.5 text-[11px] text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gvsuBlue shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">Faculty Impact:</strong> {tag.facultyImpact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <GVSUFooter />
    </div>
  );
}
