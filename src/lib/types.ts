/** Row from hourly stablecoin flow aggregation */
export interface FlowRow {
  hour: string;
  blockchain: string;
  symbol: string;
  direction: "inflow" | "outflow";
  exchange_name: string;
  total_usd_volume: number;
  num_transactions: number;
}

/** Row from daily regional reserve net flow */
export interface ReserveRow {
  day: string;
  region: "Korea" | "US" | "International";
  total_inflow: number;
  total_outflow: number;
  net_flow: number;
}

/** Row from whale alerts */
export interface WhaleAlertRow {
  block_time: string;
  blockchain: string;
  symbol: string;
  direction: "inflow" | "outflow";
  exchange_name: string;
  amount_usd: number;
  tx_hash: string;
}

/** Row from stablecoin substitution ratio */
export interface SubstitutionRow {
  day: string;
  symbol: string;
  inflow_usd: number;
  outflow_usd: number;
  total_volume: number;
}

/** Row from counterparty exchange breakdown */
export interface CounterpartyRow {
  direction: "inflow" | "outflow";
  counterparty: string;
  region: "US" | "International" | "DeFi / Unknown";
  total_usd: number;
  num_transfers: number;
}

/** Row from DeFi outflow tracking */
export interface DefiOutflowRow {
  day: string;
  destination: "DeFi / Wallets" | "Other Exchanges";
  volume_usd: number;
}

/** Row from cross-chain flow */
export interface CrossChainRow {
  day: string;
  blockchain: string;
  inflow_usd: number;
  outflow_usd: number;
  total_volume: number;
}

// ── Legacy types (kept for unused components) ──

export interface BlockchainVolume {
  blockchain: string;
  volume: number;
}

export interface RecentTransferRow {
  hour: string;
  blockchain: string;
  symbol: string;
  direction: "inflow" | "outflow";
  exchange_name: string;
  total_usd_volume: number;
  num_transactions: number;
}

// ── Derived UI types ──

export interface SummaryData {
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  totalTransactions: number;
}

export interface TimeSeriesPoint {
  time: string;
  timestamp: number;
  inflow: number;
  outflow: number;
}

export interface ExchangeVolume {
  exchange: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface StablecoinVolume {
  symbol: string;
  volume: number;
  percentage: number;
}

// ── Dashboard data ──

export interface DashboardData {
  summary: SummaryData;
  timeSeries: TimeSeriesPoint[];
  byExchange: ExchangeVolume[];
  byStablecoin: StablecoinVolume[];
  // Cross-product indices (raw rows passed to components)
  reserveRows: ReserveRow[];
  whaleRows: WhaleAlertRow[];
  substitutionRows: SubstitutionRow[];
  counterpartyRows: CounterpartyRow[];
  defiOutflowRows: DefiOutflowRow[];
  crossChainRows: CrossChainRow[];
  lastUpdated: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
