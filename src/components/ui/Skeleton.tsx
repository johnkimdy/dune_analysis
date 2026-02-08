export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#1a1a2e] rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
