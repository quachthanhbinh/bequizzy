# 32 — Billing & Credits Service — TASKS

**Status:** 📝 Draft
**Last updated:** 2025-05-05

> RED-first. Coverage gate: ≥ 90% (financial critical path).

## Task List

### Task 1 — DB migration: credit_transactions + workspace columns
- **Test:** `test_credit_transactions_table_exists`, `test_workspaces_has_credits_balance`
- **RED:** table/columns don't exist
- **GREEN:** migration adds all schema changes with constraints and indexes

### Task 2 — DB migration: plan_feature_gates + seed data
- **Test:** `test_free_plan_lead_limit_is_100`
- **RED:** table not seeded
- **GREEN:** seed inserts correct rows for all 4 plans

### Task 3 — credits.py: deduct() — success path
- **Test:** `test_deduct_succeeds_with_sufficient_credits`
- **RED:** function not implemented
- **GREEN:** balance decremented, transaction inserted, returns `credits_remaining`

### Task 4 — credits.py: deduct() — insufficient credits path
- **Test:** `test_deduct_returns_402_when_insufficient`
- **RED:** no balance check
- **GREEN:** raises `InsufficientCreditsError` when balance < amount

### Task 5 — credits.py: deduct() — idempotency
- **Test:** `test_deduct_is_idempotent_on_duplicate_idempotency_key`
- **RED:** duplicate key raises 500
- **GREEN:** returns original transaction_id with 200

### Task 6 — credits.py: deduct() — race condition
- **Test:** `test_concurrent_deductions_do_not_double_spend`
- **RED:** no FOR UPDATE lock
- **GREEN:** concurrent deductions serialise correctly via `SELECT FOR UPDATE`

### Task 7 — credits.py: refund()
- **Tests:** `test_refund_reverses_deduction`, `test_double_refund_returns_409`
- **RED:** function not implemented
- **GREEN:** refund adds back correct amount; duplicate refund rejected

### Task 8 — Monthly reset job
- **Test:** `test_monthly_reset_restores_full_allocation`
- **RED:** reset logic not implemented
- **GREEN:** balance restored; topup credits preserved; `credits_reset_at` advanced

### Task 9 — POST /billing/credits/deduct + /refund endpoints
- **Test:** `test_deduct_endpoint_returns_correct_structure`
- **RED:** endpoints not implemented
- **GREEN:** correct request/response contract; 402 on insufficient credits

### Task 10 — Paddle webhook: HMAC validation
- **Test:** `test_webhook_rejected_without_valid_signature`
- **RED:** no HMAC check
- **GREEN:** invalid signature returns 401 immediately

### Task 11 — Paddle webhook: subscription.updated + transaction.completed
- **Tests:** `test_subscription_updated_upgrades_plan`, `test_topup_webhook_credits_workspace`, `test_paddle_transaction_replayed_deduplicated`
- **RED:** handlers not implemented
- **GREEN:** all three events handled correctly with deduplication

### Task 12 — GET /billing/plan + GET /billing/features/{feature_key}
- **Tests:** `test_plan_endpoint_returns_correct_plan`, `test_feature_blocked_returns_upgrade_url`
- **RED:** endpoints not implemented
- **GREEN:** plan returns current balance and reset date; feature gate returns allowed/blocked

### Task 13 — GET /billing/credits/history (paginated)
- **Test:** `test_history_returns_transactions_newest_first`
- **RED:** endpoint not implemented
- **GREEN:** paginated history with correct ordering

### Task 14 — Frontend: CreditsWidget + TopUpModal
- **Tests:** Vitest `renders_credits_balance`, `opens_topup_modal`
- **RED:** components not created
- **GREEN:** widget shows balance; modal shows top-up options

### Task 15 — Verify-RED + coverage check (≥ 90%)
- Run full suite; assert coverage ≥ 90% on `billing-service/app/`
- Run adversarial race condition test 10× — zero double-spends
