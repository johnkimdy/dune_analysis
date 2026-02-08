"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatUSD, formatTimeLabel, formatNumber } from "@/lib/utils";
import type { RecentTransferRow } from "@/lib/types";

export function RecentTransactions({ data }: { data: RecentTransferRow[] }) {
  return (
    <Card title="Large Transfers (> $100K, 24h, Hourly)">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3e] text-left text-slate-400">
              <th className="pb-3 pr-4">Hour</th>
              <th className="pb-3 pr-4">Exchange</th>
              <th className="pb-3 pr-4">Direction</th>
              <th className="pb-3 pr-4">Stablecoin</th>
              <th className="pb-3 pr-4">Chain</th>
              <th className="pb-3 pr-4 text-right">Volume</th>
              <th className="pb-3 text-right">Txns</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {data.map((row, i) => (
              <tr
                key={`${row.hour}-${row.exchange_name}-${row.symbol}-${row.direction}-${i}`}
                className="border-b border-[#2a2a3e]/50 hover:bg-[#1a1a2e] transition-colors"
              >
                <td className="py-3 pr-4 font-mono text-xs">
                  {formatTimeLabel(row.hour)}
                </td>
                <td className="py-3 pr-4">{row.exchange_name}</td>
                <td className="py-3 pr-4">
                  <Badge
                    variant={
                      row.direction === "inflow" ? "inflow" : "outflow"
                    }
                  >
                    {row.direction}
                  </Badge>
                </td>
                <td className="py-3 pr-4 font-mono">{row.symbol}</td>
                <td className="py-3 pr-4 capitalize">{row.blockchain}</td>
                <td className="py-3 pr-4 text-right font-mono font-medium">
                  {formatUSD(row.total_usd_volume)}
                </td>
                <td className="py-3 text-right font-mono">
                  {formatNumber(row.num_transactions)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            No large transfers in the last 24 hours.
          </p>
        )}
      </div>
    </Card>
  );
}
