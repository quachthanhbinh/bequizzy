# 32 — Billing & Credits Service

**Status:** 📝 Draft
**Confidence:** 9/10
**Security flag:** 🔴 HIGH (payment processing, credit manipulation, plan enforcement)
**Priority:** P0
**Parallel Track:** E (Billing / Integrations)
**Depends on:** 01 (Auth & Workspace — plan tier stored on workspace)
**Blocks:** every spec that deducts credits (05, 06, 07, 10, 11, 13, 28, 29, 31)
**Owning service:** billing-service

## One-line summary
The foundational billing service: plan enforcement, AI credit accounting (atomic deduction before every LLM call), credit top-ups via Paddle, and the credit history view — referenced as a dependency in every other spec but never itself specced until now.

## Why it matters
- Architecture non-negotiable: "Credits deducted via billing-service BEFORE any AI call" — every AI spec depends on this contract
- Without a spec, teams implementing AI features have no contract to code against and no tests to validate the deduction flow
- Revenue model: credits are the primary upsell lever for Free → Pro conversion (PRD §10.9.7)
- Security: credit manipulation is the top financial attack surface

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Credits model, plan enforcement, Paddle integration, acceptance criteria |
| [DESIGN.md](DESIGN.md) | DB schema, API contract, atomic deduction pattern, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Threat model — credit manipulation, payment security, plan bypass |
| [TESTS.md](TESTS.md) | Unit / integration / adversarial tests |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, Paddle webhook integration, feature flags |
| [TASKS.md](TASKS.md) | TDD task list (≤15 tasks, RED-first) |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Pointers
- Related specs: ALL AI specs (05, 06, 07, 10, 11, 13, 28, 29, 31) — all consume `POST /billing/credits/deduct`
- Skills: `spec-driven-development`, `tdd-workflow`, `security-auditor`
- Owning service: `services/billing-service/`
- Payment provider: Paddle (global MoR) + payOS/MoMo/VNPay (Vietnam)
