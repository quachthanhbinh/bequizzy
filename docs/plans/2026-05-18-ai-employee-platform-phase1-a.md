# AI Employee Platform — Phase 1 Plan A (Tasks 1–9)

**Spec:** docs/specs/40_AI_EMPLOYEE_PLATFORM/
**Goal:** Scaffold `ai-employee-service`, create all DB tables, SQLAlchemy models, repositories, and the first five core services (workspace-settings, rental, model-swap, SOP, spend-cap).
**Architecture:** New Cloud Run microservice `ai-employee-service`. 10 new tables in shared Supabase DB. Communicates with `billing-service` (credit reserve/settle) and `ai-service` (graph run). All routes scoped by `X-Workspace-ID` header (set by api-gateway).
**Services touched:** `ai-employee-service` (new), `billing-service` (Phase 0 amendment), `ai-service` (Phase 0 amendment)
**Execution:** Use TDD Agent — task-by-task. Each task = RED → Verify-RED → GREEN → Verify-GREEN → Commit.

> **Phase 0 note:** Tasks P0-1 through P0-4 (Spec 37 + Spec 32 amendments) are prerequisites. This plan includes stubs/clients for those services so Tasks 1-9 can be developed independently and integration-tested once P0 lands.

---

## Phase 0 — Prerequisite Amendments

### P0-A: billing-service — ai_models + paddle_line_items + reserve/settle

**Files:**
- Modify: `services/billing-service/app/models/billing.py` (add AIModel, PaddleLineItem, CreditReservation)
- Create: `services/billing-service/app/api/v1/ai_models.py`
- Create: `services/billing-service/app/api/v1/credits_reserve.py`
- Modify: `services/billing-service/app/main.py` (include new routers)
- Modify: `services/billing-service/tests/conftest.py` (register new models)

**Tables to add:**
```sql
ai_models (id, slug, provider, display_name, input_rate_per_1k_usd, output_rate_per_1k_usd, capabilities[], is_active, min_plan, created_at, updated_at)
paddle_line_items (id, workspace_id, paddle_subscription_id, paddle_item_id, catalog_id, monthly_price_usd, status, created_at, updated_at)
credit_reservations (id, workspace_id, idempotency_key, credits_reserved, status[reserved/settled/released], model_id, input_rate_per_1k_usd, output_rate_per_1k_usd, margin_pct, created_at, settled_at)
```

**Seed ai_models:** gpt-4o-mini ($0.000150/$0.000600), gpt-4o ($0.002500/$0.010000), claude-3-5-sonnet ($0.003000/$0.015000), gemini-1.5-flash ($0.000075/$0.000300).

**New endpoints:**
- `GET /v1/ai-models` — list active models
- `GET /v1/ai-models/{id}` — single model with rates
- `POST /v1/internal/credits/reserve` — `{workspace_id, idempotency_key, estimated_input_tokens, estimated_output_tokens, model_id}` → reserve credits, return `reservation_id`
- `POST /v1/internal/credits/settle` — `{idempotency_key, actual_input_tokens, actual_output_tokens, tool_cost_usd}` → reconcile reservation to actual usage
- `POST /v1/internal/credits/release` — `{idempotency_key}` — full release (pre-side-effect failure)
- `POST /v1/internal/paddle/line-items` — create prepaid subscription line item

- [ ] **Step 1: Write failing tests** for ai_models list endpoint and credit reservation cycle
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Add models + migrations + endpoints**
- [ ] **Step 4: Seed ai_models in Alembic migration**
- [ ] **Step 5: Verify GREEN**
- [ ] **Step 6: Commit** `feat(billing): add ai_models, paddle_line_items, credit reserve/settle`

### P0-B: ai-service — graph_registry + /internal/graph/run

**Files:**
- Modify: `services/ai-service/app/models/brain.py` (add GraphRegistry model)
- Create: `services/ai-service/app/api/v1/internal/graph_run.py`
- Modify: `services/ai-service/app/main.py` (include graph_run router)

