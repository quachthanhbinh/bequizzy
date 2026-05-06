---
description: "Start a TDD Red-Green-Refactor cycle for a service, handler, component, or feature flow"
agent: tdd-agent
argument-hint: "Describe what to test/implement: a service, handler, component, or feature flow"
---

Start the TDD Red-Green-Refactor cycle.

**Target:** $ARGUMENTS

Follow the iron law: NO production code without a failing test first.

1. **CONTEXT ANCHOR** — Read the actual models, schemas, and one similar existing test before writing anything
2. **RED** — Write ONE minimal failing test
3. **VERIFY RED** — Run it; confirm it fails for the right reason (not a typo)
4. **GREEN** — Write the simplest code to pass
5. **VERIFY GREEN** — Run all tests in the service; all must pass
6. **REFACTOR** — Clean up while keeping tests green
7. **EDGE CASES** — Discover untested behaviors; loop back to RED for each, one at a time
8. **GIT CHECKPOINTS** — Commit after each verified RED and GREEN
9. **ITERATION GUARD** — Stop after 10 cycles and surface to user
10. **VERIFY** — Run the `verification-loop` skill before declaring done

Use the `tdd-workflow` skill.

If the change is for an AI feature in `ai-service`, use the `edd-workflow` skill instead (Eval-Driven Development with code-based grading + LLM-as-judge + golden datasets).

Always assert in tests:
- workspace_id scope on DB queries
- Outbox event emission for domain changes
- Credit deduction before AI calls (mock billing-service)
- Suppression check before outbound (in outreach-service)
