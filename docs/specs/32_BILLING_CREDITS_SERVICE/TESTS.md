# 32 — Billing & Credits Service — TESTS

**Status:** 📝 Draft
**Coverage gate:** ≥ 90% on billing-service (financial critical path)
**Last updated:** 2025-05-05

## Unit Tests

### Credit deduction
- [ ] `test_deduct_succeeds_with_sufficient_credits`
- [ ] `test_deduct_returns_402_when_credits_zero`
- [ ] `test_deduct_returns_402_when_insufficient`
- [ ] `test_deduct_is_idempotent_on_duplicate_idempotency_key`
- [ ] `test_deduct_does_not_go_below_zero` — DB constraint holds
- [ ] `test_concurrent_deductions_do_not_double_spend` (use `threading` or `asyncio.gather`)

### Credit refund
- [ ] `test_refund_reverses_deduction_by_idempotency_key`
- [ ] `test_refund_unknown_key_returns_404`
- [ ] `test_double_refund_returns_409`

### Plan reset
- [ ] `test_monthly_reset_restores_full_allocation`
- [ ] `test_topup_credits_not_reset_on_monthly_reset`
- [ ] `test_reset_advances_credits_reset_at_by_one_month`

### Paddle webhook handler
- [ ] `test_subscription_updated_upgrades_plan`
- [ ] `test_subscription_cancelled_schedules_downgrade`
- [ ] `test_webhook_rejected_without_valid_signature`
- [ ] `test_paddle_transaction_replayed_is_deduplicated`
- [ ] `test_topup_webhook_credits_workspace`

### Feature gate
- [ ] `test_feature_allowed_for_correct_plan`
- [ ] `test_feature_blocked_returns_reason_and_upgrade_url`
- [ ] `test_lead_limit_returns_limit_value`

## Integration Tests
- [ ] Full deduction → AI call fail → refund: balance restored to original value
- [ ] Paddle webhook → plan upgrade → feature gate check returns new plan's allowances
- [ ] Credit history endpoint returns all transactions in correct order

## Adversarial Tests
- [ ] Forged Paddle webhook (wrong signature) → 401, no plan change
- [ ] Race condition simulation: 10 concurrent deductions of 10 credits against balance of 15 → exactly 1 succeeds
- [ ] Attempt `DELETE FROM credit_transactions` → RLS policy blocks it

## E2E Tests (Playwright)
- [ ] Credits widget shows correct balance in workspace settings
- [ ] Top-up modal opens Paddle checkout (mock Paddle in test env)
- [ ] After credits = 0, AI email draft button shows "Upgrade" instead of "Generate"
