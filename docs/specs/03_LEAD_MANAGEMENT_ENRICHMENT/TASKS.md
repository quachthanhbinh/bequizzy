# 03 — Lead Management & Enrichment — TASKS

**Status:** 📝 Draft
**Task count:** 12
**Pattern:** Red → Green → Refactor (TDD).
**Last updated:** 2026-05-04

## Tasks

### T-01 · Alembic migration — leads, activities, tags, enrichment_jobs
**Files:**
- `alembic/versions/2026_05_05_003_create_leads_enrichment_tables.py`

**Done when:** `upgrade head` + `downgrade -1` clean; all indexes + RLS created.

---

### T-02 · Lead model + CRUD service layer
**RED first:** `tests/unit/test_lead_service.py`

**Files:**
- `services/lead-service/tests/unit/test_lead_service.py`
- `services/lead-service/app/models/lead.py`
- `services/lead-service/app/services/lead_service.py`

**Stub:**
```python
class LeadService:
    async def create_lead(self, workspace_id: UUID, data: LeadCreate) -> Lead: ...
    async def update_lead(self, workspace_id: UUID, lead_id: UUID, data: LeadUpdate) -> Lead: ...
    async def soft_delete_lead(self, workspace_id: UUID, lead_id: UUID) -> None: ...
    async def get_lead(self, workspace_id: UUID, lead_id: UUID) -> Lead: ...
    async def list_leads(self, workspace_id: UUID, filters: LeadFilters) -> LeadPage: ...
    async def check_free_plan_limit(self, workspace_id: UUID) -> None: ...  # SELECT FOR UPDATE
```
**Done when:** Free plan limit race condition test passes; duplicate email returns 409.

---

### T-03 · Lead list — FTS search + filters + cursor pagination
**RED first:** `tests/integration/test_lead_list.py`

**Files:**
- `services/lead-service/tests/integration/test_lead_list.py`
- `services/lead-service/app/services/lead_query_service.py`

**Key tests:** search "acme" returns correct leads; cursor pagination no duplicates; filter by status + enrichment_status.

**Done when:** All query tests green; p99 < 1s for 10k-lead workspace in staging.

---

### T-04 · Activity timeline write + read
**Files:**
- `services/lead-service/app/services/activity_service.py`
- `services/lead-service/tests/unit/test_activity_service.py`

**Done when:** Activities written on lead create, status change, enrichment; read in DESC order.

---

### T-05 · CSV import pipeline (upload → validate → map → batch insert → error CSV)
**RED first:** `tests/integration/test_csv_import.py`

**Files:**
- `services/lead-service/tests/integration/test_csv_import.py`
- `services/lead-service/app/services/csv_import_service.py`
- `services/lead-service/app/tasks/csv_import_task.py`

**Key tests:** 1k rows < 30s; malicious file rejected; 30% bad rows → error CSV URL returned.

**Done when:** Performance gate passes in CI; security file validation tests green.

---

### T-06 · Dedup engine (exact email match within workspace)
**RED first:** `tests/unit/test_dedup_engine.py`

**Files:**
- `services/lead-service/tests/unit/test_dedup_engine.py`
- `services/lead-service/app/services/dedup_service.py`

**Done when:** Same email + same workspace = duplicate; same email + different workspace = not duplicate; concurrent imports don't exceed free plan limit.

---

### T-07 · Hunter.io client (email verify)
**RED first:** `tests/unit/test_hunter_client.py` (mock HTTP)

**Files:**
- `services/lead-service/tests/unit/test_hunter_client.py`
- `services/lead-service/app/clients/hunter_client.py`

**Stub:**
```python
class HunterClient:
    async def verify_email(self, email: str) -> HunterResult:
        """Returns status: 'valid'|'invalid'|'risky'|'unknown'"""
```
**Done when:** Verified → lead status = 'verified'; invalid → 'invalid'; API key never logged.

---

### T-08 · Apollo.io client (enrich) + credit gate
**RED first:** `tests/unit/test_apollo_client.py` + `tests/integration/test_apollo_credit_gate.py`

**Files:**
- `services/lead-service/tests/unit/test_apollo_client.py`
- `services/lead-service/tests/integration/test_apollo_credit_gate.py`
- `services/lead-service/app/clients/apollo_client.py`

**Key test:** billing-service called BEFORE Apollo API call; 0 credits → 402; credits refunded on Apollo failure.

**Done when:** Credit gate integration test proves order of operations.

---

### T-09 · Bulk operations API (tag, delete, export)
**RED first:** `tests/integration/test_bulk_ops.py`

**Files:**
- `services/lead-service/tests/integration/test_bulk_ops.py`
- `services/lead-service/app/api/v1/bulk.py`

**Key tests:** Bulk delete without `confirm_delete: true` → 422; bulk delete creates audit log; viewer cannot export.

**Done when:** All bulk op tests green; soft-delete verified (deleted_at set, not hard-deleted).

---

### T-10 · Lead CRUD API router + Pydantic schemas
**Files:**
- `services/lead-service/app/api/v1/leads.py`
- `services/lead-service/app/schemas/lead.py`

**Done when:** All endpoints wired; response envelope `{ data, error, meta }` consistent.

---

### T-11 · Frontend — lead list + detail + import modal + bulk toolbar
**Files:**
- `frontend/app/(dashboard)/leads/page.tsx`
- `frontend/app/(dashboard)/leads/[id]/page.tsx`
- `frontend/components/leads/ImportCsvModal.tsx`
- `frontend/components/leads/BulkActionToolbar.tsx`
- `frontend/components/leads/EnrichmentStatusBadge.tsx`

**Done when:** All 12 E2E scenarios from TESTS.md pass.

---

### T-12 · Outbox events + monitoring alerts
**Files:**
- `services/lead-service/app/services/outbox_service.py`
- `infra/monitoring/lead-enrichment-alerts.yaml`

**Done when:** `lead.created`, `lead.status.changed`, `lead.enrichment.completed`, `lead.bulk.imported` outbox events verified in integration tests; 4 alert policies created.

## Completion Checklist
- [ ] Migrations clean
- [ ] lead-service coverage ≥ 90%
- [ ] Free plan limit race condition test GREEN (concurrent imports)
- [ ] CSV 1k rows < 30s performance gate GREEN
- [ ] Apollo credits deducted BEFORE API call (integration test)
- [ ] `[SECURITY]` cross-workspace test GREEN
- [ ] All 12 E2E scenarios green
- [ ] Hunter/Apollo API keys never appear in logs (tested)
