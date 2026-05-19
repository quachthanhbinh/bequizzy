# 35 — Solo Operator Mode — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-05

## Phase Breakdown

### Phase 1 — Autopilot Mode + Brief Core (Sprint 1–2)

**campaign-service:**
- Alembic migration: `campaigns.execution_mode` column (`DEFAULT 'autopilot'`)
- `PATCH /campaigns/{id}` extended to accept `execution_mode` (role gate + active-campaign gate + audit log + outbox event)
- `POST /internal/campaigns/{id}/auto-pause` (internal OIDC) for bounce circuit breaker

**sequence-worker:**
- Dispatch fork: read `execution_mode` from Redis cache (or DB on miss); Autopilot → dispatch; Review/Manual → queue
- Bounce rate circuit breaker: Redis counter per campaign per hour; calls `/internal/campaigns/{id}/auto-pause` on threshold

**ai-service:**
- `brief_assembler.py` — standalone service-layer function (NOT gated on Spec 31)
- `GET /advisor/daily-brief` + `POST /internal/generate-briefs` + `POST /internal/generate-brief/{workspace_id}/{user_id}`
- Redis cache with workspace_id + user_id + date in key

**notification-service:**
- Novu template: `daily_ops_brief_ready` — in-app push

**Frontend:**
- `ExecutionModeSelector.tsx` — 3-option segmented control in campaign wizard + settings
- `DailyOpsBriefPanel.tsx` — morning dashboard panel with 5 core cards
- Mode badge on Campaign List + Campaign Detail

### Phase 2 — Review Mode Approval Queue UI (Sprint 3–4)

**campaign-service:**
- Alembic migration: `step_approval_queue` table + indexes
- `GET /campaigns/{id}/approval-queue`
- `POST /campaigns/{id}/approval-queue/approve` (batch loop of 500)
- `POST /campaigns/{id}/approval-queue/reject`
- Expiry job: Cloud Scheduler daily → `POST /internal/approval-queue/expire-stale`

**notification-service:**
- Novu template: `steps_queued_for_review` — in-app notification

**Frontend:**
- `ApprovalQueueTable.tsx` — paginated queue with bulk approve/reject
- Brief Card 3 "Approve batch" action → opens `ApprovalQueueTable` pre-filtered

### Phase 3 — Enhanced Brief (Sprint 5+, gated on Spec 30)

- Brief Cards 6–7: stalled deals (crm-service) + pipeline velocity (Spec 30 `pipeline_snapshots`)
- Brief delivery via push notification (mobile, when native app exists)
- Brief history: "Yesterday's brief" link

---

## File Map

```
services/
  campaign-service/
    app/
      models/
        campaign.py                     # ADD execution_mode column
        step_approval_queue.py          # NEW model
      schemas/
        campaign.py                     # ADD execution_mode to CampaignUpdate
        step_approval_queue.py          # NEW: ApprovalQueueResponse, ApproveRequest, RejectRequest
      services/
        campaign_service.py             # EXTEND: execution mode update logic + role gate + audit log + outbox
        approval_queue_service.py       # NEW: queue insert, batch approve, reject, expire logic
        bounce_circuit_breaker.py       # NEW: Redis counter + auto-pause call
      routers/
        campaigns.py                    # EXTEND: PATCH execution_mode
        approval_queue.py               # NEW: GET/POST approval queue endpoints
    tests/
      services/
        test_campaign_execution_mode.py
        test_approval_queue_service.py
        test_bounce_circuit_breaker.py
      api/
        test_approval_queue_api.py

  sequence-worker/
    app/
      executor/
        step_executor.py                # EXTEND: dispatch fork on execution_mode
        mode_cache.py                   # NEW: Redis read/write/delete for execution_mode cache
      subscribers/
        campaign_events.py              # NEW: handle campaign.execution_mode_changed → cache invalidate
    tests/
      test_step_executor_fork.py
      test_mode_cache.py
      test_circuit_breaker.py

  ai-service/
    app/
      services/
        brief_assembler.py              # NEW: multi-service fan-out, structured payload assembly
        brief_cache.py                  # NEW: Redis get/set for ops brief cache key
      routers/
        daily_brief.py                  # NEW: GET /advisor/daily-brief + internal generation endpoints
    tests/
      services/
        test_brief_assembler.py
        test_brief_cache.py
      api/
        test_daily_brief.py

alembic/
  versions/
    2026_05_05_001_add_execution_mode_to_campaigns.py
    2026_05_05_002_create_step_approval_queue.py

frontend/
  app/
    (dashboard)/
      campaigns/
        [id]/
          page.tsx                      # EXTEND: show mode badge; Review Queue tab (Phase 2)
          settings/page.tsx             # EXTEND: ExecutionModeSelector
        new/page.tsx                    # EXTEND: ExecutionModeSelector in wizard Launch step
      page.tsx                          # EXTEND: mount DailyOpsBriefPanel on first load
  components/
    content-studio/                     # (existing)
    solo-operator/
      ExecutionModeSelector.tsx         # NEW: 3-option segmented control with plan gates
      DailyOpsBriefPanel.tsx            # NEW: Brief panel with 5–7 cards
      BriefCard.tsx                     # NEW: reusable card with count + previews + action button
      ApprovalQueueTable.tsx            # NEW (Phase 2): paginated queue with bulk actions
  hooks/
    useDailyBrief.ts                    # NEW: TanStack Query hook for GET /advisor/daily-brief
    useApprovalQueue.ts                 # NEW: TanStack Query hook for approval queue
    useExecutionMode.ts                 # NEW: mutation hook for PATCH execution_mode
```

