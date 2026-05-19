# Group 1 Billing Backend Implementation Plan

**Spec:** [docs/superpowers/specs/2026-05-18-group-1-billing-backend-design.md](../superpowers/specs/2026-05-18-group-1-billing-backend-design.md)
**Goal:** Make `billing-service` production-complete for Group 1 by adding real schema migrations, seeded feature gates, monthly reset execution, Paddle checkout + webhook flows, top-up handling, and subscription lifecycle endpoints.
**Architecture:** Extend the existing `billing-service` rather than introducing a new service. Keep current credit logic in [services/billing-service/app/services/credits.py](../../services/billing-service/app/services/credits.py), add two new persistence models (`BillingSubscription`, `BillingWebhookEvent`), add a small Paddle client + checkout/webhook/subscription services, and implement monthly reset as a non-HTTP job module to keep the public API surface smaller.
**Services touched:** `billing-service`
**Execution:** Use TDD Agent. Each task must follow RED → Verify-RED → GREEN → Verify-GREEN → Commit.

---

## Context already verified

The plan is based on these existing files and patterns:

- Spec: [docs/superpowers/specs/2026-05-18-group-1-billing-backend-design.md](../superpowers/specs/2026-05-18-group-1-billing-backend-design.md)
- Billing router baseline: [services/billing-service/app/api/v1/billing.py](../../services/billing-service/app/api/v1/billing.py)
- Billing models baseline: [services/billing-service/app/models/billing.py](../../services/billing-service/app/models/billing.py)
- Credits service baseline: [services/billing-service/app/services/credits.py](../../services/billing-service/app/services/credits.py)
- Feature gate baseline: [services/billing-service/app/services/feature_gates.py](../../services/billing-service/app/services/feature_gates.py)
- Billing tests baseline: [services/billing-service/tests/unit/test_feature_gates.py](../../services/billing-service/tests/unit/test_feature_gates.py), [services/billing-service/tests/integration/test_billing_routers.py](../../services/billing-service/tests/integration/test_billing_routers.py), [services/billing-service/tests/conftest.py](../../services/billing-service/tests/conftest.py)
- Webhook idempotency template: [services/outreach-service/app/api/v1/webhooks.py](../../services/outreach-service/app/api/v1/webhooks.py)
- HMAC helper template: [services/booking-service/app/utils/hmac_validator.py](../../services/booking-service/app/utils/hmac_validator.py)
- External-auth/session creation template: [services/outreach-service/app/api/v1/mailbox_oauth.py](../../services/outreach-service/app/api/v1/mailbox_oauth.py)
- Job-entrypoint template: [services/analytics-aggregator/app/main.py](../../services/analytics-aggregator/app/main.py)
- Ownership + billing schema notes: [docs/DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)

---

## Scope decisions for implementation

1. **Monthly reset entrypoint:** implement as a non-HTTP job module (`python -m app.jobs.monthly_reset`) rather than a new internal route.
2. **Top-up catalog:** keep server-known top-up packages as code constants in this slice; do not add a `credit_top_up_packs` table yet.
3. **Plan values:** keep current backend plan values (`free`, `starter`, `pro`, `agency`) rather than introducing `business` mid-slice.
4. **Webhook idempotency:** persist received Paddle events in a dedicated table and no-op duplicates.
5. **Schema source of truth:** move feature gate seed data into the first Alembic migration; runtime helper remains optional for tests only.

---

## File map

