# ── Cloud Scheduler Jobs ──────────────────────────────────────────────────────
#
# Note: Cloud Scheduler minimum interval is 1 minute.
# The outbox-publisher is designed to poll every 5 seconds in production
# (to minimize event delivery lag). Since Cloud Scheduler cannot trigger
# sub-minute intervals, this job is set to every 1 minute as the Cloud
# Scheduler trigger. For sub-minute polling, deploy outbox-publisher as a
# long-running process instead (e.g. a GKE Deployment with a polling loop).

resource "google_cloud_scheduler_job" "outbox_publisher" {
  name             = "revlooper-${var.environment}-outbox-publisher"
  description      = "Trigger outbox-publisher Cloud Run Job to relay events to Pub/Sub"
  schedule         = "* * * * *" # every minute (minimum; ideally run as daemon)
  time_zone        = "Asia/Singapore"
  region           = var.region
  project          = var.project_id
  attempt_deadline = "300s"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.outbox_publisher.name}:run"

    oauth_token {
      service_account_email = google_service_account.services["outbox-publisher"].email
    }
  }

  retry_config {
    retry_count          = 3
    min_backoff_duration = "5s"
    max_backoff_duration = "60s"
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_job.outbox_publisher,
  ]
}

resource "google_cloud_scheduler_job" "analytics_aggregator" {
  name             = "revlooper-${var.environment}-analytics-aggregator"
  description      = "Refresh campaign_stats materialized view and generate weekly digests"
  schedule         = "0 * * * *" # every hour
  time_zone        = "Asia/Singapore"
  region           = var.region
  project          = var.project_id
  attempt_deadline = "1800s"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.analytics_aggregator.name}:run"

    oauth_token {
      service_account_email = google_service_account.services["analytics-aggregator"].email
    }
  }

  retry_config {
    retry_count          = 1
    min_backoff_duration = "60s"
    max_backoff_duration = "300s"
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_job.analytics_aggregator,
  ]
}

# ── AI Brain Reflection — 7 daily-bucket schedulers ──────────────────────────
# One job per day-of-week bucket. Each triggers a POST to ai-service with the
# list of workspaces assigned to that bucket (hash(workspace_id) % 7).

locals {
  reflection_buckets = {
    "0" = { schedule = "0 2 * * 0", day = "Sunday" }
    "1" = { schedule = "0 2 * * 1", day = "Monday" }
    "2" = { schedule = "0 2 * * 2", day = "Tuesday" }
    "3" = { schedule = "0 2 * * 3", day = "Wednesday" }
    "4" = { schedule = "0 2 * * 4", day = "Thursday" }
    "5" = { schedule = "0 2 * * 5", day = "Friday" }
    "6" = { schedule = "0 2 * * 6", day = "Saturday" }
  }
}

resource "google_cloud_scheduler_job" "ai_brain_reflection" {
  for_each = local.reflection_buckets

  name             = "revlooper-${var.environment}-ai-brain-reflection-bucket-${each.key}"
  description      = "AI Brain reflection run for bucket ${each.key} (${each.value.day})"
  schedule         = each.value.schedule
  time_zone        = "Asia/Singapore"
  region           = var.region
  project          = var.project_id
  attempt_deadline = "1800s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.services["ai-service"].uri}/v1/internal/reflections/scheduled"
    body        = base64encode(jsonencode({ bucket = tonumber(each.key) }))

    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = google_service_account.services["ai-service"].email
      audience              = google_cloud_run_v2_service.services["ai-service"].uri
    }
  }

  retry_config {
    retry_count          = 2
    min_backoff_duration = "60s"
    max_backoff_duration = "600s"
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_service.services,
  ]
}

# ── Lead scoring refresh — daily at midnight SGT ──────────────────────────────

resource "google_cloud_scheduler_job" "lead_scoring" {
  name             = "revlooper-${var.environment}-lead-scoring-refresh"
  description      = "Trigger scoring-worker to recompute stale lead scores"
  schedule         = "0 0 * * *" # midnight SGT
  time_zone        = "Asia/Singapore"
  region           = var.region
  project          = var.project_id
  attempt_deadline = "1800s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.services["lead-service"].uri}/v1/internal/scoring/trigger"

    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = google_service_account.services["lead-service"].email
      audience              = google_cloud_run_v2_service.services["lead-service"].uri
    }
  }

  retry_config {
    retry_count          = 1
    min_backoff_duration = "60s"
    max_backoff_duration = "300s"
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_service.services,
  ]
}
