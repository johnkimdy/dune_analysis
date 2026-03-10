-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001 — Initial schema
-- Run against both prod and staging after `terraform apply`.
--
-- Phase 1: dashboard_snapshots stores full Dune result blobs.
--          The app reads the latest snapshot; Dune is only called manually.
-- Phase 3: stablecoin_transfers + flow_aggregates_* store raw RPC-ingested
--          events. Once the ingester is live, the app switches to these tables
--          and Dune is fully deprecated.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search on tx_hash later

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 1 — Dune snapshot cache
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE dashboard_snapshots (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE        NOT NULL,
  -- Full DashboardData JSON blob from the Dune query run
  data          JSONB       NOT NULL,
  -- Which data source produced this snapshot
  source        TEXT        NOT NULL DEFAULT 'dune'
                            CHECK (source IN ('dune', 'rpc', 'manual')),
  -- Raw row counts per query for audit/debugging
  row_counts    JSONB,
  -- How long the Dune queries took (ms)
  fetch_duration_ms INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Only one snapshot per date per source
  UNIQUE (snapshot_date, source)
);

CREATE INDEX idx_snapshots_date ON dashboard_snapshots (snapshot_date DESC);

COMMENT ON TABLE dashboard_snapshots IS
  'Daily snapshots of full dashboard data. Phase 1: sourced from Dune. '
  'Phase 3: sourced from onchain RPC ingestion. The API route always serves '
  'the most recent snapshot and falls back to mock data if none exists.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 3 — Raw RPC-ingested stablecoin transfers
-- (scaffold now, populate later when the ingester is built)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE stablecoin_transfers (
  id              BIGSERIAL   PRIMARY KEY,
  blockchain      TEXT        NOT NULL,
  tx_hash         TEXT        NOT NULL,
  block_number    BIGINT      NOT NULL,
  block_time      TIMESTAMPTZ NOT NULL,
  symbol          TEXT        NOT NULL,
  from_address    TEXT        NOT NULL,
  to_address      TEXT        NOT NULL,
  amount_raw      NUMERIC     NOT NULL, -- raw token units (pre-decimal)
  amount_usd      NUMERIC,              -- null until price enrichment runs
  -- Which Korean exchange address was involved (null if not Korean CEX)
  exchange_name   TEXT,
  direction       TEXT        CHECK (direction IN ('inflow', 'outflow', NULL)),
  -- Ingestion metadata
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Dedup: one row per on-chain transfer
  UNIQUE (blockchain, tx_hash, from_address, to_address)
);

CREATE INDEX idx_transfers_block_time  ON stablecoin_transfers (block_time DESC);
CREATE INDEX idx_transfers_blockchain  ON stablecoin_transfers (blockchain, block_time DESC);
CREATE INDEX idx_transfers_exchange    ON stablecoin_transfers (exchange_name, block_time DESC) WHERE exchange_name IS NOT NULL;
CREATE INDEX idx_transfers_symbol      ON stablecoin_transfers (symbol, block_time DESC);
CREATE INDEX idx_transfers_amount_usd  ON stablecoin_transfers (amount_usd DESC) WHERE amount_usd IS NOT NULL;

COMMENT ON TABLE stablecoin_transfers IS
  'Raw stablecoin transfer events ingested from onchain RPC. '
  'Populated by the ingester service (Phase 3). amount_usd is filled '
  'by a separate price enrichment job.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 3 — Pre-computed aggregates (materialized hourly/daily by ingester)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE flow_aggregates_hourly (
  hour            TIMESTAMPTZ NOT NULL,
  blockchain      TEXT        NOT NULL,
  symbol          TEXT        NOT NULL,
  exchange_name   TEXT        NOT NULL,
  direction       TEXT        NOT NULL CHECK (direction IN ('inflow', 'outflow')),
  total_usd       NUMERIC     NOT NULL DEFAULT 0,
  num_transfers   INTEGER     NOT NULL DEFAULT 0,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (hour, blockchain, symbol, exchange_name, direction)
);

CREATE INDEX idx_hourly_hour ON flow_aggregates_hourly (hour DESC);

CREATE TABLE flow_aggregates_daily (
  day             DATE        NOT NULL,
  region          TEXT        NOT NULL CHECK (region IN ('Korea', 'US', 'International')),
  symbol          TEXT        NOT NULL,
  total_inflow    NUMERIC     NOT NULL DEFAULT 0,
  total_outflow   NUMERIC     NOT NULL DEFAULT 0,
  net_flow        NUMERIC     GENERATED ALWAYS AS (total_inflow - total_outflow) STORED,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (day, region, symbol)
);

CREATE INDEX idx_daily_day ON flow_aggregates_daily (day DESC);

COMMENT ON TABLE flow_aggregates_hourly IS
  'Pre-computed hourly aggregates from stablecoin_transfers. '
  'The ingester recomputes these on a rolling basis. '
  'Dashboard reads these instead of querying raw transfers.';

COMMENT ON TABLE flow_aggregates_daily IS
  'Pre-computed daily regional net flows. Mirrors the RESERVE_LEVEL_QUERY '
  'output from Dune so the dashboard component needs no code change when '
  'switching data sources.';


-- ─────────────────────────────────────────────────────────────────────────────
-- Migration tracking
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE schema_migrations (
  version     TEXT        PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_initial');