### Create
- `services/billing-service/alembic/env.py`
- `services/billing-service/alembic/script.py.mako`
- `services/billing-service/alembic/versions/2026_05_18_001_create_billing_tables.py`
- `services/billing-service/app/schemas/__init__.py`
- `services/billing-service/app/schemas/billing.py`
- `services/billing-service/app/services/paddle_client.py`
- `services/billing-service/app/services/checkout_service.py`
- `services/billing-service/app/services/subscription_service.py`
- `services/billing-service/app/services/paddle_webhook_service.py`
- `services/billing-service/app/api/v1/checkout.py`
- `services/billing-service/app/api/v1/subscriptions.py`
- `services/billing-service/app/api/v1/webhooks.py`
- `services/billing-service/app/jobs/__init__.py`
- `services/billing-service/app/jobs/monthly_reset.py`
- `services/billing-service/tests/migrations/test_001_billing_schema.py`
- `services/billing-service/tests/unit/test_checkout_service.py`
- `services/billing-service/tests/unit/test_subscription_service.py`
- `services/billing-service/tests/unit/test_paddle_webhook_service.py`
- `services/billing-service/tests/unit/test_monthly_reset_job.py`

### Modify
- `services/billing-service/app/models/billing.py`
- `services/billing-service/app/services/credits.py`
- `services/billing-service/app/services/feature_gates.py`
- `services/billing-service/app/main.py`
- `services/billing-service/tests/conftest.py`
- `services/billing-service/tests/integration/test_billing_routers.py`
- `docs/DATABASE_SCHEMA.md`

---

## Task 1: Add billing-service Alembic scaffolding and the first migration

**Files:**
- Create: `services/billing-service/alembic/env.py`
- Create: `services/billing-service/alembic/script.py.mako`
- Create: `services/billing-service/alembic/versions/2026_05_18_001_create_billing_tables.py`
- Create: `services/billing-service/tests/migrations/test_001_billing_schema.py`

**Dependencies:** none

- [ ] **Step 1: Write a failing migration roundtrip test**

```python
from sqlalchemy import text


def test_upgrade_creates_billing_tables(migrated_engine):
    with migrated_engine.connect() as conn:
        tables = {
            row[0]
            for row in conn.execute(
                text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
            )
        }

    assert "workspace_credits" in tables
    assert "credit_transactions" in tables
    assert "plan_feature_gates" in tables
    assert "billing_subscriptions" in tables
    assert "billing_webhook_events" in tables
```

- [ ] **Step 2: Run the migration test and verify RED**

```bash
cd services/billing-service
pytest tests/migrations/test_001_billing_schema.py -v
```

Expected RED: Alembic env or revision missing.

- [ ] **Step 3: Copy Alembic structure from an existing service**
  - Use `services/workspace-service/alembic/` as the structural template.
  - Point `target_metadata` at `app.models.billing.Base.metadata`.
  - Do not invent a second Base.

- [ ] **Step 4: Write the first migration**
  - Create tables:
    - `workspace_credits`
    - `credit_transactions`
    - `plan_feature_gates`
    - `billing_subscriptions`
    - `billing_webhook_events`
  - Preserve existing constraints from the current ORM.
  - Add unique constraints for:
    - `workspace_credits.workspace_id`
    - `billing_subscriptions.provider_subscription_id`
    - `billing_webhook_events(provider, provider_event_id)`
  - Seed `plan_feature_gates` inside the migration using the current gate matrix from `feature_gates.SEED_GATES`.

- [ ] **Step 5: Verify GREEN**

```bash
cd services/billing-service
alembic upgrade head
pytest tests/migrations/test_001_billing_schema.py -v
alembic downgrade base
alembic upgrade head
```

- [ ] **Step 6: Commit**

```bash
git add services/billing-service/alembic services/billing-service/tests/migrations/test_001_billing_schema.py
git commit -m "feat(billing): add alembic scaffolding and initial billing schema"
```

**Acceptance:**
- [ ] Billing-service has its own working Alembic environment
- [ ] All required tables exist after `alembic upgrade head`
- [ ] Seeded feature gates exist immediately after migration
- [ ] Downgrade/upgrade roundtrip works

---

## Task 2: Extend ORM models and shared billing schemas

**Files:**
- Modify: `services/billing-service/app/models/billing.py`
- Create: `services/billing-service/app/schemas/__init__.py`
- Create: `services/billing-service/app/schemas/billing.py`
- Modify: `services/billing-service/tests/conftest.py`

**Dependencies:** Task 1

