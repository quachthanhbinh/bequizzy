# Spec 10 — Multichannel Outreach: TASKS

## TDD Task List

### Task 1 — Migration: channel_sends
**RED first:** Import models → fails.
**File:** `alembic/versions/0010_channel_sends.py`
**Done when:** Upgrade + downgrade succeed.

### Task 2 — SMS Provider Router
**RED first:** Test U10-01 fails because `get_sms_provider()` missing.
**File:** `services/outreach-service/app/services/sms_service.py`
**Done when:** U10-01 passes.

### Task 3 — PDPA Consent Gate
**RED first:** Test U10-02 fails because `send_sms_step()` missing.
**Done when:** U10-02 passes; no SMS sent without consent.

### Task 4 — SMS Suppression Check (first operation)
**RED first:** Test U10-04 fails because suppression not checked.
**Done when:** U10-04 passes; suppressed leads never reach provider.

### Task 5 — LinkedIn Rate Limiter (Redis)
**RED first:** Test U10-03 fails because `check_linkedin_rate_limit()` missing.
**File:** `services/outreach-service/app/services/linkedin_service.py`
**Done when:** U10-03 passes; counter atomic in Redis.

### Task 6 — Twilio Adapter
**RED first:** Mock Twilio → integration test fails.
**File:** `services/outreach-service/app/adapters/twilio_adapter.py`
**Done when:** I10-01 passes.

### Task 7 — ESMS.vn Adapter
**RED first:** VN send integration test fails because adapter missing.
**File:** `services/outreach-service/app/adapters/esms_vn_adapter.py`
**Done when:** VN send routes to ESMS.vn with correct API key.

### Task 8 — LinkedIn Extension Bridge Endpoint
**RED first:** Extension polling request 404s.
**File:** `services/outreach-service/app/routers/channels.py`
**Done when:** Extension can poll and report results.

### Task 9 — PDPA Integration Test
**RED first:** Test I10-02 fails.
**Done when:** I10-02 passes; consent log is the sole authority.

## Completion Checklist
- [ ] Suppression check is first call in all channel handlers
- [ ] PDPA consent gate blocks VN SMS without consent
- [ ] LinkedIn rate limit hard cap at 25/day
- [ ] Twilio and ESMS.vn webhook signatures validated
- [ ] `mypy app/` passes; coverage ≥ 80%
