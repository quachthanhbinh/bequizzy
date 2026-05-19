# Spec 16 — Platform Reliability: TASKS

## TDD Task List

### Task 1 — Retry Decorator (Tenacity)
**RED first:** Test U16-01 fails because `call_service` missing.
**File:** `services/shared/reliability.py`
**Done when:** U16-01, U16-02 pass.

### Task 2 — Circuit Breaker (Redis State)
**RED first:** Test U16-03 fails.
**Done when:** U16-03 passes; state transitions: closed → open → half_open → closed.

### Task 3 — Health Router
**RED first:** Test I16-01 fails.
**Done when:** /healthz returns 200; /readyz tests DB + Redis; I16-01, I16-02 pass.

### Task 4 — Roll Out to All Services
**RED first:** Each service missing /healthz returns 404.
**Done when:** All 14 services include HealthRouter; Cloud Run probes configured.

### Task 5 — No Info Disclosure on /readyz Failure
**RED first:** Test I16-02 fails.
**Done when:** 503 returned; no stack trace in response body.

## Completion Checklist
- [ ] Retry: 3 attempts with exponential backoff
- [ ] Circuit breaker: opens at 5 failures, resets after 30s
- [ ] /healthz and /readyz on ALL services
- [ ] /readyz no info disclosure verified
- [ ] `mypy app/` passes on shared module