- [ ] **Step 1: Write failing unit tests that import the new models and schemas**

```python
from app.models.billing import BillingSubscription, BillingWebhookEvent
from app.schemas.billing import CheckoutSessionRequest, SubscriptionResponse


def test_subscription_model_defaults():
    sub = BillingSubscription(provider="paddle", workspace_id=uuid.uuid4(), plan="starter", status="active")
    assert sub.cancel_at_period_end is False
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
cd services/billing-service
pytest tests/unit/test_subscription_service.py -k defaults -v
```

Expected RED: import/module/class missing.

- [ ] **Step 3: Update `app/models/billing.py`**
  - Add `BillingSubscription`
  - Add `BillingWebhookEvent`
  - Keep them in the same file as existing billing models to match the current small-service pattern.

- [ ] **Step 4: Add `app/schemas/billing.py`**
  - Move new request/response models there instead of growing `app/api/v1/billing.py`
  - Add only the schemas needed for:
    - checkout session creation
    - top-up session creation
    - subscription read/change/cancel/resume
    - webhook response envelope

- [ ] **Step 5: Update `tests/conftest.py` if required**
  - Keep `Base.metadata.create_all()` working with the expanded model file.
  - Do not switch unit/integration tests to Alembic-driven setup in this slice.

- [ ] **Step 6: Verify GREEN**

```bash
cd services/billing-service
pytest tests/unit/test_subscription_service.py -v
```

- [ ] **Step 7: Commit**

```bash
git add services/billing-service/app/models/billing.py services/billing-service/app/schemas services/billing-service/tests/conftest.py services/billing-service/tests/unit/test_subscription_service.py
git commit -m "feat(billing): add subscription and webhook receipt models"
```

**Acceptance:**
- [ ] ORM models match the migration schema
- [ ] Pydantic schemas exist for all new route contracts
- [ ] Existing test setup still boots the schema cleanly

---

## Task 3: Add Paddle checkout session creation for plans and top-ups

**Files:**
- Create: `services/billing-service/app/services/paddle_client.py`
- Create: `services/billing-service/app/services/checkout_service.py`
- Create: `services/billing-service/app/api/v1/checkout.py`
- Create: `services/billing-service/tests/unit/test_checkout_service.py`
- Modify: `services/billing-service/tests/integration/test_billing_routers.py`
- Modify: `services/billing-service/app/main.py`

**Dependencies:** Task 2

- [ ] **Step 1: Write failing unit tests for checkout payload mapping**

```python
async def test_create_plan_checkout_uses_server_known_price(monkeypatch):
    ...
    result = await checkout_service.create_plan_checkout(..., plan="starter")
    assert result.provider == "paddle"
    assert result.checkout_url.startswith("https://")
```

- [ ] **Step 2: Verify RED**

```bash
cd services/billing-service
pytest tests/unit/test_checkout_service.py -v
```

Expected RED: service/module missing.

- [ ] **Step 3: Implement the minimal Paddle client**
  - Read secrets from env with a tiny local helper inside `paddle_client.py`
  - Use `httpx.AsyncClient`
  - Support only the operations needed now:
    - create checkout for subscription plan
    - create checkout for top-up package
    - fetch/update/cancel subscription for lifecycle tasks later

- [ ] **Step 4: Implement `checkout_service.py`**
  - Keep plan-to-price and top-up-package mappings server-side constants
  - Reject unknown plans/packages with domain errors
  - Return a typed response that the router can send directly

- [ ] **Step 5: Add router endpoints**
  - `POST /v1/billing/checkout/session`
  - `POST /v1/billing/topups/session`
  - Reuse existing auth + workspace dependencies from `app/api/v1/billing.py`

- [ ] **Step 6: Add integration tests for both endpoints**
  - extend `tests/integration/test_billing_routers.py`
  - patch the checkout service, not the router internals

- [ ] **Step 7: Verify GREEN**

```bash
cd services/billing-service
pytest tests/unit/test_checkout_service.py tests/integration/test_billing_routers.py -k "checkout or topup" -v
```

