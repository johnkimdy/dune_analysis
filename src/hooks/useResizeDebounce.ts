"use client";

import { useState, useEffect, useRef } from "react";

const RESIZE_DEBOUNCE_MS = 280;

/**
 * Detects window resize and debounces "resize complete".
 * Returns true while the user is actively resizing (e.g. dragging window, rotating device).
 * Use to blur cards during resize and only recalculate chart dimensions after settling.
 */
export function useResizeDebounce() {
  const [isResizing, setIsResizing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onResize = () => {
      setIsResizing(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsResizing(false);
        timeoutRef.current = null;
      }, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return isResizing;
}
