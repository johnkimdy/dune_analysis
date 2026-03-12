"use client";

import { useState, useEffect, useRef } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n";
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
import { format } from "date-fns";

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
        "inline-flex shrink-0 w-5 h-5 md:w-6 md:h-6 items-center justify-center transition-transform duration-300 ease-out",
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

/** Indicator row: slim, smaller font than category headers; click toggles chart open/closed */
function IndicatorRow({
  id,
  label,
  selected,
  onSelect,
  innerRef,
}: {
  id: IndicatorId;
  label: string;
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
        "w-full text-left px-3 py-2 md:px-5 md:py-2.5 border-b border-[var(--border)]/60 transition-all flex items-center gap-2 md:gap-3",
        "hover:bg-[var(--card)]/60",
        selected &&
          "bg-[var(--card)] border-l-4 border-l-[var(--accent)] pl-[calc(0.75rem-4px)] md:pl-[calc(1.25rem-4px)]"
      )}
    >
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-medium tracking-tight transition-colors",
            "text-xs md:text-sm",
            selected ? "text-[var(--accent)]" : "text-[var(--primary)]"
          )}
        >
          {label}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 text-[var(--muted)]",
          selected && "text-[var(--accent)]"
        )}
      >
        <PlusToXIcon expanded={selected} />
      </span>
    </button>
  );
}

const NAVBAR_HEIGHT_CSS_VAR = "--charts-navbar-height";

