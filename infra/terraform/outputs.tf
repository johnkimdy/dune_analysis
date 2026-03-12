output "prod_instance_connection_name" {
  description = "Cloud SQL connection name for prod — use as CLOUD_SQL_INSTANCE env var"
  value       = google_sql_database_instance.prod.connection_name
}

output "staging_instance_connection_name" {
  description = "Cloud SQL connection name for staging — use as CLOUD_SQL_INSTANCE env var"
  value       = google_sql_database_instance.staging.connection_name
}

output "prod_public_ip" {
  description = "Prod Cloud SQL public IP (needed if using direct TCP connection)"
  value       = google_sql_database_instance.prod.public_ip_address
}

output "staging_public_ip" {
  description = "Staging Cloud SQL public IP"
  value       = google_sql_database_instance.staging.public_ip_address
}

output "app_service_account_email" {
  value = google_service_account.app.email
}

output "app_service_account_key_b64" {
  description = "Base64-encoded JSON key — set this as GCP_CREDENTIALS in Vercel"
  value       = google_service_account_key.app_key.private_key
  sensitive   = true
}

output "ingester_service_account_email" {
  value = google_service_account.ingester.email
}

# ── Phase 1 pipeline (M, V, KFI indices) ──
output "gcs_bucket_name" {
  description = "GCS bucket for data_pipeline.py output (latest_indices.json, parquet)"
  value       = google_storage_bucket.indices.name
}

output "pipeline_service_account_email" {
  value = google_service_account.pipeline.email
}

output "pipeline_service_account_key_b64" {
  description = "Base64-encoded JSON key — save as service_account.json, set GOOGLE_APPLICATION_CREDENTIALS"
  value       = google_service_account_key.pipeline_key.private_key
  sensitive   = true
}

# ── Print Vercel env var block for easy copy-paste ──
output "vercel_env_vars_prod" {
  description = "Copy-paste these into Vercel > Project Settings > Environment Variables (Production)"
  sensitive   = true
  value       = <<-EOT
    CLOUD_SQL_INSTANCE=${google_sql_database_instance.prod.connection_name}
    DB_NAME=${var.prod_db_name}
    DB_USER=${var.prod_db_user}
    DB_PASSWORD=${var.prod_db_password}
    GCP_CREDENTIALS=<run: terraform output -raw app_service_account_key_b64>
    GCP_BUCKET_NAME=${google_storage_bucket.indices.name}
  EOT
}

output "vercel_env_vars_staging" {
  description = "Copy-paste these into Vercel > Project Settings > Environment Variables (Preview)"
  sensitive   = true
  value       = <<-EOT
    CLOUD_SQL_INSTANCE=${google_sql_database_instance.staging.connection_name}
    DB_NAME=${var.staging_db_name}
    DB_USER=${var.staging_db_user}
    DB_PASSWORD=${var.staging_db_password}
    GCP_CREDENTIALS=<same key as prod — or create a separate staging key>
    GCP_BUCKET_NAME=${google_storage_bucket.indices.name}
  EOT
}
