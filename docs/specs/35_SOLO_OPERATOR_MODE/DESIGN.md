# 35 — Solo Operator Mode — DESIGN

**Status:** 📝 Draft
**Confidence:** 8/10
**Last updated:** 2026-05-05

## Architecture

**Owning services:**
- `campaign-service` — execution mode column; step_approval_queue table; approval endpoints
- `sequence-worker` — dispatch fork logic (reads execution_mode; chooses Autopilot path or queues for Review)
- `outreach-service` — unchanged; terminal dispatcher; suppression check invariant
- `ai-service` — daily brief assembly endpoint + Cloud Tasks handler
- `notification-service` — Novu push for "steps ready for review" + "brief ready" alerts

**Touches:** `analytics-service` (bounce rate for circuit breaker), `lead-service` (hot lead scores for brief), `crm-service` (stalled deals for brief), `billing-service` (credit balance for brief + feature gate), `analytics-aggregator` (brief generation scheduling pattern)

```
═══════════════════════════════════════════════════════════════════════
  AUTOPILOT DISPATCH PATH (existing path, now explicit)
═══════════════════════════════════════════════════════════════════════

Cloud Tasks ──► sequence-worker /execute-step
                    │
                    ├─ load campaign_lead
                    ├─ load execution_mode from Redis cache
                    │     (campaign:exec_mode:{campaign_id}  TTL 5m)
                    │     cache miss → DB read → populate cache
                    │
                    ├─ IF execution_mode = 'autopilot'
                    │       ├─ check Redis daily_send counter  ◄── ENFORCED
                    │       └─ call outreach-service /internal/dispatch
                    │               ├─ CHECK suppression_list  ◄── ENFORCED
                    │               └─ send email/channel
                    │
                    ├─ IF execution_mode = 'review' OR 'manual'
                    │       ├─ INSERT step_approval_queue (status='pending')
                    │       └─ emit step.queued_for_approval via outbox
                    │
                    └─ emit step.dispatched OR step.queued via outbox ──► analytics-service

═══════════════════════════════════════════════════════════════════════
  BOUNCE CIRCUIT BREAKER (Autopilot safety net)
═══════════════════════════════════════════════════════════════════════

outreach-service receives bounce event
  │
  ├─ INCR Redis campaign:bounce_count:{campaign_id}:{hour}  TTL 2h
  │
  └─ campaign:bounce_count exceeds 5% of sends_this_hour?
          ├─ YES → POST campaign-service /internal/campaigns/{id}/auto-pause
          │           campaign-service: status='paused', WRITE outbox event campaign.auto_paused
          │           → notification-service: fires Brief card 4 alert
          └─ NO  → noop

═══════════════════════════════════════════════════════════════════════
  COPILOT APPROVAL PATH
═══════════════════════════════════════════════════════════════════════

POST /campaigns/{id}/approval-queue/approve
  │
  ├─ campaign-service service layer:
  │     batch loop (500 rows per iteration):
  │       UPDATE step_approval_queue
  │         SET status='dispatching', approved_by=user_id, approved_at=NOW()
  │         WHERE id IN (batch) AND workspace_id=$wid AND status='pending'
  │       check Redis daily_send counter — stop loop if limit reached
  │       enqueue Cloud Task → sequence-worker /execute-step (same path as Autopilot)
  │       UPDATE status='dispatched'
  │
  └─ emit steps.approved outbox event

═══════════════════════════════════════════════════════════════════════
  DAILY OPS BRIEF GENERATION
═══════════════════════════════════════════════════════════════════════

Cloud Scheduler (06:00 UTC base, per-workspace timezone offset handled in fan-out)
  │
  └─ POST ai-service /internal/generate-briefs
          │
          └─ for each active workspace:
                IF Redis ops_brief:{workspace_id}:{user_id}:{date} EXISTS → skip
                ELSE → enqueue Cloud Task → /internal/generate-brief/{workspace_id}/{user_id}

/internal/generate-brief/{workspace_id}/{user_id}:
  ├─ parallel fan-out (async):
  │     outreach-service   GET /internal/inbox/unread-count
  │     lead-service       GET /internal/leads/hot-unfollowed
  │     campaign-service   GET /internal/campaigns/steps-due-today
  │     campaign-service   GET /internal/campaigns/auto-paused-since/{last_brief_at}
  │     billing-service    GET /internal/credits/balance
  │     crm-service        GET /internal/deals/stalled (Business+ only)
  ├─ assemble structured payload (no LLM)
  ├─ INSERT advisor_notifications (trigger_type='daily_ops_brief')
  ├─ SET Redis ops_brief:{workspace_id}:{user_id}:{date} = "generated" TTL 26h
  └─ POST notification-service /internal/push (Novu in-app: "Your daily brief is ready")
```