**Table:**
```sql
graph_registry (id, slug, module_path, description, is_active, created_at)
```

**Endpoint:**
- `POST /v1/internal/graph/run` — `{graph_slug, workspace_id, run_id, inputs, model_id}` → dispatches LangGraph invocation, returns `{trace_id, status: "dispatched"}`

- [ ] **Step 1: Write failing test** for `POST /v1/internal/graph/run` with valid slug
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Add model + endpoint + stub graph executor**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-service): add graph_registry and /internal/graph/run endpoint`

---

## Task 1: Alembic Migration — 10 Platform Tables

**Files:**
- Create: `alembic/versions/2026_05_18_001_create_ai_employee_platform_tables.py`
- Create: `tests/migrations/test_001_roundtrip.py` (in root alembic test folder)

**Tables (DDL from DESIGN.md):**
1. `ai_employee_catalog`
2. `ai_employee_rentals` (+ 2 indexes including unique partial)
3. `ai_employee_sops`
4. `ai_employee_tools`
5. `ai_employee_runs` (+ 2 indexes)
6. `ai_employee_tool_invocations`
7. `ai_employee_approval_requests`
8. `ai_employee_memory`
9. `ai_employee_run_feedback`
10. `ai_employee_workspace_settings`

**RLS policies** — same pattern as every other service (workspace_id scoped).

- [ ] **Step 1: Write roundtrip test** (upgrade → schema present → downgrade → schema absent)

```python
# tests/migrations/test_001_roundtrip.py
def test_upgrade_creates_tables(migrated_engine):
    with migrated_engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'ai_employee_%'"))
        tables = {r[0] for r in result}
    assert "ai_employee_catalog" in tables
    assert "ai_employee_rentals" in tables
    assert "ai_employee_workspace_settings" in tables
```

- [ ] **Step 2: Verify RED** (migration doesn't exist yet)
- [ ] **Step 3: Write migration** (full DDL per DESIGN.md §Data Model)
- [ ] **Step 4: Verify GREEN** (`alembic upgrade head && alembic downgrade -1`)
- [ ] **Step 5: Commit** `feat(db): Spec 40 Phase 1 — create ai_employee platform tables`

---

## Task 2: SQLAlchemy Models (all 10 tables)

**Files:**
- Create: `services/ai-employee-service/app/models/__init__.py`
- Create: `services/ai-employee-service/app/models/catalog.py` (AIEmployeeCatalog, AIEmployeeTool)
- Create: `services/ai-employee-service/app/models/rental.py` (AIEmployeeRental)
- Create: `services/ai-employee-service/app/models/sop.py` (AIEmployeeSop)
- Create: `services/ai-employee-service/app/models/run.py` (AIEmployeeRun, AIEmployeeToolInvocation, AIEmployeeRunFeedback)
- Create: `services/ai-employee-service/app/models/approval.py` (AIEmployeeApprovalRequest)
- Create: `services/ai-employee-service/app/models/memory.py` (AIEmployeeMemory)
- Create: `services/ai-employee-service/app/models/workspace_settings.py` (AIEmployeeWorkspaceSettings)
- Create: `services/ai-employee-service/app/models/outbox.py` (AIEmployeeOutboxEvent)
- Create: `services/ai-employee-service/tests/unit/models/test_models_roundtrip.py`

**Pattern** (from `services/lead-service/app/models/lead.py`):
```python
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Index, Integer, Text, TIMESTAMP, Numeric, ARRAY
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
```

- [ ] **Step 1: Write model roundtrip test** (instantiate each model, check field names)

```python
# tests/unit/models/test_models_roundtrip.py
def test_rental_model_fields():
    r = AIEmployeeRental(
        workspace_id=uuid.uuid4(),
        catalog_id=uuid.uuid4(),
        rented_by_user_id=uuid.uuid4(),
        model_id=uuid.uuid4(),
        daily_spend_cap_usd=Decimal("50.00"),
        monthly_spend_cap_usd=Decimal("1000.00"),
        per_run_credit_ceiling=200,
    )
    assert r.status == "active"
    assert r.config == {}
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Write all 10 model files** (exact field names from DESIGN.md DDL)
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): SQLAlchemy ORM models for 10 platform tables`

---

## Task 3: Repositories (CRUD per table)

**Files:**
- Create: `services/ai-employee-service/app/repositories/catalog_repo.py`
- Create: `services/ai-employee-service/app/repositories/rental_repo.py`
- Create: `services/ai-employee-service/app/repositories/sop_repo.py`
- Create: `services/ai-employee-service/app/repositories/run_repo.py`
- Create: `services/ai-employee-service/app/repositories/approval_repo.py`
- Create: `services/ai-employee-service/app/repositories/tool_repo.py`
- Create: `services/ai-employee-service/app/repositories/memory_repo.py`
- Create: `services/ai-employee-service/app/repositories/feedback_repo.py`
- Create: `services/ai-employee-service/app/repositories/workspace_settings_repo.py`
- Create: `services/ai-employee-service/tests/unit/repositories/test_rental_repo.py`
- Create: `services/ai-employee-service/tests/unit/repositories/test_catalog_repo.py`

**Pattern:** Each repo takes `db: AsyncSession`, uses `select()`, all queries include `workspace_id` (or catalog has system-only reads).

```python
class RentalRepo:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, workspace_id: uuid.UUID, rental_id: uuid.UUID) -> AIEmployeeRental | None:
        result = await self._db.execute(
            select(AIEmployeeRental).where(
                AIEmployeeRental.id == rental_id,
                AIEmployeeRental.workspace_id == workspace_id,
            )
        )
        return result.scalar_one_or_none()
