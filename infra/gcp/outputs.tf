output "api_gateway_url" {
  description = "Public URL of the API gateway (set as NEXT_PUBLIC_API_URL in frontend)"
  value       = google_cloud_run_v2_service.services["api-gateway"].uri
}

output "redis_host" {
  description = "Memorystore Redis host (accessible via VPC)"
  value       = google_redis_instance.main.host
  sensitive   = true
}

output "redis_port" {
  description = "Memorystore Redis port"
  value       = google_redis_instance.main.port
}

output "artifact_registry_url" {
  description = "Artifact Registry Docker repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.services.repository_id}"
}

output "gke_cluster_name" {
  description = "GKE Autopilot cluster name"
  value       = google_container_cluster.main.name
}

output "gke_cluster_endpoint" {
  description = "GKE cluster API endpoint"
  value       = google_container_cluster.main.endpoint
  sensitive   = true
}

output "vpc_connector_id" {
  description = "Serverless VPC Access connector ID (for Cloud Run services)"
  value       = google_vpc_access_connector.main.id
}

output "sequence_steps_queue" {
  description = "Cloud Tasks queue name for sequence step execution"
  value       = google_cloud_tasks_queue.sequence_steps.name
}

output "service_account_emails" {
  description = "Map of service name → service account email"
  value = {
    for name, sa in google_service_account.services : name => sa.email
  }
}

output "pubsub_topic_ids" {
  description = "Map of topic key → fully-qualified Pub/Sub topic ID"
  value = {
    for key, topic in google_pubsub_topic.topics : key => topic.id
  }
}
