# 28 — AI Brain Reflection Loop — TASKS

**Status:** 📝 Draft
**Plan generated via:** `writing-plans` skill
**Execution:** `tdd-agent` task-by-task

Each task follows the TDD cycle: RED → Verify-RED → GREEN → Verify-GREEN → Commit. See [TESTS.md](TESTS.md) for full test strategy.

---

## Task 1 — DB migration: brain_proposals + reflection_runs

**Files:**
- Create: `alembic/versions/2026_05_05_001_add_brain_proposals_and_reflection_runs.py`
- Create: `services/ai-service/app/models/brain_proposal.py`
- Create: `services/ai-service/app/models/reflection_run.py`
- Modify: `services/ai-service/app/models/ai_brain_chunk.py` (add `source`, `source_proposal_id`)

**Steps:**
- [ ] Write failing test: `tests/migrations/test_2026_05_05_001.py` — applies migration on temp DB, asserts columns/indexes exist
- [ ] Verify RED
- [ ] Generate migration: `alembic revision --autogenerate -m "add_brain_proposals_and_reflection_runs"`
- [ ] Hand-edit migration to add unique partial index on `reflection_runs(workspace_id) WHERE status='running'`
- [ ] Add SQLAlchemy models with all columns matching DESIGN.md
- [ ] Verify GREEN
- [ ] Roundtrip: `alembic upgrade head && alembic downgrade -1 && alembic upgrade head`
- [ ] Commit: `feat(ai): add brain_proposals and reflection_runs tables`

**Acceptance:** migration is reversible; all columns + indexes match DESIGN.md.

---

## Task 2 — Pydantic schemas

**Files:**
- Create: `services/ai-service/app/schemas/brain_proposal.py`
- Create: `services/ai-service/app/schemas/reflection_run.py`

**Steps:**
- [ ] Write failing test: `tests/schemas/test_brain_proposal_schema.py` — validates required fields, category Literal, confidence range, body length cap
- [ ] Verify RED
- [ ] Implement schemas matching DESIGN.md API contract exactly
- [ ] Verify GREEN
- [ ] Commit: `feat(ai): add brain_proposal + reflection_run Pydantic schemas`

---

## Task 3 — PII stripper (CRITICAL — 100% coverage)

**Files:**
- Create: `services/ai-service/app/services/pii_stripper.py`
- Create: `services/ai-service/tests/services/test_pii_stripper.py`

**Steps:**
- [ ] Write failing tests for: English names, Vietnamese names (with diacritics), emails, phone numbers, +84 phone format, Thai phone format, edge cases (initials, hyphenated names)
- [ ] Verify RED
- [ ] Implement `strip_pii(text: str) -> str` replacing detected entities with `[NAME]` / `[EMAIL]` / `[PHONE]`
- [ ] Verify GREEN — 100% coverage required
- [ ] Add adversarial tests: Vietnamese mixed with English, name collisions with common words
- [ ] Commit: `feat(ai): add PII stripper for reflection input`

**Acceptance:** 100% line + branch coverage; no PII in any output across 50+ test cases.

---

## Task 4 — Reflection prompt template

**Files:**
- Create: `services/ai-service/app/prompts/brain_reflection.py`
- Create: `services/ai-service/tests/prompts/test_brain_reflection_prompt.py`

**Steps:**
- [ ] Write failing test: prompt produces valid JSON for sample input, includes anti-injection delimiters, version string
- [ ] Verify RED
- [ ] Author system prompt + user prompt template; version it as `BRAIN_REFLECTION_V1`
- [ ] Wrap reply bodies in `<reply>...</reply>` delimiters; instruct LLM to treat as data not instructions
- [ ] Verify GREEN
- [ ] Commit: `feat(ai): add reflection prompt template v1`

---

## Task 5 — Reflection service core

**Files:**
- Create: `services/ai-service/app/services/reflection_service.py`
- Create: `services/ai-service/tests/services/test_reflection_service.py`

