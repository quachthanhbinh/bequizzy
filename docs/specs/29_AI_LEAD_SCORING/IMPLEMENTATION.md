# 29 — AI Lead Scoring — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Phase Breakdown

### Phase 1 — DB migration + score calculator (Week 1)
- Alembic migration: add `score`, `score_label`, `score_updated_at` to `leads`; create `lead_score_signals`
- `services/lead-service/app/scoring/weights.py` — global default weights dict
- `services/lead-service/app/scoring/calculator.py` — `calculate_score(lead_id, signal_type, current_score)` pure function

### Phase 2 — Pub/Sub subscriber (Week 2)
- `services/lead-service/app/subscribers/score_updater.py` — consumes `outreach_events` topic
- Writes new score to `leads` + inserts `lead_score_signals` row
- Publishes `lead_scored_hot` on Hot transition
- Deploy: Cloud Run subscription on `outreach_events`

### Phase 3 — Decay worker (Week 2–3)
- `services/scoring-worker/` GKE CronJob (daily 02:00 UTC)
- Batch UPDATE with CASE WHEN for efficiency
- Respects floor of 10

### Phase 4 — API + UI (Week 3)
- `GET /leads/{id}/score` endpoint (lead-service)
- Score badge React component (`frontend/components/leads/ScoreBadge.tsx`)
- Breakdown popover (plan-gated, `frontend/components/leads/ScoreBreakdown.tsx`)
- LeadTable column, KanbanCard badge, InboxThread header badge

## File Map

```
services/lead-service/
  app/
    scoring/
      weights.py              # Global signal weights
      calculator.py           # Pure scoring function
    subscribers/
      score_updater.py        # Pub/Sub event handler
    routers/
      leads.py                # Add GET /{id}/score endpoint
    models/
      lead_score_signal.py    # SQLAlchemy model
  tests/
    scoring/
      test_calculator.py
      test_score_updater.py

services/scoring-worker/
  app/
    jobs/
      decay.py                # Batch decay UPDATE

frontend/
  components/
    leads/
      ScoreBadge.tsx
      ScoreBreakdown.tsx      # Gated Pro+
  hooks/
    useLeadScore.ts
```

## Feature Flags
- `lead_scoring_enabled` — workspace-level flag; on by default for Phase 2 rollout
- `score_breakdown_panel` — plan gate: Pro+ only

## Risks
| Risk | Mitigation |
|---|---|
| Pub/Sub event storm at campaign launch (50k emails sent simultaneously) | Rate-limit score-updater subscriber to 100 concurrent messages; excess queued naturally |
| Decay job timeout on large workspaces | Batch in 10k-row chunks with LIMIT/OFFSET; CronJob timeout = 30min |
