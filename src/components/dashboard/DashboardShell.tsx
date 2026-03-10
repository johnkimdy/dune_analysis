"use client";

import { useState } from "react";
import Link from "next/link";
import { SummaryCards } from "./SummaryCards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { ExchangeBreakdown } from "./ExchangeBreakdown";
import { StablecoinBreakdown } from "./StablecoinBreakdown";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { RefreshIndicator } from "./RefreshIndicator";
import { useResizeDebounce } from "@/hooks/useResizeDebounce";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const dashboardData = useDashboardData();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const isResizing = useResizeDebounce();

  const data = dashboardData?.data ?? null;
  const error = dashboardData?.error ?? null;
  const isLoading = dashboardData?.isLoading ?? true;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: "#faf8f5" }}>
      {/* Refresh bar - right below navbar */}
      {dashboardData && (
        <div className="flex items-center justify-end mb-6 -mt-2">
          <RefreshIndicator
            lastUpdated={dashboardData.lastUpdated}
            isLoading={dashboardData.isLoading}
            onRefreshNow={dashboardData.refreshNow}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
          <span className="font-medium">Error loading data: </span>{error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !data && (
        <div className="flex items-center justify-center py-32 text-[var(--muted)]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm">Fetching on-chain data from Dune...</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              This may take up to a minute on first load
            </p>
          </div>
        </div>
      )}

      {data && (
      <div className="space-y-6 animate-chart-blur-in">
        <div
          className={cn(
            "transition-all duration-300",
            isResizing && "blur-sm opacity-60"
          )}
        >
          <SummaryCards data={data.summary} />
        </div>
        <div
          onMouseEnter={() => setHoveredSection("chart")}
          onMouseLeave={() => setHoveredSection(null)}
          className={cn(
            "transition-all duration-300",
            (isResizing ||
              (hoveredSection && hoveredSection !== "chart")) &&
              "blur-sm opacity-60 pointer-events-none"
          )}
        >
          <TimeSeriesChart data={data.timeSeries} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            onMouseEnter={() => setHoveredSection("exchange")}
            onMouseLeave={() => setHoveredSection(null)}
            className={cn(
              "transition-all duration-300",
              (isResizing ||
                (hoveredSection && hoveredSection !== "exchange")) &&
                "blur-sm opacity-60 pointer-events-none"
            )}
          >
            <ExchangeBreakdown data={data.byExchange} />
          </div>
          <div
            onMouseEnter={() => setHoveredSection("stablecoin")}
            onMouseLeave={() => setHoveredSection(null)}
            className={cn(
              "transition-all duration-300",
              (isResizing ||
                (hoveredSection && hoveredSection !== "stablecoin")) &&
                "blur-sm opacity-60 pointer-events-none"
            )}
          >
            <StablecoinBreakdown data={data.byStablecoin} />
          </div>
        </div>

        {/* Link to Charts for more indicators */}
        <div
          className={cn(
            "border-t border-[var(--border)] pt-6",
            "transition-all duration-300",
            isResizing && "blur-sm opacity-60"
          )}
        >
          <Link
            href="/charts"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all charts & indicators →
          </Link>
          <p className="text-xs text-[var(--muted)] mt-1">
            Reserve Level, Substitution Ratio, Counterparty, DeFi, Cross-Chain, Whale Alerts
          </p>
        </div>
      </div>
      )}
    </div>
  );
}

export function DashboardShell() {
  return <DashboardContent />;
}