```

- [ ] **Step 1: Write failing test** for `RentalRepo.get_by_id` (missing → None; existing → row; cross-workspace → None)
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Write all repo files**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): repositories for all platform tables`

---

## Task 4: WorkspaceSettingsService + GET/PUT /workspace-settings

**Files:**
- Create: `services/ai-employee-service/app/services/workspace_settings_service.py`
- Create: `services/ai-employee-service/app/api/v1/workspace_settings.py`
- Create: `services/ai-employee-service/tests/unit/services/test_workspace_settings_service.py`

**Business rules:**
- Template must be 1–280 chars (enforced at service layer, not just DB CHECK)
- Returns default `[Posted by AI on behalf of {workspace_name}]` if row doesn't exist (upsert on PUT)
- Interpolation helper: `render_disclosure(template: str, workspace_name: str, agent_name: str) -> str`

- [ ] **Step 1: Write failing tests**

```python
async def test_put_disclosure_template_validates_empty(db_session):
    svc = WorkspaceSettingsService(db_session)
    with pytest.raises(AppError) as exc:
        await svc.put(workspace_id=uuid.uuid4(), template="")
    assert exc.value.code == "DISCLOSURE_TEMPLATE_REQUIRED"

async def test_put_disclosure_template_validates_too_long(db_session):
    svc = WorkspaceSettingsService(db_session)
    with pytest.raises(AppError) as exc:
        await svc.put(workspace_id=uuid.uuid4(), template="x" * 281)
    assert exc.value.code == "DISCLOSURE_TEMPLATE_TOO_LONG"

async def test_render_disclosure_interpolates_workspace_name(db_session):
    svc = WorkspaceSettingsService(db_session)
    rendered = svc.render_disclosure(
        "[Posted by AI on behalf of {workspace_name}]",
        workspace_name="Acme Corp", agent_name="Content Writer"
    )
    assert rendered == "[Posted by AI on behalf of Acme Corp]"

async def test_get_returns_default_if_no_row(db_session):
    svc = WorkspaceSettingsService(db_session)
    settings = await svc.get(workspace_id=uuid.uuid4())
    assert "{workspace_name}" in settings.ai_disclosure_template
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement service + router**

```python
# app/api/v1/workspace_settings.py
router = APIRouter(prefix="/employees/workspace-settings", tags=["ai-employee-settings"])

