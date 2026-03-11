"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  id,
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <button
        id={`accordion-btn-${id}`}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-3 md:px-4 md:py-3.5 text-left",
          "text-base md:text-lg font-semibold text-[var(--primary)]",
          "hover:bg-[var(--card)] transition-colors",
          open && "bg-[var(--card)]"
        )}
        aria-expanded={open}
        aria-controls={`accordion-${id}`}
      >
        {title}
        <svg
          className={cn(
            "w-3 h-3 text-[var(--muted)] transition-transform duration-200",
            open && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        id={`accordion-${id}`}
        role="region"
        aria-labelledby={`accordion-btn-${id}`}
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-3 pb-3 pt-1 md:px-4 md:pb-4">{children}</div>
      </div>
    </div>
  );
}
