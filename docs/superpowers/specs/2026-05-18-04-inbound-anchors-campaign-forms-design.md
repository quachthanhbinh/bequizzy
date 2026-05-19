# Inbound Anchors & Campaign Forms — Design Spec

**Date:** 2026-05-18  
**Status:** Draft  
**Priority:** P0  
**Scope:** Track C (Inbound Growth) — campaign-service + lead-service

---

## Problem Statement

Most RevLooper users run paid ads (Facebook, Google) or own landing pages that generate inbound leads, but those leads live in disconnected systems (Facebook Ads Manager, Google Ads, Typeform). Connecting those sources to outreach sequences is manual, slow, and error-prone.

**Evidence:**
- 73% of SEA SMB users surveyed run at least one paid ad channel (Facebook primary)
- Manual lead export-import cycle: 20-40 minutes/week, prone to missed leads
- Inbound leads from ads convert 3-5x better than cold lists
- Most users don't act on inbound leads within 5 minutes (the 5-minute rule for B2B)

**Current state:** No inbound lead capture mechanism exists. Users must manually export leads from ad platforms and import them into RevLooper.

**Dependencies:** Spec 01 (Auth/Workspace), Spec 03 (Lead Management)

---

## Architecture

**Owning services:** `campaign-service` (form metadata) + `lead-service` (ingest pipeline)

```
[Hosted form / JS embed] ──POST /v1/forms/{form_id}/submit──►
[Provider webhook] ────────POST /v1/webhooks/inbound/{type}──►
                                    │
                          [api-gateway — rate limited + signature verify]
                                    │
                          [lead-service — ingest handler]
                            ├── Validate + sanitize fields
                            ├── Dedup against existing leads
                            ├── Create/update lead with source attribution
                            ├── Route to campaign (if configured)
                            ├── Enqueue enrichment (Pro+)
                            └── Outbox: lead.created + lead.inbound.captured

[campaign-service]
  ├── /v1/campaign-forms/** (form CRUD + field builder)
  ├── /v1/form-sync-connections/** (provider connections)
  └── Outbox: form.submission.failed → replay queue

[Provider adapters] (one per integration):
  ├── facebook_lead_ads_adapter
  ├── google_ads_adapter
  ├── zalo_adapter (behind flag)
  └── tiktok_adapter (behind flag)
```

**Key flows:**
1. **Hosted form submission:** User fills form → POST /v1/forms/{id}/submit → CSRF validation → ingest pipeline
2. **Provider webhook:** FB/Google sends webhook → HMAC verification → adapter parses → ingest pipeline
3. **Ingest pipeline:** Validate → dedup → create/update lead → source attribution → route to campaign → enrich queue

---

## Components

### 1. Form Builder & Metadata (campaign-service)

**Tables:**
- `campaign_forms` — form metadata, slug, settings, submission count
- `form_fields` — field definitions (type, label, validation, maps_to lead field)
- `form_submissions` — submission log with idempotency key
- `form_sync_connections` — provider OAuth connections + field mappings

**API routes:**
- `POST/GET/PATCH/DELETE /v1/campaign-forms` — Form CRUD
- `GET/POST/DELETE /v1/campaign-forms/{id}/fields` — Field management
- `GET /v1/campaign-forms/{id}/submissions` — Submission list
- `POST /v1/campaign-forms/{id}/submissions/replay` — Replay failed submissions
- `POST/GET/DELETE /v1/form-sync-connections` — Provider connection management
- `GET /v1/form-sync-connections/{id}/health` — Connection health

**Form field types:** text, email, phone, dropdown, checkbox, radio, date, number, hidden (for UTM params)

**Form settings (JSONB):**
```json
{
  "thank_you_message": "Thanks for your interest!",
  "redirect_url": "https://example.com/thanks",
  "require_consent": true
}
```

---

### 2. Hosted Form Page (frontend)

**Public route:** `GET /f/{workspace_slug}/{form_slug}`

