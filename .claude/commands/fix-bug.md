---
description: "Fix a bug using systematic debugging with TDD: reproduce → isolate → fix → prevent"
agent: tdd-agent
argument-hint: "Describe the bug: what's expected vs what happens, plus any error/log/trace"
---

Fix a bug using systematic debugging and TDD.

**Bug report:** $ARGUMENTS

Never fix without a reproducer test. If you can't reproduce, gather more data first.

1. **REPRODUCE** — Write a failing test that captures the EXACT bug
2. **VERIFY RED** — Run it; confirm it fails the way the user reported
3. **ISOLATE** — Walk the data flow from request entry to failure point. Write down a falsifiable hypothesis before coding.
4. **FIX** — Minimal code change that resolves the root cause (no drive-by refactors)
5. **VERIFY GREEN** — Reproducer test now passes; all other tests still pass
6. **PREVENT** — Reproducer test stays as a regression guard. Search for similar patterns elsewhere in the codebase.
7. **DOCUMENT** — Commit with format:
   ```
   fix({service}): correct {bug summary}

   Reproducer: tests/regression/test_{name}.py
   Source: {Sentry / GitHub issue / user report}
   Root cause: {1-sentence}
   ```
8. **CONVENTIONS UPDATE** — If the bug reveals a convention gap, update `docs/CODE_CONVENTIONS.md` or the relevant agent's BLOCKER list

Use the `systematic-debugging` and `tdd-workflow` skills.

Iteration guard: if 5 fix attempts haven't resolved it, STOP and surface to user with hypotheses tried and falsified.
