"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

type DashboardDataContextValue = ReturnType<typeof useAutoRefresh> | null;

const DashboardDataContext = createContext<DashboardDataContextValue>(null);

function DashboardDataFetcher({ children }: { children: ReactNode }) {
  const value = useAutoRefresh();
  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/dashboard") {
    return <DashboardDataFetcher>{children}</DashboardDataFetcher>;
  }
  return (
    <DashboardDataContext.Provider value={null}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DashboardDataContext);
}
