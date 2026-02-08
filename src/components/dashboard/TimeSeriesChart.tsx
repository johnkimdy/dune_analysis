"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { formatUSD } from "@/lib/utils";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import type { TimeSeriesPoint } from "@/lib/types";

export function TimeSeriesChart({ data }: { data: TimeSeriesPoint[] }) {
  const { t } = useI18n();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        netFlow: d.inflow - d.outflow,
      })),
    [data]
  );

  return (
    <Card
      title={t("chart.timeSeriesTitle")}
      sql={QUERY_SQL_MAP["Korea Net Stablecoin Flow"]}
      signal={t("chart.timeSeriesSignal")}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            {/* Left axis: Net Flow */}
            <YAxis
              yAxisId="net"
              orientation="left"
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v: number) => formatUSD(v)}
              width={80}
            />
            {/* Right axis: Inflow / Outflow volume */}
            <YAxis
              yAxisId="volume"
              orientation="right"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v: number) => formatUSD(v)}
              width={80}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Area
              yAxisId="volume"
              type="monotone"
              dataKey="inflow"
              name={t("chart.inflow")}
              stroke="#22c55e"
              fill="url(#inflowGrad)"
              strokeWidth={2}
            />
            <Area
              yAxisId="volume"
              type="monotone"
              dataKey="outflow"
              name={t("chart.outflow")}
              stroke="#ef4444"
              fill="url(#outflowGrad)"
              strokeWidth={2}
            />
            <ReferenceLine
              yAxisId="net"
              y={0}
              stroke="#475569"
              strokeWidth={0.75}
              strokeDasharray="2 3"
            />
            <Line
              yAxisId="net"
              type="monotone"
              dataKey="netFlow"
              name={t("chart.netFlow")}
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
