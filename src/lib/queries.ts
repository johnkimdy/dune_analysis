import { EXCHANGES, STABLECOINS } from "./constants";

const exchangeList = EXCHANGES.map((e) => `'${e}'`).join(", ");
const stablecoinList = STABLECOINS.map((s) => `'${s}'`).join(", ");

// US exchanges for regional comparison
const US_EXCHANGES = [
  "Coinbase",
  "Kraken",
  "Gemini",
  "Bittrex",
  "Robinhood",
];
const usExchangeList = US_EXCHANGES.map((e) => `'${e}'`).join(", ");

// ──────────────────────────────────────────────────
// 1. KOREA NET STABLECOIN FLOW (existing)
// ──────────────────────────────────────────────────
export const FLOWS_QUERY = `
WITH korean_exchanges AS (
  SELECT blockchain, address, cex_name
  FROM cex.addresses
  WHERE cex_name IN (${exchangeList})
),
stablecoin_flows AS (
  SELECT
    date_trunc('hour', t.block_time) as hour,
    t.blockchain,
    t.symbol,
    CASE
      WHEN t."to" = k.address
        AND t."from" NOT IN (SELECT address FROM korean_exchanges)
        THEN 'inflow'
      WHEN t."from" = k.address
        AND t."to" NOT IN (SELECT address FROM korean_exchanges)
        THEN 'outflow'
    END as direction,
    k.cex_name as exchange_name,
    t.amount_usd,
    t.tx_hash
  FROM tokens.transfers t
  INNER JOIN korean_exchanges k
    ON (t."to" = k.address OR t."from" = k.address)
    AND t.blockchain = k.blockchain
  WHERE t.symbol IN (${stablecoinList})
    AND t.block_time >= NOW() - INTERVAL '7' DAY
    AND t.amount_usd > 0
)
SELECT
  hour,
  blockchain,
  symbol,
  direction,
  exchange_name,
  SUM(amount_usd) as total_usd_volume,
  COUNT(DISTINCT tx_hash) as num_transactions
FROM stablecoin_flows
WHERE direction IS NOT NULL
GROUP BY hour, blockchain, symbol, direction, exchange_name
ORDER BY hour DESC, total_usd_volume DESC
`;

// ──────────────────────────────────────────────────
// 2. EXCHANGE RESERVE LEVEL (daily net flow proxy)
//    Korean vs US vs International
// ──────────────────────────────────────────────────
export const RESERVE_LEVEL_QUERY = `
WITH korean_ex AS (
  SELECT blockchain, address FROM cex.addresses WHERE cex_name IN (${exchangeList})
),
us_ex AS (
  SELECT blockchain, address FROM cex.addresses WHERE cex_name IN (${usExchangeList})
),
daily_flows AS (
  SELECT
    date_trunc('day', t.block_time) as day,
    t.symbol,
    CASE
      WHEN ce.cex_name IN (${exchangeList}) THEN 'Korea'
      WHEN ce.cex_name IN (${usExchangeList}) THEN 'US'
      ELSE 'International'
    END as region,
    SUM(CASE WHEN t."to" = ce.address THEN t.amount_usd ELSE 0 END) as inflow,
    SUM(CASE WHEN t."from" = ce.address THEN t.amount_usd ELSE 0 END) as outflow
  FROM tokens.transfers t
  INNER JOIN cex.addresses ce
    ON (t."to" = ce.address OR t."from" = ce.address)
    AND t.blockchain = ce.blockchain
  WHERE t.symbol IN (${stablecoinList})
    AND t.block_time >= NOW() - INTERVAL '30' DAY
    AND t.amount_usd > 0
  GROUP BY 1, 2, 3
)
SELECT
  day,
  region,
  SUM(inflow) as total_inflow,
  SUM(outflow) as total_outflow,
  SUM(inflow) - SUM(outflow) as net_flow
FROM daily_flows
GROUP BY day, region
ORDER BY day ASC, region
`;

