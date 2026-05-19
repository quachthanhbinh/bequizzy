# 33 — Freemium Feature Gates

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (plan bypass, gate conversion tracking)
**Priority:** P1
**Parallel Track:** C (CRM / UX / Frontend)
**Depends on:** 01 (Auth — plan on workspace), 32 (Billing — feature gate API)
**Blocks:** none (wraps all other specs)
**Owning service:** billing-service (gate API, PRD §10.9.7), frontend (UX layer)

## One-line summary
The upgrade trigger framework: value-first gates with contextual upgrade prompts, "show what they're missing" previews, and gate-to-upgrade conversion funnel tracking — turning free plan limits into revenue moments.

## Why it matters
- RevLooper is free forever — without intelligent gates, revenue never happens
- PRD §10.9.7 defines 12 specific gate moments with exact copy and UX behaviour
- "Gates with < 2% conversion are reviewed for repositioning" — requires measurement infrastructure
- Without a spec, gate UX is implemented inconsistently across features (some hard errors, some no gates)

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Gate inventory, UX principles, upgrade copy, conversion tracking |
| [DESIGN.md](DESIGN.md) | Gate component architecture, analytics events, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Plan bypass threats, client-side gate enforcement risks |
| [TESTS.md](TESTS.md) | Gate rendering, plan bypass, conversion funnel tests |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Component library, feature flag integration, rollout |
| [TASKS.md](TASKS.md) | TDD task list (≤15 tasks, RED-first) |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Pointers
- Related specs: 32 (billing-service owns the gate API), 23 (feature flags for gradual rollout)
- Skills: `spec-driven-development`, `tdd-workflow`
- All 12 gate moments defined in PRD §10.9.7 must be implemented
