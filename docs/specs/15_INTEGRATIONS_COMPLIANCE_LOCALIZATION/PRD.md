# Spec 15 — Integrations, Compliance & Localization: PRD

## Problem Statement

RevLooper must integrate with existing tools (Zapier, HubSpot, Salesforce), prove regulatory compliance to enterprise buyers (PDPA/GDPR), and serve SEA markets natively in Vietnamese and Thai.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-15-01 | Founder | I want to trigger Zapier/Make workflows when a lead replies | P0 |
| US-15-02 | Founder | I want to sync contacts with HubSpot | P1 |
| US-15-03 | Founder | I want to sync contacts with Salesforce | P1 |
| US-15-04 | Admin | I want to see a PDPA/GDPR compliance dashboard | P0 |
| US-15-05 | Admin | I want to handle right-to-erasure (GDPR/PDPA) requests | P0 |
| US-15-06 | VN User | I want the UI in Vietnamese | P1 |
| US-15-07 | TH User | I want the UI in Thai | P2 |
| US-15-08 | VN Business | I want to generate Vietnam tax invoices | P2 |

## Acceptance Criteria

### AC-15-01: Outbound Webhooks (Zapier/Make)
- GIVEN a user configures a webhook URL for event type `lead.replied`
- WHEN the event occurs
- THEN webhook handler POSTs to the URL within 30s
- AND retries up to 3 times with exponential backoff
- AND HMAC-SHA256 signature in `X-RevLooper-Signature` header

### AC-15-02: PDPA/GDPR Erasure
- GIVEN a user submits a right-to-erasure request for lead_id
- WHEN processed
- THEN all PII fields for that lead are nulled/pseudonymized within 30 days
- AND erasure is logged in `gdpr_erasure_requests`
- AND the lead record is retained (for audit purposes) with PII removed

### AC-15-03: HubSpot Contact Sync
- GIVEN HubSpot OAuth is connected
- WHEN a lead is created or updated in RevLooper
- THEN a contact is upserted in HubSpot within 5 minutes
- AND sync status tracked in `integration_sync_log`

## Non-Functional Requirements
| Requirement | Target |
|---|---|
| Webhook delivery | ≤ 30s, 3 retries |
| Erasure completion | ≤ 30 days |
| HubSpot sync lag | ≤ 5 minutes |
| i18n support | EN, VN (P1), TH (P2) |
