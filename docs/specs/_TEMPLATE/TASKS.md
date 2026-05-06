# NN — <FEATURE> — TASKS

**Status:** 📝 Draft
**Plan generated via:** `writing-plans` skill
**Execution:** `tdd-agent` task-by-task

Each task follows TDD: RED → Verify-RED → GREEN → Verify-GREEN → Commit. See [TESTS.md](TESTS.md) for the full test strategy.

> Keep ≤15 tasks. If you need more, split this spec into a follow-up.

---

## Task 1 — <DB migration / first slice>

**Files:**
- Create: `alembic/versions/YYYY_MM_DD_NNN_<slug>.py`
- Create / modify: `services/<service>/app/models/<model>.py`

**Steps:**
- [ ] Write failing test: <path> — <what it asserts>
- [ ] Verify RED
- [ ] Implement
- [ ] Verify GREEN
- [ ] Roundtrip: `alembic upgrade head && alembic downgrade -1 && alembic upgrade head`
- [ ] Commit: `feat(<scope>): <message>`

**Acceptance:** <invariant>

---

## Task 2 — Pydantic schemas

**Files:**
- Create: `services/<service>/app/schemas/<schema>.py`

**Steps:**
- [ ] Write failing test
- [ ] Verify RED
- [ ] Implement matching DESIGN.md API contract exactly
- [ ] Verify GREEN
- [ ] Commit

---

## Task 3 — Service layer (business logic)

**Files:**
- Create: `services/<service>/app/services/<service>.py`
- Create: `services/<service>/tests/services/test_<service>.py`

**Steps:**
- [ ] Write failing tests for happy path + error branches + workspace isolation + credit deduction + outbox atomicity
- [ ] Verify RED
- [ ] Implement; credit deduction must be BEFORE any external call
- [ ] Verify GREEN
- [ ] Commit

---

## Task 4 — Internal client (if calling another service)

**Files:**
- Create: `services/<service>/app/clients/<other>_client.py`

**Steps:**
- [ ] Write failing test (mock httpx)
- [ ] Verify RED
- [ ] Implement async httpx client with Workload Identity OIDC token
- [ ] Verify GREEN
- [ ] Commit

---

## Task 5 — API router

**Files:**
- Create: `services/<service>/app/api/v1/<router>.py`
- Create: `services/<service>/tests/api/test_<router>.py`

**Steps:**
- [ ] Write failing tests for all endpoints + every error code
- [ ] Verify RED
- [ ] Implement; every route uses `workspace_id: str = Depends(get_workspace_id)`
- [ ] Verify GREEN
- [ ] Commit

---

## Task 6 — Pub/Sub handler (if event-driven)

**Files:**
- Create: `services/<service>/app/handlers/<handler>.py`

**Steps:**
- [ ] Write failing test: idempotent on duplicate delivery
- [ ] Verify RED → implement → Verify GREEN → commit

---

## Task 7 — Infrastructure (Terraform / Cloud Scheduler / queue)

**Files:**
- Create: `infra/terraform/<service>/<resource>.tf`

**Steps:**
- [ ] Define resources
- [ ] `terraform plan` → review → apply to staging
- [ ] Commit

---

## Task 8 — Notification template (if user-facing)

**Files:**
- Create: `services/notification-service/app/templates/<event>.<channel>.json`

**Steps:**
- [ ] Write failing test: notification dispatched, dedup correct
- [ ] Verify RED → implement → Verify GREEN → commit

---

## Task 9 — Frontend page / components

**Files:**
- Create: `frontend/app/(dashboard)/<route>/page.tsx`
- Create: `frontend/components/features/<feature>/<Component>.tsx`
- Create: `frontend/lib/api/<feature>.ts` (typed client)
- Create: `frontend/hooks/use-<feature>.ts`

**Steps:**
- [ ] Write failing component test
- [ ] Verify RED
- [ ] Implement using shadcn/ui + tokens from `design-system/globals.css`
- [ ] Loading skeleton, empty state, error state
- [ ] Mobile-first 375px verified; touch targets ≥44×44px
- [ ] Verify GREEN
- [ ] Commit

---

## Task 10 — Eval suite (AI features only)

**Files:**
- Create: `evals/golden/<feature>.yaml` (≥30 cases)
- Create: `evals/adversarial/<feature>_*.yaml`
- Create: `services/<service>/tests/evals/test_<feature>_eval.py`

**Steps:**
- [ ] Author golden + adversarial cases per [TESTS.md](TESTS.md)
- [ ] Implement harness via `edd-workflow` skill
- [ ] Run baseline; record in `evals/reports/`
- [ ] Set CI thresholds + cost caps
- [ ] Commit

---

## Task 11 — Feature flag wiring

**Files:**
- Modify: `services/<service>/app/core/feature_flags.py`
- Modify: `frontend/lib/feature-flags.ts`

**Steps:**
- [ ] Add `<flag>` to enum
- [ ] Gate API endpoints + frontend routes
- [ ] Default OFF
- [ ] Commit

---

## Task 12 — Ops handoff

**Files:**
- Create: `docs/runbooks/<feature>.md`

**Steps:**
- [ ] Author runbook (manual replay, per-workspace disable, common failures)
- [ ] Add monitoring dashboard links
- [ ] Commit

---

## Verification
After all tasks complete, run the `verification-loop` skill:

```bash
cd services/<service>
pytest -v --cov=app --cov-report=term-missing
mypy app/
ruff check app/

cd frontend
npx tsc --noEmit && npm run lint && npx vitest run
```

Then run `/code-review services/<service>` and `/security-audit services/<service>` before Phase 1 deploy.

## Done Definition
- All tasks committed
- All tests passing at coverage targets
- All evals above thresholds (AI features)
- Phase 1 internal validation successful
- IMPLEMENTATION.md Done Criteria all checked
