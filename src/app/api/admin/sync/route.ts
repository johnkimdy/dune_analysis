/**
 * POST /api/admin/sync
 *
 * The ONLY endpoint that calls Dune. Requires ADMIN_SECRET header.
 * Runs all 7 queries, transforms the data, and saves a snapshot to GCP.
 *
 * Usage (manual):
 *   curl -X POST https://your-domain.com/api/admin/sync \
 *     -H "x-admin-secret: YOUR_ADMIN_SECRET"
 *
 * Usage (automated):
 *   Set up a Vercel cron in vercel.json:
 *     { "path": "/api/admin/sync", "schedule": "0 1 * * *" }
 *   And pass the secret via the Authorization header in the cron config.
 *   OR use a GitHub Actions cron workflow that hits this endpoint with the secret.
 *
 * Cost awareness:
 *   One call = 7 Dune queries = ~0.238 credits (per your analysis).
 *   Daily = ~7.1 credits/month. Keep it at most once/day.
 */

import { NextRequest, NextResponse } from "next/server";
import { executeDuneQuery } from "@/lib/dune-client";
import {
  FLOWS_QUERY,
  RESERVE_LEVEL_QUERY,
  WHALE_ALERTS_QUERY,
  SUBSTITUTION_RATIO_QUERY,
  COUNTERPARTY_QUERY,
  DEFI_OUTFLOW_QUERY,
  CROSS_CHAIN_QUERY,
} from "@/lib/queries";
import { transformDashboardData } from "@/lib/utils";
import { saveSnapshot } from "@/lib/db";
import type {
  FlowRow,
  ReserveRow,
  WhaleAlertRow,
  SubstitutionRow,
  CounterpartyRow,
  DefiOutflowRow,
  CrossChainRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Dune queries can take a few minutes

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    console.error("[admin/sync] ADMIN_SECRET env var is not set");
    return false;
  }
  const header =
    req.headers.get("x-admin-secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  return header === secret;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();
  console.log("[admin/sync] Starting Dune query run...");

  try {
    // Run all 7 queries in parallel — this is the expensive Dune call
    const [
      flowRows,
      reserveRows,
      whaleRows,
      substitutionRows,
      counterpartyRows,
      defiOutflowRows,
      crossChainRows,
    ] = await Promise.all([
      executeDuneQuery<FlowRow>(FLOWS_QUERY),
      executeDuneQuery<ReserveRow>(RESERVE_LEVEL_QUERY),
      executeDuneQuery<WhaleAlertRow>(WHALE_ALERTS_QUERY),
      executeDuneQuery<SubstitutionRow>(SUBSTITUTION_RATIO_QUERY),
      executeDuneQuery<CounterpartyRow>(COUNTERPARTY_QUERY),
      executeDuneQuery<DefiOutflowRow>(DEFI_OUTFLOW_QUERY),
      executeDuneQuery<CrossChainRow>(CROSS_CHAIN_QUERY),
    ]);

    const fetchDurationMs = Date.now() - startMs;

    const rowCounts = {
      flows: flowRows.length,
      reserve: reserveRows.length,
      whale: whaleRows.length,
      substitution: substitutionRows.length,
      counterparty: counterpartyRows.length,
      defiOutflow: defiOutflowRows.length,
      crossChain: crossChainRows.length,
    };

    console.log(
      `[admin/sync] Dune queries complete in ${fetchDurationMs}ms`,
      rowCounts
    );

    const transformed = transformDashboardData(
      flowRows,
      reserveRows,
      whaleRows,
      substitutionRows,
      counterpartyRows,
      defiOutflowRows,
      crossChainRows
    );

    const dashboardData = {
      ...transformed,
      lastUpdated: new Date().toISOString(),
    };

    // Save to GCP — upserts on (snapshot_date, source)
    await saveSnapshot(dashboardData, {
      source: "dune",
      fetchDurationMs,
      rowCounts,
    });

    return NextResponse.json({
      ok: true,
      fetchDurationMs,
      rowCounts,
      snapshotDate: new Date().toISOString().slice(0, 10),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin/sync] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — health check (shows whether DB is reachable and last snapshot date)
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pingDb, getLatestSnapshot } = await import("@/lib/db");
  const [dbAlive, snapshot] = await Promise.all([
    pingDb(),
    getLatestSnapshot(),
  ]);

  return NextResponse.json({
    dbAlive,
    hasSnapshot: !!snapshot,
    lastUpdated: snapshot?.lastUpdated ?? null,
    duneApiKeySet: !!process.env.DUNE_API_KEY,
  });
}