// ──────────────────────────────────────────────────
// 3. WHALE ALERTS (>$1M, 7 days)
// ──────────────────────────────────────────────────
export const WHALE_ALERTS_QUERY = `
WITH korean_exchanges AS (
  SELECT blockchain, address, cex_name
  FROM cex.addresses
  WHERE cex_name IN (${exchangeList})
)
SELECT
  t.block_time,
  t.blockchain,
  t.symbol,
  CASE
    WHEN t."to" = k.address THEN 'inflow'
    WHEN t."from" = k.address THEN 'outflow'
  END as direction,
  k.cex_name as exchange_name,
  t.amount_usd,
  t.tx_hash
FROM tokens.transfers t
INNER JOIN korean_exchanges k
  ON (t."to" = k.address OR t."from" = k.address)
  AND t.blockchain = k.blockchain
WHERE t.symbol IN (${stablecoinList})
  AND t.block_time >= NOW() - INTERVAL '7' DAY
  AND t.amount_usd >= 1000000
ORDER BY t.amount_usd DESC
LIMIT 50
`;

// ──────────────────────────────────────────────────
// 4. STABLECOIN SUBSTITUTION RATIO
//    Daily USDC vs USDT ratio on Korean exchange flows
// ──────────────────────────────────────────────────
export const SUBSTITUTION_RATIO_QUERY = `
WITH korean_exchanges AS (
  SELECT blockchain, address, cex_name
  FROM cex.addresses
  WHERE cex_name IN (${exchangeList})
)
SELECT
  date_trunc('day', t.block_time) as day,
  t.symbol,
  SUM(CASE WHEN t."to" = k.address THEN t.amount_usd ELSE 0 END) as inflow_usd,
  SUM(CASE WHEN t."from" = k.address THEN t.amount_usd ELSE 0 END) as outflow_usd,
  SUM(t.amount_usd) as total_volume
FROM tokens.transfers t
INNER JOIN korean_exchanges k
  ON (t."to" = k.address OR t."from" = k.address)
  AND t.blockchain = k.blockchain
WHERE t.symbol IN ('USDC', 'USDT')
  AND t.block_time >= NOW() - INTERVAL '30' DAY
  AND t.amount_usd > 0
GROUP BY 1, 2
ORDER BY day ASC, symbol
`;

// ──────────────────────────────────────────────────
// 5. COUNTERPARTY EXCHANGE BREAKDOWN
//    Which foreign exchanges do Korean flows go to/from
// ──────────────────────────────────────────────────
export const COUNTERPARTY_QUERY = `
WITH korean_exchanges AS (
  SELECT blockchain, address, cex_name
  FROM cex.addresses
  WHERE cex_name IN (${exchangeList})
),
counterparty_flows AS (
  SELECT
    CASE
      WHEN t."from" = k.address THEN 'outflow'
      WHEN t."to" = k.address THEN 'inflow'
    END as direction,
    CASE
      WHEN t."from" = k.address THEN cp.cex_name
      WHEN t."to" = k.address THEN cp2.cex_name
    END as counterparty,
    CASE
      WHEN COALESCE(
        CASE WHEN t."from" = k.address THEN cp.cex_name ELSE cp2.cex_name END
      ) IN (${usExchangeList}) THEN 'US'
      WHEN COALESCE(
        CASE WHEN t."from" = k.address THEN cp.cex_name ELSE cp2.cex_name END
      ) IS NULL THEN 'DeFi / Unknown'
      ELSE 'International'
    END as region,
    t.amount_usd
  FROM tokens.transfers t
  INNER JOIN korean_exchanges k
    ON (t."to" = k.address OR t."from" = k.address)
    AND t.blockchain = k.blockchain
  LEFT JOIN cex.addresses cp
    ON t."to" = cp.address AND t.blockchain = cp.blockchain
    AND t."from" = k.address
  LEFT JOIN cex.addresses cp2
    ON t."from" = cp2.address AND t.blockchain = cp2.blockchain
    AND t."to" = k.address
  WHERE t.symbol IN (${stablecoinList})
    AND t.block_time >= NOW() - INTERVAL '7' DAY
    AND t.amount_usd > 0
    AND (t."from" NOT IN (SELECT address FROM korean_exchanges)
      OR t."to" NOT IN (SELECT address FROM korean_exchanges))
)
SELECT
  direction,
  COALESCE(counterparty, 'DeFi / Unknown') as counterparty,
  region,
  SUM(amount_usd) as total_usd,
  COUNT(*) as num_transfers
FROM counterparty_flows
WHERE direction IS NOT NULL
GROUP BY 1, 2, 3
ORDER BY total_usd DESC
LIMIT 30
`;