@router.get("")
async def get_workspace_settings(workspace_id: ...) -> WorkspaceSettingsOut: ...

@router.put("")
async def put_workspace_settings(workspace_id: ..., body: PutWorkspaceSettingsRequest) -> WorkspaceSettingsOut: ...
```

- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): WorkspaceSettingsService + disclosure template API`

---

## Task 5: RentalService + POST /rent + model validation + Paddle line-item

**Files:**
- Create: `services/ai-employee-service/app/services/rental_service.py`
- Create: `services/ai-employee-service/app/api/v1/rentals.py`
- Create: `services/ai-employee-service/app/clients/billing_client.py`
- Create: `services/ai-employee-service/tests/unit/services/test_rental_service.py`
- Create: `services/ai-employee-service/tests/integration/test_rent_to_paddle.py`

**Business rules (from AC-2):**
1. Validate `model_id ∈ catalog.allowed_model_ids` → `MODEL_NOT_ALLOWED` (422)
2. Validate model is active → `MODEL_INACTIVE` (422)
3. Validate model has all capabilities required by catalog tools → `MODEL_NOT_ALLOWED` (422)
4. If `publish_public` tool exists and workspace `ai_disclosure_template` is blank → `DISCLOSURE_TEMPLATE_REQUIRED` (422)
5. Validate workspace plan ≥ `catalog.min_plan` (Pro+) → `PLAN_GATE_REQUIRED` (402)
6. One-active-rental-per-catalog-per-workspace enforced by unique partial index → 409 on duplicate
7. Compute `per_run_credit_ceiling` from `ceil(catalog.default_per_run_cost_ceiling_usd × model.input_rate_per_1k_usd × 1000 × 1.30 / credit_unit_price_usd)` (approximate; using input rate as proxy)
8. Call `billing_client.create_paddle_line_item(...)` → if no payment method → return 402 + checkout URL
9. Create rental row + emit `ai.employee.rented` to outbox (atomic)

- [ ] **Step 1: Write failing unit tests** (mock billing client, mock catalog repo):

```python
async def test_rent_rejects_model_not_in_allowed_list(db_session, seed_catalog, seed_model):
    catalog = seed_catalog(allowed_model_ids=[seed_model.id])
    svc = RentalService(db_session, billing_client=MockBillingClient())
    with pytest.raises(AppError) as exc:
        await svc.rent(workspace_id=WS, catalog_id=catalog.id, model_id=uuid.uuid4(), plan="pro")
    assert exc.value.code == "MODEL_NOT_ALLOWED"

async def test_rent_requires_disclosure_template_for_publish_public_agent(db_session, seed_catalog_with_publish_tool, seed_model):
    ...

async def test_rent_creates_rental_and_outbox_event(db_session, seed_catalog, seed_model, mock_billing):
    svc = RentalService(db_session, billing_client=mock_billing)
    rental = await svc.rent(workspace_id=WS, catalog_id=seed_catalog.id, model_id=seed_model.id, plan="pro")
    assert rental.status == "active"
    # verify outbox event
    events = await db_session.execute(select(AIEmployeeOutboxEvent).where(...))
    assert events.scalar_one().event_type == "ai.employee.rented"
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement `RentalService.rent()` + billing client + router**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): RentalService + POST /rent with model validation`

---

## Task 6: PATCH /rentals/{id}/model — model swap

**Files:**
- Modify: `services/ai-employee-service/app/services/rental_service.py` (add `swap_model()`)
- Modify: `services/ai-employee-service/app/api/v1/rentals.py` (add `PATCH /{id}/model`)
- Create: `services/ai-employee-service/tests/integration/test_model_switch.py`

