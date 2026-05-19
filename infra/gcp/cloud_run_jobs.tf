# ── Cloud Run Jobs ────────────────────────────────────────────────────────────
#
# Jobs run on a schedule (via Cloud Scheduler) rather than handling HTTP traffic.
# - outbox-publisher: polls outbox_events tables and publishes to Pub/Sub
# - analytics-aggregator: refreshes campaign_stats materialized view + digests

resource "google_cloud_run_v2_job" "outbox_publisher" {
  name     = "revlooper-outbox-publisher-${var.environment}"
  location = var.region
  project  = var.project_id

  template {
    task_count  = 1
    parallelism = 1

    template {
      service_account = google_service_account.services["outbox-publisher"].email
      max_retries     = 3

      vpc_access {
        connector = google_vpc_access_connector.main.id
        egress    = "PRIVATE_RANGES_ONLY"
      }

      containers {
        image = "${local.image_base}/outbox-publisher:${var.image_tag}"

        resources {
          limits = {
            memory = "512Mi"
            cpu    = "1"
          }
        }

        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.secrets["database-url"].secret_id
              version = "latest"
            }
          }
        }

        env {
          name  = "PUBSUB_PROJECT_ID"
          value = var.project_id
        }

        # Outbox tables polled — comma-separated
        env {
          name  = "OUTBOX_TABLES"
          value = "outbox_events,lead_outbox_events,campaign_outbox_events,booking_outbox_events,deal_outbox_events,ai_outbox_events"
        }
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.services,
    google_vpc_access_connector.main,
  ]
}

resource "google_cloud_run_v2_job" "analytics_aggregator" {
  name     = "revlooper-analytics-aggregator-${var.environment}"
  location = var.region
  project  = var.project_id

  template {
    task_count  = 1
    parallelism = 1

    template {
      service_account = google_service_account.services["analytics-aggregator"].email
      max_retries     = 1

      vpc_access {
        connector = google_vpc_access_connector.main.id
        egress    = "PRIVATE_RANGES_ONLY"
      }

      containers {
        image = "${local.image_base}/analytics-aggregator:${var.image_tag}"

        resources {
          limits = {
            memory = "1Gi"
            cpu    = "2"
          }
        }

        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.secrets["database-url"].secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.services,
    google_vpc_access_connector.main,
  ]
}
