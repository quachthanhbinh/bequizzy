---
name: systematic-debugging
description: "Use when debugging bugs, investigating failures, or hunting root causes. Four-phase root cause analysis: reproduce → isolate → fix → prevent. Pairs with tdd-workflow for regression-test-first fixes."
---

# Systematic Debugging

Bugs are not fixed by guessing. Follow the four-phase loop.

```
1. REPRODUCE  → Make the bug happen reliably
2. ISOLATE    → Find the smallest failing input / code path
3. FIX        → Minimal change that resolves the root cause
4. PREVENT    → Regression test + check for similar patterns elsewhere
```

## Phase 1: Reproduce

Before touching any code, you MUST reproduce the bug locally.

### Reproduction Checklist

- [ ] What's the exact reported behavior? (paste the error, screenshot, or log)
- [ ] What's the expected behavior?
- [ ] What workspace / user / environment did it occur in?
- [ ] What's the trigger sequence? (specific request, click path, scheduled job)
- [ ] What's in the relevant log around the failure? Trace ID?
- [ ] Can you reproduce in a unit test? (preferred) — if yes, write that test now.
- [ ] If not unit-reproducible, can you reproduce against local Supabase + service?

### Reproducer Test (the regression guard)

Write a failing test that captures the EXACT bug:

```python
@pytest.mark.asyncio
async def test_regression_lead_create_does_not_duplicate_outbox_on_retry():
    # BUG: When DB write fails after outbox insert, retry creates duplicate event
    # Source: Sentry RVL-1234, occurred for workspace ws-acme on 2026-04-30
    ...
```

If you cannot reproduce: gather more data first (logs, Sentry trace, user steps). Do NOT fix blind.

## Phase 2: Isolate

### Root Cause Analysis

Walk the data flow from request entry to failure point:

1. Did request reach the right service? (api-gateway routing)
2. Did `get_workspace_id()` return the expected value?
3. Did the service function receive the expected args?
4. Did the SQL query match expectations? (`echo=True` on AsyncEngine in test)
5. Did external calls (LLM, Pub/Sub, payment provider) return what was expected?
6. Did the outbox row commit in the same transaction?

### Use binary search on commits

```bash
git log --oneline -- services/{service-name}/app/services/lead_service.py
git bisect start
git bisect bad HEAD
git bisect good {known-good-commit}
# run reproducer test at each step
```

### Hypothesis discipline

Before fixing, write down:
- **Hypothesis:** "The bug is caused by X"
- **Predicted observation:** "If hypothesis is true, then Y will be true in the logs/test"
- **Confirm or falsify** before coding the fix

If you can't articulate the hypothesis clearly, you don't understand the bug yet. Keep investigating.

## Phase 3: Fix

### Minimal change

The fix changes ONLY what is required to make the reproducer test pass. No drive-by refactors.

### Fix at the right layer

Common mis-layered fixes (anti-patterns):
- ❌ Fixing data corruption in the API response handler — fix at write time
- ❌ Catching an exception to silence it — find why it's raised and fix that
- ❌ Adding `if not None` everywhere — fix the upstream that returns None
- ❌ Patching a frontend display bug that's actually a backend data bug

### Make GREEN

Run the reproducer. It must now pass. All other tests must still pass.

## Phase 4: Prevent

### Regression test

The reproducer test stays in the repo permanently as a regression guard.

Commit message format:
```
fix({service}): correct {bug summary}

Reproducer: tests/regression/test_{name}.py
Source: {Sentry / GitHub issue / user report}
Root cause: {1-sentence}
```

### Search for similar patterns

After every bug fix, search the codebase for similar patterns:

```bash
# Example: bug was "missing workspace_id in update query"
grep -rn "update(.*).where" services/ | grep -v workspace_id
```

If you find related instances, file follow-up tickets or fix them in a separate commit.

### Update conventions

If the bug reveals a convention gap:
- Update `docs/CODE_CONVENTIONS.md`
- Update relevant `.claude/agents/{agent}.md` BLOCKER list
- Add a hook check to `.claude/hooks/pre-tool-call.md` if automatable

## Anti-patterns to Avoid

- ❌ "It's flaky" — flaky tests are bugs, not noise. Find the race condition.
- ❌ Fixing without reproducing — you might fix the wrong thing
- ❌ "Worked on my machine" — find the env / data difference
- ❌ Deleting the failing test — write a fixing test instead
- ❌ `try/except: pass` to silence the error — find the cause

## Iteration Guard

If 5 fix attempts have not resolved the bug:
```
STOP. Surface to user with:
- Confirmed reproducer steps
- Hypotheses tried and falsified
- Current best hypothesis
- Specific code/data inspection still needed
- Whether to escalate (DB-level data corruption? Provider outage?)
```
