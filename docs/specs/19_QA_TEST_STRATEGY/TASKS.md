# Spec 19 — QA Test Strategy: TASKS

## TDD Task List

### Task 1 — pytest Config for All Services
**RED first:** Coverage gate not enforced → PR with 0% coverage passes.
**Files:** `services/*/pyproject.toml`
**Done when:** `cov-fail-under` set per service; gate enforced in CI.

### Task 2 — testcontainers Shared Fixture
**RED first:** Integration test runs against non-existent DB → fails.
**File:** `services/shared/tests/conftest.py`
**Done when:** Shared `db_session` and `redis_client` fixtures using testcontainers.

### Task 3 — Vitest Coverage Config
**RED first:** `npm test -- --coverage` reports 0%.
**File:** `frontend/vitest.config.ts`
**Done when:** Coverage threshold enforced; PR fails below 75%.

### Task 4 — Playwright E2E Critical Path
**RED first:** E2E job missing → staging deploy has no smoke test.
**Files:** `frontend/__tests__/e2e/critical-path.spec.ts`, `.github/workflows/e2e.yml`
**Done when:** Critical path passes on staging.

### Task 5 — Flaky Test Quarantine
**RED first:** Flaky tests in main suite cause CI flakiness.
**Done when:** `@pytest.mark.flaky` suite separated; not blocking green CI.

## Completion Checklist
- [ ] All 14 services have coverage gate
- [ ] testcontainers fixtures shared across services
- [ ] E2E critical path passing on staging
- [ ] Flaky test policy documented + enforced
