"use client";

import { format } from "date-fns";

interface RefreshIndicatorProps {
  lastUpdated: string | null;
  isLoading: boolean;
  onRefreshNow: () => void;
}

export function RefreshIndicator({
  lastUpdated,
  isLoading,
  onRefreshNow,
}: RefreshIndicatorProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-[var(--secondary)]">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"
          }`}
        />
        <span>
          {isLoading
            ? "Fetching data..."
            : `Last updated: ${
                lastUpdated
                  ? format(new Date(lastUpdated), "MMM d, yyyy HH:mm")
                  : "---"
              }`}
        </span>
      </div>

      {!isLoading && (
        <span className="text-xs text-[var(--muted)]">
          Updates daily at midnight UTC
        </span>
      )}

      <button
        onClick={onRefreshNow}
        disabled={isLoading}
        className="px-3 py-1.5 rounded-md bg-[var(--card)] border border-[var(--border)]
                   text-[var(--secondary)] hover:bg-[var(--border-muted)] hover:border-[var(--accent)]/50
                   hover:text-[var(--accent)] transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed text-xs"
      >
        Refresh
      </button>
    </div>
  );
}
