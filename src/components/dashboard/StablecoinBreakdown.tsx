"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { DebouncedChartContainer } from "@/components/ui/DebouncedChartContainer";
import { STABLECOIN_COLORS } from "@/lib/constants";
import { formatUSD } from "@/lib/utils";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import type { StablecoinVolume } from "@/lib/types";

interface StablecoinBreakdownProps {
  data: StablecoinVolume[];
  hideTitle?: boolean;
  timeframe?: string;
}

export function StablecoinBreakdown({ data, hideTitle, timeframe }: StablecoinBreakdownProps) {
  const { t } = useI18n();

  return (
    <Card
      title={t("chart.stablecoinTitle")}
      hideTitle={hideTitle}
      timeframe={timeframe}
      sql={QUERY_SQL_MAP["Korea Net Stablecoin Flow"]}
      signal={t("chart.stablecoinSignal")}
      products={["Exchange", "Lending"]}
    >
      <DebouncedChartContainer className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="volume"
              nameKey="symbol"
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
              }
            >
              {data.map((entry) => (
                <Cell
                  key={entry.symbol}
                  fill={STABLECOIN_COLORS[entry.symbol] || "#6366f1"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatUSD(Number(value ?? 0))}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </DebouncedChartContainer>
    </Card>
  );
}