**Implementation:**
- Next.js SSG shell (static HTML/CSS/JS)
- Dynamic field fetch from `campaign-service GET /v1/campaign-forms/{id}/public`
- Client-side form validation + CSRF token
- Submit to `POST /v1/forms/{form_id}/submit`

**JS embed snippet:**
```html
<script src="https://revlooper.com/embed.js" data-form-id="{form_id}"></script>
<div id="revlooper-form"></div>
```

**Iframe embed:**
```html
<iframe src="https://revlooper.com/f/{workspace_slug}/{form_slug}" width="100%" height="600"></iframe>
```

---

### 3. Form Submission Endpoint (lead-service)

**Route:** `POST /v1/forms/{form_id}/submit` (public, rate-limited)

**Flow:**
1. Validate CSRF token (for hosted form; not required for provider webhooks)
2. Rate limit: 100 submissions/min/form (Memorystore sliding window)
3. Sanitize all text fields (strip HTML, truncate, validate email format)
4. Write `form_submissions` row with `status=pending` (idempotent on `provider_submission_id`)
5. Enqueue Cloud Tasks ingest job
6. Return 200 immediately (webhook ACK)

**Ingest job (async):**
1. Map provider fields → lead fields via `form_sync_connections.field_mapping`
2. Dedup: does this email already exist in workspace leads?
   - Yes → update enrichment + source attr; mark submission as `duplicate`
   - No → create lead with source attribution
3. Route to campaign (if `form.campaign_id` set) → insert into campaign lead pool
4. If Pro+: enqueue Hunter verify + Apollo enrich
5. Mark submission as `processed`
6. Outbox: `lead.inbound.captured`

---

### 4. Provider Webhook Endpoints (lead-service)

**Routes:**
- `POST /v1/webhooks/inbound/facebook_lead_ads/{workspace_id}`
- `POST /v1/webhooks/inbound/google_ads/{workspace_id}`
- `POST /v1/webhooks/inbound/zalo/{workspace_id}` (behind flag)
- `POST /v1/webhooks/inbound/tiktok/{workspace_id}` (behind flag)

**Adapter interface:**
```python
# services/lead-service/app/adapters/base.py
class InboundProviderAdapter(ABC):
    @abstractmethod
    def verify_signature(self, headers: dict, body: bytes, secret: str) -> bool:
        """Verify HMAC/JWT signature from provider"""
        
    @abstractmethod
    def parse_submission(self, payload: dict) -> list[RawSubmission]:
        """Parse provider-specific payload into normalized submissions"""
        
    @abstractmethod
    def get_provider_submission_id(self, payload: dict) -> str:
        """Extract idempotency key from provider payload"""
```

**Adapters:**
- `FacebookLeadAdsAdapter` — HMAC-SHA256 verification, parses FB Lead Ads webhook
- `GoogleAdsAdapter` — JWT verification, parses Google Ads lead form webhook
- `ZaloAdapter` — HMAC verification, parses Zalo OA form webhook (behind `inbound_zalo_enabled` flag)
- `TikTokAdapter` — HMAC verification, parses TikTok lead form webhook (behind `inbound_tiktok_enabled` flag)

---

## Data Model

### campaign-service schema

