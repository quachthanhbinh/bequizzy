# ── Secret Manager — secret placeholders ─────────────────────────────────────
#
# Secrets are created as empty shells here. Actual values are populated
# out-of-band (CI/CD pipeline or gcloud CLI) and never stored in Terraform state.
# Pattern: gcloud secrets versions add {name} --data-file=-
#
# All services read secrets via:
#   DATABASE_URL = google_secret_manager_secret_version.data
# mounted as env vars in Cloud Run via secretKeyRef.

locals {
  secrets = {
    # Shared
    "database-url"               = "PostgreSQL connection string (Supabase)"
    "supabase-jwt-secret"        = "Supabase JWT signing secret"
    "redis-url"                  = "Memorystore Redis connection URL"

    # API Gateway
    "supabase-jwks-url"          = "Supabase JWKS endpoint for JWT verification"

    # AI service
    "openai-api-key"             = "OpenAI API key for LiteLLM"
    "anthropic-api-key"          = "Anthropic Claude API key"
    "gemini-api-key"             = "Google Gemini API key"

    # Outreach / mailbox OAuth
    "gmail-client-id"            = "Google OAuth2 client ID for Gmail"
    "gmail-client-secret"        = "Google OAuth2 client secret for Gmail"
    "outlook-client-id"          = "Microsoft OAuth2 client ID for Outlook"
    "outlook-client-secret"      = "Microsoft OAuth2 client secret for Outlook"
    "mailbox-token-key"          = "Fernet key for encrypting mailbox refresh tokens"

    # Booking service
    "cal-webhook-secret"         = "Cal.com webhook signing secret"

    # Billing
    "paddle-api-key"             = "Paddle API key"
    "paddle-webhook-secret"      = "Paddle webhook signing secret"

    # Notifications (Novu)
    "novu-api-key"               = "Novu API key"
    "novu-app-id"                = "Novu application ID"

    # Integration service / webhook handler
    "facebook-app-secret"        = "Facebook app secret for HMAC verification"
    "facebook-page-access-token" = "Facebook page access token template (per workspace in DB)"

    # Analytics
    "analytics-api-key"          = "Internal analytics service API key"
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each = local.secrets

  secret_id = "revlooper-${var.environment}-${each.key}"
  project   = var.project_id

  labels = {
    environment = var.environment
    managed-by  = "terraform"
  }

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}