**Business rules (from AC-3a):**
1. Validate new `model_id ∈ catalog.allowed_model_ids` → `MODEL_NOT_ALLOWED`
2. New model must be active → `MODEL_INACTIVE`
3. Recompute `per_run_credit_ceiling` from new model's rates
4. Takes effect on next dispatched run (update rental row immediately)
5. Emit `ai.employee.model_changed` to outbox

- [ ] **Step 1: Write failing tests**

```python
async def test_model_swap_recomputes_credit_ceiling(db_session, seed_rental, seed_model_cheap, seed_model_expensive):
    svc = RentalService(db_session, billing_client=MockBillingClient())
    old_ceiling = seed_rental.per_run_credit_ceiling
    updated = await svc.swap_model(workspace_id=WS, rental_id=seed_rental.id, new_model_id=seed_model_expensive.id)
    assert updated.per_run_credit_ceiling > old_ceiling
    assert updated.model_id == seed_model_expensive.id

async def test_model_swap_emits_outbox_event(db_session, seed_rental, seed_model):
    ...
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement `swap_model()` + PATCH endpoint**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): model swap API with ceiling recompute`

---

## Task 7: SopService + SOP CRUD API

**Files:**
- Create: `services/ai-employee-service/app/services/sop_service.py`
- Create: `services/ai-employee-service/app/api/v1/sops.py`
- Create: `services/ai-employee-service/tests/unit/services/test_sop_service.py`
- Create: `services/ai-employee-service/tests/security/test_sop_prompt_injection.py`

**Business rules (from AC-4, AC-5, AC-6):**
1. Body max 20 KB → `SOP_TOO_LARGE` (422)
2. Escape any `</sop>` in the body to `&lt;/sop&gt;` before storage (prompt injection)
3. On `PATCH` (update): create a new row with incremented `version`; set old row `is_active=false`
4. SOP injection format: `<sop version="N">\n{body}\n</sop>`
5. `is_global=true` → `rental_id=None` (workspace-level SOP); `is_global=false` → requires `rental_id`

- [ ] **Step 1: Write failing tests**

```python
async def test_create_sop_rejects_oversized_body(db_session, seed_rental):
    svc = SopService(db_session)
    with pytest.raises(AppError) as exc:
        await svc.create(workspace_id=WS, rental_id=seed_rental.id, title="T", body="x" * 20481)
    assert exc.value.code == "SOP_TOO_LARGE"

async def test_create_sop_escapes_closing_tag(db_session, seed_rental):
    svc = SopService(db_session)
    sop = await svc.create(workspace_id=WS, rental_id=seed_rental.id, title="T", body="</sop>foo")
    assert "&lt;/sop&gt;" in sop.body_markdown

async def test_update_sop_increments_version(db_session, seed_sop):
    svc = SopService(db_session)
    v2 = await svc.update(workspace_id=WS, sop_id=seed_sop.id, body="new body")
    assert v2.version == 2
    # old row is inactive
    result = await db_session.get(AIEmployeeSop, seed_sop.id)
    assert result.is_active == False

async def test_sop_injection_format_wraps_body(db_session, seed_sop):
    svc = SopService(db_session)
    injected = svc.format_for_injection(seed_sop)
    assert injected.startswith(f'<sop version="{seed_sop.version}">')
    assert injected.endswith("</sop>")
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement `SopService` + router**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): SopService with versioning and prompt-injection escaping`

---

## Task 8: SpendCapService

**Files:**
- Create: `services/ai-employee-service/app/services/spend_cap_service.py`
- Create: `services/ai-employee-service/tests/unit/services/test_spend_cap_service.py`
- Create: `services/ai-employee-service/tests/integration/test_spend_cap_race.py`

