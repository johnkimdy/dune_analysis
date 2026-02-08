"use client";

import { useI18n } from "@/lib/i18n";

const PRODUCT_COLORS: Record<string, string> = {
  Exchange: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Staking: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Lending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Custody: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export function ProductBadges({ products }: { products: string[] }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap gap-1">
      {products.map((p) => (
        <span
          key={p}
          className={`text-[10px] px-1.5 py-0.5 rounded-full border leading-none ${
            PRODUCT_COLORS[p] || "bg-slate-500/20 text-slate-400"
          }`}
        >
          {t(`product.${p}`)}
        </span>
      ))}
    </div>
  );
}
