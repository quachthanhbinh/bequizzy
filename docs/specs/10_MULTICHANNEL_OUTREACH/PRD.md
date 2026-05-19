# Spec 10 — Multichannel Outreach: PRD

## Problem Statement

In Southeast Asia, LinkedIn and SMS are primary B2B channels — often more effective than email. Founders need to run LinkedIn connect + message sequences and SMS drips as first-class outreach steps, not workarounds.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-10-01 | Founder | I want to add a LinkedIn connect step to my sequence | P0 |
| US-10-02 | Founder | I want to send a LinkedIn message step after connecting | P0 |
| US-10-03 | Founder | I want to send SMS via Twilio to international leads | P0 |
| US-10-04 | Founder | I want to send SMS via ESMS.vn to Vietnamese numbers | P0 |
| US-10-05 | Founder | I want LinkedIn and SMS steps to respect suppression lists | P0 (CRITICAL) |
| US-10-06 | Founder | I want PDPA consent gating for Vietnamese contacts before SMS | P0 (CRITICAL) |
| US-10-07 | Founder | I want to connect my LinkedIn account via the browser extension | P1 |
| US-10-08 | Admin | I want channel-specific rate limits (e.g., 100 LinkedIn connects/day) | P1 |

## Acceptance Criteria

### AC-10-01: LinkedIn Connect Step
- GIVEN a sequence has a LinkedIn connect step with `note_template`
- WHEN executed by sequence-worker
- THEN suppression check is performed FIRST
- AND outreach-service calls LinkedIn via browser extension bridge
- AND rate limit: 25 connect requests/day per LinkedIn account (LinkedIn limits)
- AND result logged in `channel_sends`

### AC-10-02: SMS Send (Twilio + ESMS.vn)
- GIVEN a sequence has an SMS step
- WHEN executed
- THEN suppression check FIRST
- AND for VN phone numbers: consent_log checked for `channel=sms` BEFORE sending
- AND phone number routed to ESMS.vn for VN (+84) or Twilio for other countries
- AND delivery status webhook from provider updates `channel_sends.status`

### AC-10-03: Consent Gate (PDPA — Vietnam)
- GIVEN a lead has a Vietnamese phone number (+84)
- WHEN an SMS step is about to execute
- THEN check `consent_log` for `{lead_id, channel=sms, workspace_id}`
- AND if no consent record: skip step, log reason `no_consent`, do NOT send
- AND increment `sequence_step_executions.status = skipped`

### AC-10-04: Channel Suppression
- GIVEN a lead's phone/LinkedIn is suppressed (opted out)
- WHEN any channel step is about to execute
- THEN step is skipped; enrollment set to unsubscribed (same as email)

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| LinkedIn rate limit | ≤ 25 connects/day/account |
| SMS delivery confirmation | Via webhook < 5min |
| Consent check latency | < 50ms |
| Channel suppression | Synchronous, < 50ms |
