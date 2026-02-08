import { NextResponse } from "next/server";
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
import { getCached, setCache } from "@/lib/cache";
import { transformDashboardData } from "@/lib/utils";
import type {
  FlowRow,
  ReserveRow,
  WhaleAlertRow,
  SubstitutionRow,
  CounterpartyRow,
  DefiOutflowRow,
  CrossChainRow,
  DashboardData,
  ApiResponse,
} from "@/lib/types";

const CACHE_KEY = "stablecoin-flows-dashboard-v2";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(): Promise<
  NextResponse<ApiResponse<DashboardData>>
> {
  try {
    const cached = getCached<DashboardData>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ data: cached, error: null });
    }

    // Execute all 7 queries in parallel
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

    const transformed = transformDashboardData(
      flowRows,
      reserveRows,
      whaleRows,
      substitutionRows,
      counterpartyRows,
      defiOutflowRows,
      crossChainRows
    );

    const dashboardData: DashboardData = {
      ...transformed,
      lastUpdated: new Date().toISOString(),
    };

    setCache(CACHE_KEY, dashboardData);

    return NextResponse.json({ data: dashboardData, error: null });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error fetching data";
    console.error("Stablecoin flows API error:", message);
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
