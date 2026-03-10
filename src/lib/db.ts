/**
 * Prisma client for the stablecoin dashboard.
 *
 * Connection strategy:
 *   - Local dev:  DATABASE_URL in .env.local → Docker Postgres
 *   - GCP/Vercel: DATABASE_URL in Vercel env vars → Cloud SQL public IP (direct TCP)
 *
 * Data source precedence (in the API route):
 *   DB → mock data
 *   Dune is NEVER called automatically. It's only called via the admin/sync endpoint.
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import type { DashboardData } from "./types";

let _prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!_prisma) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    _prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return _prisma;
}

function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function getLatestSnapshot(): Promise<DashboardData | null> {
  if (!isDbConfigured()) {
    console.warn("[db] DB not configured — skipping DB lookup");
    return null;
  }

  try {
    const row = await getPrisma().dashboardSnapshot.findFirst({
      orderBy: [{ snapshotDate: "desc" }, { createdAt: "desc" }],
    });

    if (!row) return null;

    console.log(
      `[db] Serving snapshot from ${row.snapshotDate.toISOString().slice(0, 10)} (source: ${row.source})`
    );

    const data = row.data as unknown as DashboardData;
    return {
      ...data,
      lastUpdated: data.lastUpdated ?? row.createdAt.toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[db] getLatestSnapshot error:", msg);
    return null;
  }
}

export async function saveSnapshot(
  data: DashboardData,
  opts: {
    source?: "dune" | "rpc" | "manual";
    fetchDurationMs?: number;
    rowCounts?: Record<string, number>;
  } = {}
): Promise<void> {
  if (!isDbConfigured()) {
    throw new Error("DB not configured — cannot save snapshot");
  }

  const { source = "dune", fetchDurationMs, rowCounts } = opts;
  const snapshotDate = new Date();
  snapshotDate.setUTCHours(0, 0, 0, 0);

  await getPrisma().dashboardSnapshot.upsert({
    where: { snapshotDate_source: { snapshotDate, source } },
    create: {
      snapshotDate,
      data: data as object,
      source,
      fetchDurationMs: fetchDurationMs ?? null,
      rowCounts: rowCounts ?? Prisma.JsonNull,
    },
    update: {
      data: data as object,
      fetchDurationMs: fetchDurationMs ?? null,
      rowCounts: rowCounts ?? Prisma.JsonNull,
      createdAt: new Date(),
    },
  });

  console.log(
    `[db] Saved snapshot for ${snapshotDate.toISOString().slice(0, 10)} (source: ${source})`
  );
}

export async function pingDb(): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
