"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardData, ApiResponse } from "@/lib/types";

export function useAutoRefresh() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stablecoin-flows");
      const json: ApiResponse<DashboardData> = await res.json();
      if (json.error) {
        setError(json.error);
      } else if (json.data) {
        setData(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch once on mount. Data is cached server-side for 24 hours via ISR,
  // so this call is always cheap after the daily cron pre-warms the cache.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    lastUpdated: data?.lastUpdated ?? null,
    refreshNow: fetchData,
  };
}
