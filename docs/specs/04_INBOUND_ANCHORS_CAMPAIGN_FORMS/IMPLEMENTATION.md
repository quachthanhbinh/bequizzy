# 04 — Inbound Anchors & Campaign Forms — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-04

## Rollout Phases

### Phase 1 — Hosted Forms + JS Embed (Week 3, after spec 03)
**Goal:** Workspace can create a form, publish it as a hosted URL + JS embed, and receive submissions.

**Deliverables:**
1. Alembic migration: `campaign_forms`, `form_fields`, `form_submissions`, `form_sync_connections`, `lead_sources` + indexes + RLS
2. `campaign-service`: Form + field CRUD service layer + FastAPI router
3. `campaign-service`: Hosted form public API (`GET /f/{workspace_slug}/{form_slug}` — data endpoint)
4. Next.js public route: `/f/[slug]` — rendered hosted form page (SSG shell + dynamic field fetch)
5. CSRF token generation + validation
6. Form submission endpoint + ingest pipeline (validate → dedup → create lead → source attr)
7. JS embed snippet generator (inline snippet with form_id + workspace_id)
8. Feature flag: `inbound_forms_enabled` (default true)
9. Unit + integration tests, coverage ≥ 85%

**Exit gate:** Hosted form creates leads with correct source attribution; CSRF test passes; XSS sanitization test passes.

### Phase 2 — Provider Adapters (Week 4)
**Goal:** Facebook Lead Ads + Google Ads adapters built and ready for provider app review submission.

**Deliverables:**
1. `InboundProviderAdapter` base class + `FacebookLeadAdsAdapter` (parse + HMAC verify)
2. `GoogleAdsAdapter` (parse + JWT verify)
3. Webhook endpoints for FB + Google (provider-specific signature verification)
4. `form_sync_connections` CRUD API
5. Provider OAuth connection flow UI (campaign-service + frontend)
6. Field mapping UI (map provider field names to RevLooper lead fields)
7. Idempotency: `UNIQUE (workspace_id, provider, provider_submission_id)` enforced
8. Submit FB/Google app reviews (can take 2–4 weeks)

**Exit gate:** FB + Google webhook ingest tested with provider sandbox accounts.

### Phase 3 — Sync Health + Replay + Frontend (Week 4–5)
**Deliverables:**
1. `form_sync_connections` health tracking (error counter, last_sync_at, status state machine)
2. Replay endpoint: `POST /v1/campaign-forms/{id}/submissions/replay`
3. Sync health dashboard page (frontend)
4. Form builder drag-and-drop UI (campaign-service settings tab: Forms)
5. Form analytics: submissions count, source breakdown
6. Auto-enrichment integration (if Pro+: call lead-service enrich after ingest)
7. E2E tests all green

### Phase 4 — Zalo + TikTok Adapters (Wave 3, behind flags)
**Deliverables:**
1. `ZaloAdapter` (HMAC verify + parse) — behind `inbound_zalo_enabled` flag
2. `TikTokAdapter` (HMAC verify + parse) — behind `inbound_tiktok_enabled` flag
3. Zalo OA / TikTok OAuth connection flows
4. QA in SEA staging environment

## Feature Flags

| Flag | Default | Purpose |
|---|---|---|
| `inbound_forms_enabled` | true | Master flag for all forms features |
| `inbound_fb_lead_ads_enabled` | true | FB Lead Ads adapter (enables after app review approved) |
| `inbound_google_ads_enabled` | true | Google Ads adapter |
| `inbound_zalo_enabled` | false | Zalo form adapter (Phase 4) |
| `inbound_tiktok_enabled` | false | TikTok adapter (Phase 4) |
| `inbound_auto_enrich_enabled` | false | Auto-enrich after ingest (Pro+ only) |

## Monitoring

| Signal | Alert threshold | Tool |
|---|---|---|
| Webhook ingest failure rate | > 2% | `form.submission.failed` event count |
| Webhook ACK latency | > 500ms p95 | Cloud Run metric |
| Sync connection error count | > 10 errors in 1h | `form.sync.connection.error` event |
| Hosted form submission latency | > 3s p95 | Cloud Run metric |
| Duplicate submission catch rate | < 99% | Idempotency metric |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Facebook app review takes > 4 weeks | High | Medium | Submit early (Week 4); use hosted forms as fallback for users in waiting period |
| TikTok API changes mid-development | High | Medium | Build adapter in Phase 4 only; monitor TikTok developer announcements |
| Provider webhook endpoint discovery by bots | Medium | Low | Rate-limit + HMAC verification blocks all unauthenticated payloads |
| CSRF token cookie in cross-domain iframe embed | Medium | Medium | Document that JS embed (not iframe) avoids CSRF; iframe users warned |

## Runbook

### Provider webhook suddenly failing HMAC verification
1. Check if provider rotated webhook secret
2. Fetch new secret from provider dashboard
3. Update GCP Secret Manager version
4. Cloud Run cold-start picks up new secret
5. If gap: use Replay endpoint to reprocess any submissions with `ingest_status=failed`

### FB Lead Ads not delivering leads
1. Check `form_sync_connections.status` → if `error`, check `last_error`
2. Verify FB page still connected (OAuth token may have expired)
3. Re-authenticate FB connection from workspace settings
4. Use FB Lead Ads test tool to send test lead

### Hosted form taking > 3s to load
1. Check if Next.js SSG shell cached on Cloudflare CDN
2. Check `campaign-service` GET /form-data endpoint latency
3. If DB slow: check if `campaign_forms(workspace_id, slug)` index is being used
