# ── Memorystore Redis ─────────────────────────────────────────────────────────
#
# Used for:
# - API Gateway rate limiting (sliding window counters)
# - Comment-processor DM quota (500 DMs/day) and cooldown management
# - Session/cache storage for AI service

resource "google_redis_instance" "main" {
  name           = "revlooper-${var.environment}"
  tier           = var.environment == "production" ? "STANDARD_HA" : "BASIC"
  memory_size_gb = var.redis_memory_gb
  region         = var.region
  project        = var.project_id

  location_id             = var.zone
  alternative_location_id = var.environment == "production" ? "${var.region}-b" : null

  redis_version     = "REDIS_7_0"
  display_name      = "RevLooper ${var.environment} Redis"
  reserved_ip_range = "10.9.0.0/29"

  authorized_network = google_compute_network.main.id

  labels = {
    environment = var.environment
    managed-by  = "terraform"
  }

  depends_on = [
    google_project_service.apis,
    google_compute_network.main,
  ]
}
