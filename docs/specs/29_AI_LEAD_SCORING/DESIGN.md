# 29 — AI Lead Scoring — DESIGN

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Architecture Overview

```
[Pub/Sub: outreach_events] → [lead-service subscriber: score_updater]
                                      ↓
                              [score_calculator.py]
                              (weighted signal model)
                                      ↓
                        UPDATE leads SET score=X, score_label=Y
                        INSERT lead_score_signals (audit log)
                                      ↓
                        IF label changed to Hot:
                          publish lead_scored_hot → [Pub/Sub: lead_events]
                                                         ↓
                                              [workflow-service]  [ai-service/advisor]

[scoring-worker GKE CronJob] → daily decay pass over all leads
```

## Database Schema

```sql
-- Migration: add score columns to leads table
ALTER TABLE leads ADD COLUMN score INTEGER NOT NULL DEFAULT 50;
ALTER TABLE leads ADD COLUMN score_label TEXT NOT NULL DEFAULT 'Warm'
    CHECK (score_label IN ('Hot', 'Warm', 'Cold'));
ALTER TABLE leads ADD COLUMN score_updated_at TIMESTAMPTZ;

CREATE INDEX idx_leads_score_label ON leads(workspace_id, score_label);

-- Audit log for score breakdown panel
CREATE TABLE lead_score_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,   -- 'email_opened', 'replied', 'bounced', etc.
    weight_applied INTEGER NOT NULL,
    score_before INTEGER NOT NULL,
    score_after INTEGER NOT NULL,
    event_id UUID,               -- soft FK to outreach_events (cross-service)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_score_signals_lead ON lead_score_signals(workspace_id, lead_id, created_at DESC);
```

## Signal Weight Configuration

Stored in `scoring_config` JSONB column on `workspaces` table (Phase 3 customisation hook). Phase 2 uses global defaults from `services/lead-service/app/scoring/weights.py`.

## API Contract

### GET /leads/{id}/score
```json
{
  "score": 82,
  "label": "Hot",
  "updated_at": "2025-05-05T10:22:00Z",
  "signals": [
    { "type": "replied", "weight": 25, "at": "2025-05-05T10:20:00Z" },
    { "type": "email_opened", "weight": 8, "at": "2025-05-05T09:00:00Z" }
  ]
}
```
- Auth: Bearer JWT, `X-Workspace-ID` header
- Rate limit: standard (100 rpm via api-gateway)

## Events

| Event | Topic | Publisher | Consumer |
|---|---|---|---|
| `lead_scored_hot` | `lead_events` | lead-service | workflow-service, ai-service |
| `lead_score_updated` | `lead_events` | lead-service | analytics-service |

### `lead_scored_hot` payload
```json
{
  "event": "lead_scored_hot",
  "workspace_id": "uuid",
  "lead_id": "uuid",
  "lead_name": "Alice Wang",
  "score": 82,
  "previous_label": "Warm",
  "top_signal": "replied",
  "occurred_at": "2025-05-05T10:22:00Z"
}
```

## CPO ↔ CTO Debate

### Round 1 — Scoring Approach

**CPO (confidence: 7):** Use a simple rule-based weighted sum. Users need to understand why a lead is Hot — a black-box ML model loses trust. Ship in Phase 2 with transparent weights.

**CTO (confidence: 7):** Agree on rule-based for Phase 2. Main concern: the scoring-worker decay cron touching every lead row daily at scale (100 workspaces × 100k leads = 10M rows/day). Must be a batch UPDATE with a WHERE clause, not row-by-row.

**Gap:** 0 — both aligned.

### Round 2 — Score Freshness

**CPO (confidence: 8):** Score must feel real-time to the user — if a lead replies and the badge is still Cold 5 minutes later, trust breaks. Target < 60s.

**CTO (confidence: 7):** 60s is achievable with Pub/Sub push subscription. The bottleneck is the Pub/Sub delivery SLA (~10s) + scoring compute (~5s). Risk: at high event volume (1M msgs/month), the subscriber must auto-scale. Use Cloud Run min-instances=1 to avoid cold start.

**Gap:** 1 — CTO slightly less confident on p99 at max volume but not blocking.

### Round 3 — Free Plan Gating

**CPO (confidence: 9):** Show score label (Hot/Warm/Cold) on Free — it's the hook. Gate the breakdown panel (which signals drove the score) behind Pro. This creates the "what is this and why?" curiosity that converts.

**CTO (confidence: 9):** Agreed. The breakdown panel is a separate `GET /leads/{id}/score` endpoint — easy to gate with a plan check in the api-gateway middleware.

**Final confidence: CPO 9 / CTO 8** — Approved for implementation.
