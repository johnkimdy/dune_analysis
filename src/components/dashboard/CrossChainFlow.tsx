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
  Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { formatUSD } from "@/lib/utils";
import { BLOCKCHAIN_COLORS } from "@/lib/constants";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import type { CrossChainRow } from "@/lib/types";

interface Props {
  data: CrossChainRow[];
}

export function CrossChainFlow({ data }: Props) {
  const { t } = useI18n();

  // Aggregate by blockchain across all days
  const chainMap = new Map<
    string,
    { inflow: number; outflow: number }
  >();

  for (const row of data) {
    const entry = chainMap.get(row.blockchain) || { inflow: 0, outflow: 0 };
    entry.inflow += row.inflow_usd;
    entry.outflow += row.outflow_usd;
    chainMap.set(row.blockchain, entry);
  }

  const chartData = Array.from(chainMap.entries())
    .map(([blockchain, vals]) => ({
      blockchain,
      inflow: Math.round(vals.inflow),
      outflow: Math.round(vals.outflow),
      total: Math.round(vals.inflow + vals.outflow),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <Card
      title={t("chart.crossChainTitle")}
      sql={QUERY_SQL_MAP["Cross-Chain Flow Patterns"]}
      signal={t("chart.crossChainSignal")}
      products={["Exchange", "Staking"]}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v: number) => formatUSD(v)}
            />
            <YAxis
              type="category"
              dataKey="blockchain"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              width={90}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Bar
              dataKey="inflow"
              name={t("chart.inflow")}
              fill="#22c55e"
              radius={[0, 4, 4, 0]}
              stackId="stack"
            />
            <Bar
              dataKey="outflow"
              name={t("chart.outflow")}
              fill="#ef4444"
              radius={[0, 4, 4, 0]}
              stackId="stack"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
