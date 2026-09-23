'use client';

import { Skeleton } from "@/components/ui/skeleton";

export function AdminTabSkeleton() {
  return (
    <div className="flex-1 flex gap-8 min-h-0 animate-pulse">
      {/* Sidebar list skeleton */}
      <aside className="w-[380px] flex flex-col gap-4 shrink-0">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-4 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main detail card skeleton */}
      <section className="flex-1 flex flex-col min-h-0">
        <div className="bg-white border border-slate-200 rounded-3xl flex flex-col flex-1 p-8 space-y-6">
          <div className="flex justify-between items-center pb-6 border-b">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
