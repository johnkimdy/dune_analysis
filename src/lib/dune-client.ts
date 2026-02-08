const DUNE_API_BASE = "https://api.dune.com/api/v1";
const POLL_INTERVAL_MS = 2000;

function getApiKey(): string {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    throw new Error("DUNE_API_KEY environment variable is not set");
  }
  return apiKey;
}

async function duneRequest(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(`${DUNE_API_BASE}${path}`, {
    ...options,
    headers: {
      "X-Dune-Api-Key": getApiKey(),
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dune API ${res.status}: ${body}`);
  }
  return res;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeDuneQuery<T>(sql: string): Promise<T[]> {
  // 1. Execute SQL via the free-tier endpoint
  const executeRes = await duneRequest("/sql/execute", {
    method: "POST",
    body: JSON.stringify({ sql, performance: "medium" }),
  });
  const { execution_id } = (await executeRes.json()) as {
    execution_id: string;
  };

  // 2. Poll until complete
  while (true) {
    await sleep(POLL_INTERVAL_MS);

    const statusRes = await duneRequest(
      `/execution/${execution_id}/status`
    );
    const statusData = await statusRes.json();
    const state = statusData.state as string;

    if (state === "QUERY_STATE_COMPLETED") break;
    if (state === "QUERY_STATE_FAILED") {
      const errMsg =
        statusData.error?.message ||
        statusData.error ||
        JSON.stringify(statusData);
      throw new Error(`Dune query failed: ${errMsg}`);
    }
    if (state === "QUERY_STATE_CANCELLED") {
      throw new Error("Dune query was cancelled");
    }
  }

  // 3. Fetch results
  const resultsRes = await duneRequest(
    `/execution/${execution_id}/results`
  );
  const data = (await resultsRes.json()) as {
    result?: { rows?: T[] };
  };

  return data.result?.rows ?? [];
}
