# Check Workspace Scope

Audit a file or service for missing `workspace_id` scoping in database queries.

## Usage

```
/check-workspace-scope path=<file-or-directory>
```

## Instructions

Search `$ARGUMENTS.path` for all SQLAlchemy query patterns and verify each is scoped by `workspace_id`.

### What to look for

1. **Missing workspace_id in SELECT queries**
```python
# ❌ BLOCKER — no workspace_id scope
select(Lead).where(Lead.id == lead_id)

# ✅ CORRECT
select(Lead).where(Lead.id == lead_id, Lead.workspace_id == workspace_id)
```

2. **Missing workspace_id in UPDATE/DELETE**
```python
# ❌ BLOCKER
update(Lead).where(Lead.id == lead_id).values(status="archived")

# ✅ CORRECT
update(Lead).where(Lead.id == lead_id, Lead.workspace_id == workspace_id).values(status="archived")
```

3. **Service functions that don't accept workspace_id parameter**
```python
# ❌ BLOCKER — workspace_id not passed to service
async def get_lead(db: AsyncSession, lead_id: str) -> Lead:
    ...

# ✅ CORRECT
async def get_lead(db: AsyncSession, workspace_id: str, lead_id: str) -> Lead:
    ...
```

4. **Router endpoints that don't use `get_workspace_id()` dependency**
```python
# ❌ BLOCKER
@router.get("/{lead_id}")
async def get_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    ...

# ✅ CORRECT
@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    workspace_id: str = Depends(get_workspace_id),
):
    ...
```

### Output format

List each finding as:
- **BLOCKER** or **WARNING**
- File path + line number
- The problematic code snippet
- The corrected version

If no issues found, output: "✅ All queries in `$ARGUMENTS.path` are properly scoped by workspace_id."
