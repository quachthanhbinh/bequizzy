# Spec 20 — Data Governance & Retention: PRD

## Problem Statement

RevLooper stores personal data (names, emails, phones) for thousands of leads. Without data retention enforcement and erasure pipelines, the platform is non-compliant with PDPA (Thailand, Vietnam) and GDPR, creating enterprise sales blockers.

## PII Inventory

| Table | PII Fields | Retention |
|---|---|---|
| leads | first_name, last_name, email, phone, linkedin_url | 2 years |
| inbox_messages | body (may contain PII) | 3 months |
| email_sends | to_email | 3 months |
| email_events | metadata | 3 months |
| channel_sends | metadata | 3 months |
| bookings | form_responses (JSONB) | 1 year |
| customers | — (references leads) | Customer lifetime |
| outbox_events | payload (may contain emails) | 30 days |

## Acceptance Criteria

### AC-20-01: Right-to-Erasure Endpoint
- GIVEN a POST to `/compliance/erasure` with `lead_id`
- WHEN processed
- THEN PII fields in `leads` are pseudonymized within 30 days
- AND all related tables are purged or pseudonymized
- AND `gdpr_erasure_requests` row updated to `status = completed`

### AC-20-02: Automated Retention Enforcement
- GIVEN `email_events` rows older than 3 months
- WHEN retention job runs (daily)
- THEN rows are deleted (hard delete)
- AND a count is logged

### AC-20-03: Consent Log
- GIVEN a workspace processes personal data for VN/TH/SG leads
- THEN a `consent_log` row must exist for that lead before processing
- AND consent_log retention: lifetime of lead record

## Non-Functional Requirements
| Requirement | Target |
|---|---|
| Erasure completion | ≤ 30 days from request |
| Retention job | Daily 02:00 UTC |
| Consent log lookup | < 50ms |
