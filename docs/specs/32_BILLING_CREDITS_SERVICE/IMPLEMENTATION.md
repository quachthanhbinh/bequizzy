# 32 — Billing & Credits Service — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Phase Breakdown

### Phase 1 — DB + core deduction API (Week 1)
- Alembic migration: `credit_transactions`, `plan_feature_gates`; add columns to `workspaces`
- `billing-service/app/services/credits.py` — `deduct()`, `refund()`, `get_balance()`
- `POST /billing/credits/deduct`, `POST /billing/credits/refund`
- Seed `plan_feature_gates` with Phase 1 plan config
- Monthly reset Cloud Scheduler job

### Phase 2 — Paddle webhook + top-up (Week 2)
- `billing-service/app/webhooks/paddle.py` — HMAC validation + event handlers
- `POST /billing/credits/topup` (creates Paddle checkout session)
- `GET /billing/plan`, `GET /billing/features/{feature_key}`

### Phase 3 — History + UI (Week 2–3)
- `GET /billing/credits/history` (paginated)
- `frontend/components/billing/CreditsWidget.tsx`
- `frontend/components/billing/TopUpModal.tsx`
- `frontend/components/billing/CreditHistoryTable.tsx`

## File Map
```
services/billing-service/
  app/
    services/
      credits.py
      plan_gates.py
    webhooks/
      paddle.py
    routers/
      billing.py
    models/
      credit_transaction.py
      plan_feature_gate.py
    schemas/
      billing.py

frontend/
  components/billing/
    CreditsWidget.tsx
    TopUpModal.tsx
    CreditHistoryTable.tsx
  hooks/
    useBillingPlan.ts
    useCreditsHistory.ts
```

## Feature Flags
None — billing-service is always-on (no feature flag for payment processing).

## Risks
| Risk | Mitigation |
|---|---|
| Paddle webhook delivery failure | Paddle retries for 72h; idempotency key prevents double-processing |
| DB lock contention on high-traffic deductions | `SELECT FOR UPDATE SKIP LOCKED` + connection pool sizing (min 5, max 20 connections) |
| Credit reset job misfire | Cloud Scheduler + Cloud Tasks dead-letter queue; alert on 0 allocations in 25h |
