variable "project_id" {
  description = "GCP project ID (create this in the GCP console first, then paste here)"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud SQL instances"
  type        = string
  default     = "us-central1"
}

variable "db_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_16"
}

# ── Prod instance settings ──
variable "prod_instance_name" {
  type    = string
  default = "stablecoin-prod"
}

variable "prod_tier" {
  description = "Cloud SQL machine type for prod. db-f1-micro is the cheapest (~$7/mo). Upgrade to db-g1-small (~$25) when read load increases."
  type        = string
  default     = "db-f1-micro"
}

variable "prod_db_name" {
  type    = string
  default = "stablecoin_prod"
}

variable "prod_db_user" {
  type    = string
  default = "app_user"
}

variable "prod_db_password" {
  description = "Password for the prod DB user. Use a strong random string. Store in 1Password."
  type        = string
  sensitive   = true
}

# ── Staging instance settings ──
variable "staging_instance_name" {
  type    = string
  default = "stablecoin-staging"
}

variable "staging_tier" {
  description = "Cloud SQL machine type for staging. db-f1-micro is fine."
  type        = string
  default     = "db-f1-micro"
}

variable "staging_db_name" {
  type    = string
  default = "stablecoin_staging"
}

variable "staging_db_user" {
  type    = string
  default = "app_user"
}

variable "staging_db_password" {
  description = "Password for the staging DB user."
  type        = string
  sensitive   = true
}

variable "gcs_bucket_name" {
  description = "GCS bucket for pipeline indices (M, V, KFI). Must be globally unique."
  type        = string
  default     = "stablecoin-flow-data"
}
