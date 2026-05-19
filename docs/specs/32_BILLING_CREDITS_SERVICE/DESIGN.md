# 32 — Billing & Credits Service — DESIGN

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Architecture

```
[AI service] → POST /billing/credits/deduct → [billing-service]
                                                      ↓
                                          SELECT FOR UPDATE credits row
                                          Deduct credits
                                          INSERT credit_transactions
                                          COMMIT
                                          ↓  (success)
                              [AI service executes LLM call]
                                          ↓  (if AI fails)
                              POST /billing/credits/refund (rollback)

[Paddle webhook] → POST /webhooks/paddle → [billing-service]
                                                ↓
                                    UPDATE workspaces.plan
                                    Reset monthly credits
                                    INSERT credit_transactions (allocation)
```

## Database Schema

```sql
-- workspace credit balance (denormalised for fast reads)
ALTER TABLE workspaces
    ADD COLUMN credits_balance INTEGER NOT NULL DEFAULT 50,
    ADD COLUMN credits_reset_at TIMESTAMPTZ,
    ADD COLUMN paddle_subscription_id TEXT,
    ADD COLUMN paddle_customer_id TEXT;

-- Full transaction ledger (append-only, never update/delete)
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'allocation', 'deduction', 'refund', 'topup', 'adjustment'
    )),
    amount INTEGER NOT NULL,         -- positive = credit, negative = debit
    balance_after INTEGER NOT NULL,
    operation TEXT,                  -- 'ai_email_draft', 'ai_advisor_chat', etc.
    idempotency_key TEXT,            -- prevents double-deduction on retry
    reference_id UUID,               -- AI call ID or Paddle transaction ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_credit_transactions_idempotency
    ON credit_transactions(workspace_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_credit_transactions_ws ON credit_transactions(workspace_id, created_at DESC);

-- Feature gate config (plan → feature allowlist)
CREATE TABLE plan_feature_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT true,
    limit_value INTEGER,             -- e.g. lead_limit = 100 for Free
    UNIQUE(plan, feature_key)
);
```

## API Contract

### POST /billing/credits/deduct
```json
// Request
{
  "operation": "ai_email_draft",
  "amount": 2,
  "idempotency_key": "ai-call-uuid"
}
// Headers: Authorization: Bearer JWT, X-Workspace-ID

// Response 200
{ "success": true, "credits_remaining": 48, "transaction_id": "uuid" }

// Response 402
{ "error": "insufficient_credits", "credits_remaining": 0, "upgrade_url": "/billing/upgrade" }
```

### POST /billing/credits/refund
```json
{ "idempotency_key": "ai-call-uuid" }  // Reverses the matching deduction
```

### GET /billing/plan
```json
{
  "plan": "Pro",
  "credits_balance": 423,
  "credits_monthly_allocation": 500,
  "credits_reset_at": "2025-06-01T00:00:00Z",
  "topup_credits": 500
}
```

### GET /billing/features/{feature_key}
```json
{ "allowed": true, "limit_value": null }
// or
{ "allowed": false, "reason": "Requires Pro plan", "upgrade_url": "/billing/upgrade" }
```

### GET /billing/credits/history
Paginated; returns `credit_transactions` ordered by `created_at DESC`.

## Idempotency Pattern

Every deduction call carries an `idempotency_key` (the AI call's UUID). The `UNIQUE INDEX` on `(workspace_id, idempotency_key)` ensures that Pub/Sub retries or network retries never double-deduct. If the same key arrives twice, the second insert raises a unique violation — the handler returns the original `transaction_id` with 200 (not an error).

## CPO ↔ CTO Debate

### Round 1 — Synchronous vs async deduction

**CPO (confidence: 8):** Deduction must be synchronous — the AI service needs a go/no-go decision before paying for an LLM call. If we go async, users can exhaust credits before the system catches up.

**CTO (confidence: 9):** Synchronous is correct. Implementation: billing-service uses `SELECT ... FOR UPDATE SKIP LOCKED` to grab the workspace credit row atomically. If balance < amount, return 402 immediately. Under concurrent requests (same workspace hits 5 AI features simultaneously), only one transaction decrements at a time — this serialises correctly at the DB level.

**Gap:** 1.

### Round 2 — Paddle webhook security

**CTO (confidence: 9):** Paddle webhook must be validated with the Paddle HMAC signature on every request. Never process a webhook without verifying the signature. Store the Paddle webhook secret in GCP Secret Manager, not environment variables. Any replay of a Paddle transaction ID must be deduplicated.

**CPO (confidence: 9):** Agreed — this is a financial endpoint. Non-negotiable.

**Gap:** 0.

### Round 3 — Credit reset timing

**CPO (confidence: 8):** Reset on billing cycle date (not calendar month). Avoids "I paid on the 15th but credits reset on the 1st" confusion.

**CTO (confidence: 8):** Agreed. Store `credits_reset_at` on the workspace. Cron job (Cloud Scheduler) checks daily for workspaces where `credits_reset_at ≤ now()`, resets balance, advances `credits_reset_at` by one month, inserts an `allocation` transaction.

**Final confidence: CPO 8 / CTO 9** — Approved.
