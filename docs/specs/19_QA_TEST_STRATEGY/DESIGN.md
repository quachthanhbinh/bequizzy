# Spec 19 — QA Test Strategy: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Tests are invisible to users, but slow CI kills developer velocity. Need fast feedback loops (unit < 5s, integration < 2min, E2E < 10min). Coverage gates per service prevent regressions. Confidence: 9.

**CTO:** pytest with testcontainers for integration (no mocking DB — real Postgres + Redis containers). Vitest for frontend (fast, Jest-compatible). Playwright for E2E (Chromium only for cost). Coverage via `pytest-cov` + `--cov-fail-under`. Flaky test detection via GitHub Actions test reporter. Confidence: 9.

**Gap: 0. Both ≥ 9. Converge.**

**Final Confidence: 9 / 10.**

---

## CI Test Pipeline

```yaml
# Per-service CI job
jobs:
  test:
    steps:
      - name: Run unit tests with coverage
        run: pytest tests/unit/ --cov=app --cov-fail-under=80 --cov-report=xml
      - name: Run integration tests
        run: pytest tests/integration/ --timeout=120
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## pytest Configuration (pyproject.toml)
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
timeout = 30
markers = ["unit", "integration", "edd", "slow"]
```

## E2E Critical Path (Playwright)
```typescript
test('critical path: sign up → campaign → sequence → test send', async ({ page }) => {
  await page.goto('/auth/signup');
  await page.fill('[name=email]', 'test@e2e.com');
  // ... complete critical path
  await expect(page.locator('[data-testid=campaign-created]')).toBeVisible();
});
```

## Flaky Test Quarantine
Tests marked `@pytest.mark.flaky` are run in a separate `flaky` suite; not counted in gate.
