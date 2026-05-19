---
name: verification-loop
description: "Use when verifying implementations, validating changes, or running final checks before committing. Post-implementation verification checklist for RevLooper. Do NOT skip steps."
---

# Verification Loop

Run after every implementation cycle to validate correctness. Do NOT skip steps.

## Step 1: Tests Pass (per service)

```bash
# Python service
cd services/{service-name}
pytest -v --cov=app --cov-report=term-missing

# Frontend
cd apps/portal
npx vitest run

# E2E — MANDATORY for any user-facing change (new page, new form, changed flow)
# Invoke the qa-engineer agent, or run directly:
cd apps/portal
npx playwright test e2e/{relevant}.spec.ts
```

**Gate:** ALL tests pass. Zero tolerance for "unrelated" failures.
**E2E Gate:** For any user-facing feature, at least one Playwright E2E test must exist and pass before this step is considered complete. If no spec file covers the changed UI, the qa-engineer agent must write it first.

## Step 2: Coverage Threshold

Compare against per-service thresholds:

| Service | Target |
|---|---|
| billing-service, outreach-service | 90% |
| ai-service, lead-service, campaign-service | 85% |
| Other services | 80% |
| Frontend | 70% |
| Critical paths (suppression check, credit deduction, JWT validate, signature verify) | 100% |

**Gate:** coverage must meet or exceed threshold for the changed service.

## Step 2b: Cross-Service Regression

If the change touches a shared boundary (Pub/Sub topic schema, OpenAPI contract, outbox event payload), test all subscribing services:

```bash
# Run tests for every service that subscribes to the affected event
for svc in services/*/; do (cd "$svc" && pytest -q) || echo "FAIL: $svc"; done
```

**Iteration Guard:** if fixes in one service keep breaking another, stop after 3 cross-service fix attempts and surface to user with: which services conflict, the failing test in each, and your hypothesis for the shared root cause.

## Step 3: Type Check

```bash
# Python
cd services/{service-name}
mypy app/

# TypeScript
cd frontend
npx tsc --noEmit
```

**Gate:** zero new type errors.

## Step 4: Lint

```bash
# Python
ruff check app/
ruff format --check app/

# TypeScript
cd frontend
npm run lint
```

**Gate:** zero new lint errors.

## Step 5: Spec Compliance

If a spec exists in `docs/specs/` or `docs/plans/`:
- [ ] Every acceptance criterion from the spec is covered by a test
- [ ] Every acceptance criterion passes
- [ ] No unspecified behavior was introduced (scope creep)
- [ ] API contract matches the spec exactly
- [ ] Database changes match the spec exactly

## Step 6: RevLooper Non-Negotiables Check

- [ ] Every new DB query is scoped by `workspace_id`
- [ ] No imports of another service's SQLAlchemy models
- [ ] Every AI call deducts credits via `billing-service` FIRST
- [ ] Every outbound message checks `suppression_list` FIRST
- [ ] Every webhook validates signature FIRST
- [ ] SEA personal-data processing writes to `consent_log`
- [ ] Every domain event written to `outbox_events` (not direct Pub/Sub publish)
- [ ] Every cross-service reference uses plain UUID (soft FK), not FK constraint
- [ ] No hardcoded secrets — all secrets via Secret Manager
- [ ] No direct LLM SDK imports (`openai`, `anthropic`, etc.) outside `ai-service`
- [ ] No direct notification SDK imports outside `notification-service`

## Step 7: Migration Check (if Alembic migration changed)

```bash
cd services/{service-name}
alembic upgrade head           # apply
alembic downgrade -1 && alembic upgrade head   # roundtrip — must succeed
```

**Gate:** migration is reversible (has working `downgrade()`).

## Step 8: Security Quick-Check

- [ ] No hardcoded secrets / credentials / tokens
- [ ] User input validated (Pydantic schemas, Zod)
- [ ] No raw SQL with string interpolation (parameterized only)
- [ ] Auth middleware on all non-public endpoints
- [ ] Internal Cloud Run services still have `--ingress=internal` config

## Step 9: Code Review (REQUIRED)

Invoke the **code-reviewer** agent or run the `code-review-workflow` against all changed files.

## Step 10: E2E Coverage (REQUIRED for user-facing features)

For every user-facing feature or UI change:
- Invoke the **qa-engineer** agent to write or update Playwright E2E tests
- All E2E tests must pass: `npx playwright test --project=chromium`
- Every acceptance criterion in the spec's `TESTS.md` must have at least one E2E scenario
- If a route, form, or flow was changed, the corresponding spec file in `apps/portal/e2e/` must be updated

**Gate:** no user-facing feature is done until E2E tests pass.

## Step 11: Done Declaration

Report back to the user with:
- Tests passing: count
- Coverage: %
- Files changed: list
- Spec criteria covered: count / total
- Any non-blocking warnings worth noting
