# Spec 26 — Migration & Backfill: PRD

## Problem Statement

Zero-downtime deployments require safe schema changes. Without a formal expand-contract pattern and backfill framework, migrations risk data loss or long table locks.

## Acceptance Criteria

### AC-26-01: Expand-Contract Pattern
- Phase 1 (Expand): Add new column as nullable, deploy code that writes to both old + new
- Phase 2 (Backfill): Run Cloud Run Job to populate new column for existing rows
- Phase 3 (Contract): Drop old column after backfill verified

### AC-26-02: Backfill Job Framework
- Template Cloud Run Job with checkpoint table (resume on failure)
- Batch size: 1000 rows per transaction
- Progress: logged to `backfill_jobs` table (job_name, status, rows_done, rows_total)

### AC-26-03: Rollback Procedure
- Alembic downgrade tested in staging before prod
- Rollback checklist in each migration PR

### AC-26-04: Naming Convention
- Migration files: `{NNNN}_{entity}_{action}.py` (e.g., `0026_leads_add_timezone.py`)
