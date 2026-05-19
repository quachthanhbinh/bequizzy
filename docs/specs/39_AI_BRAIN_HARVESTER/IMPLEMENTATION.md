# 39 — AI Brain Knowledge Harvester — IMPLEMENTATION

**Status:** 📝 Pending user approval — plan generated only after PRD + DESIGN + SECURITY + TESTS are approved.

> Per the SDD hard-gate in `CLAUDE.md`, this file remains a stub until the user explicitly approves the spec. Once approved, the Planner regenerates this file with the full rollout plan and the companion [TASKS.md](TASKS.md) with the ≤15-task TDD breakdown.

## Goal (placeholder)
Implement the design in [DESIGN.md](DESIGN.md) per the requirements in [PRD.md](PRD.md), gated by tests in [TESTS.md](TESTS.md) and threats in [SECURITY.md](SECURITY.md).

## Feature Flag
`ai_brain_harvester_enabled` — per-workspace, default OFF.

## Rollout Plan (to be expanded post-approval)
- **Phase 1 — Internal validation** (week 1): migrations to staging, flag ON for internal RevLooper workspace, manual smoke test of SSE on Cloud Run.
- **Phase 2 — Design partners** (week 2): 5 design-partner workspaces, monitor EDD nightly + cost dashboards.
- **Phase 3 — Limited beta** (week 3): opt-in beta cohort with credit free-trial.
- **Phase 4 — Public launch** (week 4+): default ON for new workspaces; existing workspaces via in-app banner.

## Migration Sequence (placeholder)
1. Apply `add_ai_harvester_sessions` migration
2. Apply `add_consent_log` migration
3. Roundtrip both: `alembic upgrade head && alembic downgrade -2 && alembic upgrade head`
4. Deploy ai-service with flag OFF
5. Deploy frontend with flag-gated routes
6. Enable flag for internal workspace
7. Monitor 48h → progress to Phase 2

## Monitoring Metrics (placeholder)
| Metric | Owner | Alert threshold |
|---|---|---|
| `harvester.sessions.created.rate` | ai-service | none (informational) |
| `harvester.sessions.committed.count` | ai-service | drop > 50% vs 7d avg |
| `harvester.sse.first_byte_p95_ms` | ai-service | > 1500ms |
| `harvester.commit.failure_rate` | ai-service | > 1% |
| `harvester.credit_bypass_count` | billing-service | > 0 |
| `harvester.delete_orphan_chunks` | ai-service | > 0 (any orphan = page) |
| EDD `no_hallucination_pass_rate` | nightly eval | < 95% |
| EDD `rewrite_dont_append_pass_rate` | nightly eval | < 90% |

## Risks & Mitigations (placeholder)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SSE on Cloud Run flakiness | M | M | Smoke test in Phase 1; fall back to polling endpoint if hot rollback needed |
| Rewrite-don't-append fails EDD baseline | M | M | Prompt iteration loop with EDD harness before opening to design partners |
| Orphan embeddings on delete failure | L | H | Transaction-level atomicity + nightly orphan-check job |
| Free-trial abuse via re-signup | L | L | `workspaces.created_at` snapshot at session create — same workspace can't reset |

## Dependencies on Other Services (placeholder)

| Service | What we need | Owner action |
|---|---|---|
| billing-service | New `reason` enum values: `harvester_probe`, `harvester_synthesis`, `harvester_probe_free`, `harvester_synth_free` | 1-line PR pre-launch |
| workspace-service | Confirm `workspaces.region` column exists; expose `GET /internal/workspaces/{id}/region` (cached) | Verify in TASK 1 |

## On-call Runbook
Lives at `docs/runbooks/ai-brain-harvester.md` — created in the TASKS "ops handoff" step.

## Done Criteria
- [ ] All tasks in [TASKS.md](TASKS.md) completed
- [ ] All tests in [TESTS.md](TESTS.md) pass at coverage targets
- [ ] All threats in [SECURITY.md](SECURITY.md) mitigated and verified
- [ ] Phase 4 launched
- [ ] [RESULT.md](RESULT.md) populated with first 30 days of metrics
