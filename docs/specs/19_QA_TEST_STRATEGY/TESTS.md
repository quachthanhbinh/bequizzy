# Spec 19 — QA Test Strategy: TESTS

This spec defines the test strategy itself. Verification is via CI enforcement.

## Verification Checklist

- [ ] Each service has `pyproject.toml` with `cov-fail-under` set to service gate
- [ ] Integration tests use testcontainers (real DB, not mocked)
- [ ] Playwright E2E runs on every staging deploy
- [ ] Flaky test quarantine marker configured in pytest
- [ ] Codecov integration showing coverage trend
- [ ] All test files follow naming convention: `test_{operation}_{context}_{expected}`
