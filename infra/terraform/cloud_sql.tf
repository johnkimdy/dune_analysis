# ─────────────────────────────────────────────────────────────────────────────
# PROD — Cloud SQL PostgreSQL instance
# ─────────────────────────────────────────────────────────────────────────────
resource "google_sql_database_instance" "prod" {
  name             = var.prod_instance_name
  database_version = var.db_version
  region           = var.region
  depends_on       = [google_project_service.sqladmin]

  settings {
    tier              = var.prod_tier
    availability_type = "ZONAL" # upgrade to REGIONAL for HA when needed

    ip_configuration {
      ipv4_enabled = true
      # Restrict to Vercel egress IPs (https://vercel.com/docs/edge-network/regions)
      # and your local IP. Add entries as needed.
      authorized_networks {
        name  = "allow-all-temp"
        value = "0.0.0.0/0"
        # IMPORTANT: replace with specific CIDRs before prod launch.
        # Vercel doesn't have fixed IPs — use Cloud SQL Connector (IAM auth)
        # to avoid needing authorized_networks at all.
      }
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00" # 3am UTC
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
      }
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 4 # 4am UTC
      update_track = "stable"
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "On"
    }

    # Disabling deletion protection allows `terraform destroy` — enable for prod
    deletion_protection_enabled = false
  }

  deletion_protection = false # set to true once stable
}

resource "google_sql_database" "prod" {
  name     = var.prod_db_name
  instance = google_sql_database_instance.prod.name
}

resource "google_sql_user" "prod" {
  name     = var.prod_db_user
  instance = google_sql_database_instance.prod.name
  password = var.prod_db_password
}

resource "google_sql_user" "app_iam_prod" {
  name     = replace(google_service_account.app.email, ".gserviceaccount.com", "")
  instance = google_sql_database_instance.prod.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}

# ─────────────────────────────────────────────────────────────────────────────
# STAGING — Identical config, smaller footprint
# ─────────────────────────────────────────────────────────────────────────────
resource "google_sql_database_instance" "staging" {
  name             = var.staging_instance_name
  database_version = var.db_version
  region           = var.region
  depends_on       = [google_project_service.sqladmin]

  settings {
    tier              = var.staging_tier
    availability_type = "ZONAL"

    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "allow-all-temp"
        value = "0.0.0.0/0"
      }
    }

    backup_configuration {
      enabled    = true
      start_time = "03:00"
      backup_retention_settings {
        retained_backups = 3
      }
    }

    database_flags {
      name  = "max_connections"
      value = "50"
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "On"
    }

    deletion_protection_enabled = false
  }

  deletion_protection = false
}

resource "google_sql_database" "staging" {
  name     = var.staging_db_name
  instance = google_sql_database_instance.staging.name
}

resource "google_sql_user" "staging" {
  name     = var.staging_db_user
  instance = google_sql_database_instance.staging.name
  password = var.staging_db_password
}

resource "google_sql_user" "app_iam_staging" {
  name     = replace(google_service_account.app.email, ".gserviceaccount.com", "")
  instance = google_sql_database_instance.staging.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}
