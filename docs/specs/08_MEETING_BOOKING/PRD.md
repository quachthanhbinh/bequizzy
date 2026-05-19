# Spec 08 — Meeting Booking: PRD

## Problem Statement

The goal of cold outreach is a booked meeting. Founders waste time on manual scheduling — back-and-forth emails, time zone confusion. RevLooper should let a booking link in an email or sequence step convert a reply into a calendar invite automatically.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-08-01 | Founder | I want to connect my Cal.com account to RevLooper | P0 |
| US-08-02 | Founder | I want to create meeting types (15/30/60 min) with custom names | P0 |
| US-08-03 | Founder | I want a shareable booking link to embed in email sequences | P0 |
| US-08-04 | Founder | I want booking notifications sent to me and the lead automatically | P0 |
| US-08-05 | Sales Rep | I want round-robin assignment for team bookings | P1 |
| US-08-06 | Founder | I want custom questions on the booking form | P1 |
| US-08-07 | Founder | I want booked meetings to appear in the CRM as deals | P2 |
| US-08-08 | Admin | I want to set availability hours (timezone-aware) | P1 |
| US-08-09 | Founder | I want booking reminders sent 24h and 1h before the meeting | P1 |
| US-08-10 | Founder | I want cancelled/rescheduled bookings handled automatically | P1 |

## Acceptance Criteria

### AC-08-01: Cal.com OAuth Connection
- GIVEN a user clicks "Connect Cal.com"
- WHEN they complete OAuth flow
- THEN an access token is stored in GCP Secret Manager (not DB)
- AND a test API call verifies the connection is active
- AND `cal_connections` row is created with `status = connected`

### AC-08-02: Meeting Type Creation
- GIVEN a user creates a meeting type
- WHEN saved
- THEN the meeting type is created in Cal.com via API
- AND a `meeting_types` row is created in RevLooper DB with `cal_event_type_id` (soft FK)
- AND a shareable booking URL is generated: `revlooper.com/book/{workspace_slug}/{meeting_type_slug}`

### AC-08-03: Booking Webhook Consumer
- GIVEN a lead books a meeting via the booking link
- WHEN Cal.com delivers the `booking.created` webhook
- THEN `bookings` row is created with `status = confirmed`
- AND `notification-service` sends confirmation email to lead and host
- AND a `booking.created` outbox event is emitted
- AND if the lead_id can be matched (by email), `lead.last_activity_at` is updated

### AC-08-04: Booking Cancellation/Reschedule
- GIVEN Cal.com delivers `booking.cancelled` or `booking.rescheduled` webhook
- WHEN processed
- THEN `bookings.status` is updated to `cancelled` or `rescheduled`
- AND notification-service sends update email to both parties
- AND outbox event emitted

### AC-08-05: Round-Robin Assignment
- GIVEN a meeting type has `assignment_type = round_robin` with multiple hosts
- WHEN a booking is created
- THEN the host is selected by round-robin (Redis atomic counter per meeting type)
- AND the booking is assigned to the selected host's Cal.com event type

### AC-08-06: Booking Reminders
- GIVEN a confirmed booking exists
- WHEN the booking time is 24h away (Cloud Scheduler checks)
- THEN notification-service sends a reminder to the lead and host
- AND repeat at 1h before

### AC-08-07: Custom Booking Form Questions
- GIVEN a meeting type has custom questions configured
- WHEN the booking form is submitted
- THEN Cal.com captures answers and includes them in the webhook payload
- AND answers are stored in `bookings.form_responses` JSONB

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Booking webhook processing latency | < 3s |
| Booking confirmation email | Delivered < 30s after booking |
| Booking URL availability | 99.9% |
| Cal.com API rate limits | Respect Cal.com limits (100 req/min) |

## Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Cal.com connection success rate | ≥ 95% |
| Booking confirmation delivery rate | ≥ 99% |
| Meeting → deal conversion rate (via CRM) | Tracked (baseline TBD) |
| Booking link click → booked rate | Tracked (baseline TBD) |
