"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { BLOCKCHAIN_COLORS } from "@/lib/constants";
import { formatUSD } from "@/lib/utils";
import type { BlockchainVolume } from "@/lib/types";

export function BlockchainBreakdown({ data }: { data: BlockchainVolume[] }) {
  return (
    <Card title="Volume by Blockchain">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
            <Bar dataKey="volume" name="Volume" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.blockchain}
                  fill={BLOCKCHAIN_COLORS[entry.blockchain] || "#6366f1"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
