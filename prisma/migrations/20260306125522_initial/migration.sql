-- CreateTable
CREATE TABLE "dashboard_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshot_date" DATE NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'dune',
    "row_counts" JSONB,
    "fetch_duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stablecoin_transfers" (
    "id" BIGSERIAL NOT NULL,
    "blockchain" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_time" TIMESTAMPTZ(6) NOT NULL,
    "symbol" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "amount_raw" DECIMAL NOT NULL,
    "amount_usd" DECIMAL,
    "exchange_name" TEXT,
    "direction" TEXT,
    "ingested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stablecoin_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_aggregates_hourly" (
    "hour" TIMESTAMPTZ(6) NOT NULL,
    "blockchain" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange_name" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "total_usd" DECIMAL NOT NULL DEFAULT 0,
    "num_transfers" INTEGER NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flow_aggregates_hourly_pkey" PRIMARY KEY ("hour","blockchain","symbol","exchange_name","direction")
);

-- CreateTable
CREATE TABLE "flow_aggregates_daily" (
    "day" DATE NOT NULL,
    "region" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "total_inflow" DECIMAL NOT NULL DEFAULT 0,
    "total_outflow" DECIMAL NOT NULL DEFAULT 0,
    "net_flow" DECIMAL NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flow_aggregates_daily_pkey" PRIMARY KEY ("day","region","symbol")
);

-- CreateIndex
CREATE INDEX "dashboard_snapshots_snapshot_date_idx" ON "dashboard_snapshots"("snapshot_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_snapshots_snapshot_date_source_key" ON "dashboard_snapshots"("snapshot_date", "source");

-- CreateIndex
CREATE INDEX "stablecoin_transfers_block_time_idx" ON "stablecoin_transfers"("block_time" DESC);

-- CreateIndex
CREATE INDEX "stablecoin_transfers_blockchain_block_time_idx" ON "stablecoin_transfers"("blockchain", "block_time" DESC);

-- CreateIndex
CREATE INDEX "stablecoin_transfers_exchange_name_block_time_idx" ON "stablecoin_transfers"("exchange_name", "block_time" DESC);

-- CreateIndex
CREATE INDEX "stablecoin_transfers_symbol_block_time_idx" ON "stablecoin_transfers"("symbol", "block_time" DESC);

-- CreateIndex
CREATE INDEX "stablecoin_transfers_amount_usd_idx" ON "stablecoin_transfers"("amount_usd" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "stablecoin_transfers_blockchain_tx_hash_from_address_to_add_key" ON "stablecoin_transfers"("blockchain", "tx_hash", "from_address", "to_address");

-- CreateIndex
CREATE INDEX "flow_aggregates_hourly_hour_idx" ON "flow_aggregates_hourly"("hour" DESC);

-- CreateIndex
CREATE INDEX "flow_aggregates_daily_day_idx" ON "flow_aggregates_daily"("day" DESC);
