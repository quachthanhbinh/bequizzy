# Spec 20 — Data Governance & Retention: IMPLEMENTATION

## Phases
1. **Schema**: consent_log migration; `holds_deletion` flag on leads
2. **Erasure Job**: Cloud Run Job; pseudonymization logic; erasure_request update
3. **Retention Job**: Daily Cloud Run Job; per-table rules; dry-run mode
4. **Frontend**: Compliance dashboard; erasure request form; consent log view

## File Map
```
services/lead-service/
  app/
    models/consent.py
    routers/compliance.py
    jobs/
      erasure_job.py
      retention_job.py

alembic/versions/0020_governance.py
```

## Cloud Scheduler
| Job | Schedule | Purpose |
|---|---|---|
| erasure-job | Daily 02:00 UTC | Process pending erasure requests |
| retention-job | Daily 02:30 UTC | Delete expired records |
