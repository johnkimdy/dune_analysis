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
import { formatUSD, parseDuneTimestamp, formatDayLabel } from "@/lib/utils";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import type { DefiOutflowRow } from "@/lib/types";

interface Props {
  data: DefiOutflowRow[];
  hideTitle?: boolean;
  timeframe?: string;
}

export function DefiOutflow({ data, hideTitle, timeframe }: Props) {
  const { t } = useI18n();
  const isCompact = useMediaQuery("(max-width: 639px)");

  const dayMap = new Map<
    string,
    { defi: number; exchanges: number }
  >();

  for (const row of data) {
    const entry = dayMap.get(row.day) || { defi: 0, exchanges: 0 };
    if (row.destination === "DeFi / Wallets") {
      entry.defi = row.volume_usd;
    } else {
      entry.exchanges = row.volume_usd;
    }
    dayMap.set(row.day, entry);
  }

  const chartData = Array.from(dayMap.entries())
    .sort(
      (a, b) =>
        parseDuneTimestamp(a[0]).getTime() - parseDuneTimestamp(b[0]).getTime()
    )
    .map(([day, vals]) => ({
      day: formatDayLabel(day),
      "DeFi / Wallets": Math.round(vals.defi),
      "Other Exchanges": Math.round(vals.exchanges),
    }));

  return (
    <Card
      title={t("chart.defiTitle")}
      hideTitle={hideTitle}
      timeframe={timeframe}
      sql={QUERY_SQL_MAP["DeFi Outflow Tracking"]}
      signal={t("chart.defiSignal")}
      products={["Staking", "Lending"]}
    >
      <DebouncedChartContainer className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
              tickFormatter={(v: number) => formatUSD(v)}
              width={isCompact ? 50 : 80}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Area
              type="monotone"
              dataKey="DeFi / Wallets"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Other Exchanges"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </DebouncedChartContainer>
    </Card>
  );
}