**Steps:**
- [ ] Write failing tests: happy path, insufficient data (skip), insufficient credits, LLM failure (retry 2x then fail), workspace isolation (never references other workspace data)
- [ ] Verify RED
- [ ] Implement `reflection_service.run(workspace_id, window_days, trigger)`:
  1. Acquire workspace `running`-status slot (unique index)
  2. Fetch replies via `outreach_client.get_recent_replies(workspace_id, since)`
  3. If <10 replies: write skipped run, return
  4. Strip PII from reply bodies
  5. `billing_client.deduct_credits(workspace_id, 5, "ai_brain_reflection")` — raise if insufficient
  6. Call LLM via `litellm_router.complete()` with `max_tokens` caps
  7. Validate response against Pydantic schema
  8. Insert `brain_proposals` rows + outbox event atomically
  9. Update `reflection_runs.status='succeeded'`
- [ ] Verify GREEN
- [ ] Commit: `feat(ai): implement reflection_service core`

**Acceptance:** workspace_id scope on every query; credit deduction before LLM; outbox event emitted.

---

## Task 6 — Outreach internal client

**Files:**
- Create: `services/ai-service/app/clients/outreach_client.py`
- Create: `services/ai-service/tests/clients/test_outreach_client.py`
- (Coordinated PR in outreach-service) Create: `services/outreach-service/app/api/v1/internal/replies_router.py`

**Steps:**
- [ ] Write failing test: client mock returns 100 replies, asserts correct query params and authentication header
- [ ] Verify RED
- [ ] Implement async httpx client with Workload Identity OIDC token
- [ ] Verify GREEN
- [ ] Commit: `feat(ai): add internal client for outreach-service replies`

---

## Task 7 — API router (run/list/get/accept/reject)

**Files:**
- Create: `services/ai-service/app/api/v1/brain_router.py`
- Create: `services/ai-service/tests/api/test_brain_router.py`

**Steps:**
- [ ] Write failing tests for all 5 endpoints + error codes (`REFLECTION_INSUFFICIENT_DATA`, `INSUFFICIENT_CREDITS`, `BRAIN_PROPOSAL_NOT_FOUND`, `BRAIN_PROPOSAL_EXPIRED`, `REFLECTION_RATE_LIMITED`)
- [ ] Verify RED
- [ ] Implement endpoints; every route has `workspace_id: str = Depends(get_workspace_id)`
- [ ] Manual trigger rate limit: Memorystore sliding window 1/24h
- [ ] Accept endpoint: write `ai_brain_chunks` row + outbox event atomically
- [ ] Verify GREEN
- [ ] Commit: `feat(ai): add brain proposals + reflections API`

---

## Task 8 — Pub/Sub handler for scheduled reflections

**Files:**
- Create: `services/ai-service/app/handlers/reflection_handler.py`
- Create: `services/ai-service/tests/handlers/test_reflection_handler.py`

**Steps:**
- [ ] Write failing test: handler invokes reflection_service per workspace, idempotent on `run_id`
- [ ] Verify RED
- [ ] Implement handler subscribed to `ai.brain.reflection.requested`
- [ ] Verify GREEN
- [ ] Commit: `feat(ai): add Pub/Sub handler for scheduled reflections`

---

## Task 9 — Cloud Scheduler config (Terraform)

**Files:**
- Create: `infra/terraform/ai_service/cloud_scheduler_reflections.tf`

**Steps:**
- [ ] Define 7 Cloud Scheduler jobs (one per day-of-week bucket)
- [ ] Each invokes Cloud Tasks queue → ai-service.internal endpoint
- [ ] `terraform plan` → review
- [ ] Apply to staging
- [ ] Commit: `infra(ai): add weekly reflection scheduler buckets`

---

## Task 10 — Notification template

**Files:**
- Modify: `services/notification-service/app/templates/brain_proposals_created.in_app.json`
- Subscribe to `ai.brain.proposals.created`

