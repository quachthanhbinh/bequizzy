# Spec 06 — Sequence Builder & Execution: TASKS

## TDD Task List

> **Rule:** Every task starts with a failing test (RED). No implementation code before the test fails for the right reason.

---

### Task 1 — Migration: sequences, sequence_steps, sequence_enrollments, sequence_step_executions

**RED first:** Import models and assert all 4 tables exist — fails because migration hasn't run.

**File:** `alembic/versions/0006_sequences.py`

```python
def upgrade():
    op.create_table('sequences', ...)
    op.create_table('sequence_steps', ...)
    op.create_table('sequence_enrollments', ...)
    # partial unique index for active enrollment idempotency:
    op.create_index('idx_enrollments_active', 'sequence_enrollments',
        ['workspace_id', 'sequence_id', 'lead_id'],
        unique=True,
        postgresql_where="status = 'active'")
    op.create_table('sequence_step_executions', ...)
```

**Done when:** `alembic upgrade head` + `downgrade -1` both succeed.

---

### Task 2 — SQLAlchemy Models (all 4 tables)

**RED first:** Test `Sequence(workspace_id=None)` raises IntegrityError.

**File:** `services/campaign-service/app/models/sequence.py`

**Done when:** All 4 models import; column constraints verified in unit tests.

---

### Task 3 — Sequence CRUD Service

**RED first:** Test `create_sequence(db, workspace_id, data)` — fails because function missing.

**File:** `services/campaign-service/app/services/sequence_service.py`

```python
async def create_sequence(db: AsyncSession, workspace_id: UUID, data: SequenceCreate) -> Sequence:
    seq = Sequence(workspace_id=workspace_id, **data.model_dump())
    db.add(seq)
    await db.flush()
    await emit_outbox_event(db, "sequence.created", {...})
    await db.commit()
    return seq
```

**Done when:** CRUD unit tests pass.

---

### Task 4 — Enrollment Create with Idempotency Guard

**RED first:** Test U06-01 — fails because duplicate active enrollment isn't blocked.

**File:** `services/campaign-service/app/services/sequence_service.py`

```python
async def enroll_lead(db, workspace_id, sequence_id, lead_id) -> SequenceEnrollment:
    try:
        enrollment = SequenceEnrollment(...)
        db.add(enrollment)
        await db.flush()
    except IntegrityError:
        raise AppError("ALREADY_ENROLLED", "Lead is already enrolled in this sequence", 409)
    # Schedule first step via Cloud Tasks
    await enqueue_step(enrollment.id, sequence_id, first_step_id, delay=0)
    await db.commit()
    return enrollment
```

**Done when:** Test U06-01 passes.

---

### Task 5 — Suppression Check Client

**RED first:** Test that `suppression_client.is_suppressed(lead_id, workspace_id)` raises when outreach-service returns 503.

**File:** `services/sequence-worker/app/services/suppression_client.py`

```python
class SuppressionClient:
    async def is_suppressed(self, lead_id: str, workspace_id: str) -> bool:
        resp = await self._get(f"/suppression/check?lead_id={lead_id}&workspace_id={workspace_id}")
        return resp.json()["is_suppressed"]
```

**Done when:** Unit test for suppressed lead passes.

---

### Task 6 — Core Execution Engine (suppression-first)

**RED first:** Test U06-02 — verify suppressed lead gets enrollment set to 'unsubscribed' and step NOT executed. Must fail first (without suppression check in handler).

**File:** `services/sequence-worker/app/services/execution_engine.py`

```python
async def execute_step(
    enrollment: SequenceEnrollment,
    step: SequenceStep,
    suppression_client: SuppressionClient,
    outreach_client: OutreachClient,
    db: AsyncSession,
) -> StepExecutionResult:
    # FIRST: suppression check — non-negotiable
    if await suppression_client.is_suppressed(str(enrollment.lead_id), str(enrollment.workspace_id)):
        enrollment.status = "unsubscribed"
        enrollment.unsubscribed_at = datetime.utcnow()
        await db.commit()
        return StepExecutionResult(enrollment=enrollment, step_executed=False)

    # Execute by step type
    handler = STEP_HANDLERS[step.step_type]
    await handler(enrollment, step, outreach_client, db)
    ...
```

