/**
 * GCS helpers for fetching latest_indices.json.
 *
 * Credentials:
 * - GCP_CREDENTIALS: Base64-encoded JSON key (Terraform output) or raw JSON string
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to service_account.json (local dev)
 *
 * Bucket: GCP_BUCKET_NAME (default: stablecoin-flow-data)
 */

import { Storage } from "@google-cloud/storage";

function getCredentials(): Record<string, unknown> | undefined {
  const raw = process.env.GCP_CREDENTIALS;
  if (!raw) return undefined;

  // Try base64 first (Terraform outputs base64)
  try {
    const buf = Buffer.from(raw, "base64");
    const text = buf.toString("utf-8");
    if (text.startsWith("{")) {
      return JSON.parse(text) as Record<string, unknown>;
    }
  } catch {
    // fall through to raw JSON
  }

  // Raw JSON string
  try {
    if (raw.startsWith("{")) {
      return JSON.parse(raw) as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function createStorageClient(): Storage {
  const credentials = getCredentials();
  if (credentials) {
    return new Storage({ credentials });
  }
  // Fallback: GOOGLE_APPLICATION_CREDENTIALS path (local dev)
  return new Storage();
}

const BLOB_KEY = "latest_indices.json";

export async function fetchLatestIndices(): Promise<Record<string, unknown> | null> {
  const bucketName = process.env.GCP_BUCKET_NAME ?? "stablecoin-flow-data";
  const storage = createStorageClient();
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(BLOB_KEY);

  const [exists] = await blob.exists();
  if (!exists) return null;

  const [contents] = await blob.download();
  const text = contents.toString("utf-8");
  return JSON.parse(text) as Record<string, unknown>;
}
