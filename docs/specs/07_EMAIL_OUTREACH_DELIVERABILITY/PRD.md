# Spec 07 — Email Outreach & Deliverability: PRD

## Problem Statement

Cold email deliverability is the #1 reason outreach fails. Founders connect their GSuite/Outlook accounts and immediately blast 500 emails — destroying sender reputation. RevLooper must enforce warmup, track health, and auto-suppress bounces/complaints to protect users' domains.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-07-01 | Founder | I want to connect my Google Workspace email to send from | P0 |
| US-07-02 | Founder | I want to connect SendGrid / Postmark / AWS SES via API key | P0 |
| US-07-03 | Founder | I want a guided DKIM/DMARC/SPF checklist for my domain | P1 |
| US-07-04 | Founder | I want an automatic warmup schedule that ramps sends safely | P1 |
| US-07-05 | Founder | I want bounced emails to auto-suppress the lead immediately | P0 (CRITICAL) |
| US-07-06 | Founder | I want complaint/spam reports to auto-suppress and alert me | P0 (CRITICAL) |
| US-07-07 | Founder | I want a deliverability health score (0–100) per mailbox | P1 |
| US-07-08 | Founder | I want open/click tracking on sent emails | P1 |
| US-07-09 | Admin | I want to set a daily send limit per mailbox | P1 |
| US-07-10 | Founder | I want to manually suppress/unsuppress an email address | P1 |

## Acceptance Criteria

### AC-07-01: Mailbox Connection
- GIVEN a user provides valid ESP credentials (OAuth token or API key)
- WHEN the mailbox is saved
- THEN `outreach-service` verifies connectivity by sending a test probe
- AND stores credentials encrypted in GCP Secret Manager (never in DB plaintext)
- AND records the mailbox with `status = active`

### AC-07-02: Email Send
- GIVEN a sequence step calls `outreach-service.send_email()`
- WHEN the email is dispatched
- THEN suppression list is checked FIRST (synchronous)
- AND email is routed through the assigned mailbox ESP
- AND an `email_sends` row is created
- AND `daily_send_count` is checked and incremented atomically

### AC-07-03: Bounce Handling (CRITICAL)
- GIVEN ESP delivers a hard bounce webhook
- WHEN `outreach-service` processes it
- THEN the email address is immediately added to `suppression_list`
- AND all active sequence enrollments for that lead are set to `unsubscribed`
- AND the bounce is recorded in `email_events`
- AND the mailbox's `bounce_rate` metric is updated
- AND if `bounce_rate > 5%` over last 7 days, a workspace alert is sent

### AC-07-04: Complaint Handling (CRITICAL)
- GIVEN ESP delivers a complaint/spam webhook
- WHEN `outreach-service` processes it
- THEN the email address is immediately added to `suppression_list`
- AND a real-time alert is sent to the workspace owner (email + in-app)
- AND the mailbox's `complaint_rate` metric is updated
- AND if `complaint_rate > 0.1%` over last 7 days, the mailbox is auto-paused

### AC-07-05: Warmup Schedule
- GIVEN a new mailbox with warmup enabled
- WHEN the warmup is active
- THEN daily send limit follows the ramp: day 1–7: 10/day, day 8–14: 25/day, day 15–21: 50/day, day 22–30: 100/day
- AND warmup sends are interleaved with real sends (not separate)

### AC-07-06: Deliverability Health Score
- GIVEN a mailbox has activity over the past 7 days
- WHEN the health score is requested
- THEN score is computed: 100 − (bounce_weight × bounce_rate%) − (complaint_weight × complaint_rate%)
- AND score is shown as: ≥80 Green, 50–79 Yellow, <50 Red
- AND score is refreshed every 6 hours via Cloud Scheduler

### AC-07-07: Open/Click Tracking
- GIVEN an email is sent with tracking enabled
- WHEN the recipient opens or clicks
- THEN the event is recorded in `email_events` with `event_type = opened|clicked`
- AND the lead's `last_activity_at` is updated
- AND a `lead.activity.email_opened` Pub/Sub event is emitted

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Email send latency | p95 < 1s (queued) |
| Bounce suppression latency | < 5s after webhook receipt |
| Complaint suppression latency | < 2s after webhook receipt |
| Webhook processing | Idempotent (same event ID returns 200 without reprocessing) |
| Scale | 1M emails/month per workspace |
| Health score freshness | Refreshed every 6h |

## Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Bounce rate (platform avg) | < 3% |
| Complaint rate (platform avg) | < 0.08% |
| Bounce → suppression latency p99 | < 5s |
| Deliverability health score (avg across workspaces) | ≥ 80 |
| Mailbox connection success rate | ≥ 95% |
