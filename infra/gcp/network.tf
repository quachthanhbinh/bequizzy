# ── VPC ───────────────────────────────────────────────────────────────────────

resource "google_compute_network" "main" {
  name                    = "revlooper-${var.environment}"
  auto_create_subnetworks = false

  depends_on = [google_project_service.apis]
}

resource "google_compute_subnetwork" "main" {
  name          = "revlooper-${var.environment}-${var.region}"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.main.id

  private_ip_google_access = true
}

resource "google_compute_subnetwork" "gke" {
  name          = "revlooper-${var.environment}-gke"
  ip_cidr_range = "10.1.0.0/20"
  region        = var.region
  network       = google_compute_network.main.id

  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.10.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.20.0.0/20"
  }
}

# ── Serverless VPC Access Connector (Cloud Run → Redis / internal services) ──

resource "google_vpc_access_connector" "main" {
  name          = "revlooper-${var.environment}"
  region        = var.region
  network       = google_compute_network.main.id
  ip_cidr_range = "10.8.0.0/28"
  min_instances = 2
  max_instances = 10

  depends_on = [google_project_service.apis]
}

# ── Cloud NAT (outbound internet for Cloud Run / GKE) ────────────────────────

resource "google_compute_router" "main" {
  name    = "revlooper-${var.environment}"
  region  = var.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "main" {
  name                               = "revlooper-${var.environment}"
  router                             = google_compute_router.main.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
