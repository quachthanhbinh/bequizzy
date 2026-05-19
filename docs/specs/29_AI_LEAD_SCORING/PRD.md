# 29 — AI Lead Scoring — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM
**Last updated:** 2025-05-05

## Problem Statement

RevLooper users import hundreds of leads and launch campaigns, but today they have no way to know which of those leads is worth prioritising. Every lead looks identical in the table. Users end up replying to whoever messaged most recently rather than whoever is most likely to convert — and they miss hot signals entirely.

The AI Reply Assistant (spec 11) and AI Advisor (spec 31) both need an authoritative score to drive smart prioritisation and proactive notifications. Without scoring, these features degrade to generic suggestions.

### Evidence
- Manual prioritisation is cited as the #1 time cost by early RevLooper users (internal feedback)
- Industry benchmark: sequences where hot leads receive same-day follow-up convert at 3× the rate of leads followed up 48h+ later (Salesloft 2024 State of Sales)
- Competitors: Instantly shows open/click counts, not a score; 11x.ai scores but only within their closed AI SDR loop

### Who has this problem
All plan tiers on Phase 2+. Most acute for solo founders managing 200+ active leads with no assistant.

## Goals
1. Every lead has a current score (Hot / Warm / Cold + numeric 0–100) updated within 60 seconds of a scoring signal event
2. Score drives inbox badge, Kanban card badge, and AI Advisor trigger
3. Users can understand why a lead is Hot (audit trail of signals)

## Non-Goals
- ❌ Predictive revenue scoring (Win probability on deals — that's spec 30 Revenue Signals)
- ❌ ML model trained per-workspace in Phase 2 (rule-based weighted model only; per-workspace ML is Phase 3)
- ❌ Manual score override by user (deferred to Phase 3)

## Acceptance Criteria
- [ ] Every lead has a `score` (0–100 integer) and `score_label` (Hot / Warm / Cold) column
- [ ] Score is recalculated asynchronously within 60 seconds of any scoring signal event published to Pub/Sub
- [ ] Score is visible on lead table (badge column), lead detail page, Kanban card, and inbox thread header
- [ ] Hot = score ≥ 70 (red badge), Warm = 40–69 (yellow), Cold < 40 (grey)
- [ ] Score breakdown panel: hovering/tapping the badge shows last 5 signals and their weight contribution
- [ ] Workflow trigger `lead_scored_hot` fires when a lead transitions from Warm/Cold → Hot
- [ ] AI Advisor notification triggers on `lead_scored_hot` (spec 31)
- [ ] Score resets toward baseline (50%) with configurable decay — no-signal decay: −2 points per 24h to a floor of 10
- [ ] Free plan: score visible but no breakdown panel (upgrade prompt)

## Scoring Signal Model

| Signal | Weight | Direction |
|---|---|---|
| Email opened | +8 | per unique open (max +24 per email) |
| Email link clicked | +15 | per click |
| Replied to email | +25 | per reply |
| Meeting booked | +40 | one-time |
| LinkedIn profile viewed (via ext.) | +5 | |
| LinkedIn replied | +20 | |
| Deal stage advanced | +15 | |
| Unsubscribed | −100 (floor 0) | |
| Bounced | −50 | |
| No engagement 7d | −5/day | decay |

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Score freshness p99 | < 90s after event | `lead_score_updated` event latency |
| Hot leads followed up same day | ≥ 60% | `lead_scored_hot` → first outbound within 24h |
| Notification click-through (hot alert) | ≥ 25% | `ai_advisor_notification_clicked` |

## In-Scope Deliverables
- `leads.score` + `leads.score_label` columns (Alembic migration)
- `lead_score_signals` table (per-lead event log for breakdown panel)
- `scoring-worker` GKE CronJob for daily decay pass
- Real-time score update handler (Pub/Sub subscriber in lead-service)
- Score badge UI component (React, used in LeadTable, KanbanCard, InboxThread)
- Score breakdown panel (Popover component, gated Free → Pro)
- `lead_scored_hot` Pub/Sub event published on Hot transition

## Out of Scope (deferred)
- Per-workspace ML model training (Phase 3)
- Manual score override
- Score export in CSV

## Dependencies

| Dep | What we need from it |
|---|---|
| 03_LEAD_MANAGEMENT | `leads` table, `lead_id` FK |
| 06_SEQUENCE_EXECUTION | Sequence step events (email sent, opened, clicked, replied) |
| 07_EMAIL_OUTREACH | Bounce + unsubscribe events |
| 09_ANALYTICS | Event taxonomy for all signal types |
| 13_WORKFLOW_AUTOMATION | Consumes `lead_scored_hot` trigger |
| 31_AI_ADVISOR | Consumes `lead_scored_hot` for proactive notification |

## Test Checklist (PRD level — see TESTS.md for full plan)
- [ ] Score increases on open event
- [ ] Score caps correctly (no >100)
- [ ] Score transitions Hot/Warm/Cold label correctly
- [ ] Decay job runs without scoring non-engaged leads above floor
- [ ] `lead_scored_hot` event fires only on Hot transition, not on every recalc

## Open Questions
1. Should score be workspace-scoped or global? **Recommendation:** workspace-scoped signal weights in Phase 3; global default weights in Phase 2.
2. Display score as number or label only? **Recommendation:** label (Hot/Warm/Cold) on table and Kanban; number only in breakdown panel to avoid gamification.
