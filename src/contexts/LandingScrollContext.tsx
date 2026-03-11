"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface LandingScrollContextValue {
  scrollRange: number | null;
  setScrollRange: (value: number) => void;
}

const LandingScrollContext = createContext<LandingScrollContextValue | null>(null);

export function LandingScrollProvider({ children }: { children: React.ReactNode }) {
  const [scrollRange, setScrollRange] = useState<number | null>(null);
  return (
    <LandingScrollContext.Provider value={{ scrollRange, setScrollRange }}>
      {children}
    </LandingScrollContext.Provider>
  );
}

export function useLandingScroll() {
  return useContext(LandingScrollContext);
}
