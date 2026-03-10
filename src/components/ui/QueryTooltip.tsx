"use client";

import { useState, useRef, useEffect } from "react";

interface QueryTooltipProps {
  sql: string;
}

export function QueryTooltip({ sql }: QueryTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors p-1 rounded"
        title="View SQL query"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-[500px] max-h-[400px] overflow-auto bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">
              SQL Query
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--muted)] hover:text-[var(--accent)] text-xs transition-colors"
            >
              Close
            </button>
          </div>
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
            {sql.trim()}
          </pre>
        </div>
      )}
    </div>
  );
}
