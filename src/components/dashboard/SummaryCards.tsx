"use client";

import { Card } from "@/components/ui/Card";
import { formatUSD, formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { SummaryData } from "@/lib/types";

export function SummaryCards({ data }: { data: SummaryData }) {
  const { t } = useI18n();

  const cards = [
    {
      title: t("summary.totalInflow"),
      value: formatUSD(data.totalInflow),
      color: "text-green-400",
      sub: t("summary.intoKorean"),
    },
    {
      title: t("summary.totalOutflow"),
      value: formatUSD(data.totalOutflow),
      color: "text-red-400",
      sub: t("summary.outOfKorean"),
    },
    {
      title: t("summary.netFlow"),
      value: formatUSD(data.netFlow),
      color: data.netFlow >= 0 ? "text-green-400" : "text-red-400",
      sub: data.netFlow >= 0 ? t("summary.netInflow") : t("summary.netOutflow"),
    },
    {
      title: t("summary.transactions"),
      value: formatNumber(data.totalTransactions),
      color: "text-blue-400",
      sub: t("summary.totalTransfers"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <p className="text-sm text-slate-400 mb-1">{card.title}</p>
          <p className={`text-2xl font-bold font-mono ${card.color}`}>
            {card.value}
          </p>
          <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
        </Card>
      ))}
    </div>
  );
}