**Done when:** Tests U06-02 and I06-02 (suppression integration) pass.

---

### Task 7 — Daily Send Cap (Redis)

**RED first:** Test U06-03 — 6th call to `check_daily_send_cap(redis, "seq", cap=5)` returns False. Fails because function doesn't exist.

**File:** `services/sequence-worker/app/utils/daily_cap.py`

**Done when:** Test U06-03 passes; I06-05 (parallel worker cap) passes.

---

### Task 8 — Step Handlers (email, wait, condition, ab_split stubs)

**RED first:** Test that email step handler calls `outreach_client.send_email()`. Fails because handler is missing.

**Files:**
- `services/sequence-worker/app/handlers/email_step.py`
- `services/sequence-worker/app/handlers/wait_step.py`
- `services/sequence-worker/app/handlers/condition_step.py`
- `services/sequence-worker/app/handlers/ab_split_step.py`

**Done when:** Tests U06-04, U06-05 pass; stub handlers for linkedin/sms return "not_implemented".

---

### Task 9 — Cloud Tasks Enqueue + Worker HTTP Target

**RED first:** Test that `enqueue_step(enrollment_id, step_id, delay=0)` creates a Cloud Tasks task with correct payload.

**Files:**
- `services/campaign-service/app/services/task_scheduler.py`
- `services/sequence-worker/app/main.py` (route: `POST /tasks/execute-step`)

**Done when:** Integration test I06-01 (full enrollment → completion) passes.

---

### Task 10 — Unsubscribe Fan-out (Pub/Sub consumer)

**RED first:** Test I06-03 — publish `lead.unsubscribed` event → assert both enrollments become 'unsubscribed'. Fails because Pub/Sub handler missing.

**File:** `services/sequence-worker/app/pubsub/unsubscribe_handler.py`

```python
async def handle_lead_unsubscribed(message: PubSubMessage, db: AsyncSession):
    data = json.loads(message.data)
    await db.execute(
        update(SequenceEnrollment)
        .where(
            SequenceEnrollment.lead_id == data["lead_id"],
            SequenceEnrollment.workspace_id == data["workspace_id"],
            SequenceEnrollment.status == "active",
        )
        .values(status="unsubscribed", unsubscribed_at=datetime.utcnow())
    )
    await db.commit()
```

**Done when:** Test I06-03 passes.

---

### Task 11 — Cross-Workspace Isolation Test

**RED first:** Write test I06-04 — confirm it FAILS initially (returns 200 instead of 404 without workspace scoping).

**File:** `services/campaign-service/tests/integration/test_cross_workspace_sequence.py`

**Done when:** Test I06-04 passes.

---

### Task 12 — Frontend Sequence Builder Canvas

**RED first:** Vitest test for `SequenceCanvas` — fails because component doesn't exist.

**Files:**
- `frontend/components/sequences/SequenceCanvas.tsx`
- `frontend/components/sequences/StepBlock.tsx`
- `frontend/components/sequences/StepConfigPanel.tsx`

**Done when:** Component renders; drag-and-drop reorder works; E2E-06-01 passes.

---

## Completion Checklist

- [ ] Migration: upgrade + downgrade succeed
- [ ] Suppression check is FIRST operation in execute_step (code reviewed)
- [ ] Test I06-02 passes (suppression prevents step execution)
- [ ] Test I06-03 passes (unsubscribe propagates to all enrollments)
- [ ] Test I06-04 passes (cross-workspace isolation)
- [ ] Test I06-05 passes (daily send cap enforced)
- [ ] DLQ monitoring configured for unsubscribe fan-out
- [ ] sequence-worker deployed to GKE Autopilot
- [ ] `mypy app/` passes for campaign-service and sequence-worker
- [ ] `npx tsc --noEmit` passes for frontend
