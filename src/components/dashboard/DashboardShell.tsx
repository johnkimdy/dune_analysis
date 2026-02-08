"use client";

import { useState, useMemo } from "react";
import { generateMockDashboardData } from "@/lib/mock-data";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { SummaryCards } from "./SummaryCards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { ExchangeBreakdown } from "./ExchangeBreakdown";
import { StablecoinBreakdown } from "./StablecoinBreakdown";
import { ReserveLevel } from "./ReserveLevel";
import { WhaleAlerts } from "./WhaleAlerts";
import { SubstitutionRatio } from "./SubstitutionRatio";
import { CounterpartyBreakdown } from "./CounterpartyBreakdown";
import { DefiOutflow } from "./DefiOutflow";
import { CrossChainFlow } from "./CrossChainFlow";
import { Card } from "@/components/ui/Card";

const INDEX_KEYS = [
  "netFlow",
  "reserve",
  "whale",
  "substitution",
  "counterparty",
  "defi",
  "crossChain",
] as const;

const INDEX_PRODUCTS: Record<string, string[]> = {
  netFlow: ["Exchange", "Custody"],
  reserve: ["Exchange", "Custody", "Lending"],
  whale: ["Exchange", "Custody"],
  substitution: ["Exchange", "Lending"],
  counterparty: ["Exchange", "Custody"],
  defi: ["Staking", "Lending"],
  crossChain: ["Exchange", "Staking"],
};

const PRODUCT_COLORS: Record<string, string> = {
  Exchange: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Staking: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Lending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Custody: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

function DashboardContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { t } = useI18n();

  const data = useMemo(() => generateMockDashboardData(), [refreshKey]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-6 lg:p-8">
      <LanguageToggle />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 pr-20">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {t("dashboard.title")}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs">{t("dashboard.mockNotice")}</span>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-3 py-1 rounded-md bg-[#1a1a2e] border border-[#2a2a3e]
                       text-slate-300 hover:bg-[#2a2a3e] transition-colors text-xs"
          >
            {t("dashboard.regenerate")}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <SummaryCards data={data.summary} />
        <TimeSeriesChart data={data.timeSeries} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExchangeBreakdown data={data.byExchange} />
          <StablecoinBreakdown data={data.byStablecoin} />
        </div>

        {/* ─── Cross-Product Indices ─── */}
        <div className="border-t border-[#2a2a3e] pt-6">
          <h2 className="text-lg font-semibold text-white mb-1">
            {t("dashboard.crossProductTitle")}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            {t("dashboard.crossProductSub")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReserveLevel data={data.reserveRows} />
          <SubstitutionRatio data={data.substitutionRows} />
        </div>

        <CounterpartyBreakdown data={data.counterpartyRows} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DefiOutflow data={data.defiOutflowRows} />
          <CrossChainFlow data={data.crossChainRows} />
        </div>

        <WhaleAlerts data={data.whaleRows} />

        {/* ─── Cross-Product Index Reference Table ─── */}
        <Card title={t("dashboard.refTitle")}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a3e] text-left text-slate-400">
                  <th className="pb-3 pr-4">{t("dashboard.refIndex")}</th>
                  <th className="pb-3 pr-4">{t("dashboard.refProducts")}</th>
                  <th className="pb-3">{t("dashboard.refDescription")}</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {INDEX_KEYS.map((key) => (
                  <tr
                    key={key}
                    className="border-b border-[#2a2a3e]/50 hover:bg-[#1a1a2e] transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-200 whitespace-nowrap">
                      {t(`index.${key}`)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {INDEX_PRODUCTS[key].map((p) => (
                          <span
                            key={p}
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              PRODUCT_COLORS[p] ||
                              "bg-slate-500/20 text-slate-400"
                            }`}
                          >
                            {t(`product.${p}`)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-xs text-slate-400">
                      {t(`indexDesc.${key}`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function DashboardShell() {
  return (
    <I18nProvider>
      <DashboardContent />
    </I18nProvider>
  );
}