```sql
CREATE TABLE campaign_forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  campaign_id     UUID,              -- soft FK; null = standalone form
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,     -- URL slug
  status          TEXT NOT NULL DEFAULT 'draft',  -- 'draft'|'published'|'archived'
  settings        JSONB NOT NULL DEFAULT '{}',
  submission_count INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE form_fields (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id         UUID NOT NULL REFERENCES campaign_forms(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL,
  field_type      TEXT NOT NULL,     -- 'text'|'email'|'phone'|'dropdown'|'checkbox'|'radio'|'date'|'number'|'hidden'
  label           TEXT NOT NULL,
  placeholder     TEXT,
  required        BOOLEAN NOT NULL DEFAULT false,
  maps_to         TEXT,              -- lead field name (e.g. 'email', 'first_name', 'company')
  options         JSONB,             -- for dropdown/radio/checkbox: [{value, label}]
  validation      JSONB,             -- { min_length, max_length, pattern, ... }
  position        INTEGER NOT NULL DEFAULT 0,
  is_utm_capture  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  form_id         UUID NOT NULL,
  lead_id         UUID,              -- null until ingest completes
  provider        TEXT NOT NULL DEFAULT 'hosted',  -- 'hosted'|'facebook_lead_ads'|'google_ads'|'zalo'|'tiktok'
  raw_payload     JSONB NOT NULL,
  mapped_fields   JSONB NOT NULL DEFAULT '{}',
  ingest_status   TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'processed'|'duplicate'|'failed'
  error_message   TEXT,
  provider_submission_id TEXT,       -- for idempotency
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  UNIQUE (workspace_id, provider, provider_submission_id)
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id, created_at DESC);
CREATE INDEX idx_form_submissions_failed ON form_submissions(workspace_id, ingest_status)
  WHERE ingest_status = 'failed';

CREATE TABLE form_sync_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  provider        TEXT NOT NULL,     -- 'facebook_lead_ads'|'google_ads'|'zalo'|'tiktok'
  provider_account_id TEXT NOT NULL,
  provider_form_id TEXT,
  form_id         UUID NOT NULL,
  field_mapping   JSONB NOT NULL DEFAULT '{}',  -- provider_field → form_field
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active'|'paused'|'error'
  last_sync_at    TIMESTAMPTZ,
  last_error      TEXT,
  error_count     INTEGER NOT NULL DEFAULT 0,
  credentials_secret TEXT NOT NULL,  -- GCP Secret Manager resource name
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_sync_workspace ON form_sync_connections(workspace_id, status);
```

### lead-service schema

```sql
CREATE TABLE lead_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  source_type     TEXT NOT NULL,     -- 'form'|'facebook_lead_ads'|'google_ads'|'zalo'|'tiktok'
  source_name     TEXT NOT NULL,
  source_config   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration:** `alembic/versions/2026_05_05_004_create_campaign_forms_submissions_sync.py`

---

## Data Flow

### Hosted Form Submission

1. User fills form at `/f/{workspace_slug}/{form_slug}`
2. Client-side validation passes
3. POST `/v1/forms/{form_id}/submit` with CSRF token
4. API Gateway validates rate limit (100/min/form)
5. lead-service validates CSRF token
6. Sanitize fields (strip HTML, validate email)
7. Write `form_submissions` row (status=pending)
8. Enqueue Cloud Tasks ingest job
9. Return 200 to user
10. Ingest job processes async (dedup → create/update lead → route → enrich)

### Provider Webhook Submission

1. Facebook/Google sends webhook POST to `/v1/webhooks/inbound/{provider}/{workspace_id}`
2. API Gateway validates rate limit
3. lead-service reads raw body + headers
4. Adapter verifies HMAC/JWT signature → 401 on failure
5. Adapter parses provider payload → normalized submission
6. Write `form_submissions` row with `provider_submission_id` (idempotent)
7. Enqueue Cloud Tasks ingest job
8. Return 200 to provider (ACK within 200ms)
9. Ingest job processes async

---

## Error Handling

### Signature Verification Failures

All provider webhook signature failures raise `HTTPException(401, detail="Invalid signature")` before any processing.

**Facebook Lead Ads:**
- Missing `X-Hub-Signature-256` header → 401
- HMAC mismatch → 401

**Google Ads:**
- Missing `Authorization` header → 401
- Invalid JWT → 401

### Submission Processing Failures

**Validation errors:**
- Missing required field → 400
- Invalid email format → 400
- Field exceeds max length → 400

**Ingest job failures:**
- Lead creation fails → mark submission as `failed`, log error, emit `form.submission.failed` event
- Enrichment API timeout → log warning, continue (enrichment is best-effort)

### Logging

All errors logged with:
- `workspace_id`
- `form_id`
- `provider`
- `error_message` (sanitized, no secrets)
- `timestamp`
- `source_ip`

**Example log:**
```json
{
  "level": "error",
  "service": "lead-service",
  "workspace_id": "...",
  "form_id": "...",
  "provider": "facebook_lead_ads",
  "error": "Invalid signature",
  "timestamp": "2026-05-18T14:32:01Z",
  "source_ip": "192.0.2.1"
}
```

---

## Testing

### Test Files

**campaign-service:**
- `tests/test_campaign_forms.py` — Form CRUD, field management
- `tests/test_form_sync_connections.py` — Provider connection CRUD, health tracking

**lead-service:**
- `tests/test_form_submission.py` — Hosted form submission, CSRF validation, rate limiting
- `tests/test_facebook_adapter.py` — FB webhook signature verification, parsing
- `tests/test_google_adapter.py` — Google webhook JWT verification, parsing
- `tests/test_ingest_pipeline.py` — Dedup logic, source attribution, campaign routing

### Test Cases

**Hosted form submission:**
- Valid submission with all required fields → lead created with correct source attribution
- Duplicate email submission → lead updated, not duplicated
- Missing required field → 400 error
- Invalid CSRF token → 403 error
- Rate limit exceeded → 429 error
- XSS attempt in text field → sanitized before storage

**Facebook Lead Ads webhook:**
- Valid signature + payload → lead created within 60s
- Invalid signature → 401 rejected
- Missing `X-Hub-Signature-256` header → 401 rejected
- Duplicate `provider_submission_id` → idempotent (no duplicate lead)

**Google Ads webhook:**
- Valid JWT + payload → lead created within 60s
- Invalid JWT → 401 rejected
- Expired JWT → 401 rejected

**Ingest pipeline:**
- UTM hidden field → lead `source_id` populated correctly
- Form linked to campaign → lead added to campaign pool
- Pro+ workspace → enrichment job enqueued
- Failed submission replay → idempotent (no duplicate lead)

**Sync health:**
- Provider webhook failure → connection status set to `error`, error count incremented
- 10 consecutive errors → `form.sync.connection.error` event emitted

---

## Security Considerations

### Webhook Signature Verification

**Facebook Lead Ads:** HMAC-SHA256 with app secret
```python
import hmac
import hashlib

