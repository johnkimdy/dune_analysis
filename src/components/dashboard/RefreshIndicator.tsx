"use client";

import { format } from "date-fns";

interface RefreshIndicatorProps {
  lastUpdated: string | null;
  secondsUntilRefresh: number;
  isLoading: boolean;
  onRefreshNow: () => void;
}

export function RefreshIndicator({
  lastUpdated,
  secondsUntilRefresh,
  isLoading,
  onRefreshNow,
}: RefreshIndicatorProps) {
  const minutes = Math.floor(secondsUntilRefresh / 60);
  const seconds = secondsUntilRefresh % 60;

  return (
    <div className="flex items-center gap-4 text-sm text-slate-400">
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
                  ? format(new Date(lastUpdated), "HH:mm:ss")
                  : "---"
              }`}
        </span>
      </div>

      {!isLoading && (
        <span className="font-mono text-xs text-slate-500">
          Next refresh in {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      )}

      <button
        onClick={onRefreshNow}
        disabled={isLoading}
        className="px-3 py-1 rounded-md bg-[#1a1a2e] border border-[#2a2a3e]
                   text-slate-300 hover:bg-[#2a2a3e] transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed text-xs"
      >
        Refresh Now
      </button>
    </div>
  );
}
