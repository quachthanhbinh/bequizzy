# Spec 21 — Analytics Event Taxonomy: TASKS

## TDD Task List

### Task 1 — AnalyticsEvent Schema with PII Validator
**RED first:** Test U21-02 fails (PII passes through).
**File:** `services/analytics-service/app/schemas/events.py`
**Done when:** U21-01 and U21-02 pass.

### Task 2 — POST /events Endpoint
**RED first:** Test for missing workspace_id returns 422.
**Done when:** Endpoint validates schema, fires outbox event.

### Task 3 — Tracking Plan Document
**Done when:** 50+ events documented with when/who/properties columns.

## Completion Checklist
- [ ] Schema validation rejects PII fields
- [ ] workspace_id is required on every event
- [ ] 50+ events in tracking plan