def verify_facebook_signature(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

**Google Ads:** JWT verification with Google public keys
```python
from google.auth.transport import requests
from google.oauth2 import id_token

def verify_google_jwt(token: str, audience: str) -> dict:
    return id_token.verify_oauth2_token(token, requests.Request(), audience)
```

**Constant-time comparison:** Use `hmac.compare_digest()` to prevent timing attacks.

---

### CSRF Protection

**Hosted forms:** CSRF token required for all submissions
- Token generated on form page load
- Token validated on submission
- Token expires after 1 hour

**JS embed:** CSRF token fetched via AJAX before form render

**Iframe embed:** CSRF token included in iframe src URL (warning: cross-domain cookie issues)

---

### XSS Prevention

All text fields sanitized before storage:
- Strip HTML tags (except whitelisted: `<b>`, `<i>`, `<a>`)
- Truncate to max length (configurable per field)
- Escape special characters in output

---

### Rate Limiting

**Hosted form submission:** 100 requests/min/form (Memorystore sliding window)

**Provider webhooks:** 1000 requests/min/workspace (API Gateway)

**Replay endpoint:** 10 requests/min/workspace (prevents abuse)

---

### Secret Management

**Provider credentials:** Stored in GCP Secret Manager, never in database
- `form_sync_connections.credentials_secret` contains Secret Manager resource name
- Secrets rotated via GCP console, no code changes required

**Webhook secrets:** Stored in GCP Secret Manager
- `FACEBOOK_APP_SECRET`
- `GOOGLE_ADS_CLIENT_ID`
- `ZALO_APP_SECRET`
- `TIKTOK_APP_SECRET`

**Fail-closed behavior:** Service fails to start if secrets are missing.

---

## Deployment & Configuration

### Environment Variables Required

- `FACEBOOK_APP_SECRET` — Facebook app secret for webhook verification
- `GOOGLE_ADS_CLIENT_ID` — Google Ads OAuth client ID for JWT verification
- `ZALO_APP_SECRET` — Zalo OA app secret (Phase 4)
- `TIKTOK_APP_SECRET` — TikTok app secret (Phase 4)

### GCP Secret Manager Setup

**Staging:**
```bash
echo -n "..." | gcloud secrets create lead-service-facebook-app-secret \
  --data-file=- --project=revlooper-staging

echo -n "..." | gcloud secrets create lead-service-google-ads-client-id \
  --data-file=- --project=revlooper-staging
```

**Production:**
```bash
echo -n "..." | gcloud secrets create lead-service-facebook-app-secret \
  --data-file=- --project=revlooper-prod

echo -n "..." | gcloud secrets create lead-service-google-ads-client-id \
  --data-file=- --project=revlooper-prod
```

### Feature Flags

| Flag | Default | Purpose |
|---|---|---|
| `inbound_forms_enabled` | true | Master flag for all forms features |
| `inbound_fb_lead_ads_enabled` | true | FB Lead Ads adapter (enables after app review approved) |
| `inbound_google_ads_enabled` | true | Google Ads adapter |
| `inbound_zalo_enabled` | false | Zalo form adapter (Phase 4) |
| `inbound_tiktok_enabled` | false | TikTok adapter (Phase 4) |
| `inbound_auto_enrich_enabled` | false | Auto-enrich after ingest (Pro+ only) |

### Rollout Plan

**Phase 1 — Hosted Forms + JS Embed (Week 3)**
1. Deploy Alembic migration to staging
2. Deploy campaign-service with form CRUD APIs
3. Deploy lead-service with submission endpoint + ingest pipeline
4. Deploy frontend with hosted form page + JS embed
5. Test hosted form submission → lead creation
6. Deploy to production
7. Monitor submission latency (target: <5s p95)

**Phase 2 — Provider Adapters (Week 4)**
1. Deploy Facebook + Google adapters to staging
2. Test with provider sandbox accounts
3. Submit Facebook/Google app reviews (2-4 weeks)
4. Deploy to production (behind feature flags)
5. Enable flags after app review approval

**Phase 3 — Sync Health + Replay (Week 4-5)**
1. Deploy sync health tracking
2. Deploy replay endpoint
3. Deploy frontend sync health dashboard
4. Deploy form builder UI

**Phase 4 — Zalo + TikTok (Wave 3)**
1. Deploy Zalo/TikTok adapters behind flags
2. Test in SEA staging environment
3. Enable flags for beta users

### Monitoring

| Signal | Alert threshold | Tool |
|---|---|---|
| Webhook ingest failure rate | > 2% | `form.submission.failed` event count |
| Webhook ACK latency | > 500ms p95 | Cloud Run metric |
| Sync connection error count | > 10 errors in 1h | `form.sync.connection.error` event |
| Hosted form submission latency | > 3s p95 | Cloud Run metric |
| Duplicate submission catch rate | < 99% | Idempotency metric |

---

## Integration with Downstream Services

### Outbox Events

| Event | Producer | Subscribers | Payload |
|---|---|---|---|
| `lead.inbound.captured` | lead-service | analytics-service, campaign-service | `{ workspace_id, lead_id, form_id, source_type }` |
| `form.submission.failed` | lead-service | notification-service | `{ workspace_id, form_id, provider, error }` |
| `form.sync.connection.error` | campaign-service | notification-service | `{ workspace_id, connection_id, provider, error_count }` |

### Campaign Routing

When a form is linked to a campaign (`campaign_forms.campaign_id` is set):
1. Ingest pipeline creates/updates lead
2. Calls `campaign-service POST /v1/campaigns/{id}/leads` to add lead to campaign pool
3. Campaign sequence enrollment happens via existing campaign logic (Spec 05)

### Enrichment Integration

When workspace is Pro+ and `inbound_auto_enrich_enabled` flag is true:
1. Ingest pipeline creates lead
2. Enqueues enrichment job to `lead-service` enrichment queue
3. Enrichment worker calls Hunter (email verify) + Apollo (company enrich)
4. Updates lead record with enriched data

---

## Scale Design

| Concern | Plan |
|---|---|---|
| Provider webhook ACK latency | < 200ms — write to `form_submissions` + queue; never block on lead processing |
| Submission duplicate prevention | `UNIQUE (workspace_id, provider, provider_submission_id)` — DB-enforced idempotency |
| Form page cold start | Next.js SSG for hosted form template; only data-fetch is dynamic |
| Rate limiting abuse on hosted form | 100 req/min/form + reCAPTCHA v3 (invisible) |
| 100 workspaces × 1k forms × 10k subs/day | 1M subs/day = ~12/sec — trivial at this scale |

---

## Out of Scope

The following are explicitly **not** included in this implementation:

1. **Multi-page forms** — v1 supports single-page forms only
2. **Payment collection in forms** — separate feature
3. **Form A/B testing** — covered in Spec 09 (campaign-level A/B)
4. **Real-time form analytics** — page views, conversion rate (v2)
5. **Conditional logic** — show field B if field A = X (v2)
6. **Custom thank-you page** — v1 uses default message or redirect URL

---

## Success Criteria

- Workspace owner can create a branded hosted form + embeddable JS widget in < 5 minutes
- Facebook Lead Ads + Google Ads leads flow into RevLooper within 60 seconds of submission
- Inbound submissions → lead created → enriched → routed to campaign → sequence enrolled, all automatically
- Source attribution on every lead (100% coverage of `source_type` field)
- Provider webhook delivery failure rate < 1%
- Replay recovery rate ≥ 95%
- Inbound lead → sequence enrollment rate ≥ 80% (when auto-route configured)
- Form setup time < 5 minutes for hosted form

---

## Implementation Checklist

**Phase 1 — Hosted Forms + JS Embed:**
- [ ] Alembic migration: `campaign_forms`, `form_fields`, `form_submissions`, `form_sync_connections`, `lead_sources` + indexes + RLS
- [ ] campaign-service: Form + field CRUD service layer + FastAPI router
- [ ] campaign-service: Hosted form public API (`GET /v1/campaign-forms/{id}/public`)
- [ ] Next.js public route: `/f/[workspace_slug]/[form_slug]` — rendered hosted form page
- [ ] CSRF token generation + validation
- [ ] Form submission endpoint + ingest pipeline (validate → dedup → create lead → source attr)
- [ ] JS embed snippet generator
- [ ] Feature flag: `inbound_forms_enabled` (default true)
- [ ] Unit + integration tests, coverage ≥ 85%
- [ ] Deploy to staging and test hosted form submission
- [ ] Deploy to production

**Phase 2 — Provider Adapters:**
- [ ] `InboundProviderAdapter` base class
- [ ] `FacebookLeadAdsAdapter` (parse + HMAC verify)
- [ ] `GoogleAdsAdapter` (parse + JWT verify)
- [ ] Webhook endpoints for FB + Google
- [ ] `form_sync_connections` CRUD API
- [ ] Provider OAuth connection flow UI
- [ ] Field mapping UI
- [ ] Idempotency: `UNIQUE (workspace_id, provider, provider_submission_id)` enforced
- [ ] Submit FB/Google app reviews
- [ ] Deploy to staging and test with provider sandbox accounts
- [ ] Deploy to production (behind feature flags)

**Phase 3 — Sync Health + Replay:**
- [ ] `form_sync_connections` health tracking (error counter, last_sync_at, status state machine)
- [ ] Replay endpoint: `POST /v1/campaign-forms/{id}/submissions/replay`
- [ ] Sync health dashboard page (frontend)
- [ ] Form builder drag-and-drop UI
- [ ] Form analytics: submissions count, source breakdown
- [ ] Auto-enrichment integration (if Pro+: call lead-service enrich after ingest)
- [ ] E2E tests all green

**Phase 4 — Zalo + TikTok Adapters:**
- [ ] `ZaloAdapter` (HMAC verify + parse) — behind `inbound_zalo_enabled` flag
- [ ] `TikTokAdapter` (HMAC verify + parse) — behind `inbound_tiktok_enabled` flag
- [ ] Zalo OA / TikTok OAuth connection flows
- [ ] QA in SEA staging environment
