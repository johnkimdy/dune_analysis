"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

const CHART_RESIZE_DEBOUNCE_MS = 280;

/**
 * Wraps chart content and only updates dimensions after resize settles.
 * Prevents janky redraws while the user is resizing the window or rotating the device.
 */
export function DebouncedChartContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMeasure = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;

      if (width <= 0 || height <= 0) return;

      if (isFirstMeasure.current) {
        isFirstMeasure.current = false;
        setDimensions({ width, height });
        return;
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setDimensions({ width, height });
        timeoutRef.current = null;
      }, CHART_RESIZE_DEBOUNCE_MS);
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%" }}
    >
      <div
        className="transition-none"
        style={{
          width: dimensions ? `${dimensions.width}px` : "100%",
          height: dimensions ? `${dimensions.height}px` : "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