**Business rules (from AC-11, AC-14a):**
1. Before dispatching a run: check `sum(tool_invocations.cost_usd) + estimated_cost` ≤ `rental.daily_spend_cap_usd` AND `monthly_spend_cap_usd`
2. If cap would be exceeded: emit `ai.employee.spend_cap_hit`, pause rental, raise `SPEND_CAP_EXCEEDED` (409)
3. Per-run ceiling: if `credits_reserved > rental.per_run_credit_ceiling` → `PER_RUN_CEILING_EXCEEDED` (409), abort before side effects
4. Daily spend = `sum(cost_usd) WHERE rental_id=X AND DATE(created_at)=today`
5. Monthly spend = `sum(cost_usd) WHERE rental_id=X AND created_at >= start_of_month`

- [ ] **Step 1: Write failing tests**

```python
async def test_check_daily_cap_raises_when_exceeded(db_session, seed_rental_with_cap, seed_tool_invocations_near_cap):
    svc = SpendCapService(db_session)
    with pytest.raises(AppError) as exc:
        await svc.check_before_run(workspace_id=WS, rental_id=seed_rental_with_cap.id, estimated_cost_usd=Decimal("1.00"))
    assert exc.value.code == "SPEND_CAP_EXCEEDED"

async def test_check_per_run_ceiling(db_session, seed_rental):
    svc = SpendCapService(db_session)
    # Ceiling is 100 credits, trying to reserve 101
    with pytest.raises(AppError) as exc:
        await svc.check_per_run_ceiling(rental=seed_rental, credits_to_reserve=101)
    assert exc.value.code == "PER_RUN_CEILING_EXCEEDED"
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement `SpendCapService`**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): SpendCapService with daily/monthly/per-run cap enforcement`

---

## Task 9: RunService — dispatch + reserve/settle credits + lifecycle

**Files:**
- Create: `services/ai-employee-service/app/services/run_service.py`
- Create: `services/ai-employee-service/app/services/billing_split_service.py`
- Create: `services/ai-employee-service/app/api/v1/runs.py`
- Create: `services/ai-employee-service/app/clients/ai_service_client.py`
- Create: `services/ai-employee-service/tests/unit/services/test_run_service.py`
- Create: `services/ai-employee-service/tests/unit/services/test_billing_split.py`
- Create: `services/ai-employee-service/tests/integration/test_rent_to_run_flow.py`

**Business rules (from AC-15a, AC-17):**
1. Check rental is `active` or `paused` (not `cancelling`/`cancelled`) → `RENTAL_NOT_ACTIVE` (409)
2. Check plan gate via workspace-service → `PLAN_GATE_REQUIRED` (402)
3. Check runaway-loop guard: ≥50 runs/hour OR ≥3 consecutive failures → `RUNAWAY_LOOP_DETECTED` (429)
4. Call `SpendCapService.check_before_run()`
5. Call `billing_client.reserve(idempotency_key=run_id, ...)` → `INSUFFICIENT_CREDITS` (402) on failure
6. Create `ai_employee_runs` row (`status=pending`)
7. Dispatch via Cloud Tasks to `ai-service /v1/internal/graph/run`
8. On completion: call `billing_client.settle(idempotency_key=run_id+":settle", ...)`
9. If run fails BEFORE any external side effect: call `billing_client.release(idempotency_key=run_id+":release")`
10. Emit `ai.employee.run.completed` to outbox

- [ ] **Step 1: Write failing unit tests**

