"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { formatUSD } from "@/lib/utils";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import type { ExchangeVolume } from "@/lib/types";

export function ExchangeBreakdown({ data }: { data: ExchangeVolume[] }) {
  const { t } = useI18n();

  return (
    <Card
      title={t("chart.exchangeTitle")}
      sql={QUERY_SQL_MAP["Korea Net Stablecoin Flow"]}
      signal={t("chart.exchangeSignal")}
      products={["Exchange", "Custody"]}
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="exchange"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v: number) => formatUSD(v)}
              width={80}
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
      </div>
    </Card>
  );
}
