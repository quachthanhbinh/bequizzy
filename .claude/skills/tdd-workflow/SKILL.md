---
name: tdd-workflow
description: "Use when implementing features, fixing bugs, refactoring code, writing tests, or increasing coverage. Enforces strict Red-Green-Refactor TDD cycle for RevLooper Python services and Next.js apps with mandatory Verify-RED step."
---

# Test-Driven Development Workflow

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
```

Wrote code before the test? Delete it. Start over. No exceptions.

## When to Use

**Always** for: new features, endpoints, bug fixes, refactoring, behavior changes.

**Exceptions (ask user first):** throwaway prototypes, generated code (Alembic autogenerate), pure config files.

## Pre-Implementation Context Anchor (MANDATORY)

Before writing ANY test or code:

1. **Read the real models** — open the SQLAlchemy model and use exact column names
2. **Read the Pydantic schemas** — match exact field names and types
3. **Read an existing similar test** — match fixture / mock / async-client pattern exactly
4. **Read target file if modifying** — understand existing functions before adding
5. **Check workspace_id pattern** — confirm how the service injects `get_workspace_id()`

This prevents writing tests against imagined APIs.

## Red-Green-Refactor Cycle

```
RED → Verify RED → GREEN → Verify GREEN → REFACTOR → Verify GREEN → REPEAT
```

### 1. RED — Write Failing Test

Write ONE minimal test describing expected behavior.

```python
# Python (pytest + pytest-asyncio)
@pytest.mark.asyncio
async def test_create_lead_blocks_suppressed_email(db_session, seed_suppression):
    seed_suppression(workspace_id="ws-1", email="blocked@acme.com")

    with pytest.raises(AppError) as exc:
        await lead_service.create(db_session, workspace_id="ws-1",
                                  data=LeadCreate(email="blocked@acme.com"))

    assert exc.value.code == "LEAD_SUPPRESSED"
```

```typescript
// TypeScript (Vitest + Testing Library)
describe('LeadList', () => {
  it('navigates to lead detail on row click', async () => {
    const push = vi.fn()
    render(<LeadList leads={[mockLead]} />, { wrapper: routerWrapper(push) })
    await userEvent.click(screen.getByText(mockLead.email))
    expect(push).toHaveBeenCalledWith(`/leads/${mockLead.id}`)
  })
})
```

**Rules:** one behavior per test, descriptive name, test the public API, mock only external services (HTTP/LLM/Pub/Sub/Stripe).

### 2. Verify RED — Watch It Fail (MANDATORY)

```bash
# Python
cd services/{service-name}
pytest tests/services/test_lead_service.py::test_create_lead_blocks_suppressed_email -v

# TypeScript
cd frontend
npx vitest run components/features/leads/LeadList.test.tsx
```

Confirm:
- Test **fails** (does not error from syntax/import)
- Failure message matches the missing behavior
- If it errors instead of fails: fix infrastructure first, then re-verify

### 3. GREEN — Minimal Code

Simplest code to pass the test. Nothing more.

### 4. Verify GREEN — Watch It Pass (MANDATORY)

```bash
pytest -v   # all tests in the service
npx vitest run
```

All tests must pass. No warnings.

### 5. REFACTOR — Clean Up

Only after GREEN. Keep tests green.

### 6. Git Checkpoint

```bash
git commit -m "test(lead): add failing test for suppression on create"  # after RED
git commit -m "feat(lead): block create when email is suppressed"        # after GREEN
git commit -m "refactor(lead): extract suppression-check helper"         # after REFACTOR (optional)
```

### 7. Edge Case Discovery Loop

After each GREEN, inspect for behaviors not tested:
- Empty / nil / zero inputs
- Boundary values
- Dependency error mid-way (Supabase, ai-service, Pub/Sub)
- Concurrency on workspace updates
- Missing `workspace_id`
- Outbox event written but transaction rolled back
- Idempotency on duplicate Pub/Sub delivery

Each gap → new failing test → new Red-Green cycle. **One at a time.** Do not batch.

### 8. Iteration Guard

```
if iteration == 10:
  STOP and surface to user:
  - Passing: [list]
  - Still failing: [list]
  - Suspected blocker
  - Recommended next action
```

## RevLooper-Specific Patterns

### Mock external HTTP / LLM / Pub/Sub — never another service's DB

```python
async def test_ai_draft_deducts_credits(monkeypatch):
    deducted = []
    async def fake_deduct(workspace_id, amount, reason):
        deducted.append((workspace_id, amount, reason))
        return {"balance": 99}
    monkeypatch.setattr(billing_client, "deduct_credits", fake_deduct)

    await draft_service.generate(workspace_id="ws-1", lead_id="lead-1")
    assert deducted == [("ws-1", 1, "ai_email_draft")]
```

### Always assert workspace scope in DB tests

```python
async def test_get_lead_does_not_cross_workspace(db_session, seed_lead):
    seed_lead(workspace_id="ws-A", email="a@x.com", id="lead-1")
    seed_lead(workspace_id="ws-B", email="b@x.com", id="lead-1")  # same id

    result = await lead_service.get(db_session, workspace_id="ws-A", lead_id="lead-1")
    assert result.email == "a@x.com"
```

### Always test outbox event emission

```python
async def test_create_lead_emits_outbox_event(db_session):
    await lead_service.create(db_session, workspace_id="ws-1",
                              data=LeadCreate(email="x@y.z"))
    rows = (await db_session.execute(
        select(OutboxEvent).where(OutboxEvent.workspace_id == "ws-1")
    )).scalars().all()
    assert any(e.event_type == "lead.created" for e in rows)
```

### Webhook signature validation tests

```python
def test_webhook_rejects_invalid_signature(client):
    response = client.post("/webhooks/paddle",
                           json={"event": "subscription.created"},
                           headers={"Paddle-Signature": "invalid"})
    assert response.status_code == 401
```

## Coverage Gates

| Layer | Target |
|---|---|
| billing-service, outreach-service | 90% |
| ai-service, lead-service, campaign-service | 85% |
| Other services | 80% |
| Frontend | 70% |
| Critical paths (suppression, credit deduct, JWT validate, signature verify) | 100% |

## Done Definition

- All RED-GREEN cycles complete
- Edge cases addressed
- Coverage gates met
- `verification-loop` skill ran clean
- Self-reviewed against `code-reviewer` agent's BLOCKER list
