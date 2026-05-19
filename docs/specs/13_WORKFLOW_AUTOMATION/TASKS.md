# Spec 13 — Workflow Automation: TASKS

## TDD Task List

### Task 1 — Migration: automation_rules, automation_executions
**RED first:** Import models fails.
**File:** `alembic/versions/0013_automation.py`
**Done when:** Upgrade + downgrade succeed.

### Task 2 — Condition Evaluator
**RED first:** Tests U13-01, U13-02 fail.
**File:** `services/campaign-service/app/services/rule_evaluator.py`
**Done when:** eq/contains/in operators all tested.

### Task 3 — Circular Rule Prevention
**RED first:** Test U13-03 fails.
**Done when:** Automated events are ignored by evaluator.

### Task 4 — Rule Evaluator Integration
**RED first:** Test I13-01 fails.
**Done when:** I13-01 passes; action dispatched via REST.

### Task 5 — Idempotent Execution
**RED first:** Test I13-02 fails.
**Done when:** I13-02 passes; UNIQUE constraint prevents duplicate.

### Task 6 — Automation CRUD API
**RED first:** POST /automations returns 404.
**File:** `services/campaign-service/app/routers/automations.py`
**Done when:** Create/list/toggle/delete endpoints work.

### Task 7 — Frontend Rule Builder
**RED first:** Vitest test for RuleBuilder component fails.
**Done when:** Trigger + conditions + actions configurable; history visible.

## Completion Checklist
- [ ] Circular loop prevention verified
- [ ] Idempotent execution verified
- [ ] Cross-workspace isolation test passes
- [ ] `mypy app/` passes; coverage ≥ 80%
