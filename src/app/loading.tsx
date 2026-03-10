import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="h-8 w-80 bg-[var(--card)] rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-[var(--card)] rounded animate-pulse" />
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    </div>
  );
}
