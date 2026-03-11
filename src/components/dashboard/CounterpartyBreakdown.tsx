"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { DebouncedChartContainer } from "@/components/ui/DebouncedChartContainer";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { formatUSD } from "@/lib/utils";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import type { CounterpartyRow } from "@/lib/types";

interface Props {
  data: CounterpartyRow[];
  hideTitle?: boolean;
  timeframe?: string;
}

const REGION_COLORS: Record<string, string> = {
  US: "#3b82f6",
  International: "#a855f7",
  "DeFi / Unknown": "#f59e0b",
};

export function CounterpartyBreakdown({ data, hideTitle, timeframe }: Props) {
  const { t } = useI18n();
  const isCompact = useMediaQuery("(max-width: 639px)");

  // Aggregate by region and direction
  const regionMap = new Map<
    string,
    { inflow: number; outflow: number }
  >();

  for (const row of data) {
    const entry = regionMap.get(row.region) || { inflow: 0, outflow: 0 };
    if (row.direction === "inflow") {
      entry.inflow += row.total_usd;
    } else {
      entry.outflow += row.total_usd;
    }
    regionMap.set(row.region, entry);
  }

  const chartData = Array.from(regionMap.entries()).map(
    ([region, vals]) => ({
      region,
      inflow: Math.round(vals.inflow),
      outflow: Math.round(vals.outflow),
    })
  );

  // Top counterparty exchanges
  const topExchanges = data
    .filter((r) => r.counterparty !== "DeFi / Unknown")
    .sort((a, b) => b.total_usd - a.total_usd)
    .slice(0, 10);

  return (
    <Card
      title={t("chart.counterpartyTitle")}
      hideTitle={hideTitle}
      timeframe={timeframe}
      sql={QUERY_SQL_MAP["Counterparty Exchange Breakdown"]}
      signal={t("chart.counterpartySignal")}
      products={["Exchange", "Custody"]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 flex flex-col">
          <p className="text-xs text-[var(--muted)] mb-2 flex-shrink-0">{t("chart.byRegion")}</p>
          <DebouncedChartContainer className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="region"
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: isCompact ? 9 : 11 }}
                tickFormatter={(v: number) => formatUSD(v)}
                width={isCompact ? 48 : 70}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              <Bar
                dataKey="inflow"
                name={t("chart.inflow")}
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="outflow"
                name={t("chart.outflow")}
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          </DebouncedChartContainer>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)] mb-2">
            {t("chart.topCounterparties")}
          </p>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {topExchanges.map((row, i) => (
              <div
                key={`${row.counterparty}-${row.direction}-${i}`}
                className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[var(--card)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      row.direction === "inflow"
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="text-[var(--secondary)]">{row.counterparty}</span>
                  <span
                    className="text-[var(--muted)]"
                    style={{ color: REGION_COLORS[row.region] }}
                  >
                    {row.region}
                  </span>
                </div>
                <span className="font-mono text-[var(--secondary)]">
                  {formatUSD(row.total_usd)}
                </span>
              </div>
            ))}
            {topExchanges.length === 0 && (
              <p className="text-[var(--muted)] text-center py-4">
                {t("chart.noData")}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
