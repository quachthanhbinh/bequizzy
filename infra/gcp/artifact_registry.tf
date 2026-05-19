# ── Artifact Registry — Docker repository for all service images ──────────────

resource "google_artifact_registry_repository" "services" {
  provider = google-beta

  location      = var.region
  repository_id = "revlooper-services"
  description   = "Docker images for RevLooper microservices"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# Shorthand local for image base path
locals {
  image_base = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.services.repository_id}"
}
