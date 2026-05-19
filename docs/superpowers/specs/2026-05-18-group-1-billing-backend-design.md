# Group 1 — Billing Backend Audit-Complete Pass — Design

**Status:** Draft
**Last updated:** 2026-05-18
**Scope:** Group 1 / Billing & Credits backend (`services/billing-service/`)
**Goal:** Close the major backend gaps called out in [docs/audit/IMPLEMENTATION_AUDIT.md](../../audit/IMPLEMENTATION_AUDIT.md) for the billing-service in one implementation slice.

---

## 1. Problem statement

The current billing-service has working credit deduction, refund, history, plan lookup, and feature-check endpoints, but it is not production-complete:

- there are no billing-service Alembic migrations
- feature gates rely on a runtime seed helper that may never run
- monthly credit reset logic exists but nothing invokes it
- there is no Paddle checkout/session endpoint
- there is no Paddle webhook ingestion or verification flow
- there are no top-up purchase endpoints
- there are no subscription lifecycle endpoints for cancel, resume, or plan change

This makes the service partially functional in local development but unsafe and incomplete for production deployment.

---

## 2. Design goals

1. Make billing-service self-bootstrapping and deployable with real schema migrations.
2. Preserve the existing credit ledger model and extend it without redesigning the service.
3. Support real Paddle-backed subscription and top-up flows.
4. Keep all billing state owned by billing-service.
5. Ensure retries, duplicate webhooks, and scheduler reruns are idempotent.
6. Keep the implementation small enough for one focused backend plan.

## Non-goals

- No billing UI work in this slice.
- No payOS, MoMo, or VNPay work in this slice.
- No cross-service shared library extraction.
- No changes to non-billing Group 1 gaps such as workspace-service endpoints or portal auth middleware.

---

## 3. Current codebase baseline

Relevant existing code:

- [services/billing-service/app/api/v1/billing.py](../../../services/billing-service/app/api/v1/billing.py)
- [services/billing-service/app/models/billing.py](../../../services/billing-service/app/models/billing.py)
- [services/billing-service/app/services/credits.py](../../../services/billing-service/app/services/credits.py)
- [services/billing-service/app/services/feature_gates.py](../../../services/billing-service/app/services/feature_gates.py)
- [services/billing-service/app/main.py](../../../services/billing-service/app/main.py)

Today the service already owns:

- `workspace_credits` as the current balance / plan row
- `credit_transactions` as the append-only ledger
- `plan_feature_gates` as the entitlement catalog

Those structures are the right foundation and should be kept.

---

## 4. Recommended approach

Three approaches were considered:

### A. Schema-first vertical slice, then real Paddle on top (**recommended**)

1. Add billing-service Alembic support and real schema.
2. Move feature gate seeding into migration-backed bootstrapping.
3. Add a scheduler-safe monthly reset entrypoint.
4. Add Paddle checkout + webhook flows on top of that schema.
5. Finish top-up and subscription lifecycle endpoints on the same model.

**Why this is recommended:** the largest audit blocker is that billing-service has business logic but no deployable schema. Real payment integration should land on durable persistence, not the other way around.

### B. Paddle-first integration

Implement checkout/session and webhook handling first, then backfill schema.

**Trade-off:** faster initial path to payment endpoints, but it risks designing local data structures around raw provider payloads instead of around RevLooper’s billing domain.

### C. API façade first

Define all missing billing endpoints now, but defer part of the real external integration.

**Trade-off:** helpful for contract unblocking, but weaker against the audit because the implementation would still hide incomplete behavior behind “live” endpoints.

---

## 5. Architecture

This slice remains fully inside `billing-service`.

### Service boundary

- `billing-service` owns all billing persistence.
- Portal and internal callers talk to it over HTTP only.
- No other service reads billing tables directly.
- `workspace_id` remains required on every workspace-scoped route.

### Internal modules

The implementation should extend the service with four responsibilities:

1. **Credit service** — existing owner of deductions, refunds, history, allocations, and top-ups.
2. **Subscription service** — normalized subscription lifecycle state and plan transitions.
3. **Checkout service** — create Paddle checkout/session payloads for plans and top-ups.
4. **Webhook service** — verify Paddle signatures, parse events, and apply idempotent mutations.

This does not require a shared abstraction layer. Small service modules are enough.

---

## 6. Persistence model

