# Spec 26 — Migration & Backfill: IMPLEMENTATION

## File Map
```
alembic/versions/0026_backfill_jobs.py      # backfill_jobs table migration
services/shared/backfill/                   # Backfill job base class + checkpoint logic
  __init__.py
  base.py                                   # run_backfill() template
  checkpoint.py                             # get/update backfill_jobs
.github/workflows/migration-lint.yml        # Migration naming check
docs/migration-checklist.md                 # Expand-contract PR checklist
```
