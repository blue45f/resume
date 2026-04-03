export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="h-5 shimmer rounded w-3/4 mb-3" />
      <div className="h-4 shimmer rounded w-1/2 mb-2" />
      <div className="h-3 shimmer rounded w-1/3 mb-3" />
      <div className="flex gap-2">
        <div className="h-7 shimmer rounded-lg flex-1" />
        <div className="h-7 shimmer rounded-lg flex-1" />
        <div className="h-7 shimmer rounded-lg w-14" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="h-3 shimmer rounded w-12 mb-2" />
          <div className="h-7 shimmer rounded w-16 mb-1" />
          <div className="h-2 shimmer rounded w-10" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 shimmer rounded w-1/3" />
      <div className="h-10 shimmer rounded" />
      <div className="h-10 shimmer rounded" />
      <div className="h-10 shimmer rounded" />
      <div className="h-32 shimmer rounded" />
    </div>
  );
}
