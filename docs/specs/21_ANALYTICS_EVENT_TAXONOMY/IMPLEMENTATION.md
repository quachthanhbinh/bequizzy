# Spec 21 — Analytics Event Taxonomy: IMPLEMENTATION

## File Map
```
services/analytics-service/
  app/
    schemas/events.py     # AnalyticsEvent Pydantic schema with PII validator
    routers/events.py     # POST /events endpoint
    bigquery/sink.py      # BigQuery log sink writer

docs/specs/21_ANALYTICS_EVENT_TAXONOMY/tracking_plan.md
```
