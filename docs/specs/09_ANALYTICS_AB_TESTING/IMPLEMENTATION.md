# Spec 09 — Analytics & A/B Testing: IMPLEMENTATION

## Phases

1. **Schema + Aggregator**: Alembic migration for metrics tables; `analytics-aggregator` Cloud Run Job; Cloud Scheduler trigger (hourly)
2. **Analytics API**: Campaign metrics endpoint, step funnel endpoint, A/B results endpoint, workspace dashboard endpoint
3. **A/B Statistical Engine**: `compute_ab_significance()` with scipy; integrated into aggregator
4. **Frontend**: Campaign analytics page with charts (open/click/reply funnel), A/B comparison table, workspace dashboard

## File Map

```
services/analytics-service/
  app/
    models/metrics.py
    routers/analytics.py
    services/analytics_service.py

services/analytics-aggregator/
  app/
    main.py             # Cloud Run Job entry point
    aggregator.py       # Core aggregation logic
    ab_testing.py       # Chi-squared significance

alembic/versions/0009_analytics.py

frontend/
  app/(dashboard)/analytics/page.tsx
  components/analytics/
    CampaignMetricsChart.tsx
    ABTestTable.tsx
    WorkspaceDashboard.tsx
```

## Integration Points

| From | To | Method |
|---|---|---|
| analytics-aggregator | analytics DB (write) | AsyncSession |
| analytics-aggregator | email_events (read via Pub/Sub) | Pub/Sub subscription |
| analytics-service | analytics DB (read) | AsyncSession |
| Cloud Scheduler | analytics-aggregator | Cloud Run Job trigger |