### Existing tables to keep

#### `workspace_credits`

Source of truth for:

- `workspace_id`
- effective plan
- current credit balance
- monthly allocation amount
- current top-up balance
- next reset time
- active Paddle customer/subscription IDs

#### `credit_transactions`

Append-only ledger for:

- monthly allocations
- AI deductions
- refunds
- paid top-ups
- manual adjustments

#### `plan_feature_gates`

Source of truth for plan entitlements and limits.

### New table to add

#### `billing_subscriptions`

Add a normalized subscription lifecycle table instead of overloading `workspace_credits`.

Suggested fields:

- `id`
- `workspace_id`
- `provider` (`paddle`)
- `provider_subscription_id`
- `provider_customer_id`
- `plan`
- `status`
- `billing_interval`
- `next_billed_at`
- `cancel_at_period_end`
- `metadata` JSONB
- `created_at`
- `updated_at`

### Idempotency persistence

Webhook application must be idempotent. To support that cleanly, add a small provider event receipt table.

#### `billing_webhook_events`

Suggested fields:

- `id`
- `provider` (`paddle`)
- `provider_event_id`
- `event_type`
- `received_at`
- `processed_at`
- `status`
- `payload` JSONB

This table exists only to deduplicate and audit inbound payment events. It is not the subscription source of truth.

### Migration strategy

Add service-local Alembic setup and a first billing revision that creates all billing-owned tables and indexes in one shot.

That first revision should include:

- `workspace_credits`
- `credit_transactions`
- `plan_feature_gates`
- `billing_subscriptions`
- `billing_webhook_events`
- required unique constraints and indexes
- seed data for `plan_feature_gates`

---

## 7. API surface

### Existing endpoints to keep

- `POST /v1/billing/credits/deduct`
- `POST /v1/billing/credits/refund`
- `GET /v1/billing/credits/history`
- `GET /v1/billing/plan`
- `GET /v1/billing/features/{feature_key}`

### New endpoints

#### Checkout creation

- `POST /v1/billing/checkout/session`
  - creates a Paddle checkout for new subscription purchase or plan upgrade/downgrade flow
- `POST /v1/billing/topups/session`
  - creates a Paddle checkout for a one-time credit top-up

The caller may choose a plan or top-up package, but not arbitrary provider pricing fields.

#### Subscription lifecycle

- `GET /v1/billing/subscription`
- `POST /v1/billing/subscription/cancel`
- `POST /v1/billing/subscription/resume`
- `POST /v1/billing/subscription/change-plan`

These routes operate on local subscription state and call Paddle as needed.

#### Webhooks

- `POST /v1/billing/webhooks/paddle`

This route is unauthenticated at the user level but must reject invalid signatures.

#### Optional admin/system endpoint

- internal scheduler entrypoint for monthly resets

This can be implemented either as:

- an internal authenticated HTTP route, or
- a small job module invoked by Cloud Run Job / scheduler runtime

The implementation plan should choose the simplest option that matches existing deployment patterns.

---

## 8. Core flows

### 8.1 Plan checkout flow

1. Portal calls `POST /v1/billing/checkout/session` with desired plan.
2. Billing-service validates the requested plan against server-known plan mappings.
3. Billing-service creates a Paddle checkout/session.
4. Billing-service returns the authorization / checkout URL payload needed by the frontend.
5. Paddle later sends webhook events.
6. Webhook handler updates subscription state and mirrors the effective plan to `workspace_credits.plan`.

### 8.2 Credit top-up flow

1. Portal calls `POST /v1/billing/topups/session` with a server-known package key.
2. Billing-service creates a Paddle one-time purchase checkout/session.
3. Paddle sends completion webhook.
4. Billing-service writes one `topup` ledger row.
5. Billing-service increments `workspace_credits.topup_credits`.
6. Billing-service increments `workspace_credits.credits_balance` by the same amount.

Duplicate webhook delivery must not create a second ledger row.

### 8.3 Subscription update flow

1. Paddle sends `subscription.created`, `subscription.updated`, or `subscription.canceled`.
2. Billing-service verifies signature before trusting the body.
3. Billing-service records the inbound event in `billing_webhook_events`.
4. Billing-service applies one idempotent subscription state transition.
5. Billing-service updates `workspace_credits.plan` if the effective plan changed.

