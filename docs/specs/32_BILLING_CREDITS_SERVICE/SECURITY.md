# 32 — Billing & Credits Service — SECURITY

**Status:** 📝 Draft
**Risk rating:** 🔴 HIGH
**Last updated:** 2025-05-05

## Assets
- Credit balances (financial value)
- Paddle webhook (payment confirmation)
- Plan tier (controls feature access)
- Credit transaction ledger (financial audit trail)

## Threat Model

| OWASP | Threat | Mitigation |
|---|---|---|
| A01 Broken Access Control | User queries another workspace's credit balance | `workspace_id` enforced on all queries; JWT validates workspace scope |
| A01 | User upgrades their own plan via direct DB manipulation | Plan only updated via validated Paddle webhook (HMAC verified) or admin endpoint (internal-only) |
| A02 Cryptographic Failures | Paddle webhook signature not verified → attacker forges subscription.updated | HMAC-SHA256 signature verification on every webhook payload before processing; secret in GCP Secret Manager |
| A04 Insecure Design | Race condition: two simultaneous AI calls both see balance = 1 and both proceed | `SELECT ... FOR UPDATE` serialises balance reads; only one transaction decrements below threshold |
| A04 | Double deduction on Pub/Sub retry | `UNIQUE INDEX` on `(workspace_id, idempotency_key)` — second insert raises 409, handler returns original transaction_id |
| A04 | Negative balance via concurrent deductions | `CHECK (credits_balance >= 0)` DB constraint as last line of defence |
| A07 Auth Failures | Unauthenticated call to `/billing/credits/deduct` | api-gateway enforces JWT auth on all `/billing/*` routes; billing-service also validates |
| A08 Software Integrity | Paddle transaction replayed from logs | Paddle transaction_id deduplicated in `credit_transactions.reference_id` with UNIQUE constraint |

## Controls
- All billing endpoints behind api-gateway JWT middleware (service-to-service calls use Workload Identity OIDC)
- `POST /webhooks/paddle` is on a separate internal endpoint — NOT routed through api-gateway; Cloud Run ingress = internal + Paddle IP allowlist
- Credit ledger is append-only — no UPDATE or DELETE on `credit_transactions` allowed (RLS policy)
- `workspaces.credits_balance` has `CHECK (credits_balance >= 0)` constraint
- Rate limit on deduction endpoint: 100 rpm per workspace (prevents farming via rapid AI calls)
- All Paddle secrets stored in GCP Secret Manager, never in environment variables
- Financial audit log: all transactions retained for 7 years (legal requirement)

## Residual Risk
High category warranted — financial data and payment processing. With mitigations applied, actual exploitation risk is LOW. Primary residual risk: Paddle webhook secret leak via GCP audit logs (mitigated by Secret Manager access controls).
