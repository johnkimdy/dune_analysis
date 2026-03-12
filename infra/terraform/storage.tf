# ── GCS bucket for Phase 1 pipeline output (M, V, KFI indices) ──
# data_pipeline.py uploads: indices/indices_YYYYMMDD.parquet, latest_indices.json

resource "google_storage_bucket" "indices" {
  name     = var.gcs_bucket_name
  location = var.region
  project  = var.project_id
  depends_on = [google_project_service.storage]
}

# ── Pipeline service account (used by data_pipeline.py) ──
resource "google_service_account" "pipeline" {
  account_id   = "stablecoin-pipeline"
  display_name = "Phase 1 ETL Pipeline (Dune → GCS)"
  project      = var.project_id
  depends_on   = [google_project_service.iam]
}

resource "google_storage_bucket_iam_member" "pipeline_writer" {
  bucket = google_storage_bucket.indices.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.pipeline.email}"
}

# App SA reads indices for GET /api/indices (google_service_account.app from iam.tf)
resource "google_storage_bucket_iam_member" "app_reader" {
  bucket = google_storage_bucket.indices.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.app.email}"
}

# Key for local/CI runs — download and save as service_account.json
resource "google_service_account_key" "pipeline_key" {
  service_account_id = google_service_account.pipeline.name
}
