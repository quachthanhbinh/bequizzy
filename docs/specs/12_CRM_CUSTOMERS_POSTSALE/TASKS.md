# Spec 12 — CRM, Customers & Post-sale: TASKS

## TDD Task List

### Task 1 — Migration: deal_stages, deals, deal_activities, customers
**RED first:** Import models fails.
**File:** `alembic/versions/0012_crm.py`
**Done when:** Upgrade + downgrade succeed; default stages seeded.

### Task 2 — SQLAlchemy Models
**RED first:** Model import fails.
**Files:** `services/crm-service/app/models/deal.py`, `customer.py`
**Done when:** Models import; constraints verified.

### Task 3 — Stage Transition Validation
**RED first:** Tests U12-01, U12-02 fail.
**File:** `services/crm-service/app/services/deal_service.py`
**Done when:** Valid transitions accepted; invalid → 422 raised.

### Task 4 — Booking.Confirmed Consumer → Deal Creation
**RED first:** Test I12-01 fails.
**File:** `services/crm-service/app/consumers/booking_consumer.py`
**Done when:** I12-01 passes; idempotent on duplicate booking_id.

### Task 5 — Won Stage → Customer Conversion
**RED first:** Test I12-02 fails.
**File:** `services/crm-service/app/services/deal_service.py`
**Done when:** I12-02 passes; UNIQUE on deal_id prevents duplicate customers.

### Task 6 — Health Score Computation
**RED first:** Tests U12-03, U12-04 fail.
**Files:** `services/scoring-worker/app/jobs/customer_health.py`
**Done when:** Score correctly weighted; at-risk < 40, churned < 20.

### Task 7 — Deal CRUD API
**RED first:** GET /deals returns 404.
**File:** `services/crm-service/app/routers/deals.py`
**Done when:** CRUD endpoints work; workspace_id scoped.

### Task 8 — Cross-Workspace Isolation Test
**RED first:** Test I12-03 fails.
**Done when:** I12-03 passes.

### Task 9 — Frontend Kanban Board
**RED first:** Vitest test fails.
**Files:** `frontend/app/(dashboard)/crm/page.tsx`, `KanbanBoard.tsx`
**Done when:** Kanban renders deal cards per stage; drag-drop updates via PATCH.

## Completion Checklist
- [ ] Booking → deal idempotency verified
- [ ] Won → customer idempotency verified
- [ ] Invalid stage transitions rejected with 422
- [ ] Health score tested with weighted signals
- [ ] Cross-workspace isolation test passes
- [ ] `mypy app/` passes; coverage ≥ 80%
