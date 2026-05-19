# Spec 20 — Data Governance & Retention: TASKS

## TDD Task List

### Task 1 — Migration: consent_log + holds_deletion on leads
**RED first:** Model import fails.
**File:** `alembic/versions/0020_governance.py`
**Done when:** Upgrade + downgrade succeed.

### Task 2 — Consent Lookup Function
**RED first:** Test U20-02 fails.
**File:** `services/lead-service/app/models/consent.py`
**Done when:** U20-02 passes; B-tree index verified.

### Task 3 — Erasure Job
**RED first:** Test U20-01 fails.
**File:** `services/lead-service/app/jobs/erasure_job.py`
**Done when:** U20-01 passes; all PII tables covered.

### Task 4 — Cross-Workspace Erasure Block
**RED first:** Test I20-01 fails.
**Done when:** I20-01 passes.

### Task 5 — Retention Job
**RED first:** Test I20-02 fails.
**File:** `services/lead-service/app/jobs/retention_job.py`
**Done when:** I20-02 passes; dry-run mode working.

### Task 6 — Compliance Dashboard Frontend
**RED first:** Vitest test fails.
**Done when:** Erasure request form + consent log view working.

## Completion Checklist
- [ ] Erasure pseudonymizes all PII fields
- [ ] Retention job has dry-run mode
- [ ] Cross-workspace erasure blocked
- [ ] Consent log indexed for < 50ms lookup
- [ ] `mypy app/` passes; coverage ≥ 80%
