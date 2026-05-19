# Spec 06 — Sequence Builder & Execution: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO (product lens):**
> The UX must be a visual drag-and-drop canvas — not a list form. SEA users are visual. Step types must include LinkedIn and SMS from day one; they're primary channels here. Condition branches are essential for "reply detected → skip remaining steps". Confidence: 6.

**CTO (technical lens):**
> Drag-and-drop is purely frontend; backend stores ordered `position` integers. The execution architecture is where complexity lives: sequence-worker on GKE Autopilot polls a queue of due enrollments. Key constraint: suppression check MUST be synchronous and FIRST in every step handler — this is a legal/compliance non-negotiable, not just good practice. Also, 1M enrollments at scale means we need Cloud Tasks for scheduling (not cron polling) — each step completion enqueues the next step. Confidence: 5 — scale of step scheduling concerns me.

**Gap: 1. CTO scale concern caps confidence at 5.**

### Round 2

**CPO:**
> Agree on Cloud Tasks for scheduling — that's invisible to users. For unsubscribe propagation at scale: when a lead unsubscribes, we emit a `lead.unsubscribed` Pub/Sub event; sequence-worker consumes it and bulk-updates all active enrollments for that lead. This handles the 1-second SLA even at scale. Confidence: 7.

**CTO:**
> Pub/Sub for unsubscribe propagation works at scale — fan-out is handled by the message bus, not sequential DB updates. For daily send caps: a Redis atomic counter per `sequence_id:date` key, incremented before each email step dispatch, checked against the cap. If over cap, Cloud Task is re-enqueued for next day (24h delay). For enrollment idempotency: use `INSERT ... ON CONFLICT (lead_id, sequence_id, workspace_id) WHERE status = 'active' DO NOTHING`. Confidence: 8.

**Gap: 1. Both ≥ 7. Converging.**

### Round 3 (Convergence)

**Joint:**
> Final design: Cloud Tasks for step scheduling (O(1) per step), Pub/Sub for unsubscribe fan-out, Redis atomic counter for daily send caps, suppression check as first operation in step handler (enforced by code review gate), enrollment idempotency via partial unique index.

**Final Confidence: 8 / 10**
**Why not 10:** Condition branch evaluation requires reading lead activity data from `outreach-service` (cross-service read). We use a direct HTTP call today but this creates temporal coupling. Acceptable for P1 but should migrate to an event-sourced approach in P2.

---

## Data Model

### Table: `sequences`

```sql
CREATE TABLE sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  campaign_id     UUID NOT NULL,              -- soft FK → campaigns
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft', -- draft/active/paused/archived
  daily_send_cap  INTEGER,
  settings        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sequences_workspace ON sequences (workspace_id);
CREATE INDEX idx_sequences_campaign  ON sequences (workspace_id, campaign_id);
```

### Table: `sequence_steps`

```sql
CREATE TABLE sequence_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  sequence_id  UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_type    TEXT NOT NULL,  -- email|wait|condition|ab_split|linkedin_connect|linkedin_message|sms
  position     INTEGER NOT NULL,
  config       JSONB NOT NULL DEFAULT '{}',
  -- email: {subject, body_template, from_mailbox_id}
  -- wait:  {duration_seconds, wait_type: 'fixed'|'until_event'}
  -- condition: {rule: 'email_opened'|'replied'|'tag_present', true_step_id, false_step_id}
  -- ab_split: {split_pct: 50, a_step_id, b_step_id}
  -- linkedin_connect: {note_template}
  -- sms: {body_template}
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sequence_id, position)
);
CREATE INDEX idx_sequence_steps_sequence ON sequence_steps (sequence_id);
```

### Table: `sequence_enrollments`

```sql
CREATE TABLE sequence_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  sequence_id     UUID NOT NULL,              -- soft FK → sequences
  lead_id         UUID NOT NULL,              -- soft FK → leads
  status          TEXT NOT NULL DEFAULT 'active',
  -- active/paused/completed/failed/unsubscribed
  current_step_id UUID,                       -- soft FK → sequence_steps
  next_step_at    TIMESTAMPTZ,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

-- Prevent duplicate active enrollments
CREATE UNIQUE INDEX idx_enrollments_active
  ON sequence_enrollments (workspace_id, sequence_id, lead_id)
  WHERE status = 'active';

CREATE INDEX idx_enrollments_workspace   ON sequence_enrollments (workspace_id);
CREATE INDEX idx_enrollments_lead        ON sequence_enrollments (workspace_id, lead_id);
CREATE INDEX idx_enrollments_next_step   ON sequence_enrollments (next_step_at) WHERE status = 'active';
```

### Table: `sequence_step_executions`

```sql
CREATE TABLE sequence_step_executions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL,
  enrollment_id  UUID NOT NULL,
  step_id        UUID NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',  -- pending/success/failed/skipped
  executed_at    TIMESTAMPTZ,
  error_message  TEXT,
  metadata       JSONB
);
CREATE INDEX idx_step_executions_enrollment ON sequence_step_executions (enrollment_id);
```

---

## Execution Architecture

```
Cloud Tasks
    │  (step task: {enrollment_id, step_id, workspace_id})
    ▼
sequence-worker (GKE Autopilot Deployment, always-on)
    │
    ├─ 1. Fetch enrollment + step from DB (scoped by workspace_id)
    ├─ 2. Check suppression list (outreach-service HTTP) ← FIRST, MANDATORY
    │     └─ If suppressed: mark enrollment 'unsubscribed', return 200 (ACK task)
    ├─ 3. Execute step handler by step_type:
    │     ├─ email → outreach-service.send_email()
    │     ├─ wait  → schedule next Cloud Task with delay
    │     ├─ condition → evaluate rule via lead activity data
    │     ├─ ab_split → hash(lead_id) % 100 < split_pct → route to A or B
    │     ├─ linkedin_connect → outreach-service.linkedin_connect()
    │     └─ sms → outreach-service.send_sms()
    ├─ 4. Record step execution in sequence_step_executions
    ├─ 5. Advance enrollment to next step (or complete)
    └─ 6. Emit outbox event

Pub/Sub (lead.unsubscribed) → sequence-worker subscription
    └─ Bulk UPDATE enrollments SET status='unsubscribed' WHERE lead_id=X AND status='active'
```

---

## Daily Send Cap (Redis)

```python
async def check_daily_send_cap(redis, sequence_id: str, cap: int) -> bool:
    key = f"seq_daily_cap:{sequence_id}:{date.today().isoformat()}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, 86400)  # TTL 24 hours
    if count > cap:
        await redis.decr(key)  # roll back
        return False  # over cap
    return True
```

---

## Outbox Events

| Event | Trigger |
|---|---|
| `sequence.created` | New sequence saved |
| `sequence.enrollment.created` | Lead enrolled |
| `sequence.step.executed` | Step completed |
| `sequence.enrollment.completed` | All steps done |
| `sequence.enrollment.unsubscribed` | Lead unsubscribed during enrollment |
