# Spec 07 — Email Outreach & Deliverability: IMPLEMENTATION

## Phases

### Phase 1 — Mailbox Management
- Alembic migration: `mailboxes`, `email_sends` (partitioned), `email_events`, `suppression_list`
- SQLAlchemy models
- Mailbox CRUD endpoints (connect/list/update/disconnect)
- Secret Manager integration for credential storage
- `ESPAdapter` interface + stub adapters (SendGrid, Postmark, SES, SMTP)

### Phase 2 — Email Send Pipeline
- `send_email()` service function (suppression-first)
- Daily send cap (Redis atomic counter)
- Warmup schedule enforcement (effective daily limit = min(warmup, user_limit))
- Outbox event emission

### Phase 3 — Webhook Processing
- Cloud Functions 2nd gen webhook handler (`email-inbound/`)
- Webhook signature validation per ESP (SendGrid Ed25519, Postmark HMAC, SES SNS)
- Bounce/complaint → suppression + enrollment stop (Pub/Sub fan-out)
- Idempotent event processing (`ON CONFLICT esp_event_id DO NOTHING`)

### Phase 4 — Tracking (Cloudflare Workers)
- Open pixel worker: `GET /o/{tracking_id}` → POST event + return GIF
- Click redirect worker: `GET /c/{tracking_id}/{url}` → POST event + redirect
- Consent check integration (VN/TH/SG)

### Phase 5 — Health Scores + Frontend
- Health score computation Cloud Scheduler job (every 6h)
- Mailbox health score API endpoint
- Frontend: Mailbox settings page (connect/status/health gauge)
- Frontend: Suppression list management page

---

## File Map

```
services/outreach-service/
  app/
    models/
      mailbox.py
      email_send.py
      email_event.py
      suppression.py
    schemas/
      email.py
      mailbox.py
    routers/
      mailboxes.py
      email.py
      webhooks.py
      suppression.py
    services/
      email_service.py        # send_email() with suppression-first
      suppression_service.py  # check + add to suppression list
      health_score_service.py # compute_health_score()
      webhook_service.py      # process_esp_event()
    adapters/
      esp_adapter.py          # Protocol definition
      sendgrid_adapter.py
      postmark_adapter.py
      ses_adapter.py
      smtp_adapter.py
    utils/
      daily_cap.py            # Redis atomic counter (reused from Spec 06)
      warmup.py               # get_effective_daily_limit()
  alembic/versions/0007_email_outreach.py

services/email-inbound/       # Cloud Functions 2nd gen
  main.py                     # Webhook receiver + Pub/Sub publisher

frontend/
  app/(dashboard)/settings/
    mailboxes/page.tsx
    suppression/page.tsx
  components/email/
    MailboxCard.tsx
    HealthScoreGauge.tsx
    SuppressionTable.tsx
```

---

## Environment Variables

```env
# outreach-service
SECRET_MANAGER_PROJECT=revlooper-prod
SUPPRESSION_CHECK_TIMEOUT_MS=50
HEALTH_SCORE_REFRESH_INTERVAL_HOURS=6
SENDGRID_WEBHOOK_PUBLIC_KEY=...  # from Secret Manager
POSTMARK_WEBHOOK_SECRET=...      # from Secret Manager
```
