import { cn } from "@/lib/cn";

function SkeletonBar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200",
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-card", className)}>
      <SkeletonBar className="mb-3 h-5 w-3/4" />
      <SkeletonBar className="mb-2 h-4 w-1/2" />
      <SkeletonBar className="mb-4 h-3 w-full" />
      <SkeletonBar className="mb-2 h-3 w-full" />
      <SkeletonBar className="h-3 w-2/3" />
    </div>
  );
}

function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <SkeletonBar className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonBar className="h-4 w-1/4" />
          <SkeletonBar className="h-4 w-1/3" />
          <SkeletonBar className="h-4 w-1/6" />
          <SkeletonBar className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}

export { SkeletonBar, SkeletonCard, SkeletonTable };
