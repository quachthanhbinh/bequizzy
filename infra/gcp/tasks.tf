# ── Cloud Tasks Queues ────────────────────────────────────────────────────────
#
# sequence-steps: Campaign sequence step execution tasks enqueued by
# campaign-service and consumed by sequence-worker (GKE).
# Each task = one sequence step delivery for one lead.

resource "google_cloud_tasks_queue" "sequence_steps" {
  name     = "revlooper-${var.environment}-sequence-steps"
  location = var.region
  project  = var.project_id

  rate_limits {
    max_concurrent_dispatches = 500
    max_dispatches_per_second = 100
  }

  retry_config {
    max_attempts  = 5
    max_backoff   = "3600s"
    min_backoff   = "10s"
    max_doublings = 5
  }

  stackdriver_logging_config {
    sampling_ratio = var.environment == "production" ? 0.01 : 1.0
  }

  depends_on = [google_project_service.apis]
}

# AI enrichment tasks — for async lead enrichment (Apollo/Hunter API calls)
resource "google_cloud_tasks_queue" "lead_enrichment" {
  name     = "revlooper-${var.environment}-lead-enrichment"
  location = var.region
  project  = var.project_id

  rate_limits {
    max_concurrent_dispatches = 50
    max_dispatches_per_second = 10
  }

  retry_config {
    max_attempts  = 3
    max_backoff   = "300s"
    min_backoff   = "30s"
    max_doublings = 3
  }

  stackdriver_logging_config {
    sampling_ratio = var.environment == "production" ? 0.1 : 1.0
  }

  depends_on = [google_project_service.apis]
}
