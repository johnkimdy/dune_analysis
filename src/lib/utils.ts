import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
import type {
  FlowRow,
  DashboardData,
  TimeSeriesPoint,
  ExchangeVolume,
  StablecoinVolume,
  ReserveRow,
  WhaleAlertRow,
  SubstitutionRow,
  CounterpartyRow,
  DefiOutflowRow,
  CrossChainRow,
} from "./types";

export function formatUSD(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** Dune returns timestamps like "2025-10-07 20:00:00.000 UTC" */
export function parseDuneTimestamp(ts: string): Date {
  return new Date(ts.replace(" UTC", "Z").replace(" ", "T"));
}

export function formatTimeLabel(ts: string): string {
  return format(parseDuneTimestamp(ts), "MMM d HH:mm");
}

export function formatDayLabel(ts: string): string {
  return format(parseDuneTimestamp(ts), "MMM d");
}

export function getExplorerUrl(blockchain: string, txHash: string): string {
  const explorers: Record<string, string> = {
    ethereum: "https://etherscan.io/tx/",
    polygon: "https://polygonscan.com/tx/",
    arbitrum: "https://arbiscan.io/tx/",
    optimism: "https://optimistic.etherscan.io/tx/",
    bnb: "https://bscscan.com/tx/",
    avalanche_c: "https://snowtrace.io/tx/",
    base: "https://basescan.org/tx/",
  };
  return `${explorers[blockchain] || "https://etherscan.io/tx/"}${txHash}`;
}

export function transformDashboardData(
  flowRows: FlowRow[],
  reserveRows: ReserveRow[],
  whaleRows: WhaleAlertRow[],
  substitutionRows: SubstitutionRow[],
  counterpartyRows: CounterpartyRow[],
  defiOutflowRows: DefiOutflowRow[],
  crossChainRows: CrossChainRow[]
): Omit<DashboardData, "lastUpdated"> {
  let totalInflow = 0;
  let totalOutflow = 0;
  let totalTransactions = 0;

  for (const row of flowRows) {
    if (row.direction === "inflow") {
      totalInflow += row.total_usd_volume;
    } else {
      totalOutflow += row.total_usd_volume;
    }
    totalTransactions += row.num_transactions;
  }

  // Time series
  const timeMap = new Map<string, { inflow: number; outflow: number }>();
  for (const row of flowRows) {
    const entry = timeMap.get(row.hour) || { inflow: 0, outflow: 0 };
    if (row.direction === "inflow") {
      entry.inflow += row.total_usd_volume;
    } else {
      entry.outflow += row.total_usd_volume;
    }
    timeMap.set(row.hour, entry);
  }

  const timeSeries: TimeSeriesPoint[] = Array.from(timeMap.entries())
    .map(([time, vals]) => ({
      time: formatTimeLabel(time),
      timestamp: parseDuneTimestamp(time).getTime(),
      inflow: Math.round(vals.inflow),
      outflow: Math.round(vals.outflow),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // By exchange
  const exchangeMap = new Map<string, { inflow: number; outflow: number }>();
  for (const row of flowRows) {
    const entry = exchangeMap.get(row.exchange_name) || {
      inflow: 0,
      outflow: 0,
    };
    if (row.direction === "inflow") {
      entry.inflow += row.total_usd_volume;
    } else {
      entry.outflow += row.total_usd_volume;
    }
    exchangeMap.set(row.exchange_name, entry);
  }

  const byExchange: ExchangeVolume[] = Array.from(exchangeMap.entries())
    .map(([exchange, vals]) => ({
      exchange,
      inflow: Math.round(vals.inflow),
      outflow: Math.round(vals.outflow),
      net: Math.round(vals.inflow - vals.outflow),
    }))
    .sort((a, b) => b.inflow + b.outflow - (a.inflow + a.outflow));

  // By stablecoin
  const stablecoinMap = new Map<string, number>();
  for (const row of flowRows) {
    stablecoinMap.set(
      row.symbol,
      (stablecoinMap.get(row.symbol) || 0) + row.total_usd_volume
    );
  }
  const totalVolume = Array.from(stablecoinMap.values()).reduce(
    (s, v) => s + v,
    0
  );

  const byStablecoin: StablecoinVolume[] = Array.from(stablecoinMap.entries())
    .map(([symbol, volume]) => ({
      symbol,
      volume: Math.round(volume),
      percentage:
        totalVolume > 0
          ? Math.round((volume / totalVolume) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.volume - a.volume);

  return {
    summary: {
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow,
      totalTransactions,
    },
    timeSeries,
    byExchange,
    byStablecoin,
    reserveRows,
    whaleRows,
    substitutionRows,
    counterpartyRows,
    defiOutflowRows,
    crossChainRows,
  };
}
