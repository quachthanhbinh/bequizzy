# Spec 19 — QA Test Strategy: IMPLEMENTATION

## Phases
1. **pytest Config**: `pyproject.toml` + `conftest.py` per service with coverage gates and testcontainers fixtures
2. **Vitest Config**: `vitest.config.ts` with coverage; test structure under `__tests__/`
3. **Playwright E2E**: Critical path test; staging-only base URL; GitHub Actions job
4. **Flaky Test Quarantine**: `@pytest.mark.flaky` and separate suite in CI

## File Map
```
services/*/pyproject.toml           # pytest + cov config per service
services/*/tests/conftest.py        # testcontainers fixtures (DB, Redis)
frontend/vitest.config.ts           # coverage config
frontend/__tests__/e2e/critical-path.spec.ts
.github/workflows/e2e.yml           # E2E job on staging deploy
```
