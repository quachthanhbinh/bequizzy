---
description: "QA Agent: write and run Playwright E2E tests for a spec or feature. Simulates real user flows in the browser. Use after implementation or to audit existing spec coverage."
agent: qa-engineer
argument-hint: "Spec folder name (e.g. 05_AI_CAMPAIGN_BUILDER), feature name, or 'all' to audit all specs"
---

Invoke the QA Engineer agent to write, run, or audit Playwright E2E tests for the given spec or feature.

**Target:** $ARGUMENTS

## What this command does

1. **Read the spec** — open `docs/specs/{target}/TESTS.md` and `PRD.md` to extract all user-facing acceptance criteria and user flows
2. **Audit existing coverage** — inspect `apps/portal/e2e/` to find which criteria already have E2E tests and which are missing
3. **Write missing tests** — add tests to the appropriate spec file in `apps/portal/e2e/`, following the patterns in `helpers.ts`
4. **Run the tests** — execute `npx playwright test` (headed or with `--ui` as appropriate), report results
5. **Report gaps** — list any acceptance criteria still not testable (blocked by missing `data-testid`, missing route, or API not wired up) and explain what must be added to unblock

## Special invocations

### Audit a single spec
```
/run-e2e 05_AI_CAMPAIGN_BUILDER
```
Reads `docs/specs/05_AI_CAMPAIGN_BUILDER/TESTS.md` and `PRD.md`, maps criteria to existing E2E tests, writes missing ones, runs all.

### Audit ALL existing specs
```
/run-e2e all
```
Iterates every folder in `docs/specs/` that has a `TESTS.md`, generates a coverage matrix (spec → test file → pass/fail/missing), and surfaces the top gaps.

### Audit a specific flow by description
```
/run-e2e "campaign creation flow"
```
Finds the most relevant spec and E2E file, writes or fixes the test, runs it.

### Run only (don't write new tests)
```
/run-e2e run campaigns.spec.ts
```
Runs the named spec file and reports results without modifying tests.

## Playwright Execution Commands

```bash
cd apps/portal

# Run all E2E
npx playwright test

# Run a single spec file
npx playwright test e2e/{file}.spec.ts

# Run headed (see the browser)
npx playwright test --headed

# Run with interactive UI
npx playwright test --ui

# Run a specific test by name
npx playwright test -g "test name pattern"

# Show HTML report
npx playwright show-report
```

## Coverage Matrix Format

When auditing, produce a table like this:

| Spec | Acceptance Criterion | E2E File | Status |
|---|---|---|---|
| 05_AI_CAMPAIGN_BUILDER | User can create a campaign via chat builder | campaigns.spec.ts | ✅ passing |
| 05_AI_CAMPAIGN_BUILDER | Campaign is saved as draft before first send | campaigns.spec.ts | ❌ missing |
| 08_MEETING_BOOKING | Public booking page renders without auth | meetings-automation-channels-outreach.spec.ts | ✅ passing |
| 11_UNIFIED_INBOX_AI_REPLY | AI reply suggestions visible for inbound thread | inbox-scoring-integrations.spec.ts | ⚠️ blocked — no data-testid |

**Status legend:**
- ✅ passing — test exists and passes
- ❌ missing — no test for this criterion
- ⚠️ blocked — test written but fails due to missing testid, unimplemented route, or mock data gap
- ⏭️ skipped — not user-facing (pure backend, infra, or internal API) — intentionally excluded

## After Running

Report:
1. Total spec criteria audited
2. Coverage % (passing / total user-facing)
3. Tests added this run
4. Blocking items with owners (which team must add `data-testid` / implement the route)
5. Next recommended `/run-e2e` target if coverage is below 80%
