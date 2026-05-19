# 30 — Revenue Signals — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Phase Breakdown

### Phase 1 — DB + aggregation job (Week 1)
- Alembic migration: `pipeline_snapshots`, `campaign_revenue_snapshots`
- `analytics-aggregator/jobs/revenue_aggregation.py` — reads deals from crm-service, writes snapshots
- `PIPELINE_DROP_THRESHOLD = 0.20` configurable constant

### Phase 2 — API endpoint (Week 2)
- `analytics-service/routers/revenue.py` — `GET /analytics/revenue`
- Reads from `pipeline_snapshots` and `campaign_revenue_snapshots`
- Returns live pipeline value via internal call to crm-service for widget freshness

### Phase 3 — UI (Week 2–3)
- `frontend/components/analytics/RevenueWidget.tsx`
- `frontend/components/analytics/PipelineHistoryChart.tsx` (Recharts line chart)
- `frontend/components/analytics/RevenueByCampaignTable.tsx`
- Wired into CRM dashboard page

## File Map
```
services/analytics-aggregator/
  app/jobs/
    revenue_aggregation.py

services/analytics-service/
  app/routers/
    revenue.py
  app/schemas/
    revenue.py

frontend/
  components/analytics/
    RevenueWidget.tsx
    PipelineHistoryChart.tsx
    RevenueByCampaignTable.tsx
  hooks/
    useRevenueAnalytics.ts
```

## Feature Flags
- `revenue_signals_enabled` — workspace-level, default on for Pro+

## Risks
| Risk | Mitigation |
|---|---|
| Cross-service read (analytics reads crm data) | analytics-aggregator calls crm-service REST endpoint, not direct DB |
| Aggregation job latency for large pipelines | Paginated read from crm-service; incremental update since last snapshot date |
