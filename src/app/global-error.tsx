"use client";

import { useEffect } from "react";
import { ShieldAlert, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught error:", error);
  }, [error]);

  const isPermissionError =
    error.name === "FirebaseError" ||
    error.message?.includes("Missing or insufficient permissions");

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-lg shadow-xl p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#0032A0]">
              Grand Valley State University • LakerAI Directory
            </div>
            <h1 className="text-2xl font-bold text-[#0032A0]">
              {isPermissionError ? "Security Rule Permission Error" : "Critical Application Error"}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isPermissionError
                ? "A database operation was blocked by Firestore Security Rules. Please ensure you are signed in with a verified @gvsu.edu or @mail.gvsu.edu account."
                : "A critical error occurred while loading the application. Please try again or return to the home directory."}
            </p>
          </div>

          {error.message && (
            <details className="text-left bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
              <summary className="cursor-pointer font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Diagnostic Details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] max-h-48 overflow-y-auto">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-md bg-[#0032A0] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" /> Try Again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Home className="w-3.5 h-3.5 mr-2" /> Return to Directory
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
