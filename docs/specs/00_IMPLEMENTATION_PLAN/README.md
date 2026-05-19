# 00 — Implementation Plan & Delivery Orchestration

**Status:** ✅ Approved (orchestration spec, not a feature)
**Confidence:** 9/10
**Security flag:** 🟢 LOW (process spec)
**Priority:** P0
**Parallel Track:** N/A (governs all tracks)
**Depends on:** none
**Blocks:** sequencing of 01–28
**Owning service:** N/A — owned by Eng Lead + PM

## One-line summary
The master delivery plan: how 27 feature specs (+ 28 AI Brain Reflection) ship in waves, what gates each wave, and how parallel tracks are coordinated.

## Why it matters
- Without explicit waves, dependencies stall progress (e.g. starting `06_SEQUENCE_BUILDER` before `01_AUTH_WORKSPACE` lands wastes weeks)
- Parallel-track discipline lets a small team ship 4× faster than serial execution
- Single source of truth for "what is unblocked right now"

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Why this plan exists, success criteria for the plan itself |
| [DESIGN.md](DESIGN.md) | Wave model, dependency graph, parallel-track matrix |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Governance cadence, release train, exit gates per wave |
| [TASKS.md](TASKS.md) | Cross-spec checkpoints (not feature tasks — those live in each spec) |
| [TESTS.md](TESTS.md) | Wave exit gate tests (integration sign-off per wave) |
| [SECURITY.md](SECURITY.md) | Cross-cutting security requirements applied to every spec |
| [RESULT.md](RESULT.md) | (Updated weekly) actual progress vs plan |

## Pointers
- Source roadmap: [docs/ROADMAP.md](../../ROADMAP.md)
- Spec index: [docs/specs/README.md](../README.md)
- Skills used: `spec-driven-development` (every spec passes through it)
