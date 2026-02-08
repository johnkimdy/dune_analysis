"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatUSD, getExplorerUrl } from "@/lib/utils";
import { QUERY_SQL_MAP } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import type { WhaleAlertRow } from "@/lib/types";

interface Props {
  data: WhaleAlertRow[];
}

export function WhaleAlerts({ data }: Props) {
  const { t } = useI18n();

  return (
    <Card
      title={t("chart.whaleTitle")}
      sql={QUERY_SQL_MAP["Whale Alerts"]}
      signal={t("chart.whaleSignal")}
    >
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#12121a]">
            <tr className="border-b border-[#2a2a3e] text-left text-slate-400">
              <th className="pb-3 pr-4">{t("whale.time")}</th>
              <th className="pb-3 pr-4">{t("whale.exchange")}</th>
              <th className="pb-3 pr-4">{t("whale.dir")}</th>
              <th className="pb-3 pr-4">{t("whale.coin")}</th>
              <th className="pb-3 pr-4 text-right">{t("whale.amount")}</th>
              <th className="pb-3">{t("whale.tx")}</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {data.map((row, i) => (
              <tr
                key={`${row.tx_hash}-${i}`}
                className="border-b border-[#2a2a3e]/50 hover:bg-[#1a1a2e] transition-colors"
              >
                <td className="py-2 pr-4 font-mono text-xs">
                  {format(
                    new Date(
                      row.block_time
                        .replace(" UTC", "Z")
                        .replace(" ", "T")
                    ),
                    "MMM d HH:mm"
                  )}
                </td>
                <td className="py-2 pr-4 text-xs">{row.exchange_name}</td>
                <td className="py-2 pr-4">
                  <Badge
                    variant={
                      row.direction === "inflow" ? "inflow" : "outflow"
                    }
                  >
                    {row.direction === "inflow"
                      ? t("chart.inflow")
                      : t("chart.outflow")}
                  </Badge>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{row.symbol}</td>
                <td className="py-2 pr-4 text-right font-mono font-medium text-xs">
                  {formatUSD(row.amount_usd)}
                </td>
                <td className="py-2">
                  <a
                    href={getExplorerUrl(row.blockchain, row.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-xs"
                  >
                    {row.tx_hash.slice(0, 8)}...
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            {t("whale.noData")}
          </p>
        )}
      </div>
    </Card>
  );
}
