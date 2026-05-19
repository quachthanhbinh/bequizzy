# ── Per-service IAM service accounts ─────────────────────────────────────────
#
# Each Cloud Run service runs as its own service account with the principle of
# least privilege. Only the minimum GCP roles required are granted.
#
# Secret Manager access is granted to every service account so they can read
# their own secrets (pattern: secret names include the service name as prefix).

locals {
  # Cloud Run services (name → human-readable display name)
  service_accounts = {
    "api-gateway"          = "RevLooper API Gateway"
    "workspace-service"    = "RevLooper Workspace Service"
    "lead-service"         = "RevLooper Lead Service"
    "campaign-service"     = "RevLooper Campaign Service"
    "outreach-service"     = "RevLooper Outreach Service"
    "ai-service"           = "RevLooper AI Service"
    "booking-service"      = "RevLooper Booking Service"
    "crm-service"          = "RevLooper CRM Service"
    "customer-service"     = "RevLooper Customer Service"
    "billing-service"      = "RevLooper Billing Service"
    "analytics-service"    = "RevLooper Analytics Service"
    "notification-service" = "RevLooper Notification Service"
    "integration-service"  = "RevLooper Integration Service"
    "outbox-publisher"     = "RevLooper Outbox Publisher Job"
    "analytics-aggregator" = "RevLooper Analytics Aggregator Job"
    "sequence-worker"      = "RevLooper Sequence Worker (GKE)"
    "scoring-worker"       = "RevLooper Scoring Worker (GKE)"
  }
}

resource "google_service_account" "services" {
  for_each = local.service_accounts

  account_id   = "revlooper-${each.key}"
  display_name = each.value
  project      = var.project_id
}

# ── Secret Manager accessor role for every service account ───────────────────

resource "google_project_iam_member" "secret_accessor" {
  for_each = local.service_accounts

  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.services[each.key].email}"
}

# ── Pub/Sub publisher — services that write to outbox are also Pub/Sub publishers
#    (via outbox-publisher job, but services need to publish to Pub/Sub for
#    direct event emission in edge cases).

locals {
  pubsub_publishers = toset([
    "outbox-publisher",
    "ai-service",
    "notification-service",
  ])
}

resource "google_project_iam_member" "pubsub_publisher" {
  for_each = local.pubsub_publishers

  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.services[each.key].email}"
}

# ── Pub/Sub subscriber — services that receive events via push subscriptions ──

locals {
  pubsub_subscribers = toset([
    "lead-service",
    "campaign-service",
    "outreach-service",
    "customer-service",
    "analytics-service",
    "notification-service",
    "billing-service",
    "sequence-worker",
    "scoring-worker",
  ])
}

resource "google_project_iam_member" "pubsub_subscriber" {
  for_each = local.pubsub_subscribers

  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.services[each.key].email}"
}

# ── Cloud Tasks enqueuer — campaign-service enqueues sequence steps ───────────

resource "google_project_iam_member" "tasks_enqueuer" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${google_service_account.services["campaign-service"].email}"
}

# ── outbox-publisher: needs to UPDATE outbox_events.published (DB UPDATE) ─────
#    This is done via database connection, not GCP role.
#    Granting Cloud Run Job invoker so Cloud Scheduler can trigger it.

resource "google_project_iam_member" "outbox_publisher_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.services["outbox-publisher"].email}"
}

resource "google_project_iam_member" "analytics_aggregator_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.services["analytics-aggregator"].email}"
}

# ── GKE workload identity — binds GKE K8s service accounts to GCP SAs ────────

resource "google_service_account_iam_member" "sequence_worker_wi" {
  service_account_id = google_service_account.services["sequence-worker"].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[revlooper/sequence-worker]"
}

resource "google_service_account_iam_member" "scoring_worker_wi" {
  service_account_id = google_service_account.services["scoring-worker"].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[revlooper/scoring-worker]"
}

# ── Artifact Registry reader for all service accounts ────────────────────────

resource "google_artifact_registry_repository_iam_member" "readers" {
  for_each = local.service_accounts

  provider   = google-beta
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.services.repository_id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.services[each.key].email}"
}
