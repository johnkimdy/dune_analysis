import { QueryTooltip } from "./QueryTooltip";

interface CardProps {
  title?: string;
  sql?: string;
  signal?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  sql,
  signal,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6 ${className}`}
    >
      {(title || sql) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              {title}
            </h3>
          )}
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
