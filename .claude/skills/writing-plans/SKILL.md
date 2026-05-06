---
name: writing-plans
description: "Use when you have an approved spec and need to create a detailed implementation plan before writing code. Breaks work into bite-sized TDD tasks with exact file paths and complete code stubs."
---

# Writing Implementation Plans

## Overview

Write comprehensive plans assuming the implementer has zero codebase context. Document everything: which files to touch, complete code, how to test, exact commands. DRY. YAGNI. TDD. Frequent commits.

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Scope Check

If the spec covers multiple independent subsystems, break into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## Mandatory Context Reading

Before writing any plan:
1. **Read the approved spec** in `docs/specs/`
2. **Find an existing similar handler/service** in the target service — use it as the structural template
3. **Read related models** — actual SQLAlchemy struct definitions
4. **Read `DATABASE_SCHEMA.md`** — verify table/column names exactly
5. **Read at least one existing test** — match the test pattern exactly
6. **Read service ownership map** — confirm which service owns each new table

This prevents the plan from inventing field names or patterns.

## File Structure Mapping

Before defining tasks, map out which files will be created or modified.

**Backend (Python service):**
```
services/{service-name}/
  app/
    models/{resource}.py                      ← NEW or MODIFY
    schemas/{resource}.py                     ← NEW
    services/{resource}_service.py            ← NEW
    api/v1/{resource}_router.py               ← NEW
    events/publishers.py                      ← MODIFY (add new event)
  tests/
    services/test_{resource}_service.py       ← NEW
    api/test_{resource}_router.py             ← NEW
alembic/versions/YYYY_NNN_<action>_<table>.py ← NEW
```

**Frontend (Next.js):**
```
frontend/
  app/(dashboard)/{feature}/page.tsx          ← NEW or MODIFY
  components/features/{domain}/{Component}.tsx ← NEW
  components/features/{domain}/{Component}.test.tsx ← NEW
  lib/api/{domain}.ts                         ← MODIFY (add typed client fn)
  hooks/use-{feature}.ts                      ← NEW
```

## Task Granularity

**Each step is one action (2–5 minutes):**
- "Write the failing test" — step
- "Run it to confirm it fails" — step
- "Implement minimal code" — step
- "Run tests and confirm GREEN" — step
- "Commit" — step

## Plan Document Header

```markdown
# [Feature Name] Implementation Plan

**Spec:** docs/specs/YYYY-MM-DD-<feature-name>.md
**Goal:** [one sentence]
**Architecture:** [2–3 sentences]
**Services touched:** [list]
**Execution:** Use TDD Agent for task-by-task implementation

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `services/lead-service/app/services/lead_dedup_service.py`
- Create: `services/lead-service/tests/services/test_lead_dedup_service.py`
- Modify: `services/lead-service/app/api/v1/lead_router.py` (add endpoint)

**Dependencies:** Task N-1 (if any)

- [ ] **Step 1: Write failing test**

```python
@pytest.mark.asyncio
async def test_dedup_merges_lead_into_canonical(db_session, seed_lead):
    canonical = seed_lead(workspace_id="ws-1", email="a@x.com")
    duplicate = seed_lead(workspace_id="ws-1", email="A@x.com")

    result = await dedup_service.merge(db_session, workspace_id="ws-1",
                                        canonical_id=canonical.id,
                                        duplicate_id=duplicate.id)

    assert result.id == canonical.id
    assert (await db_session.get(Lead, duplicate.id)) is None
```

- [ ] **Step 2: Run test, verify RED**

```bash
cd services/lead-service
pytest tests/services/test_lead_dedup_service.py::test_dedup_merges_lead_into_canonical -v
```
Expected: `FAIL — module 'app.services.lead_dedup_service' not found`

- [ ] **Step 3: Write minimal implementation**

```python
# services/lead-service/app/services/lead_dedup_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.lead import Lead
from app.core.exceptions import AppError

async def merge(db: AsyncSession, *, workspace_id: str,
                canonical_id: str, duplicate_id: str) -> Lead:
    canonical = await db.get(Lead, canonical_id)
    duplicate = await db.get(Lead, duplicate_id)
    if not canonical or canonical.workspace_id != workspace_id:
        raise AppError("LEAD_NOT_FOUND", "Canonical lead not found", 404)
    if not duplicate or duplicate.workspace_id != workspace_id:
        raise AppError("LEAD_NOT_FOUND", "Duplicate lead not found", 404)
    await db.delete(duplicate)
    return canonical
```

- [ ] **Step 4: Run test, verify GREEN**

```bash
pytest tests/services/test_lead_dedup_service.py -v
```

- [ ] **Step 5: Add edge case test (cross-workspace block)**

```python
@pytest.mark.asyncio
async def test_dedup_rejects_cross_workspace_merge(db_session, seed_lead):
    a = seed_lead(workspace_id="ws-A", email="x@y.z")
    b = seed_lead(workspace_id="ws-B", email="x@y.z")

    with pytest.raises(AppError) as exc:
        await dedup_service.merge(db_session, workspace_id="ws-A",
                                   canonical_id=a.id, duplicate_id=b.id)
    assert exc.value.code == "LEAD_NOT_FOUND"
```

- [ ] **Step 6: Commit**

```bash
git add services/lead-service/app/services/lead_dedup_service.py \
        services/lead-service/tests/services/test_lead_dedup_service.py
git commit -m "feat(lead): add dedup merge service with workspace scope"
```

**Acceptance:**
- [ ] All tests in this task pass
- [ ] Coverage on `lead_dedup_service.py` ≥ 85%
- [ ] No cross-workspace merge possible
- [ ] No raw SQL — uses ORM only
````

## Plan Footer

```markdown
---

## Verification

After all tasks complete, run the `verification-loop` skill:

```bash
cd services/{service-name}
pytest -v --cov=app --cov-report=term-missing
mypy app/
ruff check app/
```

## Rollout
- [ ] Feature flag added (if applicable)
- [ ] Alembic migration applied to staging
- [ ] Smoke test on staging
- [ ] Update `docs/CHANGELOG.md`
- [ ] Update `docs/DATABASE_SCHEMA.md` if tables added
```

## Quality Checks Before Sharing the Plan

- [ ] No placeholder code (no `pass` or `TODO`)
- [ ] Every task has Test → Verify-RED → Code → Verify-GREEN → Commit
- [ ] File paths are real and correctly scoped to the owning service
- [ ] Task dependencies are explicit
- [ ] Total tasks ≤ 15 (else split into multiple plans)
- [ ] Acceptance criteria match the spec exactly