---

## Feature Flags

| Flag | Service | Description |
|---|---|---|
| `campaign_execution_modes` | billing-service | Plan gate: Pro+ for Autopilot + Review modes |
| `daily_ops_brief` | billing-service | Plan gate: Pro+ for full Brief (core 5 cards) |
| `daily_ops_brief_pipeline` | billing-service | Plan gate: Business+ for pipeline cards (6–7) |
| `autopilot_bounce_circuit_breaker` | campaign-service | Kill switch: disable bounce auto-pause (safety valve) |

---

## GCP Config / Cloud Scheduler

**New Cloud Scheduler job (brief generation fan-out):**
```yaml
name: daily-ops-brief-trigger
schedule: "0 5 * * *"          # 05:00 UTC — covers timezone offset to 06:00 HCM (UTC+7) with ±1h tolerance
timezone: UTC
target:
  httpTarget:
    uri: https://{ai-service-internal-url}/internal/generate-briefs
    httpMethod: POST
    oidcToken:
      serviceAccountEmail: ai-service@revlooper-prod.iam.gserviceaccount.com
```

**Note on timezone handling:** Brief generation uses 05:00 UTC as a base. Individual workspace timezone is read from `workspaces.timezone` (IANA). The Cloud Tasks fan-out handler skips workspaces where `06:00 workspace_timezone` has not yet been reached. This is a best-effort approximation; precise per-workspace scheduling is a Phase 3 refinement.

**New Cloud Scheduler job (approval queue expiry):**
```yaml
name: approval-queue-expiry-job
schedule: "0 1 * * *"          # 01:00 UTC daily
target:
  httpTarget:
    uri: https://{campaign-service-internal-url}/internal/approval-queue/expire-stale
    httpMethod: POST
    oidcToken:
      serviceAccountEmail: campaign-service@revlooper-prod.iam.gserviceaccount.com
```

---

## Secrets

No new secrets. All internal service URLs already in GCP Secret Manager.

---

## Monitoring / Alerts

| Signal | Alert Threshold | Action |
|---|---|---|
| `campaign.auto_paused` events/hour | > 10/hour across workspace | PagerDuty — possible bounce spike cluster |
| approval queue `status='expired'` rows | > 100/day per workspace | In-app warning to workspace owner |
| brief generation failure rate | > 5% of scheduled briefs fail | PagerDuty + fallback: brief served from previous day's cached version |
| bulk approve p95 latency | > 30 seconds | Alert — may indicate DB lock contention |

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Bulk "Approve All" DB lock contention at 10k rows | HIGH | Batch loop of 500 documented in spec + integration tested; connection pool monitored |
| Brief generation Cloud Scheduler delay | MEDIUM | Lazy generation fallback on first `GET /advisor/daily-brief`; user never sees "brief not ready" error |
| sequence-worker cache invalidation event delivery delay | LOW | 5-min TTL is the backstop; mode changes require campaign pause first (no in-flight ambiguity) |
| Spec 31 tool reuse if Spec 31 never ships | MEDIUM | `brief_assembler.py` is fully standalone; tool functions are independent HTTP calls, not Spec 31 class instances |
| Bounce circuit breaker false positive on small batches | MEDIUM | Minimum sample size of 20 sends before threshold applies (documented + tested) |
| Cloud Scheduler timezone fan-out new pattern | LOW | Flagged for CTO review in implementation; test with 3 timezones (UTC, Asia/Ho_Chi_Minh, America/New_York) in integration suite |

---

## Rollout Plan

| Stage | What | Success Gate |
|---|---|---|
| Alpha (internal) | Phase 1 backend + ExecutionModeSelector (manual toggle, no auto-dispatch change) | Mode column exists, integration tests pass |
| Beta (10 Pro workspaces) | Phase 1 full: Autopilot badge + bounce circuit breaker + Daily Ops Brief | Brief open rate ≥ 40% in beta cohort |
| GA (all Pro+) | Phase 1 GA + Phase 2 Review queue UI | Review queue adoption ≥ 20% of beta users with manual mode |
| Phase 3 (Business+) | Pipeline velocity cards (gated on Spec 30 data) | Spec 30 shipped |