function ChartsContent() {
  const { t } = useI18n();
  const { data, error, isLoading, lastUpdated, refreshNow } = useAutoRefresh();
  const [selectedId, setSelectedId] = useState<IndicatorId | null>("netFlow");
  const indicatorRefs = useRef<Partial<Record<IndicatorId, HTMLButtonElement | null>>>({});

  // Measure navbar height dynamically for sticky chart positioning
  useEffect(() => {
    const syncNavbarHeight = () => {
      const nav = document.querySelector("nav");
      if (nav) {
        const h = nav.getBoundingClientRect().height;
        document.documentElement.style.setProperty(NAVBAR_HEIGHT_CSS_VAR, `${h}px`);
      }
    };
    syncNavbarHeight();
    const ro = new ResizeObserver(syncNavbarHeight);
    const nav = document.querySelector("nav");
    if (nav) ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  // Scroll so clicked button is at top (right below navbar/header)
  useEffect(() => {
    if (selectedId) {
      const el = indicatorRefs.current[selectedId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedId]);

  const lastUpdatedStr =
    lastUpdated && format(new Date(lastUpdated), "MMM d, HH:mm");

  const renderChart = (forId?: IndicatorId | null) => {
    if (!data) return null;
    const id = forId ?? selectedId;
    if (id === null) return null;
    const embed = { hideTitle: true };
    switch (id) {
      case "netFlow":
        return (
          <TimeSeriesChart
            data={data.timeSeries}
            {...embed}
            timeframe="(7D, hourly)"
          />
        );
      case "exchange":
        return (
          <ExchangeBreakdown
            data={data.byExchange}
            {...embed}
            timeframe="(7D)"
          />
        );
      case "stablecoin":
        return (
          <StablecoinBreakdown
            data={data.byStablecoin}
            {...embed}
            timeframe={
              lastUpdatedStr ? `(last updated: ${lastUpdatedStr})` : undefined
            }
          />
        );
      case "reserve":
        return (
          <ReserveLevel
            data={data.reserveRows}
            {...embed}
            timeframe="(7D)"
          />
        );
      case "substitution":
        return (
          <SubstitutionRatio
            data={data.substitutionRows}
            {...embed}
            timeframe="(7D)"
          />
        );
      case "counterparty":
        return (
          <CounterpartyBreakdown
            data={data.counterpartyRows}
            {...embed}
            timeframe="(7D)"
          />
        );
      case "defi":
        return (
          <DefiOutflow
            data={data.defiOutflowRows}
            {...embed}
            timeframe="(7D)"
          />
        );
      case "crossChain":
        return (
          <CrossChainFlow
            data={data.crossChainRows}
            {...embed}
            timeframe="(7D)"
          />
        );
      case "whale":
        return (
          <WhaleAlerts
            data={data.whaleRows}
            {...embed}
            timeframe={
              lastUpdatedStr ? `(last updated: ${lastUpdatedStr})` : undefined
            }
          />
        );
      case "reference":
        return (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-none p-4">
            <h3 className="text-sm font-medium text-[var(--secondary)] uppercase tracking-wider mb-3">
              {t("dashboard.refTitle")}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--secondary)]">
                    <th className="pb-2 pr-2 w-[20%] text-[10px]">{t("dashboard.refIndex")}</th>
                    <th className="pb-2 pr-2 w-[28%]">{t("dashboard.refProducts")}</th>
                    <th className="pb-2 w-[52%]">{t("dashboard.refDescription")}</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--secondary)]">
                  {INDEX_KEYS.map((key) => (
                    <tr
                      key={key}
                      className="border-b border-[var(--border)]/50 hover:bg-[var(--card)] transition-colors"
                    >
                      <td className="py-2 pr-2 font-medium text-[var(--primary)] w-[20%] text-[10px] leading-tight break-words">
                        {t(`index.${key}`)}
                      </td>
                      <td className="py-2 pr-2 w-[28%]">
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
                      <td className="py-2 text-[10px] text-[var(--muted)] w-[52%]">
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
  }: {
    id: IndicatorId;
    label: string;
  }) => (
    <IndicatorRow
      id={id}
      label={label}
      selected={selectedId === id}
      onSelect={() => setSelectedId((prev) => (prev === id ? null : id))}
      innerRef={(el) => {
        indicatorRefs.current[id] = el;
      }}
    />
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      {/* Full-width header — compact on mobile */}
      <header className="shrink-0 flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-6 lg:p-8 border-b border-[var(--border)] bg-[var(--card)]">
        <div>
          <h1 className="text-base md:text-xl font-bold text-[var(--primary)]">
            Charts & Indicators
          </h1>
          <p className="text-xs md:text-sm text-[var(--secondary)] mt-0.5">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <RefreshIndicator
            lastUpdated={lastUpdated}
            isLoading={isLoading}
            onRefreshNow={refreshNow}
          />
        </div>
      </header>

      {/* OCI-style 5.5/4.5 layout: Indicators left, Chart right */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: Indicators — 55%, expands on desktop so page scrolls; chart can stick */}
        <aside className="flex-[5.5] min-w-0 flex flex-col border-r border-[var(--border)] overflow-y-auto lg:overflow-visible scroll-smooth">
          <div className="p-3 md:p-6 lg:p-8">
            <h2 className="text-[10px] md:text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3 md:mb-6">
              Our Indicators
            </h2>
            <div className="space-y-0">
              <AccordionItem id="acc-flow" title="Flow & Volume" defaultOpen={false}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton id="netFlow" label={t("index.netFlow")} />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "netFlow"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "netFlow" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("netFlow")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <IndicatorButton
                    id="exchange"
                    label={t("chart.exchangeTitle")}
                  />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "exchange"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "exchange" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("exchange")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <IndicatorButton
                    id="stablecoin"
                    label={t("chart.stablecoinTitle")}
                  />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "stablecoin"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "stablecoin" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("stablecoin")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="acc-reserve" title={t("index.reserve")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton id="reserve" label={t("index.reserve")} />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "reserve"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "reserve" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("reserve")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="acc-substitution" title={t("index.substitution")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton
                    id="substitution"
                    label={t("index.substitution")}
                  />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "substitution"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "substitution" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("substitution")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="acc-counterparty" title={t("index.counterparty")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton
                    id="counterparty"
                    label={t("index.counterparty")}
                  />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "counterparty"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "counterparty" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("counterparty")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="acc-defi" title="DeFi & Cross-Chain">
                <div className="space-y-0 -mx-2">
                  <IndicatorButton id="defi" label={t("index.defi")} />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "defi"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "defi" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("defi")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <IndicatorButton
                    id="crossChain"
                    label={t("index.crossChain")}
                  />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "crossChain"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "crossChain" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("crossChain")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="acc-whale" title={t("index.whale")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton id="whale" label={t("index.whale")} />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "whale"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-0 sm:mx-2 my-4 min-h-[280px] w-full min-w-0 overflow-x-auto [&_.recharts-wrapper]:!max-h-[320px]">
                        {selectedId === "whale" && (
                          <div className="animate-chart-blur-in min-w-[300px]">
                            {renderChart("whale")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="acc-reference" title={t("dashboard.refTitle")}>
                <div className="space-y-0 -mx-2">
                  <IndicatorButton id="reference" label={t("dashboard.refTitle")} />
                  <div
                    className={cn(
                      "lg:hidden grid transition-[grid-template-rows] duration-300 ease-out",
                      selectedId === "reference"
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-2 my-4">
                        {selectedId === "reference" && (
                          <div className="animate-chart-blur-in">
                            {renderChart("reference")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>
            </div>
          </div>
        </aside>

        {/* Right: Chart — 45%, sticky below navbar (hidden on mobile; chart inline in indicator list) */}
        <main
          className="hidden lg:flex flex-[4.5] min-w-0 flex-col bg-[var(--card)]/40 overflow-auto shrink-0 self-start sticky"
          style={{ top: "var(--charts-navbar-height, 4rem)" }}
        >
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

            {data && selectedId && (
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
