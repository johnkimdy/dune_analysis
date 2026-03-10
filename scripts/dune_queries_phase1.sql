-- ─────────────────────────────────────────────────────────────────────────────
-- Query 1: Supply + Volume for M (Net Momentum) and V (Velocity) # Dune Query ID: 6808087
-- ─────────────────────────────────────────────────────────────────────────────
-- Output: date, symbol, daily_volume, market_cap
-- Save in Dune, add ID to DUNE_QUERY_IDS (first ID)
-- ─────────────────────────────────────────────────────────────────────────────

WITH
-- Daily supply and market_cap (balance_usd ≈ market cap for stables)
supply_by_day AS (
  SELECT
    b.day AS date,
    b.token_symbol AS symbol,
    SUM(b.balance) AS supply,
    SUM(b.balance_usd) AS market_cap
  FROM stablecoins_multichain.balances AS b
  WHERE b.token_symbol IN ('USDT', 'USDC', 'FDUSD')
    AND b.day >= CURRENT_DATE - INTERVAL '90' DAY
    AND b.balance > 0
  GROUP BY 1, 2
),

-- Daily on-chain transfer volume (EVM)
volume_evm AS (
  SELECT
    t.block_date AS date,
    t.token_symbol AS symbol,
    SUM(t.amount_usd) AS daily_volume
  FROM stablecoins_evm.transfers AS t
  WHERE t.token_symbol IN ('USDT', 'USDC', 'FDUSD')
    AND t.block_date >= CURRENT_DATE - INTERVAL '90' DAY
    AND t.amount_usd > 0
  GROUP BY 1, 2
),

-- Tron volume (USDT on Tron is significant)
volume_tron AS (
  SELECT
    t.block_date AS date,
    t.token_symbol AS symbol,
    SUM(t.amount_usd) AS daily_volume
  FROM stablecoins_tron.transfers AS t
  WHERE t.token_symbol IN ('USDT', 'USDC', 'FDUSD')
    AND t.block_date >= CURRENT_DATE - INTERVAL '90' DAY
    AND t.amount_usd > 0
  GROUP BY 1, 2
),

-- Combined volume (EVM + Tron)
volume_by_day AS (
  SELECT date, symbol, SUM(daily_volume) AS daily_volume
  FROM (
    SELECT date, symbol, daily_volume FROM volume_evm
    UNION ALL
    SELECT date, symbol, daily_volume FROM volume_tron
  ) combined
  GROUP BY 1, 2
)

SELECT
  s.date,
  s.symbol,
  s.supply,
  COALESCE(v.daily_volume, 0) AS daily_volume,
  s.market_cap
FROM supply_by_day s
LEFT JOIN volume_by_day v ON s.date = v.date AND s.symbol = v.symbol
ORDER BY s.date ASC, s.symbol;


-- ─────────────────────────────────────────────────────────────────────────────
-- Query 2: Korean Exchange Daily Volume (for KFI — Kimchi Flight Index) # Dune Query ID: 
-- ─────────────────────────────────────────────────────────────────────────────
-- KFI = correlation between Korean stablecoin velocity and KRW/USD.
-- Output: date, symbol, korean_daily_volume
-- Save in Dune, add ID to DUNE_QUERY_ID_KOREAN_VOLUME
-- Optimized: 30-day window + blockchain filter to avoid timeout.
-- ─────────────────────────────────────────────────────────────────────────────

WITH korean_exchanges AS (
  SELECT blockchain, address
  FROM cex.addresses
  WHERE cex_name IN ('Upbit', 'Bithumb', 'Coinone', 'Korbit', 'GOPAX')
),
korean_flows AS (
  SELECT
    CAST(date_trunc('day', t.block_time) AS DATE) AS date,
    t.symbol,
    t.amount_usd
  FROM tokens.transfers t
  INNER JOIN korean_exchanges k
    ON (t."to" = k.address OR t."from" = k.address)
    AND t.blockchain = k.blockchain
  WHERE t.symbol IN ('USDT', 'USDC', 'FDUSD')
    AND t.block_time >= CURRENT_DATE - INTERVAL '30' DAY
    AND t.blockchain IN ('ethereum', 'polygon', 'arbitrum', 'base', 'bnb', 'avalanche_c')
    AND t.amount_usd > 0
)
SELECT
  date,
  symbol,
  SUM(amount_usd) AS korean_daily_volume
FROM korean_flows
GROUP BY 1, 2
ORDER BY 1 ASC, 2;
