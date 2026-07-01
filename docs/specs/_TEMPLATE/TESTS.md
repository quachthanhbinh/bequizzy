# NN — <FEATURE> — TESTS

**Status:** 📝 Draft
**Coverage targets:** 90% on new code; **100% on security-critical paths** (auth, tenant scope, AI cost gate, PII handling)

---

## AC → Test Coverage Matrix

> **Required.** Every acceptance criterion in `PRD.md` must have a row here.
> The `doc-garden.yml` CI job checks this matrix weekly.
> An AC with no test row = a spec that cannot be verified = a BLOCKER for ship.

| AC ID | Description (from PRD.md) | Unit Test | Integration Test | E2E Test |
|-------|--------------------------|-----------|-----------------|---------|
| AC-1  | _copy AC text from PRD.md_ | `services/<svc>/tests/test_X_test.go::TestY` | ✅ / ❌ | `e2e/X.spec.ts:LN` |
| AC-2  | _copy AC text from PRD.md_ | `services/<svc>/tests/test_Z_test.go::TestZ` | ❌ | N/A |

**Rules:**
- Every row in `PRD.md`'s acceptance criteria section gets one row here.
- Test file + function name must be filled before spec approval.
- N/A only for AC with no user-facing surface (e.g. background jobs with no UI).
- ❌ means "not yet written" — must be ✅ before merging to main.

---

## Test Pyramid

| Layer | Tool | Scope |
|---|---|---|
| Unit | pytest + pytest-asyncio | Per-function, mocked external deps |
| Integration | pytest with local Supabase + service mocks | Multi-component, real DB |
| E2E | Playwright | Full user flow against staging |
| Evals (AI features only) | EDD harness (`edd-workflow` skill) | LLM output quality |

## Unit Tests

### `tests/services/test_<service>.py`
- [ ] `test_<happy_path>`
- [ ] `test_<error_branch>`
- [ ] `test_workspace_isolation` — query never crosses workspace boundary
- [ ] `test_credit_deduction_before_external_call` (if AI / paid op)
- [ ] `test_outbox_event_atomic_with_business_write`
- [ ] `test_idempotent_on_<dedup_key>`

### `tests/api/test_<router>.py`
- [ ] All endpoints: 200 happy path
- [ ] Each endpoint enforces `workspace_id` from JWT
- [ ] All error codes returned with correct HTTP status
- [ ] Pagination + filters where applicable

## Integration Tests

### `tests/integration/test_<feature>_flow.py`
- [ ] Full flow: trigger → service → DB writes → outbox → downstream consumer
- [ ] Cross-service: real internal HTTP + real Pub/Sub emulator

## E2E Tests (Playwright)

### `frontend/e2e/<feature>.spec.ts`
- [ ] <happy-path user flow>
- [ ] <error / empty state>
- [ ] Mobile (375px viewport): all flows work, touch targets ≥44×44px
- [ ] Accessibility: axe-core passes

## Eval Tests (only for AI features — EDD)

### Code-based grading (PR-blocking, free)
- Response is valid JSON matching schema
- No PII in output (regex check)
- No system-prompt leakage (substring check)

### LLM-as-judge (nightly, ~$2/run)
Score on 1–5 scale across <dimensions>. Target ≥4.0 each. CI fails if regression > 5% vs. 7-day baseline.

### Adversarial (REQUIRED — block public launch if any fail)
| Test ID | Goal | Pass criterion |
|---|---|---|
| ADV-01 | <attack> | <invariant holds> |

## Coverage Gates

| File | Target |
|---|---|
| <security-critical module> | **100%** |
| <core service> | 90% |
| Frontend critical paths | 90% |
| Frontend components | 70% |

## Cost Caps (AI features only)
- PR eval: `MAX_EVAL_COST_USD=2`
- Nightly full: `MAX_EVAL_COST_USD=10`

## Done Definition
- All tests pass at coverage targets
- All adversarial evals pass
- Reports persisted to `evals/reports/YYYY-MM-DD-<feature>.json`
