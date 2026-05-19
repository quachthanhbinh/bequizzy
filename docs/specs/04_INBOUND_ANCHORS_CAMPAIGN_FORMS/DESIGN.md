# 04 — Inbound Anchors & Campaign Forms — DESIGN

**Status:** 📝 Draft
**Confidence:** 8/10
**Last updated:** 2026-05-04

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

## Data Model

### In `campaign-service` schema
```sql
CREATE TABLE campaign_forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  campaign_id     UUID,              -- soft FK; null = standalone form
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,     -- URL slug
  status          TEXT NOT NULL DEFAULT 'draft',  -- 'draft'|'published'|'archived'
  settings        JSONB NOT NULL DEFAULT '{}',    -- { thank_you_message, redirect_url, require_consent }
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
  is_utm_capture  BOOLEAN NOT NULL DEFAULT false,  -- hidden UTM fields
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  form_id         UUID NOT NULL,
  lead_id         UUID,              -- null until ingest completes
  provider        TEXT NOT NULL DEFAULT 'hosted',  -- 'hosted'|'facebook_lead_ads'|'google_ads'|'zalo'|'tiktok'
  raw_payload     JSONB NOT NULL,    -- original provider payload (archived)
  mapped_fields   JSONB NOT NULL DEFAULT '{}',
  ingest_status   TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'processed'|'duplicate'|'failed'
  error_message   TEXT,
  provider_submission_id TEXT,       -- for idempotency
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  -- Idempotency: prevent double-processing
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
  provider_form_id TEXT,             -- specific form/ad within the account
  form_id         UUID NOT NULL,     -- maps to campaign_forms.id
  field_mapping   JSONB NOT NULL DEFAULT '{}',  -- provider_field → form_field
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active'|'paused'|'error'
  last_sync_at    TIMESTAMPTZ,
  last_error      TEXT,
  error_count     INTEGER NOT NULL DEFAULT 0,
  credentials_secret TEXT NOT NULL,  -- GCP Secret Manager resource name (never stored plaintext)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_sync_workspace ON form_sync_connections(workspace_id, status);
```

### In `lead-service` schema
```sql
CREATE TABLE lead_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  source_type     TEXT NOT NULL,
  source_name     TEXT NOT NULL,
  source_config   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Migration
`alembic/versions/2026_05_05_004_create_campaign_forms_submissions_sync.py`

## Ingest Pipeline

```
POST /v1/forms/{form_id}/submit  OR  webhook received
  │
  ├─1─ Validate signature (for provider webhooks — HMAC-SHA256)
  ├─2─ Rate limit: 100 submissions/min/form (Memorystore)
  ├─3─ Sanitize all text fields (strip HTML, truncate, validate email format)
  ├─4─ Write form_submission row (status=pending)  ← atomic; idempotency key
  ├─5─ Enqueue Cloud Tasks ingest job
  └─6─ Return 200 immediately (webhook ACK)

Ingest job:
  ├─1─ Map provider fields → lead fields via form_sync_connections.field_mapping
  ├─2─ Dedup: does this email already exist in workspace leads?
  │     - Yes → update enrichment + source attr; mark submission as 'duplicate'
  │     - No  → create lead with source attribution
  ├─3─ Route to campaign (if form.campaign_id set) → insert into campaign lead pool
  ├─4─ If Pro+: enqueue Hunter verify + Apollo enrich
  ├─5─ Mark submission as 'processed'
  └─6─ Outbox: lead.inbound.captured
```

## Provider Adapter Interface

```python
# services/campaign-service/app/adapters/base.py
class InboundProviderAdapter(ABC):
    @abstractmethod
    def verify_signature(self, headers: dict, body: bytes, secret: str) -> bool: ...

    @abstractmethod
    def parse_submission(self, payload: dict) -> list[RawSubmission]: ...

    @abstractmethod
    def get_provider_submission_id(self, payload: dict) -> str: ...
```

Each adapter (`FacebookLeadAdsAdapter`, `GoogleAdsAdapter`, etc.) implements this. The webhook router dispatches to the correct adapter by `provider` slug in the URL.

## API Contract

### `campaign-service` routes
| Method | Path | Description |
|---|---|---|
| `POST/GET/PATCH/DELETE` | `/v1/campaign-forms` | Form CRUD |
| `GET/POST/DELETE` | `/v1/campaign-forms/{id}/fields` | Field management |
| `GET` | `/v1/campaign-forms/{id}/submissions` | Submission list |
| `POST` | `/v1/campaign-forms/{id}/submissions/replay` | Replay failed submissions |
| `POST/GET/DELETE` | `/v1/form-sync-connections` | Provider connection management |
| `GET` | `/v1/form-sync-connections/{id}/health` | Connection health |

### Public routes (no auth, rate-limited)
| Method | Path | Description |
|---|---|---|
| `GET` | `/f/{workspace_slug}/{form_slug}` | Hosted form page |
| `POST` | `/v1/forms/{form_id}/submit` | Form submission (CSRF token required) |
| `POST` | `/v1/webhooks/inbound/facebook_lead_ads/{workspace_id}` | FB webhook |
| `POST` | `/v1/webhooks/inbound/google_ads/{workspace_id}` | Google webhook |
| `POST` | `/v1/webhooks/inbound/zalo/{workspace_id}` | Zalo webhook (flagged) |
| `POST` | `/v1/webhooks/inbound/tiktok/{workspace_id}` | TikTok webhook (flagged) |

## Event / Outbox Design

| Event | Producer | Subscribers | Payload |
|---|---|---|---|
| `lead.inbound.captured` | lead-service | analytics-service, campaign-service (update submission count) | `{ workspace_id, lead_id, form_id, source_type }` |
| `form.submission.failed` | lead-service | notification-service (sync health alert) | `{ workspace_id, form_id, provider, error }` |
| `form.sync.connection.error` | campaign-service | notification-service | `{ workspace_id, connection_id, provider, error_count }` |

## Scale Design

| Concern | Plan |
|---|---|
| Provider webhook ACK latency | < 200ms — write to `form_submissions` + queue; never block on lead processing |
| Submission duplicate prevention | `UNIQUE (workspace_id, provider, provider_submission_id)` — DB-enforced idempotency |
| Form page cold start | Next.js SSG for hosted form template; only data-fetch is dynamic |
| Rate limiting abuse on hosted form | 100 req/min/form + reCAPTCHA v3 (invisible) |
| 100 workspaces × 1k forms × 10k subs/day | 1M subs/day = ~12/sec — trivial at this scale |

## CPO ↔ CTO Debate Summary

**Round 1 (gap: 3):**
- CPO 8: "FB + Google must be live in Wave 1 — top source for SEA users"
- CTO 5: "FB webhook signature verification is non-trivial; Meta webhook subscription requires manual app review; allow Wave 3 for provider webhooks"

**Round 2 (gap: 2):**
- CPO 7: "hosted form + JS embed in Wave 1; provider webhooks in Wave 3 — agreed"
- CTO 7: agreed; CSRF token on hosted form + HMAC on webhooks resolves security concern

**Round 3 (converged, both 8):**

**Final: 8/10.** Not 9: provider-side app review timelines (FB, TikTok) are outside our control — build adapters in Wave 2, submit for review during Wave 2, expect live in Wave 3.