---

## Data Model

### Modified table — `campaigns` (campaign-service)

```sql
-- Alembic migration: 2026_05_05_001_add_execution_mode_to_campaigns.py
ALTER TABLE campaigns
  ADD COLUMN execution_mode TEXT NOT NULL DEFAULT 'autopilot'
  CHECK (execution_mode IN ('autopilot', 'review', 'manual'));

-- No index needed: sequence-worker fetches by campaign_id (PK), reads execution_mode as a column property
-- All existing campaigns default to 'autopilot' — preserves current auto-dispatch behaviour
```

`campaigns.settings` JSONB additions (no schema migration needed):
```json
{
  "copilot_step_expiry_hours": 48,
  "bounce_pause_threshold": 0.05
}
```

### New table — `step_approval_queue` (campaign-service)

Modelled on the existing `linkedin_job_queue` pattern (DATABASE_SCHEMA.md §15).

```sql
CREATE TABLE step_approval_queue (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL,              -- denormalized; every query MUST filter by this
  campaign_id           UUID NOT NULL,              -- soft FK → campaigns(id)
  campaign_lead_id      UUID NOT NULL,              -- soft FK → campaign_leads(id)
  step_id               UUID NOT NULL,              -- soft FK → sequence_steps(id)
  step_position         INT NOT NULL,
  idempotency_key       TEXT NOT NULL UNIQUE,       -- '{campaign_lead_id}:{step_position}' prevents duplicate queue rows
  -- Preview snapshot (taken at queue time — immune to subsequent step edits)
  preview_subject       TEXT,
  preview_body_snippet  TEXT,                       -- first 300 chars of rendered body
  lead_email            TEXT NOT NULL,              -- denormalized for list display without join
  content_hash          TEXT,                       -- SHA-256 of step content at queue time; if step edited, shows 'content changed' flag
  -- Status machine: pending → dispatching → dispatched | rejected | expired | failed
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','dispatching','dispatched',
                                            'rejected','expired','failed')),
  scheduled_at          TIMESTAMPTZ NOT NULL,       -- original step scheduled time
  approved_by           UUID,                       -- user_id (null until approved)
  approved_at           TIMESTAMPTZ,
  rejected_by           UUID,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  dispatched_at         TIMESTAMPTZ,
  dispatch_error        TEXT,
  attempt               SMALLINT NOT NULL DEFAULT 0,
  expires_at            TIMESTAMPTZ NOT NULL,       -- DEFAULT scheduled_at + copilot_step_expiry_hours
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Covering index for approval queue list UI (workspace → pending rows by schedule time)
CREATE INDEX idx_approval_queue_workspace_pending
  ON step_approval_queue (workspace_id, scheduled_at)
  WHERE status = 'pending';

-- Index for campaign-level queue view
CREATE INDEX idx_approval_queue_campaign
  ON step_approval_queue (campaign_id, status);

-- Index for bulk-approve batch cursor (primary key range scan preferred; this supports lead-level lookup)
CREATE INDEX idx_approval_queue_campaign_lead
  ON step_approval_queue (campaign_lead_id);
```

### `advisor_notifications` extensions (ai-service — Spec 31 table reuse)

No schema change. New `trigger_type` value: `'daily_ops_brief'`.

Payload shape for daily brief:
```json
{
  "trigger_type": "daily_ops_brief",
  "generated_at": "2026-05-05T06:00:00Z",
  "workspace_timezone": "Asia/Ho_Chi_Minh",
  "sections": {
    "unread_replies":     { "count": 4,  "previews": [{ "thread_id": "...", "from": "...", "snippet": "..." }] },
    "hot_leads":          { "count": 7,  "leads": [{ "lead_id": "...", "name": "...", "last_activity_at": "..." }] },
    "steps_due_today":    { "count": 23, "campaigns": [{ "campaign_id": "...", "name": "...", "step_count": 8 }] },
    "auto_paused":        { "count": 1,  "campaigns": [{ "campaign_id": "...", "name": "...", "reason": "bounce_spike" }] },
    "credit_warning":     { "remaining": 45, "quota": 500, "pct": 9 },
    "stalled_deals":      null,
    "pipeline_velocity":  null
  }
}
```

`stalled_deals` and `pipeline_velocity` are `null` unless Spec 30 data is confirmed available; frontend hides null sections gracefully.

