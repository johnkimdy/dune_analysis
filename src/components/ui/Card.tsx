"use client";

import { QueryTooltip } from "./QueryTooltip";
import { ProductBadges } from "./ProductBadges";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  sql?: string;
  signal?: string;
  products?: string[];
  children: React.ReactNode;
  className?: string;
  /** When true, hide the title (e.g. when chart is embedded and button shows title) */
  hideTitle?: boolean;
  /** Small timeframe caption at bottom, e.g. "(7D, hourly)" or "(last updated: ...)" */
  timeframe?: string;
}

export function Card({
  title,
  sql,
  signal,
  products,
  children,
  className = "",
  hideTitle = false,
  timeframe,
}: CardProps) {
  const showHeader = (title && !hideTitle) || sql || products;
  return (
    <div
      className={cn(
        "bg-[var(--card)] border border-[var(--border)] rounded-none p-4 sm:p-6",
        "transition-[border-color,box-shadow,transform] duration-300 ease-out",
        "hover:border-[var(--border-muted)] hover:shadow-lg hover:shadow-black/20",
        "hover:-translate-y-0.5",
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {title && !hideTitle && (
              <h3 className="text-sm font-medium text-[var(--secondary)] uppercase tracking-wider whitespace-nowrap">
                {title}
              </h3>
            )}
            {products && <ProductBadges products={products} />}
          </div>
          {sql && <QueryTooltip sql={sql} />}
        </div>
      )}
      {signal && (
        <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed border-l-2 border-[var(--border)] pl-3">
          {signal}
        </p>
      )}
      {children}
      {timeframe && (
        <p className="mt-2 text-[10px] text-[var(--muted)] text-right">
          {timeframe}
        </p>
      )}
    </div>
  );
}
