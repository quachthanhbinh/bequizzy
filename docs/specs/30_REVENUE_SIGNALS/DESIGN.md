# 30 — Revenue Signals — DESIGN

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Architecture

```
[crm-service: deals table] 
         ↓ (daily batch read)
[analytics-aggregator Cloud Run Job]
         ↓
[pipeline_snapshots table]  ←── GET /analytics/revenue ──→ [Frontend Revenue Widget]
         ↓
[Pub/Sub: analytics_events: pipeline_dropped] ──→ [ai-service/advisor]
```

## Database Schema

```sql
-- Owned by analytics-service / analytics-aggregator
CREATE TABLE pipeline_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    total_pipeline_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    won_deals_count INTEGER NOT NULL DEFAULT 0,
    lost_deals_count INTEGER NOT NULL DEFAULT 0,
    won_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    win_rate NUMERIC(5, 4),             -- 0.0000–1.0000
    projected_revenue_low NUMERIC(15, 2),
    projected_revenue_high NUMERIC(15, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, snapshot_date)
);

CREATE INDEX idx_pipeline_snapshots_ws_date ON pipeline_snapshots(workspace_id, snapshot_date DESC);

-- Revenue by campaign (denormalised for fast reads)
CREATE TABLE campaign_revenue_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    campaign_id UUID NOT NULL,   -- soft FK to campaign-service
    snapshot_date DATE NOT NULL,
    pipeline_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    won_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deal_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, campaign_id, snapshot_date)
);
```

## API Contract

### GET /analytics/revenue
**Query params:** `?period=90d` (default), `currency=USD`

```json
{
  "pipeline_value": 48500.00,
  "win_rate": 0.24,
  "projected_revenue": { "low": 9312.00, "high": 13872.00 },
  "currency": "USD",
  "by_campaign": [
    { "campaign_id": "uuid", "campaign_name": "SEA SaaS Q2", "pipeline_value": 22000.00, "won_value": 5000.00 }
  ],
  "history": [
    { "week": "2025-04-28", "pipeline_value": 41000.00 },
    { "week": "2025-05-05", "pipeline_value": 48500.00 }
  ]
}
```
Auth: Bearer JWT + `X-Workspace-ID`

## Events

| Event | Topic | Publisher | Consumer |
|---|---|---|---|
| `pipeline_dropped` | `analytics_events` | analytics-aggregator | ai-service/advisor |

### `pipeline_dropped` payload
```json
{
  "event": "pipeline_dropped",
  "workspace_id": "uuid",
  "previous_value": 60000.00,
  "current_value": 47000.00,
  "drop_pct": 0.217,
  "currency": "USD",
  "occurred_at": "2025-05-05T02:10:00Z"
}
```

## CPO ↔ CTO Debate

### Round 1 — Snapshot vs live aggregation

**CPO (confidence: 7):** Users want to see live pipeline value on the Kanban. Pre-computed daily snapshots will feel stale.

**CTO (confidence: 8):** Live aggregation over `deals` at query time is a cross-service read (analytics queries crm-service data). Violates bounded context rule. The right pattern: analytics-aggregator daily job writes `pipeline_snapshots`, plus a lightweight "current" endpoint in crm-service that returns real-time pipeline value for the live widget. Both serve different needs.

**Gap:** 1 — converging. Use crm-service for live widget, analytics-aggregator for historical chart.

### Round 2 — Currency handling

**CPO (confidence: 8):** Show in workspace currency. Don't show FX conversion complexity in Phase 2.

**CTO (confidence: 9):** Store values in the currency of the deal as entered, convert at read time using workspace's default currency. Simple enough for Phase 2 with no live FX (use static exchange rates, refreshed daily).

**Gap:** 1.

### Round 3 — Pipeline drop threshold

**CPO (confidence: 8):** 20% drop is the right threshold — lower would create noise, higher misses real signals.

**CTO (confidence: 8):** Agreed. Implement as a configurable constant in analytics-aggregator (`PIPELINE_DROP_THRESHOLD = 0.20`) so it can be tuned without a deploy.

**Final confidence: CPO 8 / CTO 8** — Approved.
