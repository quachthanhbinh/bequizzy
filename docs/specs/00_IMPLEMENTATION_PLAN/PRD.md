# 00 — Implementation Plan — PRD

**Status:** ✅ Approved
**Confidence:** 9/10
**Security flag:** 🟢 LOW
**Last updated:** 2026-05-04

## Problem Statement
RevLooper has 28 feature specs spanning 4 product phases (Find&Reach → Close&Care → Loop&Scale → Financial). With a small team, undisciplined sequencing produces three failure modes:
1. **Blocked starts** — engineers begin a downstream spec before its upstream lands and waste days on contracts that change
2. **Hidden serial dependencies** — perceived "parallel" work secretly serializes through a single shared module (e.g., the events table)
3. **Quality gate skips** — pressure to ship the next wave causes incomplete tests/migrations on the prior wave

This spec defines the wave model and governance that prevents all three.

### Evidence
- Roadmap covers 18 months across 4 phases × ~30 milestones
- Multi-tenant, multi-channel system → many shared contracts → high coordination cost
- Solo founder / small team → context-switching cost is the dominant variable

### Who has this problem
The build team (engineers, PM, eng lead) every sprint.

## Goals
1. Every engineer knows at any moment which spec is unblocked and which is gated
2. Parallel-track work is explicit and coordinated (no accidental serialization)
3. Each wave has objective exit gates — no vibes-based "feels done"
4. Risky integrations always ship behind feature flags
5. Roadmap, specs, and shipped work stay in lockstep (no doc drift)

## Non-Goals
- ❌ Feature-level requirements (those live in each individual spec PRD)
- ❌ Sprint-level task tracking (use the project tracker)
- ❌ Performance benchmarks (live in spec 16 + spec 18)

## Acceptance Criteria
- [ ] Every spec has an explicit `Depends on` list and a wave assignment
- [ ] Every wave has 3+ exit gates that are testable, not opinion
- [ ] Cross-cutting concerns (security, observability, accessibility) appear as gates on every wave
- [ ] Plan is reviewed at the start of every wave; deviations flagged in `RESULT.md`
- [ ] `RESULT.md` is updated at least weekly with shipped/unshipped status
- [ ] Plan stays consistent with `docs/ROADMAP.md`; conflicts resolved within 1 sprint

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Wave-on-time delivery | ≥ 80% of waves ship within +1 week of plan | RESULT.md |
| Spec start-to-merge cycle time | p50 ≤ 2 weeks for medium specs | git + project tracker |
| Specs blocked on upstream contract change | ≤ 1 per wave | RESULT.md |
| Cross-cutting gate failures caught in QA | 0 in production | incident log |
| Plan ↔ roadmap drift | 0 unresolved conflicts > 1 sprint | weekly review |

## In-Scope Deliverables
- Wave 1–5 definitions with entry/exit gates
- Parallelization matrix
- Cross-cutting requirements (security, observability, a11y, FinOps) that bind every spec
- Governance cadence (weekly arch review, bi-weekly product acceptance, 2-week release train)

## Out of Scope (deferred)
- Hiring plan / team composition
- Marketing launches (live in `docs/BUSINESS.md`)
- Procurement / vendor management

## Dependencies
None — this is the root spec.

## Test Checklist (PRD level — see TESTS.md)
- [ ] Every spec referenced exists as a folder with the 8-file structure (or legacy 3-file with migration ticket open)
- [ ] Every wave's exit gate has at least one automated test
- [ ] Quarterly: plan vs ROADMAP delta = 0

## Open Questions
1. When AI Brain Reflection (spec 28) ships, does it become a Wave 4+ requirement or a separate Wave 6? **Recommendation:** integrate into Wave 4 as enhancement; revisit if scope grows.
2. How do we treat platform specs (16–27) — interleaved across waves or as a continuous track? **Decision:** continuous Track F starting Wave 1, with milestone gates at wave boundaries.
