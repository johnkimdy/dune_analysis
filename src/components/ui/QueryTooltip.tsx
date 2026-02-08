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
        className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
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
        <div className="absolute right-0 top-8 z-50 w-[500px] max-h-[400px] overflow-auto bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg shadow-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              SQL Query
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-300 text-xs"
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