- [ ] **Step 8: Commit**

```bash
git add services/billing-service/app/services/paddle_client.py services/billing-service/app/services/checkout_service.py services/billing-service/app/api/v1/checkout.py services/billing-service/app/main.py services/billing-service/tests/unit/test_checkout_service.py services/billing-service/tests/integration/test_billing_routers.py
git commit -m "feat(billing): add paddle checkout endpoints for plans and topups"
```

**Acceptance:**
- [ ] Client cannot choose arbitrary provider pricing
- [ ] Plan checkout and top-up checkout return typed session payloads
- [ ] Endpoints are workspace-scoped and authenticated
- [ ] HTTP calls are covered by unit tests with mocks, not live Paddle

---

## Task 4: Add subscription lifecycle service and endpoints

**Files:**
- Create: `services/billing-service/app/services/subscription_service.py`
- Create: `services/billing-service/app/api/v1/subscriptions.py`
- Modify: `services/billing-service/app/services/credits.py`
- Create: `services/billing-service/tests/unit/test_subscription_service.py`
- Modify: `services/billing-service/tests/integration/test_billing_routers.py`
- Modify: `services/billing-service/app/main.py`

**Dependencies:** Task 3

- [ ] **Step 1: Write failing unit tests for lifecycle operations**

```python
async def test_get_subscription_returns_workspace_subscription(db_session):
    ...

async def test_cancel_sets_cancel_at_period_end(db_session, monkeypatch):
    ...

async def test_change_plan_updates_local_effective_plan(db_session, monkeypatch):
    ...
```

- [ ] **Step 2: Verify RED**

```bash
cd services/billing-service
pytest tests/unit/test_subscription_service.py -v
```

Expected RED: service/router behavior missing.

- [ ] **Step 3: Implement `subscription_service.py`**
  - `get_current_subscription()`
  - `cancel_subscription()`
  - `resume_subscription()`
  - `change_plan()`
  - Mirror effective plan changes into `WorkspaceCredits.plan`
  - Do not mutate credits in this task except for plan metadata

- [ ] **Step 4: Add router endpoints**
  - `GET /v1/billing/subscription`
  - `POST /v1/billing/subscription/cancel`
  - `POST /v1/billing/subscription/resume`
  - `POST /v1/billing/subscription/change-plan`

- [ ] **Step 5: Add integration tests to the existing router test file**
  - authenticated success path
  - missing subscription → 404 or domain error contract
  - plan mirror into `workspace_credits.plan`

- [ ] **Step 6: Verify GREEN**

```bash
cd services/billing-service
pytest tests/unit/test_subscription_service.py tests/integration/test_billing_routers.py -k "subscription" -v
```

- [ ] **Step 7: Commit**

```bash
git add services/billing-service/app/services/subscription_service.py services/billing-service/app/api/v1/subscriptions.py services/billing-service/app/services/credits.py services/billing-service/app/main.py services/billing-service/tests/unit/test_subscription_service.py services/billing-service/tests/integration/test_billing_routers.py
git commit -m "feat(billing): add subscription lifecycle endpoints"
```

**Acceptance:**
- [ ] Subscription state is normalized in `billing_subscriptions`
- [ ] Workspace plan is mirrored to `workspace_credits.plan`
- [ ] Lifecycle endpoints are covered by unit and integration tests

---

## Task 5: Add Paddle webhook verification, persistence, and idempotent event handling

**Files:**
- Create: `services/billing-service/app/services/paddle_webhook_service.py`
- Create: `services/billing-service/app/api/v1/webhooks.py`
- Modify: `services/billing-service/app/services/credits.py`
- Modify: `services/billing-service/app/services/subscription_service.py`
- Create: `services/billing-service/tests/unit/test_paddle_webhook_service.py`
- Modify: `services/billing-service/tests/integration/test_billing_routers.py`
- Modify: `services/billing-service/app/main.py`

**Dependencies:** Task 4

