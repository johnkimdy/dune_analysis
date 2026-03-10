"use client";

import { useState, useEffect, useRef } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AccordionItem } from "@/components/ui/Accordion";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { ExchangeBreakdown } from "@/components/dashboard/ExchangeBreakdown";
import { StablecoinBreakdown } from "@/components/dashboard/StablecoinBreakdown";
import { ReserveLevel } from "@/components/dashboard/ReserveLevel";
import { WhaleAlerts } from "@/components/dashboard/WhaleAlerts";
import { SubstitutionRatio } from "@/components/dashboard/SubstitutionRatio";
import { CounterpartyBreakdown } from "@/components/dashboard/CounterpartyBreakdown";
import { DefiOutflow } from "@/components/dashboard/DefiOutflow";
import { CrossChainFlow } from "@/components/dashboard/CrossChainFlow";
import { RefreshIndicator } from "@/components/dashboard/RefreshIndicator";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { cn } from "@/lib/utils";

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

type IndicatorId =
  | "netFlow"
  | "exchange"
  | "stablecoin"
  | "reserve"
  | "substitution"
  | "counterparty"
  | "defi"
  | "crossChain"
  | "whale"
  | "reference";

/** Plus icon that rotates 135deg to X when expanded */
function PlusToXIcon({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 w-6 h-6 items-center justify-center transition-transform duration-300 ease-out",
        expanded && "rotate-[135deg]"
      )}
      aria-hidden
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <line x1="7" y1="2" x2="7" y2="12" />
        <line x1="2" y1="7" x2="12" y2="7" />
      </svg>
    </span>
  );
}

/** OCI-style indicator row: large title, +/X icon, description when expanded */
function IndicatorRow({
  id,
  label,
  description,
  selected,
  onSelect,
  innerRef,
}: {
  id: IndicatorId;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  innerRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left px-6 py-5 border-b border-[var(--border)]/60 transition-all flex items-start gap-4",
        "hover:bg-[var(--card)]/60",
        selected &&
          "bg-[var(--card)] border-l-4 border-l-[var(--accent)] pl-[calc(1.5rem-4px)]"
      )}
    >
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-semibold tracking-tight transition-colors",
            "text-lg sm:text-xl md:text-2xl lg:text-3xl",
            selected ? "text-[var(--accent)]" : "text-[var(--primary)]"
          )}
        >
          {label}
        </div>
        {description && selected && (
          <p className="mt-2 text-sm text-[var(--secondary)] line-clamp-2 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 text-[var(--muted)] mt-1",
          selected && "text-[var(--accent)]"
        )}
      >
        <PlusToXIcon expanded={selected} />
      </span>
    </button>
  );
}