```python
async def test_dispatch_run_checks_rental_active_status(db_session, seed_cancelled_rental):
    svc = RunService(db_session, billing_client=MockBillingClient(), ai_client=MockAIClient())
    with pytest.raises(AppError) as exc:
        await svc.dispatch(workspace_id=WS, rental_id=seed_cancelled_rental.id)
    assert exc.value.code == "RENTAL_NOT_ACTIVE"

async def test_dispatch_run_reserves_credits_before_dispatch(db_session, seed_active_rental, mock_billing):
    svc = RunService(db_session, billing_client=mock_billing, ai_client=MockAIClient())
    await svc.dispatch(workspace_id=WS, rental_id=seed_active_rental.id, inputs={})
    assert mock_billing.reserve_called_with_idempotency_key is not None

async def test_settle_reconciles_to_actual_usage(db_session, seed_run, mock_billing):
    svc = RunService(db_session, billing_client=mock_billing, ai_client=MockAIClient())
    await svc.settle(run_id=seed_run.id, actual_input_tokens=100, actual_output_tokens=50, tool_cost_usd=Decimal("0"))
    assert mock_billing.settle_called
    run = await db_session.get(AIEmployeeRun, seed_run.id)
    assert run.status == "succeeded"
    assert run.credits_settled > 0
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement `RunService` + `BillingSplitService` + router**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): RunService with credit reserve/settle lifecycle`

---

## Service Scaffold (prerequisite for all tasks above)

**Files to create before Task 1:**
- `services/ai-employee-service/pyproject.toml`
- `services/ai-employee-service/Dockerfile`
- `services/ai-employee-service/.dockerignore`
- `services/ai-employee-service/app/__init__.py`
- `services/ai-employee-service/app/main.py`
- `services/ai-employee-service/app/core/__init__.py`
- `services/ai-employee-service/app/core/database.py` (copy + rename from lead-service)
- `services/ai-employee-service/app/core/errors.py` (copy from lead-service)
- `services/ai-employee-service/app/core/tracing.py` (copy from lead-service)
- `services/ai-employee-service/app/core/sentry.py` (copy from lead-service)
- `services/ai-employee-service/app/dependencies/__init__.py`
- `services/ai-employee-service/app/dependencies/auth.py` (copy from lead-service)
- `services/ai-employee-service/app/api/__init__.py`
- `services/ai-employee-service/app/api/v1/__init__.py`
- `services/ai-employee-service/tests/__init__.py`
- `services/ai-employee-service/tests/conftest.py`
- `services/ai-employee-service/tests/unit/__init__.py`
- `services/ai-employee-service/tests/unit/models/__init__.py`
- `services/ai-employee-service/tests/unit/services/__init__.py`
- `services/ai-employee-service/tests/unit/repositories/__init__.py`
- `services/ai-employee-service/tests/integration/__init__.py`
- `services/ai-employee-service/tests/security/__init__.py`

**`pyproject.toml`** (same deps as lead-service):
```toml
[project]
name = "revlooper-ai-employee-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.29",
    "alembic>=1.13",
    "pydantic>=2.7",
    "pydantic-settings>=2.3",
    "httpx>=0.27",
    "python-multipart>=0.0.9",
    "opentelemetry-sdk>=1.24",
    "opentelemetry-instrumentation-fastapi>=0.45b0",
    "opentelemetry-instrumentation-sqlalchemy>=0.45b0",
    "opentelemetry-exporter-otlp-proto-grpc>=1.24",
    "sentry-sdk[fastapi]>=2.0",
    "structlog>=24.1",
]

[project.optional-dependencies]
dev = [
    "pytest>=8",
    "pytest-asyncio>=0.24",
    "httpx>=0.27",
    "anyio>=4",
    "asyncpg>=0.29",
    "psycopg2-binary>=2.9",
    "cryptography>=42",
    "respx>=0.22",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.setuptools.packages.find]
include = ["app*"]

[tool.mypy]
strict = true
```

---

## Verification (end of Plan A)

After all 9 tasks complete:

```bash
cd services/ai-employee-service
pytest -v --cov=app --cov-report=term-missing
mypy app/
```

- [ ] All tests green
- [ ] Coverage ≥ 85% per service per TESTS.md
- [ ] mypy strict clean
- [ ] `alembic upgrade head && alembic downgrade -1` (roundtrip) green