- [ ] **Step 1: Write failing unit tests for webhook verification and idempotency**

```python
def test_invalid_signature_rejected():
    ...

async def test_duplicate_event_is_ignored(db_session):
    ...

async def test_topup_completed_adds_single_ledger_row(db_session):
    ...
```

- [ ] **Step 2: Verify RED**

```bash
cd services/billing-service
pytest tests/unit/test_paddle_webhook_service.py -v
```

Expected RED: verification/parser/handler missing.

- [ ] **Step 3: Implement raw-body signature verification**
  - Follow the small helper style from `booking-service/app/utils/hmac_validator.py`
  - Keep the helper inside `paddle_webhook_service.py` unless it becomes truly reused twice
  - Compare HMAC using `hmac.compare_digest`

- [ ] **Step 4: Implement event handling for the first required event set**
  - plan/checkout completion event → create or reconcile subscription state
  - subscription created
  - subscription updated
  - subscription canceled
  - top-up purchase completion

- [ ] **Step 5: Persist webhook receipts before applying mutations**
  - insert `BillingWebhookEvent`
  - unique on `(provider, provider_event_id)`
  - duplicate event returns success without double mutation

- [ ] **Step 6: Extend `credits.py` with a top-up mutation helper**

```python
async def apply_topup(db: AsyncSession, *, workspace_id: uuid.UUID, amount: int, idempotency_key: str) -> dict:
    ...
```

  - increment `topup_credits`
  - increment `credits_balance`
  - append exactly one `topup` ledger row

- [ ] **Step 7: Add webhook route**
  - `POST /v1/billing/webhooks/paddle`
  - unauthenticated at user level
  - must read raw body and signature header
  - return 2xx on duplicates after safe no-op

- [ ] **Step 8: Add integration tests**
  - verified webhook success
  - invalid signature rejection
  - duplicate webhook idempotency
  - top-up webhook updates ledger and balances

- [ ] **Step 9: Verify GREEN**

```bash
cd services/billing-service
pytest tests/unit/test_paddle_webhook_service.py tests/integration/test_billing_routers.py -k "webhook or topup" -v
```

- [ ] **Step 10: Commit**

```bash
git add services/billing-service/app/services/paddle_webhook_service.py services/billing-service/app/api/v1/webhooks.py services/billing-service/app/services/credits.py services/billing-service/app/services/subscription_service.py services/billing-service/app/main.py services/billing-service/tests/unit/test_paddle_webhook_service.py services/billing-service/tests/integration/test_billing_routers.py
git commit -m "feat(billing): add verified paddle webhook processing"
```

**Acceptance:**
- [ ] Invalid webhook signatures do not mutate state
- [ ] Duplicate events are no-ops
- [ ] Subscription events update normalized subscription state
- [ ] Top-up events mutate both balance and ledger exactly once

---

## Task 6: Add monthly reset batch job and due-workspace processing

**Files:**
- Create: `services/billing-service/app/jobs/__init__.py`
- Create: `services/billing-service/app/jobs/monthly_reset.py`
- Modify: `services/billing-service/app/services/credits.py`
- Create: `services/billing-service/tests/unit/test_monthly_reset_job.py`

**Dependencies:** Task 5

- [ ] **Step 1: Write failing unit tests for due-workspace resets**

```python
async def test_run_monthly_reset_updates_only_due_workspaces(db_session):
    ...

async def test_monthly_reset_preserves_topup_credits(db_session):
    ...
```

- [ ] **Step 2: Verify RED**

```bash
cd services/billing-service
pytest tests/unit/test_monthly_reset_job.py -v
```

Expected RED: job module or due-workspace helper missing.

- [ ] **Step 3: Extend `credits.py` with a batch-safe query/helper**
  - list due workspaces by `credits_reset_at <= now()`
  - call existing `allocate()` logic per workspace
  - keep the logic idempotent for reruns

- [ ] **Step 4: Add job module**

