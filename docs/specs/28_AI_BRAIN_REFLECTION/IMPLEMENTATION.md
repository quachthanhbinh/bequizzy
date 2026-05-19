# 28 — AI Brain Reflection Loop — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-04

## Goal
Implement the design from [DESIGN.md](DESIGN.md) per the requirements in [PRD.md](PRD.md), gated by tests in [TESTS.md](TESTS.md) and threats in [SECURITY.md](SECURITY.md).

## Feature Flag
`ai_brain_reflection_enabled` — per-workspace, default OFF for first 2 weeks of staging.

## Rollout Plan

### Phase 1 — Internal validation (week 1)
- Apply Alembic migration to staging
- Deploy `ai-service` with feature flag default OFF
- Deploy frontend behind same flag
- Enable for **internal RevLooper workspace only**
- Manual trigger only; no scheduler
- Validate eval scores meet thresholds (see [TESTS.md](TESTS.md))
- Exit gate: 5 successful reflection runs, all proposals reviewed by team

### Phase 2 — Design partners (week 2)
- Enable for **5 design-partner workspaces**
- Manual trigger only
- Collect accept/reject metrics, tune prompt
- Run multilingual eval set (Vietnamese + Thai replies)
- Exit gate: ≥30% accept rate across cohort, no security incidents

### Phase 3 — Scheduler enabled (week 3)
- Enable Cloud Scheduler buckets
- Same 5 design partners, now on weekly auto-cadence
- Monitor LLM cost, notification fatigue
- Exit gate: ≤$0.10/workspace/month avg LLM cost, opt-out rate <20%

### Phase 4 — Public launch (week 4+)
- Default ON for new workspaces
- Existing workspaces opt-in via in-app announcement
- Add email digest of pending proposals (if Phase 3 engagement data supports it)
- Exit gate: 50% of beta workspaces with ≥1 accepted proposal in 30 days

## Migration Sequence
1. Apply Alembic migration `2026_05_05_001_add_brain_proposals_and_reflection_runs.py` to staging DB
2. Roundtrip test: `alembic upgrade head && alembic downgrade -1 && alembic upgrade head` — must succeed
3. Deploy `ai-service` v0.X.0 with flag OFF
4. Deploy frontend v0.X.0 with flag-gated routes
5. Enable flag for internal workspace
6. Monitor 48h
7. Progress to Phase 2

## Backfill
**None required.** Reflections operate on a rolling window only.

## Monitoring Metrics

| Metric | Owner | Alert threshold |
|---|---|---|
| `reflection.runs.total{status}` | ai-service | failures > 5% over 1h |
| `reflection.cost_usd.daily` | finops dashboard | > $5/day during beta |
| `proposals.accept_rate` | analytics-service | < 20% sustained 7d (quality issue) |
| `proposals.reject_reason_distribution` | analytics-service | spike in single category (prompt bug) |
| `notification.opt_out.rate` | notification-service | > 20% (UX issue) |
| `reflection.run_duration_p95` | ai-service | > 60s (LLM degradation) |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cross-workspace data leak in proposal text | Low | Critical | PII stripper + per-workspace LLM isolation + adversarial eval (see [SECURITY.md](SECURITY.md)) |
| Notification fatigue → users disable feature | Medium | High | Cap to 1 notification/week per workspace; quality gate via accept rate |
| LLM cost spike from spam manual triggers | Low | Medium | Rate limit 1/24h per workspace + credit deduction |
| Proposals are low quality / generic | Medium | High | Eval gates per phase; prompt iteration in Phase 1–2 |
| Vietnamese/Thai reply handling unknown | High | Medium | Dedicated multilingual eval set before Phase 2 |
| pgvector index pressure from accepted chunks | Low | Medium | Cap accepted chunks per workspace per week to 10 |

## Dependencies on Other Services

| Service | What we need | Owner action |
|---|---|---|
| `outreach-service` | New internal endpoint `/v1/internal/replies/recent?workspace_id&since` | spec PR before week 1 |
| `billing-service` | New credit reason code `ai_brain_reflection` registered | week 1 |
| `notification-service` | New template `brain.proposals.created.in_app` | week 1 |
| `rag-processor` | Already handles `ai.brain.chunk.created` events | no change |
| `frontend` | New routes `/dashboard/brain/proposals` + `/dashboard/settings/brain` | week 2 |

## On-call Runbook
Lives at `docs/runbooks/ai-brain-reflection.md` — to be created as part of TASKS step "ops handoff". Covers:
- How to manually re-run reflection for a workspace
- How to disable feature for a workspace experiencing issues
- How to inspect rejected proposals for prompt-tuning insight

## Done Criteria
- [ ] All tasks in [TASKS.md](TASKS.md) completed
- [ ] All tests in [TESTS.md](TESTS.md) pass at coverage targets
- [ ] All threats in [SECURITY.md](SECURITY.md) mitigated and verified
- [ ] Phase 4 launched
- [ ] [RESULT.md](RESULT.md) populated with first 30 days of metrics
