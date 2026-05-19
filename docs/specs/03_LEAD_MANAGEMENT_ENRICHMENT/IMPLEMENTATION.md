# 03 — Lead Management & Enrichment — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-04

## Rollout Phases

### Phase 1 — Core Lead CRUD (Week 2–3, after spec 01)
**Goal:** Manual lead creation + list + detail + tags. Foundation for all downstream specs.

**Deliverables:**
1. Alembic migration: `leads`, `lead_activities`, `lead_tags`, `lead_tag_assignments`, `enrichment_jobs` tables + indexes + RLS
2. `lead-service`: Lead CRUD service layer + FastAPI router (all standard endpoints)
3. Tag management API
4. Lead list: FTS, filters, cursor pagination
5. Lead activity timeline write + read
6. Outbox event: `lead.created`, `lead.status.changed`
7. Free plan limit enforcement (SELECT FOR UPDATE in transaction)
8. Unit + integration tests, coverage ≥ 90%

**Exit gate:** Lead CRUD fully functional in staging; free plan limit race condition test passes.

### Phase 2 — CSV Import Pipeline (Week 3)
**Deliverables:**
1. CSV upload endpoint → R2 storage → Cloud Tasks import job
2. Column mapping API response (return detected columns)
3. Import job: stream parse → validate → dedup → batch insert (500/batch)
4. Error CSV generation (invalid rows) → R2 → pre-signed download URL
5. Import progress API (`GET /v1/leads/import/{job_id}`)
6. Post-import: enqueue Hunter verify jobs for all imported leads
7. Import tests: 1k rows < 30s, partial success, CSV injection, file validation

**Exit gate:** 50k-row CSV import completes < 30s; error CSV downloadable.

### Phase 3 — Enrichment Pipeline (Week 3–4)
**Deliverables:**
1. `Hunter.io` client (email verify API) + webhook result handler
2. `Apollo.io` client (enrich endpoint) + credit deduction integration
3. Enrichment state machine transitions
4. Bulk enrich API: preview (count + credit cost) → confirm → enqueue jobs
5. Auto-enrichment for Pro+ workspaces (triggered on `lead.created` event)
6. Enrichment tests: credits-before-Apollo, retry on timeout, partial success

**Exit gate:** Hunter verify + Apollo enrich working E2E; credits deducted before API call confirmed.

### Phase 4 — Frontend + Bulk Ops (Week 4)
**Deliverables:**
1. Lead list page (TanStack Query, infinite scroll, filters, sort)
2. Lead detail page (all fields editable, activity timeline)
3. CSV import modal (drag-and-drop upload + column mapping UI)
4. Enrichment status badge per lead
5. Bulk action toolbar (tag, delete, export)
6. Free plan limit banner + upgrade CTA
7. Frontend tests, E2E scenarios

## Feature Flags

| Flag | Default | Purpose |
|---|---|---|
| `lead_enrichment_hunter_enabled` | true | Hunter email verify |
| `lead_enrichment_apollo_enabled` | true | Apollo enrichment |
| `lead_csv_import_enabled` | true | CSV import feature gate |
| `lead_auto_enrich_enabled` | false | Auto-enrich on inbound (Pro+ only) |

## Monitoring

| Signal | Alert threshold | Tool |
|---|---|---|
| CSV import job failure rate | > 5% | Cloud Tasks metric |
| Hunter verify success rate | < 90% | Enrichment jobs metric |
| Apollo enrich success rate | < 85% | Enrichment jobs metric |
| Lead list p99 latency (10k leads) | > 1s | Cloud Run metric |
| Free plan limit bypass attempts | Any > 0 | Security alert |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hunter.io / Apollo.io API downtime | Medium | Medium | Retry with exponential backoff (3 attempts); flag as pending vs failed |
| CSV 50k-row import timeout in Cloud Tasks | Low | Medium | Chunked 500/batch; resume-able job |
| Apollo.io rate limit (workspace hitting quota) | Medium | Medium | Per-workspace rate limit 10/sec via Cloud Tasks |
| pgvector index scan on large lead tables | Low | Medium | leads table uses BTree indexes (not vector); FTS with GIN |

## Runbook

### Hunter/Apollo provider outage
1. Enrichment jobs set to `status=failed` after 3 retries
2. `lead.enrichment.failed` outbox event → alert
3. Ops: re-enqueue failed jobs after provider recovers using `/admin/enrichment/requeue`

### CSV import stuck (Cloud Tasks job not completing)
1. Check Cloud Tasks console for job status
2. If stuck > 30 min: cancel task + delete partial import batch
3. User can re-upload same CSV (import is idempotent on email dedup)

### Enrichment API key rotation
1. Update GCP Secret Manager with new key
2. Cloud Run services restart picks up new key (startup fetch)
3. No downtime — old keys valid for 24h overlap window per provider docs
