import { Skeleton } from "./skeleton";

/** Generic page-level skeleton used by loading.tsx in each dashboard route */
export function PageSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        {/* Filter / search bar */}
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Table / card list */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {/* Table header */}
          <div className="flex gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200">
            {[140, 200, 100, 80, 80, 80].map((w, i) => (
              <Skeleton key={i} className={`h-3.5 w-${w === 80 ? 20 : w === 100 ? 24 : w === 140 ? 36 : 48}`} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-100 last:border-0">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Dashboard home skeleton — stats grid + quick actions */
export function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Inbox / chat skeleton */
export function InboxSkeleton() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Thread list */}
      <div className="w-80 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Message area */}
      <div className="flex-1 flex flex-col p-6 gap-4">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-96 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="space-y-2 items-end flex flex-col">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-80 rounded-xl" />
          </div>
        </div>
        <div className="mt-auto">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** CRM Kanban skeleton */
export function CrmSkeleton() {
  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-4 min-w-max">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="w-64 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-8 rounded-full" />
            </div>
            {Array.from({ length: 3 + (col % 2) }).map((_, row) => (
              <div key={row} className="rounded-xl border border-slate-200 p-4 space-y-2 bg-white">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
