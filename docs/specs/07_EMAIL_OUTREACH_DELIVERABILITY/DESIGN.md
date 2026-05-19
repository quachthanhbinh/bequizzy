# Spec 07 — Email Outreach & Deliverability: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:**
> Deliverability is the #1 user complaint in email tools. We must make it dead-simple: one button to connect Gmail, automatic warmup, and a clear health dashboard. The warmup schedule should require zero configuration — just on/off. Support for custom SMTP is important for Vietnamese users on corporate mail servers. Confidence: 7.

**CTO:**
> The critical architecture decision is credential storage: OAuth tokens and API keys MUST go to GCP Secret Manager — never the database. Secret versioning lets us rotate without downtime. For bounce/complaint webhooks: they are idempotent by ESP event ID (store in `email_events.esp_event_id` with UNIQUE constraint). At 1M emails/month, `email_sends` table needs aggressive partitioning by `sent_at` month. Warmup schedule is a Cloud Scheduler job that updates `mailbox.daily_send_limit` daily. Confidence: 6 — open/click tracking pixel hosting concerns me (Cloudflare R2 or Workers redirect?).

**Gap: 1. CTO concerns about tracking pixel and table scale.**

### Round 2

**CPO:**
> Open/click tracking: pixel is a 1×1 transparent GIF hosted on Cloudflare Workers (edge, zero-latency), redirect click tracking via same. No R2 needed — Worker logic only. Health score UI: use a gauge component showing the 0–100 score with color bands. Users need to know WHY the score is low (e.g., "Bounce rate 7% — pause sending"). Confidence: 8.

**CTO:**
> Cloudflare Workers for tracking is the right call — no egress cost, sub-20ms globally. For table scale: partition `email_sends` by month using PostgreSQL declarative partitioning (Supabase supports it). Keep only 3 months of `email_events` in hot partition; archive older to BigQuery. Idempotency for webhooks: `INSERT ... ON CONFLICT (esp_event_id) DO NOTHING` — handles ESP retries cleanly. Confidence: 8.

**Gap: 0. Both ≥ 7. Converged.**

### Round 3 (Convergence)

**Joint:**
> Final: Secret Manager for credentials, Cloudflare Workers for tracking pixel/click redirect, monthly-partitioned `email_sends` + `email_events`, idempotent webhook processing via `esp_event_id` UNIQUE constraint, Cloud Scheduler for warmup ramp, health score computed every 6h.

**Final Confidence: 8 / 10**
**Why not 10:** Deliverability is highly dependent on external signals (ESP feedback loops, inbox placement) that are partially outside our control. The warmup schedule is heuristic — some domains may need custom ramps.

---

## Data Model

### Table: `mailboxes`

```sql
CREATE TABLE mailboxes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL,
  email            TEXT NOT NULL,
  display_name     TEXT,
  provider         TEXT NOT NULL,  -- gmail|sendgrid|postmark|ses|smtp
  status           TEXT NOT NULL DEFAULT 'active', -- active/paused/disconnected
  daily_send_limit INTEGER NOT NULL DEFAULT 50,
  daily_send_count INTEGER NOT NULL DEFAULT 0,
  warmup_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  warmup_day       INTEGER NOT NULL DEFAULT 0,
  health_score     INTEGER,        -- 0-100, refreshed every 6h
  bounce_rate_7d   NUMERIC(5,4) DEFAULT 0,
  complaint_rate_7d NUMERIC(5,4) DEFAULT 0,
  secret_ref       TEXT NOT NULL,  -- GCP Secret Manager path (never store credential in DB)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_mailboxes_email_workspace ON mailboxes (workspace_id, email);
CREATE INDEX idx_mailboxes_workspace ON mailboxes (workspace_id);
```

### Table: `email_sends` (monthly partitioned)

```sql
CREATE TABLE email_sends (
  id            UUID NOT NULL DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  mailbox_id    UUID NOT NULL,
  lead_id       UUID NOT NULL,
  enrollment_id UUID,
  step_id       UUID,
  subject       TEXT,
  status        TEXT NOT NULL DEFAULT 'queued', -- queued/sent/failed
  sent_at       TIMESTAMPTZ,
  message_id    TEXT,             -- ESP message ID
  tracking_id   UUID UNIQUE,      -- for open/click pixel
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (sent_at);

CREATE TABLE email_sends_2025_01 PARTITION OF email_sends
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- ... monthly partitions via Alembic or Cloud Function
```

### Table: `email_events`

```sql
CREATE TABLE email_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  send_id       UUID NOT NULL,
  lead_id       UUID NOT NULL,
  event_type    TEXT NOT NULL, -- opened|clicked|bounced|complained|unsubscribed|delivered
  esp_event_id  TEXT UNIQUE,   -- idempotency key from ESP webhook
  metadata      JSONB,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_events_send ON email_events (send_id);
CREATE INDEX idx_email_events_lead ON email_events (workspace_id, lead_id);
```

### Table: `suppression_list`

```sql
CREATE TABLE suppression_list (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  email        TEXT NOT NULL,
  reason       TEXT NOT NULL, -- bounce|complaint|manual|unsubscribed
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_suppression_email ON suppression_list (workspace_id, email);
```

---

## ESP Adapters

```python
# outreach-service/app/adapters/esp_adapter.py
class ESPAdapter(Protocol):
    async def send_email(self, message: EmailMessage) -> SendResult: ...
    async def verify_connection(self) -> bool: ...

class SendGridAdapter(ESPAdapter): ...
class PostmarkAdapter(ESPAdapter): ...
class SESAdapter(ESPAdapter): ...
class SMTPAdapter(ESPAdapter): ...

def get_adapter(mailbox: Mailbox, secret_manager: SecretManager) -> ESPAdapter:
    credential = secret_manager.get(mailbox.secret_ref)
    return {
        "sendgrid": SendGridAdapter,
        "postmark": PostmarkAdapter,
        "ses": SESAdapter,
        "smtp": SMTPAdapter,
    }[mailbox.provider](credential)
```

---

## Tracking Architecture (Cloudflare Workers)

```
Email HTML:
  <img src="https://track.revlooper.com/o/{tracking_id}" width="1" height="1">
  <a href="https://track.revlooper.com/c/{tracking_id}/{url_encoded_target_url}">CTA</a>

Cloudflare Worker (track.revlooper.com):
  GET /o/{tracking_id} →
    POST outreach-service /email-events/opened  (internal, background)
    → Return 1×1 transparent GIF

  GET /c/{tracking_id}/{url} →
    POST outreach-service /email-events/clicked (internal, background)
    → Redirect 302 to target URL
```

---

## Webhook Processing (ESP → outreach-service)

```
ESP webhook → Cloud Functions 2nd gen (email-inbound) → Pub/Sub topic: email.events
    → outreach-service subscription:
        1. Validate webhook signature (HMAC or API key)
        2. INSERT email_events ON CONFLICT (esp_event_id) DO NOTHING
        3. If bounce/complaint → INSERT suppression_list + emit lead.suppressed
        4. Emit outbox event
        5. Return 200 (ACK)
```

---

## Outbox Events

| Event | Trigger |
|---|---|
| `email.sent` | Email dispatched successfully |
| `email.bounced` | Hard bounce received |
| `email.complained` | Spam complaint received |
| `email.opened` | Open tracking pixel fired |
| `email.clicked` | Click tracking redirect fired |
| `lead.suppressed` | Lead added to suppression list |
