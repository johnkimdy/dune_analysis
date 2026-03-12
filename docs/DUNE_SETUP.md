# Dune Setup for Core Metrics (M, V, KFI)

## GCP Infra Overview

| Component | Purpose |
|-----------|---------|
| **GCS bucket** `stablecoin-flow-data` | Stores `latest_indices.json` and `indices/indices_YYYYMMDD.parquet` |
| **Pipeline SA** `stablecoin-pipeline@{project}.iam.gserviceaccount.com` | Writes to GCS (used by `data_pipeline.py`) |
| **Terraform** | Creates bucket + SA in `infra/terraform/storage.tf` |

**Data flow:** Dune → `data_pipeline.py` → GCP Storage → Frontend (Phase 3)

---

## Dune Queries

### Query 1: Supply + Volume (M, V)

**Purpose:** Global supply, daily volume, market cap for USDT, USDC, FDUSD.

**Output:** `date`, `symbol`, `supply`, `daily_volume`, `market_cap`

**Source:** `scripts/dune_queries_phase1.sql` (first block) or `PHASE1_SUPPLY_VELOCITY_QUERY` in `queries.ts`

**Env:** `DUNE_QUERY_IDS=<query_id>`

---

### Query 2: Korean Exchange Volume (KFI)

**Purpose:** Daily volume through Korean CEXes (Upbit, Bithumb, Coinone, Korbit, GOPAX) for KFI.

**Output:** `date`, `symbol`, `korean_daily_volume`

**Source:** `scripts/dune_queries_phase1.sql` (second block) or `PHASE1_KOREAN_VOLUME_QUERY` in `queries.ts`

**Env:** `DUNE_QUERY_ID_KOREAN_VOLUME=<query_id>` (optional; KFI omitted if unset)

---

## Setup Steps

1. **Create both queries in Dune** — paste SQL, run, save. Note the Query IDs.

2. **Add to `.env`:**
   ```
   DUNE_API_KEY=your_key
   DUNE_QUERY_IDS=1234567
   DUNE_QUERY_ID_KOREAN_VOLUME=7654321
   GCP_BUCKET_NAME=stablecoin-flow-data
   GOOGLE_APPLICATION_CREDENTIALS=./service_account.json
   ```

3. **GCP credentials** — either:
   - Run `terraform output -raw pipeline_service_account_key_b64 | base64 -d > service_account.json` (after `terraform apply`), or
   - Create a key for the pipeline SA in GCP Console.

4. **Run pipeline:**
   ```bash
   conda activate stablecoinmustflow
   python scripts/data_pipeline.py
   ```

---

## Terraform: Create Bucket + Pipeline SA

**Checklist before apply:**
- [ ] `terraform.tfvars` has `project_id`, `prod_db_password`, `staging_db_password`
- [ ] `gcs_bucket_name` in tfvars matches `GCP_BUCKET_NAME` in `.env` (default: `stablecoin-flow-data`)
- [ ] `backend.config` exists (from `backend.config.example`) with your state bucket
- [ ] State bucket created: `gsutil mb -l us-central1 gs://YOUR_PROJECT_ID-tfstate`

```bash
cd infra/terraform
terraform init -backend-config=backend.config
terraform plan
terraform apply
```

Then:
```bash
terraform output -raw pipeline_service_account_key_b64 | base64 -d > service_account.json
```

Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of `service_account.json`.

---

## Output Schema

**latest_indices.json:**
```json
{
  "generated_at": "2026-03-10T12:00:00Z",
  "stamp": "20260310",
  "metrics": ["m_7d", "m_30d", "velocity", "kfi"],
  "latest": [
    { "date": "2026-03-10", "symbol": "USDT", "m_7d": 0.001, "m_30d": -0.002, "velocity": 0.15, "kfi": 0.42, "krw_usd_close": 0.00074 }
  ],
  "summary": { "date_range": { "min": "...", "max": "..." }, "symbols": ["USDT", "USDC", "FDUSD"] }
}
```
