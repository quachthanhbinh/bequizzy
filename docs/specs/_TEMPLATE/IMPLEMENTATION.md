# NN — <FEATURE> — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** YYYY-MM-DD

## Goal
Implement the design from [DESIGN.md](DESIGN.md) per the requirements in [PRD.md](PRD.md), gated by tests in [TESTS.md](TESTS.md) and threats in [SECURITY.md](SECURITY.md).

## Feature Flag
`<flag_name>` — per-workspace, default OFF.

## Rollout Plan

### Phase 1 — Internal validation (week 1)
- Apply migration to staging
- Deploy services with flag default OFF
- Enable for **internal BeQuizzy workspace only**
- Exit gate: <criterion>

### Phase 2 — Design partners (week 2)
- Enable for **5 design-partner workspaces**
- Exit gate: <criterion>

### Phase 3 — Limited beta (week 3)
- Enable for opt-in beta cohort
- Exit gate: <criterion>

### Phase 4 — Public launch (week 4+)
- Default ON for new workspaces
- Existing workspaces opt-in via in-app announcement
- Exit gate: <criterion>

## Migration Sequence
1. Apply Alembic migration to staging
2. Roundtrip: `alembic upgrade head && alembic downgrade -1 && alembic upgrade head`
3. Deploy backend with flag OFF
4. Deploy frontend with flag-gated routes
5. Enable flag for internal workspace
6. Monitor 48h
7. Progress to Phase 2

## Backfill
<None / one-shot script + path / event replay strategy>

## Monitoring Metrics

| Metric | Owner | Alert threshold |
|---|---|---|
| `<metric>` | <service> | <threshold> |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| <risk> | L/M/H | L/M/H | <plan> |

## Dependencies on Other Services

| Service | What we need | Owner action |
|---|---|---|
| <service> | <new endpoint / event> | <PR + week> |

## On-call Runbook
Lives at `docs/runbooks/<feature>.md` — created in TASKS step "ops handoff". Covers:
- How to manually re-run / replay
- How to disable feature for a workspace experiencing issues
- Common failure modes + fixes

## Done Criteria
- [ ] All tasks in [TASKS.md](TASKS.md) completed
- [ ] All tests in [TESTS.md](TESTS.md) pass at coverage targets
- [ ] All threats in [SECURITY.md](SECURITY.md) mitigated and verified
- [ ] Phase 4 launched
- [ ] [RESULT.md](RESULT.md) populated with first 30 days of metrics
