import { QueryTooltip } from "./QueryTooltip";
import { ProductBadges } from "./ProductBadges";

interface CardProps {
  title?: string;
  sql?: string;
  signal?: string;
  products?: string[];
  children: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  sql,
  signal,
  products,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6 ${className}`}
    >
      {(title || sql || products) && (
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {title && (
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {title}
              </h3>
            )}
            {products && <ProductBadges products={products} />}
          </div>
          {sql && <QueryTooltip sql={sql} />}
        </div>
      )}
      {signal && (
        <p className="text-xs text-slate-500 mb-4 leading-relaxed border-l-2 border-[#2a2a3e] pl-3">
          {signal}
        </p>
      )}
      {children}
    </div>
  );
}