// ──────────────────────────────────────────────────
// 6. DEFI OUTFLOW TRACKING
//    Stablecoins leaving Korean exchanges to non-CEX addresses
// ──────────────────────────────────────────────────
export const DEFI_OUTFLOW_QUERY = `
WITH korean_exchanges AS (
  SELECT blockchain, address, cex_name
  FROM cex.addresses
  WHERE cex_name IN (${exchangeList})
),
all_cex AS (
  SELECT address FROM cex.addresses
),
outflows_to_defi AS (
  SELECT
    date_trunc('day', t.block_time) as day,
    t.symbol,
    t.amount_usd
  FROM tokens.transfers t
  INNER JOIN korean_exchanges k
    ON t."from" = k.address
    AND t.blockchain = k.blockchain
  WHERE t.symbol IN (${stablecoinList})
    AND t.block_time >= NOW() - INTERVAL '30' DAY
    AND t.amount_usd > 0
    AND t."to" NOT IN (SELECT address FROM all_cex)
    AND t."to" NOT IN (SELECT address FROM korean_exchanges)
),
outflows_to_cex AS (
  SELECT
    date_trunc('day', t.block_time) as day,
    t.symbol,
    t.amount_usd
  FROM tokens.transfers t
  INNER JOIN korean_exchanges k
    ON t."from" = k.address
    AND t.blockchain = k.blockchain
  WHERE t.symbol IN (${stablecoinList})
    AND t.block_time >= NOW() - INTERVAL '30' DAY
    AND t.amount_usd > 0
    AND (t."to" IN (SELECT address FROM all_cex)
      OR t."to" IN (SELECT address FROM korean_exchanges))
)
SELECT day, 'DeFi / Wallets' as destination, SUM(amount_usd) as volume_usd
FROM outflows_to_defi GROUP BY 1
UNION ALL
SELECT day, 'Other Exchanges' as destination, SUM(amount_usd) as volume_usd
FROM outflows_to_cex GROUP BY 1
ORDER BY day ASC, destination
`;

// ──────────────────────────────────────────────────
// 7. CROSS-CHAIN FLOW PATTERNS
//    Daily stablecoin flow by blockchain for Korean exchanges
// ──────────────────────────────────────────────────
export const CROSS_CHAIN_QUERY = `
WITH korean_exchanges AS (
  SELECT blockchain, address, cex_name
  FROM cex.addresses
  WHERE cex_name IN (${exchangeList})
)
SELECT
  date_trunc('day', t.block_time) as day,
  t.blockchain,
  SUM(CASE WHEN t."to" = k.address THEN t.amount_usd ELSE 0 END) as inflow_usd,
  SUM(CASE WHEN t."from" = k.address THEN t.amount_usd ELSE 0 END) as outflow_usd,
  SUM(t.amount_usd) as total_volume
FROM tokens.transfers t
INNER JOIN korean_exchanges k
  ON (t."to" = k.address OR t."from" = k.address)
  AND t.blockchain = k.blockchain
WHERE t.symbol IN (${stablecoinList})
  AND t.block_time >= NOW() - INTERVAL '30' DAY
  AND t.amount_usd > 0
GROUP BY 1, 2
ORDER BY day ASC, total_volume DESC
`;

// Map of query name to SQL string for the tooltip display
export const QUERY_SQL_MAP: Record<string, string> = {
  "Korea Net Stablecoin Flow": FLOWS_QUERY,
  "Exchange Reserve Level": RESERVE_LEVEL_QUERY,
  "Whale Alerts": WHALE_ALERTS_QUERY,
  "Stablecoin Substitution Ratio": SUBSTITUTION_RATIO_QUERY,
  "Counterparty Exchange Breakdown": COUNTERPARTY_QUERY,
  "DeFi Outflow Tracking": DEFI_OUTFLOW_QUERY,
  "Cross-Chain Flow Patterns": CROSS_CHAIN_QUERY,
};
