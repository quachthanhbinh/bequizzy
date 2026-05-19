# 32 — Billing & Credits Service — PRD

**Status:** 📝 Draft
**Confidence:** 9/10
**Last updated:** 2025-05-05

## Problem Statement

Every AI spec in RevLooper includes the line "calls billing-service to deduct credits BEFORE executing" — but billing-service has never been specced. This means:
- No defined API contract for AI services to code against
- No test coverage for the atomic deduction pattern
- No plan enforcement spec (what gates what on which plan)
- No user-facing credit history or top-up flow

This spec defines billing-service as a first-class platform component.

### PRD References
- §10.1 Credits System: deduction atomic with AI execution, history view, top-up ($5/500 credits)
- §10.9.7 Freemium Feature-Gate: credits are the Free → Pro conversion trigger
- §10.9 (Paddle): global MoR for subscriptions; payOS/MoMo/VNPay for Vietnam

## Goals
1. Every AI operation has a single, well-tested deduction endpoint with atomic rollback on AI failure
2. Plan enforcement is centrally owned by billing-service — no plan checks scattered across services
3. Users can view credit history and top up in-app without contacting support
4. Paddle subscription webhooks correctly update plan tier and credit allocations

## Non-Goals
- ❌ Invoice generation / receipts (Paddle handles this)
- ❌ Custom enterprise pricing negotiations (manual Paddle override via admin)
- ❌ Vietnam payment gateway integration in Phase 1 (Paddle global only; VN local gateways in Phase 2)

## Credits Model

### Plan Allocations (monthly, reset on billing cycle)
| Plan | Monthly Credits | Rollover | Overage |
|---|---|---|---|
| Free | 50 | No | Blocked at 0 |
| Pro | 500 | No | Top-up available |
| Business | 2,000 | No | Top-up available |
| Agency | 5,000 | No | Top-up available |

### Credit Costs per Operation
| Operation | Credits |
|---|---|
| AI email draft (single) | 2 |
| AI email draft (batch, per email) | 1 |
| AI reply suggestion (3 options) | 3 |
| AI lead scoring signal recalc | 0 (rule-based, no LLM) |
| AI campaign builder (full campaign) | 10 |
| AI Brain RAG search (per query) | 1 |
| AI Advisor chat turn (NLQ) | 3 |
| Pre-meeting brief | 5 |
| AI Brain Reflection proposal | 5 |

### Top-up Packs
- $5 / 500 credits (all paid plans)
- Top-ups do not expire
- Top-up credits consumed after monthly allocation exhausted

## Acceptance Criteria

### Credit Deduction API
- [ ] `POST /billing/credits/deduct` — atomic: if AI call fails (5xx), credits rolled back
- [ ] Deduction returns `{ success, credits_remaining, transaction_id }` or `{ error: "insufficient_credits" }`
- [ ] If credits = 0: return 402 with `{ error: "insufficient_credits", upgrade_url: "..." }`
- [ ] Deduction is idempotent: duplicate `transaction_id` (Pub/Sub retry) does not double-deduct

### Plan Enforcement API
- [ ] `GET /billing/plan` — returns current plan, credits remaining, reset date, feature gates
- [ ] Feature gate check: `GET /billing/features/{feature_key}` — returns `{ allowed: bool, reason: string }`

### Credit History
- [ ] `GET /billing/credits/history` — paginated list of all credit transactions (operation, amount, timestamp)
- [ ] History shows both deductions and monthly allocations/top-ups

### Top-up
- [ ] `POST /billing/credits/topup` — creates Paddle checkout session for credit pack purchase
- [ ] Paddle webhook `transaction.completed` credits the workspace

### Subscription Management
- [ ] Paddle webhook `subscription.updated` updates `workspaces.plan` and resets monthly credits
- [ ] Paddle webhook `subscription.cancelled` downgrades to Free plan at end of billing period

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Credit deduction p99 latency | < 100ms | `credits_deducted` event latency |
| Zero double-deductions | 0 | Idempotency key audit |
| Top-up conversion (credits = 0 → purchase) | ≥ 5% | `insufficient_credits → topup_completed` funnel |

## In-Scope Deliverables
- `credit_transactions` table
- `POST /billing/credits/deduct`, `POST /billing/credits/topup`
- `GET /billing/plan`, `GET /billing/features/{feature}`, `GET /billing/credits/history`
- Paddle webhook handler
- Credits widget in workspace settings UI
- Top-up modal UI

## Out of Scope
- Vietnam local payment gateways (Phase 2)
- Annual billing discount (Phase 2)
- Team seat billing (Phase 2)

## Dependencies

| Dep | What we need from it |
|---|---|
| 01_AUTH_WORKSPACE | `workspaces.plan` column; workspace creation hook (trigger initial credit allocation) |

## Open Questions
1. Should credit reset be tied to billing cycle date or calendar month? **Recommendation:** billing cycle date (Paddle subscription renewal date) — avoids pro-rating complexity.
2. Should the deduction API be synchronous or async? **Recommendation:** synchronous — calling services need an immediate go/no-go before executing the AI call. Async deduction creates a race condition.
