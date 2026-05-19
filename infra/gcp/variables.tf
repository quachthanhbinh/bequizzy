variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Primary GCP region"
  type        = string
  default     = "asia-southeast1"
}

variable "zone" {
  description = "Primary GCP zone (for zonal resources)"
  type        = string
  default     = "asia-southeast1-a"
}

variable "environment" {
  description = "Deployment environment (staging | production)"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

variable "image_tag" {
  description = "Docker image tag deployed to Cloud Run services"
  type        = string
  default     = "latest"
}

variable "domain" {
  description = "Base domain for the platform (e.g. revlooper.com)"
  type        = string
  default     = "revlooper.com"
}

variable "db_host" {
  description = "Supabase PostgreSQL host (overridden per environment via tfvars)"
  type        = string
  sensitive   = true
}

variable "redis_memory_gb" {
  description = "Memorystore Redis instance size in GB"
  type        = number
  default     = 1
}

variable "gke_node_pool_min" {
  description = "GKE Autopilot minimum node count"
  type        = number
  default     = 0
}

variable "gke_node_pool_max" {
  description = "GKE Autopilot maximum node count"
  type        = number
  default     = 10
}