### RLS
`step_approval_queue`: mirror existing workspace RLS — `USING (workspace_id = auth.workspace_id())`. Campaign-service Postgres role has `SELECT, INSERT, UPDATE` on this table only.

---

## API Contract

All routes follow standard `{ data, error, meta }` envelope. All require `X-Workspace-ID` header (set by api-gateway).

### campaign-service — Execution Mode

#### `PATCH /v1/campaigns/{campaign_id}`
Existing endpoint, extended to accept `execution_mode` field.

Service layer constraint (enforced before DB write):
- `require_role(['owner', 'admin'])`
- If `campaigns.status == 'active'` → raise `AppError('CAMPAIGN_ACTIVE_MODE_CHANGE', 'Pause the campaign before changing execution mode', 409)`
- Write `audit_log` row on mode change

```python
class CampaignUpdate(BaseModel):
    execution_mode: Literal['autopilot', 'review', 'manual'] | None = None
    # ... existing fields
```

#### `GET /v1/campaigns/{campaign_id}/approval-queue`
```python
class ApprovalQueueResponse(BaseModel):
    id: UUID
    campaign_lead_id: UUID
    step_id: UUID
    step_position: int
    preview_subject: str | None
    preview_body_snippet: str | None
    lead_email: str
    content_changed: bool   # True if step edited after queue time
    status: str
    scheduled_at: datetime
    expires_at: datetime

# Query params: status (default: 'pending'), page, per_page (default: 50, max: 100)
# Ordered by scheduled_at ASC
```

#### `POST /v1/campaigns/{campaign_id}/approval-queue/approve`
```python
class ApproveRequest(BaseModel):
    step_ids: list[UUID]   # empty list = approve ALL pending (triggers batch loop)

class ApproveResponse(BaseModel):
    approved: int
    skipped_limit_reached: int
    failed: int
```

Service layer:
- Batch size: 500 rows per loop iteration
- After each batch: check Redis `daily_send:{workspace_id}:{user_id}:{date}` — stop loop if exhausted
- Atomic UPDATE: `WHERE id IN (...) AND workspace_id = $wid AND status = 'pending'`
- On 0 rows affected (concurrent approval): return 409

#### `POST /v1/campaigns/{campaign_id}/approval-queue/reject`
```python
class RejectRequest(BaseModel):
    step_ids: list[UUID]
    rejection_reason: str | None = None
```

#### `POST /v1/internal/campaigns/{campaign_id}/auto-pause`
Internal-only (OIDC auth). Called by sequence-worker bounce circuit breaker.

### ai-service — Daily Ops Brief

#### `GET /v1/advisor/daily-brief`
Returns today's brief for the authenticated user. Reads from `advisor_notifications` (latest `trigger_type='daily_ops_brief'` for the day). Falls back to lazy generation if not yet generated (Cloud Scheduler may have been delayed).

```python
class DailyBriefResponse(BaseModel):
    generated_at: datetime
    sections: BriefSections
    is_cached: bool
```

#### `POST /v1/internal/generate-briefs`
Internal (OIDC). Cloud Tasks fan-out: one task per active workspace per user who logged in within 7 days.

#### `POST /v1/internal/generate-brief/{workspace_id}/{user_id}`
Internal (OIDC). Assembles brief for one workspace/user, writes to `advisor_notifications`, sets Redis flag.

### Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `CAMPAIGN_ACTIVE_MODE_CHANGE` | 409 | Cannot change execution mode on an active campaign |
| `EXECUTION_MODE_FORBIDDEN` | 403 | Role insufficient to change execution mode |
| `AUTOPILOT_PLAN_REQUIRED` | 403 | Feature gate — Pro+ required |
| `APPROVAL_CONCURRENT_CONFLICT` | 409 | Another request approved the same step concurrently |
| `DAILY_SEND_LIMIT_REACHED` | 429 | Approval loop stopped — daily send quota exhausted |

---

## Event / Outbox Design

| Event type | Producer | Subscribers | Key payload fields |
|---|---|---|---|
| `campaign.execution_mode_changed` | campaign-service | sequence-worker (cache invalidate) | `{ campaign_id, old_mode, new_mode, changed_by }` |
| `campaign.auto_paused` | campaign-service (via circuit breaker) | notification-service (Brief card 4 alert) | `{ campaign_id, reason: 'bounce_spike', bounce_rate }` |
| `step.queued_for_approval` | sequence-worker | notification-service ("steps ready for review") | `{ campaign_id, workspace_id, step_approval_queue_id }` |
| `steps.approved` | campaign-service | analytics-service | `{ campaign_id, workspace_id, count, approved_by }` |
| `brief.generated` | ai-service | notification-service (in-app push) | `{ workspace_id, user_id, generated_at }` |

