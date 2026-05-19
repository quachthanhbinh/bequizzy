# Spec 26 — Migration & Backfill: TASKS

## TDD Task List

### Task 1 — backfill_jobs Migration
**RED first:** Migration import fails.
**Done when:** Table created; up + down succeed.

### Task 2 — Backfill Base Class with Checkpoint
**RED first:** Test U26-01 fails.
**Done when:** Checkpoint saves after each batch; resume works.

### Task 3 — Migration Naming Lint in CI
**RED first:** Test U26-02 fails on bad filename.
**Done when:** CI blocks migration with wrong filename format.

## Completion Checklist
- [ ] Backfill job resumes after crash
- [ ] Migration naming lint in CI
- [ ] Expand-contract checklist in all migration PRs
