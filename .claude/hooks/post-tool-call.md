# Post-Tool-Call Hook

After a Write or Edit tool succeeds on a file under `services/` or `frontend/`, surface the appropriate verification command to run **before declaring the task done**. This is a reminder, not an automatic execution.

## Trigger Matrix

### Python service file changed (`services/{name}/app/**/*.py`)

Remind:
```
✅ File written: {path}
Run before commit:
  cd services/{service-name}
  ruff check app/ && mypy app/ && pytest -q
Coverage gate for this service: {threshold}% (see verification-loop skill)
```

### Pydantic schema or SQLAlchemy model changed (`services/{name}/app/{models,schemas}/**`)

Add:
```
🔧 Schema/model changed.
- If DB schema: generate Alembic migration
    alembic revision --autogenerate -m "<change>"
- Roundtrip-test the migration:
    alembic upgrade head && alembic downgrade -1 && alembic upgrade head
- Run dependent service tests for any service that consumes shared event payloads
```

### FastAPI router changed (`services/{name}/app/api/**/*.py`)

Add:
```
🔒 Route changed. Confirm:
- workspace_id: str = Depends(get_workspace_id) is present (unless intentionally public)
- Pydantic request/response schemas typed
- AppError(code, message, status_code) raised for domain errors (no raw HTTPException leaking)
- OpenAPI summary + description added
```

### Outbound message code changed (`services/outreach-service/**` or `notification-service/**`)

Add:
```
🚫 Outbound code changed. Confirm:
- Suppression list checked BEFORE dispatch
- Consent log check for SEA workspaces (VN/TH/SG)
- Rate limiter applied
- Idempotency key on retried operations
```

### AI service code changed (`services/ai-service/**`)

Add:
```
🧠 AI code changed. Confirm:
- billing_service.deduct_credits() called BEFORE the LLM call
- Token budget enforced (max_tokens set)
- Eval harness updated if behavior changed (see edd-workflow skill)
- Run: pytest tests/evals/ -q --maxfail=1
```

### Webhook handler changed (`services/webhook-handler/**`)

Add:
```
📥 Webhook code changed. Confirm:
- Signature validation BEFORE any business logic
- Timing-safe comparison (hmac.compare_digest, not ==)
- Idempotency on event_id (replay safe)
- Returns 2xx fast; heavy work goes to Pub/Sub
```

### Frontend file changed (`frontend/**/*.{ts,tsx}`)

Remind:
```
✅ File written: {path}
Run before commit:
  cd frontend
  npx tsc --noEmit && npm run lint && npx vitest run
Mobile-first check: works at 375px viewport? Touch targets ≥ 44×44px?
```

### New shadcn/ui component or page added

Add:
```
🎨 UI surface added. Confirm:
- Loading / empty / error states implemented
- Uses tokens from design-system/globals.css (no hardcoded colors)
- Accessibility: keyboard nav, focus ring, aria labels
- Light + dark mode tested
```

### `docs/specs/` or `docs/plans/` file changed

Remind:
```
📝 Spec/plan touched. Confirm:
- Status field updated (Draft / In Review / Approved)
- If approved spec changed materially: bump version + changelog row
- Linked from docs/specs/README.md if new
```

## Cross-Cutting Reminders (always)

After ANY edit, if the change touches behavior:
```
Before declaring done, run the verification-loop skill (10-step checklist).
For shipped features, also: code-review (/code-review) and security-audit (/security-audit) on changed files.
```
