/**
 * GET /api/indices
 *
 * Fetches latest_indices.json from GCS (uploaded by data_pipeline.py).
 * Contains M, V, KFI metrics and summary metadata.
 *
 * Requires: GCP_CREDENTIALS, GCP_BUCKET_NAME (optional, defaults to stablecoin-flow-data)
 * App SA must have roles/storage.objectViewer on the bucket.
 */

import { NextResponse } from "next/server";
import { fetchLatestIndices } from "@/lib/gcp-storage";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  try {
    const data = await fetchLatestIndices();
    if (!data) {
      return NextResponse.json(
        { data: null, error: "latest_indices.json not found in bucket" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { data, error: null },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=600",
          "X-Data-Source": "gcs",
        },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    console.error("[api] indices:", message);
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
