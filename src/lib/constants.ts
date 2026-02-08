export const EXCHANGES = [
  "Upbit",
  "Bithumb",
  "Coinone",
  "Korbit",
  "GOPAX",
] as const;

export const STABLECOINS = [
  "USDC",
  "USDT",
  "DAI",
  "BUSD",
  "TUSD",
  "FRAX",
] as const;

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const CACHE_TTL_MS = 5 * 60 * 1000;

export const EXCHANGE_COLORS: Record<string, string> = {
  Upbit: "#093687",
  Bithumb: "#f2a900",
  Coinone: "#0066ff",
  Korbit: "#4b7bec",
  GOPAX: "#6366f1",
};

export const STABLECOIN_COLORS: Record<string, string> = {
  USDC: "#2775ca",
  USDT: "#50af95",
  DAI: "#f5ac37",
  BUSD: "#f0b90b",
  TUSD: "#002868",
  FRAX: "#8b5cf6",
};

export const BLOCKCHAIN_COLORS: Record<string, string> = {
  ethereum: "#627eea",
  polygon: "#8247e5",
  arbitrum: "#28a0f0",
  optimism: "#ff0420",
  bnb: "#f0b90b",
  avalanche_c: "#e84142",
  base: "#0052ff",
};
