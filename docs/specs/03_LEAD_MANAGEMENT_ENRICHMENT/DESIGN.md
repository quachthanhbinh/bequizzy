# 03 — Lead Management & Enrichment — DESIGN

**Status:** 📝 Draft
**Confidence:** 9/10
**Last updated:** 2026-05-04

## Architecture

**Owning service:** `lead-service`

```
CSV upload (async job)          Manual create / API
       │                               │
       ▼                               ▼
[lead-service]  ◄── POST /v1/leads ───┘
  ├── Validate + dedup
  ├── Insert leads batch
  ├── Enqueue enrichment jobs (Cloud Tasks)
  └── Outbox events: lead.created (×N)

[enrichment-worker — Cloud Tasks handler]
  ├── Hunter.io: verify email → update enrichment_status
  ├── Apollo.io: enrich company/title (deduct credits first)
  └── Outbox: lead.enrichment.completed

[billing-service]  ◄── deduct_credits (Apollo: 3/lead)
```

## Data Model

```sql
CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL,
  email               TEXT NOT NULL,
  first_name          TEXT,
  last_name           TEXT,
  phone               TEXT,
  company             TEXT,
  title               TEXT,
  linkedin_url        TEXT,
  industry            TEXT,
  company_size        TEXT,              -- '1-10'|'11-50'|'51-200'|'201-500'|'501+'
  website             TEXT,
  city                TEXT,
  country             TEXT,
  timezone            TEXT,
  notes               TEXT,
  -- Status
  status              TEXT NOT NULL DEFAULT 'active',   -- 'active'|'unsubscribed'|'bounced'|'invalid'|'deleted'
  enrichment_status   TEXT NOT NULL DEFAULT 'unverified', -- 'unverified'|'verified'|'enriched'|'invalid'|'risky'
  -- Source attribution
  source_type         TEXT,              -- 'csv'|'manual'|'form'|'facebook_lead_ads'|'google_ads'|'zalo'|'tiktok'|'api'
  source_id           TEXT,              -- form_id or provider submission ID
  source_campaign_id  UUID,              -- soft FK to campaigns
  source_form_id      UUID,              -- soft FK to campaign_forms
  -- Scoring (spec 09)
  score               INTEGER NOT NULL DEFAULT 0,
  score_updated_at    TIMESTAMPTZ,
  -- Meta
  custom_fields       JSONB NOT NULL DEFAULT '{}',
  import_batch_id     UUID,              -- groups CSV import
  merged_from_id      UUID,              -- if dedup merged
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique per workspace
CREATE UNIQUE INDEX idx_leads_workspace_email
  ON leads (workspace_id, email) WHERE deleted_at IS NULL;

CREATE INDEX idx_leads_workspace_status
  ON leads (workspace_id, status, created_at DESC);

CREATE INDEX idx_leads_workspace_enrichment
  ON leads (workspace_id, enrichment_status);

CREATE INDEX idx_leads_workspace_score
  ON leads (workspace_id, score DESC) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_leads_fts ON leads
  USING gin(to_tsvector('english', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(company,'') || ' ' || email));

CREATE TABLE lead_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type   TEXT NOT NULL,   -- 'email_sent'|'email_opened'|'email_clicked'|'replied'|'meeting_booked'|'note'|'status_changed'|'enriched'
  metadata        JSONB NOT NULL DEFAULT '{}',
  actor_user_id   UUID,            -- auth.users.id or null (system)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id, created_at DESC);

CREATE TABLE lead_tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  name            TEXT NOT NULL,
  color           TEXT NOT NULL DEFAULT '#6B7280',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE lead_tag_assignments (
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, tag_id)
);

CREATE TABLE enrichment_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  lead_id         UUID NOT NULL REFERENCES leads(id),
  provider        TEXT NOT NULL,   -- 'hunter'|'apollo'
  status          TEXT NOT NULL DEFAULT 'queued',  -- 'queued'|'running'|'done'|'failed'
  result          JSONB,
  error_message   TEXT,
  attempts        INTEGER NOT NULL DEFAULT 0,
  credits_used    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_enrichment_jobs_lead ON enrichment_jobs(lead_id);
```