```python
# app/jobs/monthly_reset.py
async def run() -> dict[str, int]:
    ...

if __name__ == "__main__":
    import asyncio
    asyncio.run(run())
```

  - follow the small script/job style already used elsewhere in the repo
  - keep it non-HTTP in this slice

- [ ] **Step 5: Verify GREEN**

```bash
cd services/billing-service
pytest tests/unit/test_monthly_reset_job.py -v
python -m app.jobs.monthly_reset
```

- [ ] **Step 6: Commit**

```bash
git add services/billing-service/app/jobs services/billing-service/app/services/credits.py services/billing-service/tests/unit/test_monthly_reset_job.py
git commit -m "feat(billing): add monthly credit reset job"
```

**Acceptance:**
- [ ] Due workspaces reset correctly
- [ ] Non-due workspaces are untouched
- [ ] `topup_credits` are preserved
- [ ] Job entrypoint exists for scheduler wiring

---

## Task 7: Final router wiring, regression coverage, and docs alignment

**Files:**
- Modify: `services/billing-service/app/main.py`
- Modify: `services/billing-service/tests/integration/test_billing_routers.py`
- Modify: `services/billing-service/app/services/feature_gates.py`
- Modify: `docs/DATABASE_SCHEMA.md`

**Dependencies:** Task 6

- [ ] **Step 1: Write failing regression assertions for the full HTTP surface**
  - existing credit endpoints still work
  - new checkout, subscription, and webhook routers are mounted
  - feature-gate behavior still passes after seed-source changes

- [ ] **Step 2: Verify RED**

```bash
cd services/billing-service
pytest tests/integration/test_billing_routers.py -v
```

- [ ] **Step 3: Do the final router wiring**
  - include `checkout.router`
  - include `subscriptions.router`
  - include `webhooks.router`
  - keep current `/v1/billing/*` routes unchanged where possible

- [ ] **Step 4: Reduce `feature_gates.seed_gates()` to non-authoritative helper status**
  - keep tests/local repair support if still useful
  - remove any assumption that startup must call it

- [ ] **Step 5: Update `docs/DATABASE_SCHEMA.md`**
  - align billing-service owned tables with actual implementation
  - align plan-value note if needed (`starter` vs `business` inconsistency)

- [ ] **Step 6: Verify GREEN**

```bash
cd services/billing-service
pytest tests/unit -v
pytest tests/integration/test_billing_routers.py -v
```

- [ ] **Step 7: Commit**

```bash
git add services/billing-service/app/main.py services/billing-service/app/services/feature_gates.py services/billing-service/tests/integration/test_billing_routers.py docs/DATABASE_SCHEMA.md
git commit -m "chore(billing): wire routers and align billing docs"
```

**Acceptance:**
- [ ] All new routers are mounted
- [ ] Existing credit endpoints still pass unchanged
- [ ] Docs match actual billing-service ownership and schema

---

## Verification

Run the verification loop after all seven tasks are GREEN.

```bash
cd services/billing-service
pytest -v --cov=app --cov-report=term-missing
mypy app/
ruff check app/
alembic downgrade base
alembic upgrade head
python -m app.jobs.monthly_reset
```

### Final checks
- [ ] Coverage includes `credits.py`, `checkout_service.py`, `subscription_service.py`, and `paddle_webhook_service.py`
- [ ] Duplicate webhook delivery is proven idempotent by test
- [ ] A top-up webhook writes one ledger row and one balance mutation only
- [ ] Seeded feature gates exist after a fresh migration
- [ ] Existing credit deduction/refund/history endpoints still pass

---

## Rollout notes

- [ ] Apply billing-service migration in staging
- [ ] Set Paddle secrets/config in staging environment
- [ ] Smoke test plan checkout, top-up checkout, and one signed webhook replay in staging
- [ ] Wire Cloud Scheduler / Cloud Run Job to invoke `python -m app.jobs.monthly_reset`
- [ ] Re-run [docs/audit/IMPLEMENTATION_AUDIT.md](../audit/IMPLEMENTATION_AUDIT.md) and update Group 1 billing backend status
