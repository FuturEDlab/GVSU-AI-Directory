"use client";

import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";

export function GVSUFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-200">
          {/* Institutional Lockup */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex flex-col">
              <span className="font-sans font-bold text-xl sm:text-2xl tracking-tight uppercase text-gvsuBlue">
                Grand Valley State University
              </span>
              <span className="text-slate-600 text-xs font-bold uppercase tracking-[0.16em] mt-1">
                (Unofficial) LakerAI Institutional Directory
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
              Empowering GVSU faculty, staff, and students with transparent AI tool evaluations, 4-pillar governance scorecards, and community-vetted pedagogical prompts.
            </p>
          </div>

          {/* Directory Navigation */}
          <div className="md:col-span-3 space-y-2.5">
            <h3 className="font-sans text-sm uppercase font-bold text-slate-900 tracking-wider">
              Directory Navigation
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-gvsuBlue transition-colors">
                  Discovery Hub
                </Link>
              </li>
              <li>
                <Link href="/governance" className="hover:text-gvsuBlue transition-colors font-semibold text-gvsuBlue">
                  Governance &amp; 4-Pillar Guide
                </Link>
              </li>
              <li>
                <Link href="/prompt-library" className="hover:text-gvsuBlue transition-colors">
                  Community Prompt Library
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-gvsuBlue transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-gvsuBlue transition-colors">
                  Help &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/help/changelog" className="hover:text-gvsuBlue transition-colors">
                  Release Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* GVSU Institutional Resources */}
          <div className="md:col-span-4 space-y-2.5">
            <h3 className="font-sans text-sm uppercase font-bold text-slate-900 tracking-wider">
              University AI &amp; Governance Resources
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/governance#tag-glossary" className="hover:text-gvsuBlue transition-colors">
                  Compliance Tag Glossary
                </Link>
              </li>
              <li>
                <a
                  href="https://www.gvsu.edu/ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gvsuBlue transition-colors inline-flex items-center gap-1.5"
                >
                  GVSU AI Hub <ExternalLink className="w-3.5 h-3.5 opacity-75" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gvsu.edu/it/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gvsuBlue transition-colors inline-flex items-center gap-1.5"
                >
                  GVSU Information Technology <ExternalLink className="w-3.5 h-3.5 opacity-75" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gvsu.edu/ftlc/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gvsuBlue transition-colors inline-flex items-center gap-1.5"
                >
                  Pew Faculty Teaching &amp; Learning Center <ExternalLink className="w-3.5 h-3.5 opacity-75" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gvsu.edu/identity/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gvsuBlue transition-colors inline-flex items-center gap-1.5"
                >
                  GVSU Brand &amp; Identity Standards <ExternalLink className="w-3.5 h-3.5 opacity-75" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gvsuBlue shrink-0" />
            <span>FERPA &amp; Institutional Stewardship Audited · Grand Valley State University</span>
          </div>
          <p className="text-slate-500">
            © {new Date().getFullYear()} Grand Valley State University · LakerAI Hub
          </p>
        </div>
      </div>
    </footer>
  );
}
