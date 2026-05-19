# Spec 08 — Meeting Booking: SECURITY

**Overall Risk: 🟡 MEDIUM**

---

## Threat Model

### T08-01: Cal.com Webhook Spoofing
- **Threat:** Attacker sends fake `booking.created` webhooks to create fraudulent bookings or exfiltrate data
- **Impact:** HIGH — fake bookings could spam workspace owners; data integrity violation
- **Controls:**
  - Cal.com signs webhooks with a shared HMAC secret (stored in GCP Secret Manager per workspace)
  - Webhook handler validates `cal-signature` header before processing
  - Invalid signatures → 403 response (no processing)
  - Idempotency: `bookings.cal_booking_id` UNIQUE — replays return 200 without side effects
- **Residual Risk:** Low

### T08-02: Booking Link Abuse / Spam Bookings
- **Threat:** Bot or malicious actor floods a booking link with fake bookings to fill the calendar and spam the workspace owner
- **Impact:** Medium — calendar poisoning; owner receives spam notifications
- **Controls:**
  - Rate limit: max 10 booking form submissions per IP per hour (Cloudflare WAF)
  - reCAPTCHA v3 on the Cal.com booking form (configurable per meeting type)
  - Booking notification to owner includes IP + user agent metadata
- **Residual Risk:** Low

### T08-03: PII in Booking Form Responses
- **Threat:** Booking form collects sensitive personal data (phone, company details) stored in `form_responses` JSONB
- **Impact:** Medium — PDPA/GDPR compliance risk if data not handled correctly
- **Controls:**
  - `form_responses` is included in the data export/erasure scope (Spec 20 — Data Governance)
  - `consent_log` entry created when booking is submitted (attendee consents to contact)
  - Data retention: bookings and form responses deleted after 2 years (retention policy)
- **Residual Risk:** Low

### T08-04: Cal.com OAuth Token Theft
- **Threat:** Cal.com OAuth token leaked from storage or logs
- **Impact:** HIGH — attacker can create/cancel bookings on behalf of the workspace
- **Controls:**
  - Token stored in GCP Secret Manager (never DB, never logs)
  - Token rotation on Cal.com OAuth refresh handled via Secret Manager versioning
  - Minimum required Cal.com OAuth scopes only (booking:write, event_types:read)
- **Residual Risk:** Low

### T08-05: Cross-Workspace Booking Access
- **Threat:** Workspace A accesses bookings belonging to workspace B
- **Impact:** CRITICAL — confidential meeting data exposed
- **Controls:**
  - All `booking-service` DB queries include `WHERE workspace_id = :workspace_id`
  - Integration test: T08-SEC-01 cross-workspace booking access returns 404
- **Residual Risk:** Low

### T08-06: Round-Robin Manipulation
- **Threat:** User deliberately times booking requests to always hit the same host (e.g., the CEO)
- **Impact:** Low — self-harm only (own workspace)
- **Controls:**
  - Round-robin is based on server-side Redis counter, not user-supplied input
  - No endpoint to query or influence the round-robin counter
- **Residual Risk:** Negligible

---

## Security Controls Summary

| Control | Implementation |
|---|---|
| Webhook HMAC validation | Per-workspace Cal.com secret from Secret Manager |
| Booking rate limiting | 10/IP/hour via Cloudflare WAF |
| PII data governance | In scope for erasure (Spec 20) |
| OAuth token storage | GCP Secret Manager only |
| workspace_id scoping | All queries |
| Idempotent processing | UNIQUE constraint on cal_booking_id |