**Steps:**
- [ ] Write failing test: notification dispatched with correct payload, dedup on run_id
- [ ] Verify RED
- [ ] Implement template + subscriber
- [ ] Verify GREEN
- [ ] Commit: `feat(notification): add brain proposals in-app template`

---

## Task 11 — Frontend: proposals dashboard

**Files:**
- Create: `frontend/app/(dashboard)/brain/proposals/page.tsx`
- Create: `frontend/components/features/brain/ProposalCard.tsx`
- Create: `frontend/components/features/brain/ProposalCard.test.tsx`
- Create: `frontend/lib/api/brain.ts` (typed client)
- Create: `frontend/hooks/use-brain-proposals.ts`

**Steps:**
- [ ] Write failing component test: renders proposals grouped by category, accept/reject buttons fire mutations
- [ ] Verify RED
- [ ] Implement page + components using shadcn/ui + tokens from `design-system/globals.css`
- [ ] Loading skeleton, empty state, error state
- [ ] Mobile-first 375px verified
- [ ] Verify GREEN
- [ ] Commit: `feat(frontend): add brain proposals dashboard`

---

## Task 12 — Frontend: settings panel

**Files:**
- Create: `frontend/app/(dashboard)/settings/brain/page.tsx`
- Create: `frontend/components/features/brain/BrainSettings.tsx`

**Steps:**
- [ ] Write failing test: toggles for auto-reflection, cadence selector, notification preferences
- [ ] Verify RED
- [ ] Implement settings page
- [ ] Verify GREEN
- [ ] Commit: `feat(frontend): add brain reflection settings`

---

## Task 13 — Eval suite (REQUIRED before Phase 2)

**Files:**
- Create: `evals/golden/brain_reflection.yaml` (≥30 cases)
- Create: `evals/adversarial/brain_reflection_*.yaml` (5 RevLooper cases)
- Create: `services/ai-service/tests/evals/test_brain_reflection_eval.py`

**Steps:**
- [ ] Author 30 golden cases across 5 categories
- [ ] Author 5 adversarial cases (see [SECURITY.md](SECURITY.md))
- [ ] Implement eval harness using `edd-workflow` skill (code-based + LLM-as-judge)
- [ ] Run baseline; record scores in `evals/reports/`
- [ ] Set CI threshold: avg score ≥ 4.0/5.0 on each dimension; cost cap $1/run
- [ ] Commit: `test(ai): add brain reflection eval suite`

---

## Task 14 — Feature flag wiring

**Files:**
- Modify: `services/ai-service/app/core/feature_flags.py`
- Modify: `frontend/lib/feature-flags.ts`

**Steps:**
- [ ] Add `ai_brain_reflection_enabled` to flag enum
- [ ] Gate API endpoints + frontend routes
- [ ] Default OFF
- [ ] Commit: `feat(ai): add ai_brain_reflection_enabled feature flag`

---

## Task 15 — Ops handoff

**Files:**
- Create: `docs/runbooks/ai-brain-reflection.md`
- Update: [RESULT.md](RESULT.md) header (still empty body)

**Steps:**
- [ ] Author runbook covering manual re-run, per-workspace disable, prompt-tuning workflow
- [ ] Add monitoring dashboards links
- [ ] Commit: `docs(ai): add brain reflection runbook`

---

## Verification

After all 15 tasks complete, run the `verification-loop` skill:

```bash
cd services/ai-service
pytest -v --cov=app --cov-report=term-missing   # target 90%+, 100% on PII stripper
mypy app/
ruff check app/

cd frontend
npx tsc --noEmit && npm run lint && npx vitest run
```

Then run `/code-review services/ai-service` and `/security-audit services/ai-service` before Phase 1 deploy.

## Done Definition
- All 15 tasks committed
- All tests passing at coverage targets
- All evals above thresholds
- Phase 1 internal validation successful
- IMPLEMENTATION.md Done Criteria all checked
