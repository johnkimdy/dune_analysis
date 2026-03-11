"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { DebouncedChartContainer } from "@/components/ui/DebouncedChartContainer";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { parseDuneTimestamp, formatDayLabel } from "@/lib/utils";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import type { SubstitutionRow } from "@/lib/types";

interface Props {
  data: SubstitutionRow[];
  hideTitle?: boolean;
  timeframe?: string;
}

export function SubstitutionRatio({ data, hideTitle, timeframe }: Props) {
  const { t } = useI18n();
  const isCompact = useMediaQuery("(max-width: 639px)");

  // Pivot by day, show USDC vs USDT volumes
  const dayMap = new Map<string, { USDC: number; USDT: number }>();

  for (const row of data) {
    const entry = dayMap.get(row.day) || { USDC: 0, USDT: 0 };
    if (row.symbol === "USDC") entry.USDC = row.total_volume;
    if (row.symbol === "USDT") entry.USDT = row.total_volume;
    dayMap.set(row.day, entry);
  }

  const chartData = Array.from(dayMap.entries())
    .sort(
      (a, b) =>
        parseDuneTimestamp(a[0]).getTime() - parseDuneTimestamp(b[0]).getTime()
    )
    .map(([day, vals]) => {
      const total = vals.USDC + vals.USDT || 1;
      return {
        day: formatDayLabel(day),
        USDC_pct: Math.round((vals.USDC / total) * 10000) / 100,
        USDT_pct: Math.round((vals.USDT / total) * 10000) / 100,
      };
    });

  return (
    <Card
      title={t("chart.substitutionTitle")}
      hideTitle={hideTitle}
      timeframe={timeframe}
      products={["Exchange", "Lending"]}
      sql={QUERY_SQL_MAP["Stablecoin Substitution Ratio"]}
      signal={t("chart.substitutionSignal")}
    >
      <DebouncedChartContainer className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            stackOffset="expand"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="day"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: isCompact ? 9 : 11 }}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              width={isCompact ? 40 : undefined}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Area
              type="monotone"
              dataKey="USDC_pct"
              name="USDC %"
              stackId="1"
              stroke="#2775ca"
              fill="#2775ca"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="USDT_pct"
              name="USDT %"
              stackId="1"
              stroke="#50af95"
              fill="#50af95"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </DebouncedChartContainer>
    </Card>
  );
}
