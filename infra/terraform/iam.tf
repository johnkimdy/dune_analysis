# ── Application service account (used by the Next.js app on Vercel) ──
resource "google_service_account" "app" {
  account_id   = "stablecoin-app"
  display_name = "Stablecoin Dashboard App (Vercel)"
  depends_on   = [google_project_service.iam]
}

resource "google_project_iam_member" "app_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app.email}"
}

resource "google_project_iam_member" "app_cloudsql_instance_user" {
  project = var.project_id
  role    = "roles/cloudsql.instanceUser"
  member  = "serviceAccount:${google_service_account.app.email}"
}

# ── Ingestion service account (used by future RPC ingestion workers) ──
resource "google_service_account" "ingester" {
  account_id   = "stablecoin-ingester"
  display_name = "Stablecoin RPC Ingester (future Cloud Run / GCE)"
  depends_on   = [google_project_service.iam]
}

resource "google_project_iam_member" "ingester_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.ingester.email}"
}

resource "google_project_iam_member" "ingester_cloudsql_instance_user" {
  project = var.project_id
  role    = "roles/cloudsql.instanceUser"
  member  = "serviceAccount:${google_service_account.ingester.email}"
}

# ── Create a JSON key for the app service account ──
# This key gets base64-encoded and stored in Vercel as GCP_CREDENTIALS env var.
resource "google_service_account_key" "app_key" {
  service_account_id = google_service_account.app.name
}
