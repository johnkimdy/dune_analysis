import type {
  DashboardData,
  FlowRow,
  ReserveRow,
  WhaleAlertRow,
  SubstitutionRow,
  CounterpartyRow,
  DefiOutflowRow,
  CrossChainRow,
  TimeSeriesPoint,
  ExchangeVolume,
  StablecoinVolume,
} from "./types";

// ── Helpers ──

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function isoDay(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day} 00:00:00.000 UTC`;
}

function isoHour(hoursAgo: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:00:00.000 UTC`;
}

function fakeTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// ── Mock data generators ──

function generateTimeSeries(): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  // 7 days * 24 hours = 168 hours, sample every 4 hours
  for (let h = 168; h >= 0; h -= 4) {
    const d = new Date();
    d.setHours(d.getHours() - h, 0, 0, 0);
    const baseInflow = randomBetween(2_000_000, 15_000_000);
    const baseOutflow = randomBetween(1_500_000, 12_000_000);
    // Add some daily patterns (higher during KST business hours)
    const hour = d.getHours();
    const kstHour = (hour + 9) % 24;
    const multiplier = kstHour >= 9 && kstHour <= 18 ? 1.4 : 0.8;

    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");

    points.push({
      time: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()} ${hh}:00`,
      timestamp: d.getTime(),
      inflow: Math.round(baseInflow * multiplier),
      outflow: Math.round(baseOutflow * multiplier),
    });
  }
  return points;
}

function generateExchangeVolumes(): ExchangeVolume[] {
  const exchanges = [
    { exchange: "Upbit", inflowBase: 180_000_000, outflowBase: 160_000_000 },
    { exchange: "Bithumb", inflowBase: 45_000_000, outflowBase: 50_000_000 },
    { exchange: "Coinone", inflowBase: 12_000_000, outflowBase: 10_000_000 },
    { exchange: "Korbit", inflowBase: 5_000_000, outflowBase: 4_500_000 },
    { exchange: "GOPAX", inflowBase: 2_000_000, outflowBase: 1_800_000 },
  ];
  return exchanges.map(({ exchange, inflowBase, outflowBase }) => {
    const inflow = randomBetween(inflowBase * 0.8, inflowBase * 1.2);
    const outflow = randomBetween(outflowBase * 0.8, outflowBase * 1.2);
    return { exchange, inflow, outflow, net: inflow - outflow };
  });
}

function generateStablecoinVolumes(): StablecoinVolume[] {
  const raw = [
    { symbol: "USDT", volume: randomBetween(350_000_000, 420_000_000) },
    { symbol: "USDC", volume: randomBetween(80_000_000, 130_000_000) },
    { symbol: "DAI", volume: randomBetween(15_000_000, 30_000_000) },
    { symbol: "BUSD", volume: randomBetween(5_000_000, 15_000_000) },
    { symbol: "TUSD", volume: randomBetween(2_000_000, 8_000_000) },
    { symbol: "FRAX", volume: randomBetween(1_000_000, 5_000_000) },
  ];
  const total = raw.reduce((s, r) => s + r.volume, 0);
  return raw.map((r) => ({
    ...r,
    percentage: Math.round((r.volume / total) * 10000) / 100,
  }));
}

function generateReserveRows(): ReserveRow[] {
  const rows: ReserveRow[] = [];
  const regions: Array<"Korea" | "US" | "International"> = [
    "Korea",
    "US",
    "International",
  ];

  for (let d = 29; d >= 0; d--) {
    for (const region of regions) {
      let inflow: number, outflow: number;
      if (region === "Korea") {
        inflow = randomBetween(8_000_000, 18_000_000);
        outflow = randomBetween(7_000_000, 16_000_000);
      } else if (region === "US") {
        inflow = randomBetween(40_000_000, 80_000_000);
        outflow = randomBetween(35_000_000, 75_000_000);
      } else {
        inflow = randomBetween(25_000_000, 50_000_000);
        outflow = randomBetween(20_000_000, 45_000_000);
      }
      rows.push({
        day: isoDay(d),
        region,
        total_inflow: inflow,
        total_outflow: outflow,
        net_flow: inflow - outflow,
      });
    }
  }
  return rows;
}

function generateWhaleAlerts(): WhaleAlertRow[] {
  const exchanges = ["Upbit", "Bithumb", "Coinone", "Upbit", "Upbit"];
  const blockchains = ["ethereum", "ethereum", "arbitrum", "polygon", "base"];
  const symbols = ["USDT", "USDC", "USDT", "USDC", "USDT"];
  const directions: Array<"inflow" | "outflow"> = [
    "inflow",
    "outflow",
    "inflow",
    "outflow",
    "inflow",
  ];

  const rows: WhaleAlertRow[] = [];
  for (let i = 0; i < 15; i++) {
    const hoursAgo = randomBetween(1, 168);
    const d = new Date();
    d.setHours(d.getHours() - hoursAgo);
    const idx = i % exchanges.length;
    rows.push({
      block_time: isoHour(hoursAgo),
      blockchain: blockchains[idx],
      symbol: symbols[idx],
      direction: directions[idx],
      exchange_name: exchanges[idx],
      amount_usd: randomBetween(1_000_000, 25_000_000),
      tx_hash: fakeTxHash(),
    });
  }
  return rows.sort((a, b) => b.amount_usd - a.amount_usd);
}

function generateSubstitutionRows(): SubstitutionRow[] {
  const rows: SubstitutionRow[] = [];
  for (let d = 29; d >= 0; d--) {
    const day = isoDay(d);
    // USDT dominates ~70-80%, USDC ~20-30%
    const usdtVol = randomBetween(12_000_000, 22_000_000);
    const usdcVol = randomBetween(3_000_000, 8_000_000);
    rows.push({
      day,
      symbol: "USDT",
      inflow_usd: randomBetween(usdtVol * 0.4, usdtVol * 0.6),
      outflow_usd: randomBetween(usdtVol * 0.4, usdtVol * 0.6),
      total_volume: usdtVol,
    });
    rows.push({
      day,
      symbol: "USDC",
      inflow_usd: randomBetween(usdcVol * 0.4, usdcVol * 0.6),
      outflow_usd: randomBetween(usdcVol * 0.4, usdcVol * 0.6),
      total_volume: usdcVol,
    });
  }
  return rows;
}

function generateCounterpartyRows(): CounterpartyRow[] {
  const counterparties = [
    { counterparty: "Binance", region: "International" as const, dir: "outflow" as const },
    { counterparty: "Coinbase", region: "US" as const, dir: "inflow" as const },
    { counterparty: "Binance", region: "International" as const, dir: "inflow" as const },
    { counterparty: "OKX", region: "International" as const, dir: "outflow" as const },
    { counterparty: "Kraken", region: "US" as const, dir: "outflow" as const },
    { counterparty: "Coinbase", region: "US" as const, dir: "outflow" as const },
    { counterparty: "DeFi / Unknown", region: "DeFi / Unknown" as const, dir: "outflow" as const },
    { counterparty: "DeFi / Unknown", region: "DeFi / Unknown" as const, dir: "inflow" as const },
    { counterparty: "Bybit", region: "International" as const, dir: "inflow" as const },
    { counterparty: "Gemini", region: "US" as const, dir: "inflow" as const },
    { counterparty: "OKX", region: "International" as const, dir: "inflow" as const },
    { counterparty: "Kraken", region: "US" as const, dir: "inflow" as const },
    { counterparty: "Bybit", region: "International" as const, dir: "outflow" as const },
    { counterparty: "Huobi", region: "International" as const, dir: "outflow" as const },
    { counterparty: "Huobi", region: "International" as const, dir: "inflow" as const },
  ];

  return counterparties.map((cp) => ({
    direction: cp.dir,
    counterparty: cp.counterparty,
    region: cp.region,
    total_usd: randomBetween(5_000_000, 80_000_000),
    num_transfers: randomBetween(50, 2000),
  })).sort((a, b) => b.total_usd - a.total_usd);
}

function generateDefiOutflowRows(): DefiOutflowRow[] {
  const rows: DefiOutflowRow[] = [];
  for (let d = 29; d >= 0; d--) {
    const day = isoDay(d);
    rows.push({
      day,
      destination: "DeFi / Wallets",
      volume_usd: randomBetween(2_000_000, 10_000_000),
    });
    rows.push({
      day,
      destination: "Other Exchanges",
      volume_usd: randomBetween(5_000_000, 15_000_000),
    });
  }
  return rows;
}

function generateCrossChainRows(): CrossChainRow[] {
  const chains = [
    "ethereum",
    "arbitrum",
    "polygon",
    "optimism",
    "base",
    "bnb",
    "avalanche_c",
  ];
  const rows: CrossChainRow[] = [];
  for (let d = 29; d >= 0; d--) {
    for (const blockchain of chains) {
      let inflow: number, outflow: number;
      if (blockchain === "ethereum") {
        inflow = randomBetween(5_000_000, 12_000_000);
        outflow = randomBetween(4_000_000, 10_000_000);
      } else if (blockchain === "arbitrum") {
        inflow = randomBetween(1_500_000, 5_000_000);
        outflow = randomBetween(1_000_000, 4_000_000);
      } else if (blockchain === "polygon") {
        inflow = randomBetween(800_000, 3_000_000);
        outflow = randomBetween(600_000, 2_500_000);
      } else {
        inflow = randomBetween(200_000, 1_500_000);
        outflow = randomBetween(150_000, 1_200_000);
      }
      rows.push({
        day: isoDay(d),
        blockchain,
        inflow_usd: inflow,
        outflow_usd: outflow,
        total_volume: inflow + outflow,
      });
    }
  }
  return rows;
}

// ── Main export ──

export function generateMockDashboardData(): DashboardData {
  const timeSeries = generateTimeSeries();
  const byExchange = generateExchangeVolumes();
  const byStablecoin = generateStablecoinVolumes();

  const totalInflow = byExchange.reduce((s, e) => s + e.inflow, 0);
  const totalOutflow = byExchange.reduce((s, e) => s + e.outflow, 0);

  return {
    summary: {
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow,
      totalTransactions: randomBetween(8_000, 15_000),
    },
    timeSeries,
    byExchange,
    byStablecoin,
    reserveRows: generateReserveRows(),
    whaleRows: generateWhaleAlerts(),
    substitutionRows: generateSubstitutionRows(),
    counterpartyRows: generateCounterpartyRows(),
    defiOutflowRows: generateDefiOutflowRows(),
    crossChainRows: generateCrossChainRows(),
    lastUpdated: new Date().toISOString(),
  };
}
