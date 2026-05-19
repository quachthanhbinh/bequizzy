# Spec 08 — Meeting Booking: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:**
> Cal.com is the right integration — open source, SEA-friendly pricing, solid API. The key UX insight is that the booking link must work inside sequence email templates as a merge tag: `{{booking_link}}`. Round-robin is essential for sales teams (common in Vietnam). Custom questions on the booking form help qualify leads before the call. Confidence: 7.

**CTO:**
> Cal.com OAuth tokens go to Secret Manager — never DB. Webhook processing must be idempotent: `bookings.cal_booking_id` is UNIQUE. Round-robin host selection: Redis atomic INCR per meeting_type_id, mod number_of_hosts. The webhook endpoint (`/webhooks/cal`) is a public Cloud Functions 2nd gen endpoint — needs HMAC signature validation (Cal.com signs webhooks with a shared secret). Confidence: 7.

**Gap: 0. Both ≥ 7 from the start. Accelerated convergence.**

### Round 2

**CPO:**
> Booking reminders (24h + 1h) via notification-service are table-stakes for SEA users — no-show rates are high. The booking link must support a workspace-level default (`/book/{workspace_slug}`) that routes to the first active meeting type, so it's easy to add to email signatures. Confidence: 8.

**CTO:**
> Reminders: Cloud Scheduler checks every 30min for bookings in the 24h and 1h windows, then calls notification-service. Use `bookings.reminder_24h_sent` and `reminder_1h_sent` boolean flags to prevent double-sends (idempotent). The CRM deal creation trigger: emit `booking.confirmed` outbox event → CRM service consumes and creates deal. No direct DB access across service boundaries. Confidence: 8.

**Gap: 0. Both = 8. Converged.**

### Round 3 (Convergence)

**Joint:**
> Final: Cal.com OAuth + Secret Manager, HMAC webhook validation, idempotent booking creation by `cal_booking_id`, Redis round-robin for team assignment, Cloud Scheduler for reminders with idempotency flags, `booking.confirmed` outbox event for CRM integration.

**Final Confidence: 7 / 10**
**Why not higher:** Cal.com API stability risk — if Cal.com changes their API, our integration breaks. Mitigated by pinning API version and monitoring. Also, round-robin reset policy (what happens when hosts are removed mid-schedule) needs careful handling.

---

## Data Model

### Table: `cal_connections`

```sql
CREATE TABLE cal_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'connected', -- connected/disconnected
  cal_user_id  TEXT NOT NULL,
  secret_ref   TEXT NOT NULL,                     -- GCP Secret Manager path
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `meeting_types`

```sql
CREATE TABLE meeting_types (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  description      TEXT,
  assignment_type  TEXT NOT NULL DEFAULT 'direct', -- direct|round_robin
  host_user_ids    JSONB NOT NULL DEFAULT '[]',    -- workspace member user IDs
  cal_event_type_id TEXT,                          -- Cal.com event type ID
  booking_link     TEXT NOT NULL,                  -- generated URL
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  custom_questions JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_meeting_types_slug ON meeting_types (workspace_id, slug);
CREATE INDEX idx_meeting_types_workspace ON meeting_types (workspace_id);
```

### Table: `bookings`

```sql
CREATE TABLE bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL,
  meeting_type_id  UUID NOT NULL,                  -- soft FK → meeting_types
  cal_booking_id   TEXT NOT NULL UNIQUE,            -- Cal.com booking UID (idempotency)
  lead_id          UUID,                            -- soft FK → leads (nullable if anonymous)
  host_user_id     UUID NOT NULL,                   -- assigned host
  attendee_email   TEXT NOT NULL,
  attendee_name    TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'confirmed', -- confirmed/cancelled/rescheduled/completed
  form_responses   JSONB NOT NULL DEFAULT '{}',
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_1h_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at     TIMESTAMPTZ,
  rescheduled_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bookings_workspace ON bookings (workspace_id);
CREATE INDEX idx_bookings_lead ON bookings (workspace_id, lead_id);
CREATE INDEX idx_bookings_scheduled ON bookings (scheduled_at) WHERE status = 'confirmed';
```

---

## Booking Flow Architecture

```
Lead clicks booking link
    │
    ▼
Cal.com (handles UI + calendar availability)
    │
    ▼  booking.created webhook
Cloud Functions 2nd gen (webhook-handler)
    ├─ 1. Validate HMAC signature (Cal.com webhook secret from Secret Manager)
    ├─ 2. Publish to Pub/Sub: booking.events
    │
    ▼
booking-service (Cloud Run, Pub/Sub subscription)
    ├─ 1. INSERT bookings ON CONFLICT (cal_booking_id) DO NOTHING
    ├─ 2. Match lead by attendee_email → update lead.last_activity_at
    ├─ 3. notification-service: send confirmation emails (lead + host)
    ├─ 4. Emit outbox event: booking.confirmed
    └─ 5. (async) CRM service consumes booking.confirmed → creates deal
```

---

## Round-Robin Assignment (Redis)

```python
async def assign_round_robin_host(redis, meeting_type_id: str, host_ids: list[str]) -> str:
    key = f"rr:{meeting_type_id}"
    idx = await redis.incr(key)
    return host_ids[(idx - 1) % len(host_ids)]
```

---

## Booking Reminder Scheduler

```
Cloud Scheduler (every 30min) → booking-service /internal/send-reminders
    ├─ Query bookings WHERE status='confirmed'
    │   AND scheduled_at BETWEEN now()+23.5h AND now()+24.5h
    │   AND reminder_24h_sent = FALSE
    │
    ├─ For each: notification-service.send(reminder_24h) → UPDATE reminder_24h_sent=TRUE
    │
    └─ Same for 1h window and reminder_1h_sent flag
```

---

## Outbox Events

| Event | Trigger |
|---|---|
| `booking.confirmed` | Booking created and confirmed |
| `booking.cancelled` | Booking cancelled |
| `booking.rescheduled` | Booking rescheduled |
| `booking.reminder_sent` | Reminder email dispatched |
