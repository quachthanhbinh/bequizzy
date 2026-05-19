# ── Cloud Run Services ────────────────────────────────────────────────────────
#
# All 13 HTTP services are defined here via a for_each loop over a service
# configuration map. Service-specific env vars are merged in the template.
# Each service runs as its own service account (defined in iam.tf).

locals {
  # Base environment variables shared by all services
  common_env = {
    ENVIRONMENT = var.environment
    REGION      = var.region
    LOG_LEVEL   = var.environment == "production" ? "INFO" : "DEBUG"
  }

  # Per-service configuration
  # Keys: image_suffix, port, min_instances, max_instances, memory, cpu, concurrency
  cloud_run_services = {
    "api-gateway" = {
      port          = 8080
      min_instances = 1
      max_instances = 20
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 250
    }
    "workspace-service" = {
      port          = 8080
      min_instances = 1
      max_instances = 10
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 100
    }
    "lead-service" = {
      port          = 8080
      min_instances = 1
      max_instances = 15
      memory        = "1Gi"
      cpu           = "2"
      concurrency   = 80
    }
    "campaign-service" = {
      port          = 8080
      min_instances = 1
      max_instances = 10
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 80
    }
    "outreach-service" = {
      port          = 8080
      min_instances = 1
      max_instances = 20
      memory        = "1Gi"
      cpu           = "2"
      concurrency   = 50
    }
    "ai-service" = {
      port          = 8080
      min_instances = 1
      max_instances = 10
      memory        = "2Gi"
      cpu           = "2"
      concurrency   = 30
    }
    "booking-service" = {
      port          = 8080
      min_instances = 0
      max_instances = 5
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 80
    }
    "crm-service" = {
      port          = 8080
      min_instances = 0
      max_instances = 5
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 80
    }
    "customer-service" = {
      port          = 8080
      min_instances = 0
      max_instances = 5
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 80
    }
    "billing-service" = {
      port          = 8080
      min_instances = 1
      max_instances = 10
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 50
    }
    "analytics-service" = {
      port          = 8080
      min_instances = 0
      max_instances = 10
      memory        = "1Gi"
      cpu           = "2"
      concurrency   = 200
    }
    "notification-service" = {
      port          = 8080
      min_instances = 0
      max_instances = 5
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 100
    }
    "integration-service" = {
      port          = 8080
      min_instances = 0
      max_instances = 5
      memory        = "512Mi"
      cpu           = "1"
      concurrency   = 50
    }
  }
}

resource "google_cloud_run_v2_service" "services" {
  for_each = local.cloud_run_services

  name     = "revlooper-${each.key}-${var.environment}"
  location = var.region
  project  = var.project_id

  ingress = each.key == "api-gateway" ? "INGRESS_TRAFFIC_ALL" : "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.services[each.key].email

    scaling {
      min_instance_count = each.value.min_instances
      max_instance_count = each.value.max_instances
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = "${local.image_base}/${each.key}:${var.image_tag}"

      ports {
        container_port = each.value.port
      }

      resources {
        limits = {
          memory = each.value.memory
          cpu    = each.value.cpu
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      dynamic "env" {
        for_each = local.common_env
        content {
          name  = env.key
          value = env.value
        }
      }

      # DATABASE_URL from Secret Manager
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["database-url"].secret_id
            version = "latest"
          }
        }
      }

      # REDIS_URL from Secret Manager
      env {
        name = "REDIS_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["redis-url"].secret_id
            version = "latest"
          }
        }
      }

      # OPENAI_API_KEY — only mounted for ai-service (used by LiteLLM for embeddings)
      dynamic "env" {
        for_each = each.key == "ai-service" ? [1] : []
        content {
          name = "OPENAI_API_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.secrets["openai-api-key"].secret_id
              version = "latest"
            }
          }
        }
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = each.value.port
        }
        initial_delay_seconds = 10
        period_seconds        = 30
        failure_threshold     = 3
      }

      startup_probe {
        http_get {
          path = "/health"
          port = each.value.port
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 12
      }
    }

    max_instance_request_concurrency = each.value.concurrency

    annotations = {
      "revlooper.com/service"     = each.key
      "revlooper.com/environment" = var.environment
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.services,
    google_secret_manager_secret.secrets,
    google_vpc_access_connector.main,
  ]
}

# ── Public access for api-gateway only ───────────────────────────────────────

resource "google_cloud_run_v2_service_iam_member" "api_gateway_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.services["api-gateway"].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Pub/Sub push subscriptions: allow Pub/Sub to invoke internal services ─────
# (The service account used by Pub/Sub is the project's default Pub/Sub SA)

data "google_project" "current" {
  project_id = var.project_id
}

resource "google_cloud_run_v2_service_iam_member" "pubsub_invokers" {
  for_each = toset([
    "lead-service",
    "campaign-service",
    "outreach-service",
    "customer-service",
    "analytics-service",
    "notification-service",
    "billing-service",
  ])

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.services[each.key].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}
