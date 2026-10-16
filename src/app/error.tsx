"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error Boundary caught error:", error);
  }, [error]);

  const isPermissionError =
    error.name === "FirebaseError" ||
    error.message?.includes("Missing or insufficient permissions");

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-lg shadow-lg p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-sans font-bold text-gvsuBlue">
            {isPermissionError ? "Institutional Access Restricted" : "Unexpected Application Error"}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isPermissionError
              ? "Your current session does not have sufficient permissions to complete this request. Please verify you are signed in with a verified GVSU email."
              : "An unexpected error occurred while rendering this view. You can try resetting the view or returning to the main directory."}
          </p>
        </div>

        {error.message && (
          <details className="text-left bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Diagnostic Details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] max-h-40 overflow-y-auto">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="bg-gvsuBlue hover:bg-gvsuBlue/90 text-white font-bold text-xs tracking-wider uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" /> Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="font-bold text-xs tracking-wider uppercase"
          >
            <Home className="w-3.5 h-3.5 mr-2" /> Return to Directory
          </Button>
        </div>
      </div>
    </div>
  );
}