Cancellation records lifecycle state, but plan removal should follow Paddle’s effective billing semantics rather than immediate access removal unless the provider explicitly signals term end.

### 8.4 Monthly reset flow

1. Scheduler or job invokes the monthly reset entrypoint.
2. Billing-service selects due workspaces where `credits_reset_at <= now()`.
3. For each due workspace, it restores the monthly allocation for the current plan.
4. Existing `topup_credits` are preserved.
5. Billing-service writes one `allocation` ledger row.
6. Billing-service advances `credits_reset_at` to the next billing cycle.

The reset flow must be safe to rerun after partial failure.

---

## 9. Seeding and bootstrap behavior

The current runtime helper `seed_gates()` is not sufficient as the primary source of correctness.

### Decision

Seed feature gates in the migration itself so a fresh production deployment is correct immediately.

### Result

- `GET /v1/billing/features/{feature_key}` works on first deploy.
- local, CI, and production environments converge on the same baseline.
- runtime startup ordering does not decide whether feature checks work.

The runtime seed helper may remain as a safety tool for tests or local repair, but migrations become authoritative.

---

## 10. Security model

### User-facing routes

All workspace-scoped billing endpoints keep:

- authenticated user dependency
- `workspace_id` dependency
- workspace-isolated queries only

### Paddle webhook route

Before parsing or mutating anything, the webhook handler must:

1. read the raw body
2. verify Paddle signature against the configured secret
3. reject invalid payloads before business logic runs

### Additional constraints

- The client must never choose arbitrary credit amounts.
- The client must never set billing status or plan directly.
- Provider subscription IDs must be unique.
- Duplicate provider events must no-op safely.
- Raw provider payload storage is for audit and reconciliation only, not the primary state model.

---

## 11. Error handling and idempotency

### Checkout/session creation

- retryable from the client
- no duplicate internal state if the same request is repeated

### Webhook application

- idempotent by provider event identity and local state transition checks
- duplicate delivery returns success without double mutation

### Credit mutations

- remain append-only and atomic
- top-up application writes exactly one `topup` ledger row per completed purchase
- no partial “balance changed but no ledger row” outcome

### Subscription lifecycle

- local state should only reflect authoritative Paddle outcomes
- frontend-triggered cancel/resume/change-plan requests may initiate provider actions, but final state comes from verified provider responses or verified follow-up fetches

---

## 12. Testing strategy

This slice should be implemented with strict RED → GREEN → REFACTOR.

### Migration tests

- fresh upgrade creates all billing tables and indexes
- migration seeds feature gates immediately
- downgrade/upgrade roundtrip succeeds

### Unit tests

- checkout payload mapping for plan purchase
- checkout payload mapping for top-up purchase
- webhook signature verification success and failure
- event parsing and state transition mapping
- monthly reset preserves `topup_credits`
- cancel/resume/change-plan state handling

### Integration tests

- top-up completion increments balance and ledger exactly once
- duplicate top-up webhook is idempotent
- `subscription.created` stores normalized subscription state
- `subscription.updated` updates effective plan
- `subscription.canceled` records cancel state correctly
- reset job updates only due workspaces
- feature check works immediately on migrated database

---

## 13. Definition of done

This billing backend slice is complete when:

1. billing-service has working Alembic support and a first migration
2. feature gates are migration-seeded
3. monthly reset has a scheduler-safe entrypoint
4. Paddle checkout/session endpoints exist for plans and top-ups
5. Paddle webhook verification and processing are implemented
6. subscription lifecycle endpoints exist for fetch, cancel, resume, and change-plan
7. top-up flow mutates both ledger and balances correctly
8. tests prove idempotent credit and subscription behavior

---

## 14. Open implementation choice

One implementation detail is intentionally left for the planning phase:

- whether the monthly reset runner is exposed as an internal HTTP route or as a non-HTTP job module

That is a planning choice, not a product ambiguity. The design requirement is only that the reset path is scheduler-safe, batch-safe, and rerunnable.

---

## 15. Self-review

- **Placeholder scan:** no TODO/TBD placeholders remain.
- **Internal consistency:** schema, API, and flow sections all use the same ownership model and idempotency rules.
- **Scope check:** limited to `billing-service` backend only; no UI or unrelated Group 1 work included.
- **Ambiguity check:** the only deferred choice is the scheduler invocation shape, and the design constrains the required behavior.
