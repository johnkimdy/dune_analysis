/**
 * GET /api/stablecoin-flows
 *
 * Data source precedence:
 *   1. GCP Cloud SQL — latest dashboard_snapshots row (fast, free)
 *   2. Mock data     — if DB is unconfigured or has no snapshot yet
 *
 * Dune is NEVER called here. It only runs via POST /api/admin/sync,
 * which is protected by ADMIN_SECRET and stores results in the DB.
 *
 * Caching: Vercel CDN caches DB responses for 24 h (s-maxage).
 * Mock responses are not cached (no-store) since they're random.
 * The daily cron in vercel.json calls this endpoint at midnight UTC
 * to pre-warm the CDN cache after the nightly admin/sync runs.
 */

import { NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/db";
import { generateMockDashboardData } from "@/lib/mock-data";
import type { DashboardData, ApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 15; // DB reads are fast; 15s is more than enough

export async function GET(): Promise<NextResponse<ApiResponse<DashboardData>>> {
  try {
    // ── 1. Try GCP DB ──
    const dbData = await getLatestSnapshot();
    if (dbData) {
      return NextResponse.json(
        { data: dbData, error: null },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=86400, stale-while-revalidate=3600",
            "X-Data-Source": "db",
          },
        }
      );
    }

    // ── 2. Fall back to mock data ──
    // DB is not configured yet, or no snapshot has been synced today.
    // Run `POST /api/admin/sync` to populate the DB from Dune.
    console.warn("[api] No DB snapshot found — serving mock data");
    const mockData = generateMockDashboardData();

    return NextResponse.json(
      { data: mockData, error: null },
      {
        headers: {
          // Never cache mock data at the CDN — it's generated fresh each call
          "Cache-Control": "no-store",
          "X-Data-Source": "mock",
        },
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    console.error("[api] stablecoin-flows:", message);
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