function ChartsContent() {
  const { t } = useI18n();
  const { data, error, isLoading, lastUpdated, refreshNow } = useAutoRefresh();
  const [selectedId, setSelectedId] = useState<IndicatorId>("netFlow");
  const indicatorRefs = useRef<Partial<Record<IndicatorId, HTMLButtonElement | null>>>({});

  // Scroll selected indicator to top of viewport (smooth)
  useEffect(() => {
    const el = indicatorRefs.current[selectedId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedId]);

  const renderChart = () => {
    if (!data) return null;
    switch (selectedId) {
      case "netFlow":
        return <TimeSeriesChart data={data.timeSeries} />;
      case "exchange":
        return <ExchangeBreakdown data={data.byExchange} />;
      case "stablecoin":
        return <StablecoinBreakdown data={data.byStablecoin} />;
      case "reserve":
        return <ReserveLevel data={data.reserveRows} />;
      case "substitution":
        return <SubstitutionRatio data={data.substitutionRows} />;
      case "counterparty":
        return <CounterpartyBreakdown data={data.counterpartyRows} />;
      case "defi":
        return <DefiOutflow data={data.defiOutflowRows} />;
      case "crossChain":
        return <CrossChainFlow data={data.crossChainRows} />;
      case "whale":
        return <WhaleAlerts data={data.whaleRows} />;
      case "reference":
        return (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-none p-4">
            <h3 className="text-sm font-medium text-[var(--secondary)] uppercase tracking-wider mb-3">
              {t("dashboard.refTitle")}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--secondary)]">
                    <th className="pb-2 pr-2">{t("dashboard.refIndex")}</th>
                    <th className="pb-2 pr-2">{t("dashboard.refProducts")}</th>
                    <th className="pb-2">{t("dashboard.refDescription")}</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--secondary)]">
                  {INDEX_KEYS.map((key) => (
                    <tr
                      key={key}
                      className="border-b border-[var(--border)]/50 hover:bg-[var(--card)] transition-colors"
                    >
                      <td className="py-2 pr-2 font-medium text-[var(--primary)] whitespace-nowrap">
                        {t(`index.${key}`)}
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex flex-wrap gap-1">
                          {INDEX_PRODUCTS[key].map((p) => (
                            <span
                              key={p}
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full border",
                                PRODUCT_COLORS[p] ||
                                  "bg-slate-500/20 text-slate-400"
                              )}
                            >
                              {t(`product.${p}`)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-[10px] text-[var(--muted)]">
                        {t(`indexDesc.${key}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const IndicatorButton = ({
    id,
    label,
    description,
  }: {
    id: IndicatorId;
    label: string;
    description?: string;
  }) => (
    <IndicatorRow
      id={id}
      label={label}
      description={description}
      selected={selectedId === id}
      onSelect={() => setSelectedId(id)}
      innerRef={(el) => {
        indicatorRefs.current[id] = el;
      }}
    />
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      {/* Full-width header */}
      <header className="shrink-0 flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-6 lg:p-8 border-b border-[var(--border)] bg-[var(--card)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--primary)]">
            Charts & Indicators
          </h1>
          <p className="text-sm text-[var(--secondary)] mt-0.5">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <RefreshIndicator
            lastUpdated={lastUpdated}
            isLoading={isLoading}
            onRefreshNow={refreshNow}
          />
          <LanguageToggle />
        </div>
      </header>

      {/* OCI-style 5.5/4.5 layout: Indicators left, Chart right */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: Indicators — 55%, BIG typography like OCI */}
        <aside className="flex-[5.5] min-w-0 flex flex-col border-r border-[var(--border)] overflow-y-auto scroll-smooth">
          <div className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-6">
              Our Indicators
            </h2>
            <div className="space-y-0">
              <AccordionItem id="acc-flow" title="Flow & Volume" defaultOpen>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton
                    id="netFlow"
                    label={t("index.netFlow")}
                    description={t("chart.timeSeriesSignal")}
                  />
                  {selectedId === "netFlow" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                  <IndicatorButton
                    id="exchange"
                    label={t("chart.exchangeTitle")}
                    description={t("chart.exchangeSignal")}
                  />
                  {selectedId === "exchange" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                  <IndicatorButton
                    id="stablecoin"
                    label={t("chart.stablecoinTitle")}
                    description={t("chart.stablecoinSignal")}
                  />
                  {selectedId === "stablecoin" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                </div>
              </AccordionItem>

              <AccordionItem id="acc-reserve" title={t("index.reserve")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton
                    id="reserve"
                    label={t("index.reserve")}
                    description={t("chart.reserveSignal")}
                  />
                  {selectedId === "reserve" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                </div>
              </AccordionItem>

              <AccordionItem id="acc-substitution" title={t("index.substitution")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton
                    id="substitution"
                    label={t("index.substitution")}
                    description={t("chart.substitutionSignal")}
                  />
                  {selectedId === "substitution" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                </div>
              </AccordionItem>

              <AccordionItem id="acc-counterparty" title={t("index.counterparty")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton
                    id="counterparty"
                    label={t("index.counterparty")}
                    description={t("chart.counterpartySignal")}
                  />
                  {selectedId === "counterparty" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                </div>
              </AccordionItem>

              <AccordionItem id="acc-defi" title="DeFi & Cross-Chain">
                <div className="space-y-0 -mx-2">
                  <IndicatorButton
                    id="defi"
                    label={t("index.defi")}
                    description={t("chart.defiSignal")}
                  />
                  {selectedId === "defi" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                  <IndicatorButton
                    id="crossChain"
                    label={t("index.crossChain")}
                    description={t("chart.crossChainSignal")}
                  />
                  {selectedId === "crossChain" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                </div>
              </AccordionItem>

              <AccordionItem id="acc-whale" title={t("index.whale")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton
                    id="whale"
                    label={t("index.whale")}
                    description={t("chart.whaleSignal")}
                  />
                  {selectedId === "whale" && data && (
                    <div className="lg:hidden mx-2 my-4 min-h-[280px] [&_.recharts-wrapper]:!max-h-[320px] animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                </div>
              </AccordionItem>

              <AccordionItem id="acc-reference" title={t("dashboard.refTitle")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton id="reference" label={t("dashboard.refTitle")} />
                  {selectedId === "reference" && data && (
                    <div className="lg:hidden mx-2 my-4 animate-chart-blur-in">
                      {renderChart()}
                    </div>
                  )}
                </div>
              </AccordionItem>
            </div>
          </div>
        </aside>

        {/* Right: Chart — 45% (hidden on mobile; chart shown inline in indicator list) */}
        <main className="hidden lg:flex flex-[4.5] min-w-0 flex-col bg-[var(--card)]/40 overflow-auto">
          <div className="p-4 md:p-5 lg:p-6 flex flex-col min-h-full">
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
                <span className="font-medium">Error loading data: </span>
                {error}
              </div>
            )}

            {isLoading && !data && (
              <div className="flex-1 flex items-center justify-center py-16 text-[var(--muted)]">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm">Fetching on-chain data from Dune...</p>
                </div>
              </div>
            )}

            {data && (
              <div
                key={selectedId}
                className="flex-1 min-h-0 [&_.recharts-wrapper]:!max-h-[420px] [&_.recharts-surface]:overflow-visible animate-chart-blur-in"
              >
                {renderChart()}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export function ChartsShell() {
  return (
    <I18nProvider>
      <ChartsContent />
    </I18nProvider>
  );
}
