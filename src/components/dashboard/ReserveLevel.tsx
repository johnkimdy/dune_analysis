"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { formatUSD, parseDuneTimestamp, formatDayLabel } from "@/lib/utils";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import type { ReserveRow } from "@/lib/types";

interface Props {
  data: ReserveRow[];
}

const REGIONS = ["Korea", "US", "International"] as const;

const REGION_COLORS: Record<string, string> = {
  Korea: "#22c55e",
  US: "#3b82f6",
  International: "#a855f7",
};

export function ReserveLevel({ data }: Props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState<Record<string, boolean>>({
    Korea: true,
    US: true,
    International: true,
  });

  const toggle = (region: string) =>
    setVisible((prev) => ({ ...prev, [region]: !prev[region] }));

  // Pivot: for each day, show cumulative net flow per region
  const dayMap = new Map<
    string,
    { Korea: number; US: number; International: number }
  >();

  for (const row of data) {
    const key = row.day;
    const entry = dayMap.get(key) || { Korea: 0, US: 0, International: 0 };
    entry[row.region] = row.net_flow;
    dayMap.set(key, entry);
  }

  // Build cumulative series
  let cumKorea = 0;
  let cumUS = 0;
  let cumIntl = 0;

  const chartData = Array.from(dayMap.entries())
    .sort(
      (a, b) =>
        parseDuneTimestamp(a[0]).getTime() - parseDuneTimestamp(b[0]).getTime()
    )
    .map(([day, vals]) => {
      cumKorea += vals.Korea;
      cumUS += vals.US;
      cumIntl += vals.International;
      return {
        day: formatDayLabel(day),
        Korea: Math.round(cumKorea),
        US: Math.round(cumUS),
        International: Math.round(cumIntl),
      };
    });

  return (
    <Card
      title={t("chart.reserveTitle")}
      sql={QUERY_SQL_MAP["Exchange Reserve Level"]}
      signal={t("chart.reserveSignal")}
      products={["Exchange", "Custody", "Lending"]}
    >
      {/* Region toggles */}
      <div className="flex gap-4 mb-3">
        {REGIONS.map((region) => (
          <label
            key={region}
            className="flex items-center gap-1.5 cursor-pointer select-none text-xs"
          >
            <input
              type="checkbox"
              checked={visible[region]}
              onChange={() => toggle(region)}
              className="sr-only peer"
            />
            <span
              className="w-3 h-3 rounded-sm border flex items-center justify-center transition-colors"
              style={{
                borderColor: REGION_COLORS[region],
                backgroundColor: visible[region]
                  ? REGION_COLORS[region] + "33"
                  : "transparent",
              }}
            >
              {visible[region] && (
                <svg
                  viewBox="0 0 12 12"
                  className="w-2 h-2"
                  fill="none"
                  stroke={REGION_COLORS[region]}
                  strokeWidth={2.5}
                >
                  <path d="M2 6l3 3 5-6" />
                </svg>
              )}
            </span>
            <span
              className="transition-colors"
              style={{
                color: visible[region] ? REGION_COLORS[region] : "#475569",
              }}
            >
              {region}
            </span>
          </label>
        ))}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v: number) => formatUSD(v)}
              width={80}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            {REGIONS.map((region) =>
              visible[region] ? (
                <Line
                  key={region}
                  type="monotone"
                  dataKey={region}
                  stroke={REGION_COLORS[region]}
                  strokeWidth={2}
                  dot={false}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