All events written to `outbox_events` atomically with the relevant DB write.

**sequence-worker cache invalidation:**
On receiving `campaign.execution_mode_changed` event (Pub/Sub push subscription), sequence-worker calls `Redis.DELETE('campaign:exec_mode:{campaign_id}')`. Next step execution fetches fresh value from DB and re-populates cache.

---

## Scale Design

**Target:** 100 workspaces × 100k leads × 1M outbound msgs/month

| Concern | Plan |
|---|---|
| Autopilot throughput | No change vs. current auto-dispatch path — sequence-worker already sized at 500 dispatches/sec Cloud Tasks ceiling. Autopilot adds no throughput overhead. |
| step_approval_queue INSERT burst | 10k leads hitting `next_step_at` simultaneously → 10k rows at ~500 rows/sec = 20s to queue. PostgreSQL handles this. Partial index `idx_approval_queue_workspace_pending` covers approval UI query efficiently. |
| Bulk "Approve All" 10k rows | Batch loop of 500; each iteration: 500-row UPDATE + 500 Cloud Task enqueues + Redis counter check = ~10ms/batch × 20 batches = ~200ms total service-layer time. Frontend shows streaming progress via SSE or polling. NOT a single UPDATE. |
| Redis execution_mode cache | 1,000 active campaigns → 1,000 keys. Negligible. TTL 5 min. |
| Bounce circuit breaker Redis | Per-campaign per-hour counter. 100 campaigns × 24h = 2,400 keys max. TTL 2h. Negligible. |
| Daily Ops Brief generation | 100 workspaces × 5 internal HTTP calls/day = 500 calls total. Spread via Cloud Tasks fan-out over 15 minutes window. No concurrency concern. |
| Brief Redis cache | Key: `ops_brief:{workspace_id}:{user_id}:{date}`. 100 workspaces × avg 3 users = 300 keys/day. TTL 26h. Negligible. |

---

## Dependency Interfaces

| Dependency | What this spec needs |
|---|---|
| campaign-service (self) | NEW: `execution_mode` column + `step_approval_queue` table + approval endpoints |
| outreach-service | Existing: `POST /internal/dispatch` — suppression check + send. No changes. |
| ai-service (self for brief) | NEW: brief assembly tool functions as standalone service-layer functions (NOT gated on Spec 31 full advisor session being shipped) |
| analytics-service | Existing events: `message.bounced` per campaign (used for circuit breaker). Brief uses `campaign_stats` materialized view. |
| lead-service | NEW internal endpoint: `GET /internal/leads/hot-unfollowed?workspace_id=X&user_id=Y` for Brief Card 2 |
| billing-service | Existing: `GET /internal/credits/balance`. NEW: `campaign_execution_modes` and `daily_ops_brief` feature flags |
| notification-service | Existing: Novu push. Two new notification templates: `steps_queued_for_review` and `daily_ops_brief_ready` |
| sequence-worker | NEW: reads `execution_mode` from Redis cache; dispatch fork; bounce circuit breaker INCR |

---

## CPO ↔ CTO Debate Summary

**Round 1 only — converged immediately.**

CPO 8/10, CTO 7/10. Gap = 1. Both ≥ 7. **Converged.**

**Open item 1 (CPO):** Defer Review approval queue UI to Phase 2 to keep MVP lean.
**Open item 1 (CTO):** Build data model and backend now; UI can ship Phase 2. → **Resolved: backend Phase 1, UI Phase 2.**

**Open item 2 (CPO):** Don't call it "Copilot" — trademark confusion with Microsoft.
**Open item 2 (CTO):** No opinion on naming. → **Resolved: "Review" mode (CPO wins).**

**Open item 3 (CTO):** Spec 31 dependency risk for brief tool functions.
→ **Resolved:** Brief tool functions are extracted as standalone service-layer functions in `ai-service/app/services/brief_assembler.py`. They call internal endpoints of other services directly, not through the Spec 31 AI Advisor session machinery. Brief can ship before Spec 31.

**Open item 4 (CTO):** Bulk approval batch loop is mandatory — single UPDATE on 10k rows is a scale blocker.
→ **Resolved:** Documented as a spec invariant and explicit TASKS item. Frontend must show progress.

**Final consensus: 8/10.** Residual unknowns: (1) exact Cloud Scheduler timezone fan-out implementation (new pattern for this codebase — flagged for CTO review in IMPLEMENTATION.md); (2) sequence-worker Redis cache invalidation via Pub/Sub subscription — new but clean pattern, must have integration test coverage.
