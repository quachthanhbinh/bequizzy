# Spec 25 — FinOps & Cost Control: IMPLEMENTATION

## File Map
```
services/ai-service/app/finops/cost_guard.py    # check_and_record_cost()
services/analytics-service/app/models/llm_cost.py  # llm_cost_events table
alembic/versions/0025_finops.py
infra/terraform/billing_alerts.tf               # GCP Cloud Billing alerts
```