### Migration
`alembic/versions/2026_05_05_003_create_leads_enrichment_tables.py`

### RLS
Standard workspace RLS on `leads`, `lead_activities`, `lead_tags`, `lead_tag_assignments`.

## API Contract

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/leads` | Create single lead |
| `GET` | `/v1/leads` | List leads (paginated, filterable, sortable) |
| `GET` | `/v1/leads/{id}` | Lead detail |
| `PATCH` | `/v1/leads/{id}` | Update lead fields |
| `DELETE` | `/v1/leads/{id}` | Soft-delete |
| `POST` | `/v1/leads/import` | Start CSV import (returns job_id) |
| `GET` | `/v1/leads/import/{job_id}` | Import status |
| `GET` | `/v1/leads/import/{job_id}/errors` | Download error rows |
| `POST` | `/v1/leads/bulk` | Bulk actions (tag/delete/export) |
| `POST` | `/v1/leads/{id}/enrich` | Trigger Apollo enrich (requires credits) |
| `POST` | `/v1/leads/bulk-enrich` | Bulk Apollo enrich (preview + confirm) |

### List query params
`search` (FTS), `status`, `enrichment_status`, `tag_ids[]`, `source_type`, `created_after`, `sort` (`score`|`created_at`|`name`), `limit`, `cursor`

## CSV Import Pipeline

```
1. Validate file: MIME type, size ≤25MB, ≤50k rows
2. Parse headers → column mapping UI response
3. User maps columns → POST /v1/leads/import { column_map }
4. Cloud Tasks job:
   a. Read CSV in chunks of 500
   b. Per row: validate email format → dedup check → upsert
   c. Track error rows → write to R2 (error CSV)
   d. Update job progress (% complete)
   e. After all rows: enqueue Hunter verify jobs
5. Return: { imported, duplicates_skipped, errors, error_file_url }
```

## Enrichment Waterfall

```
Lead created (any source)
  ├─► Hunter.io verify (free, always runs)
  │     → status: 'verified' | 'invalid' | 'risky'
  │
  └─► Apollo.io enrich (3 credits, on-demand or Pro+ auto)
        → fill: title, company_size, industry, linkedin_url, website
        → status: 'enriched'
```

## Event / Outbox Design

| Event | Producer | Subscribers | Payload |
|---|---|---|---|
| `lead.created` | lead-service | analytics-service, outreach-service (suppression check) | `{ workspace_id, lead_id, source_type }` |
| `lead.enrichment.completed` | lead-service | analytics-service | `{ workspace_id, lead_id, provider, enrichment_status }` |
| `lead.status.changed` | lead-service | outreach-service (if bounced → suppression) | `{ workspace_id, lead_id, old_status, new_status }` |
| `lead.bulk.imported` | lead-service | analytics-service | `{ workspace_id, batch_id, imported_count }` |

## Scale Design

| Concern | Plan |
|---|---|
| 50k-row CSV import | Cloud Tasks chunked 500/batch; p95 <30s |
| Lead list (100k/workspace) | Cursor pagination; index on `(workspace_id, created_at DESC)` |
| FTS search | GIN index on tsvector; pg_trgm extension for typo-tolerance v2 |
| Enrichment concurrency | Cloud Tasks rate-limited 10/sec/workspace → respects Hunter/Apollo quotas |
| 100 workspaces × 10M total leads | partition by `workspace_id` in v2 if needed; fine for MVP |

## CPO ↔ CTO Debate Summary

**Round 1 (gap: 2):**
- CPO 9: "CSV import and Hunter auto-verify must both land in Wave 1"
- CTO 7: "CSV 50k rows async is fine; concern is Hunter.io API rate limits hitting on bulk import day"

**Round 2 (converged, both 9):**
- Rate-limit Hunter at 10/sec/workspace via Cloud Tasks; acceptable 30s latency for 1k-lead import

**Final: 9/10.** Not 10: fuzzy dedup and per-workspace Hunter API key management are deferred to v2.
