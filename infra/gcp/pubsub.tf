# ── Pub/Sub Topics ────────────────────────────────────────────────────────────
#
# One topic per domain event stream. The outbox-publisher reads from each
# service's outbox table and publishes messages to the corresponding topic.
# All subscriptions are push-based, delivering to service /events endpoints.

locals {
  pubsub_topics = {
    "lead-events"     = "Lead domain events (lead.created, lead.scored, lead.bounced)"
    "campaign-events" = "Campaign events (campaign.launched, step.completed, etc.)"
    "deal-events"     = "CRM deal events (deal.won, deal.lost, stage.changed)"
    "booking-events"  = "Booking events (booking.confirmed, booking.cancelled)"
    "message-events"  = "Outreach events (message.sent, message.opened, message.replied)"
    "billing-events"  = "Billing events (plan.upgraded, credits.exhausted)"
    "content-events"  = "AI content events (content.generated, content.job_completed)"
    "comment-events"  = "Social comment events (comment.captured)"
  }

  # push subscriptions: topic → list of {service, path}
  pubsub_subscriptions = {
    "lead-events-to-campaign" = {
      topic   = "lead-events"
      service = "campaign-service"
      path    = "/v1/events/lead"
    }
    "lead-events-to-analytics" = {
      topic   = "lead-events"
      service = "analytics-service"
      path    = "/v1/events/lead"
    }
    "lead-events-to-notification" = {
      topic   = "lead-events"
      service = "notification-service"
      path    = "/v1/events/lead"
    }
    "campaign-events-to-outreach" = {
      topic   = "campaign-events"
      service = "outreach-service"
      path    = "/v1/events/campaign"
    }
    "campaign-events-to-analytics" = {
      topic   = "campaign-events"
      service = "analytics-service"
      path    = "/v1/events/campaign"
    }
    "campaign-events-to-notification" = {
      topic   = "campaign-events"
      service = "notification-service"
      path    = "/v1/events/campaign"
    }
    "deal-events-to-customer" = {
      topic   = "deal-events"
      service = "customer-service"
      path    = "/v1/events/deal"
    }
    "deal-events-to-analytics" = {
      topic   = "deal-events"
      service = "analytics-service"
      path    = "/v1/events/deal"
    }
    "deal-events-to-notification" = {
      topic   = "deal-events"
      service = "notification-service"
      path    = "/v1/events/deal"
    }
    "deal-events-to-billing" = {
      topic   = "deal-events"
      service = "billing-service"
      path    = "/v1/events/deal"
    }
    "booking-events-to-analytics" = {
      topic   = "booking-events"
      service = "analytics-service"
      path    = "/v1/events/booking"
    }
    "booking-events-to-notification" = {
      topic   = "booking-events"
      service = "notification-service"
      path    = "/v1/events/booking"
    }
    "message-events-to-analytics" = {
      topic   = "message-events"
      service = "analytics-service"
      path    = "/v1/events/message"
    }
    "billing-events-to-notification" = {
      topic   = "billing-events"
      service = "notification-service"
      path    = "/v1/events/billing"
    }
    "comment-events-to-lead" = {
      topic   = "comment-events"
      service = "lead-service"
      path    = "/v1/events/comment"
    }
    "comment-events-to-analytics" = {
      topic   = "comment-events"
      service = "analytics-service"
      path    = "/v1/events/comment"
    }
  }
}

resource "google_pubsub_topic" "topics" {
  for_each = local.pubsub_topics

  name    = "revlooper-${var.environment}-${each.key}"
  project = var.project_id

  labels = {
    environment = var.environment
    managed-by  = "terraform"
  }

  message_retention_duration = "604800s" # 7 days

  depends_on = [google_project_service.apis]
}

# Dead-letter topics for failed deliveries
resource "google_pubsub_topic" "dead_letter" {
  for_each = local.pubsub_topics

  name    = "revlooper-${var.environment}-${each.key}-dlq"
  project = var.project_id

  labels = {
    environment = var.environment
    managed-by  = "terraform"
    type        = "dead-letter"
  }

  message_retention_duration = "604800s" # 7 days
}

# Push subscriptions to Cloud Run services
resource "google_pubsub_subscription" "push_subscriptions" {
  for_each = local.pubsub_subscriptions

  name    = "revlooper-${var.environment}-${each.key}"
  topic   = google_pubsub_topic.topics[each.value.topic].name
  project = var.project_id

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.services[each.value.service].uri}${each.value.path}"

    oidc_token {
      service_account_email = google_service_account.services[each.value.service].email
    }
  }

  ack_deadline_seconds       = 60
  message_retention_duration = "604800s" # 7 days

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter[each.value.topic].id
    max_delivery_attempts = 5
  }

  depends_on = [google_cloud_run_v2_service.services]
}
