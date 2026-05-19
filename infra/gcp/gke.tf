# ── GKE Autopilot Cluster ─────────────────────────────────────────────────────
#
# GKE Autopilot manages node provisioning automatically. Workloads:
# - sequence-worker: Deployment — consumes Cloud Tasks HTTP targets for
#   scheduled sequence step execution
# - scoring-worker: CronJob — periodic lead + customer health score recomputation

resource "google_container_cluster" "main" {
  provider = google-beta

  name     = "revlooper-${var.environment}"
  location = var.region
  project  = var.project_id

  enable_autopilot = true

  network    = google_compute_network.main.id
  subnetwork = google_compute_subnetwork.gke.id

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  vertical_pod_autoscaling {
    enabled = true
  }

  master_authorized_networks_config {
    # Allow access from any IP — restrict in production via VPN
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "all"
    }
  }

  logging_service    = "logging.googleapis.com/kubernetes"
  monitoring_service = "monitoring.googleapis.com/kubernetes"

  depends_on = [
    google_project_service.apis,
    google_compute_subnetwork.gke,
  ]
}
