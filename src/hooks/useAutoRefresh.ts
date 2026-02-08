"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { REFRESH_INTERVAL_MS } from "@/lib/constants";
import type { DashboardData, ApiResponse } from "@/lib/types";

export function useAutoRefresh() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    REFRESH_INTERVAL_MS / 1000
  );
  const lastFetchTime = useRef<number>(0);

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
      lastFetchTime.current = Date.now();
      setSecondsUntilRefresh(REFRESH_INTERVAL_MS / 1000);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastFetchTime.current;
      const remaining = Math.max(
        0,
        Math.ceil((REFRESH_INTERVAL_MS - elapsed) / 1000)
      );
      setSecondsUntilRefresh(remaining);

      if (remaining === 0) {
        fetchData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    secondsUntilRefresh,
    lastUpdated: data?.lastUpdated ?? null,
    refreshNow: fetchData,
  };
}
