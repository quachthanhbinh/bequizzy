# Spec 07 — Email Outreach & Deliverability: TASKS

## TDD Task List

---

### Task 1 — Migration: mailboxes, email_sends (partitioned), email_events, suppression_list

**RED first:** Import models, assert tables exist → fails because migration hasn't run.

**File:** `alembic/versions/0007_email_outreach.py`

```python
def upgrade():
    op.create_table('mailboxes', ...)
    # email_sends: declarative partitioning by sent_at month
    op.execute("""
        CREATE TABLE email_sends (...) PARTITION BY RANGE (sent_at);
        CREATE TABLE email_sends_2025_01 PARTITION OF email_sends
          FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
    """)
    op.create_table('email_events', ...)
    op.create_unique_index('idx_email_events_esp_id', 'email_events', ['esp_event_id'])
    op.create_table('suppression_list', ...)
    op.create_unique_index('idx_suppression_email', 'suppression_list', ['workspace_id', 'email'])
```

**Done when:** Upgrade + downgrade succeed.

---

### Task 2 — SQLAlchemy Models (all 4 tables)

**RED first:** Test `Mailbox(workspace_id=None)` raises.

**File:** `services/outreach-service/app/models/mailbox.py` (and others)

**Done when:** All models import; column assertions pass.

---

### Task 3 — ESP Adapter Interface + SendGrid Adapter

**RED first:** Test `SendGridAdapter.send_email(message)` calls SendGrid API — fails because adapter missing.

**File:** `services/outreach-service/app/adapters/sendgrid_adapter.py`

**Done when:** Integration test I07-01 passes (mock SendGrid).

---

### Task 4 — Suppression Service (check + add)

**RED first:** Test U07-01 — suppressed email blocks send. Fails because `SuppressedError` not raised.

**File:** `services/outreach-service/app/services/suppression_service.py`

```python
async def check_suppressed(db, workspace_id, email) -> bool:
    result = await db.execute(
        select(SuppressionList).where(
            SuppressionList.workspace_id == workspace_id,
            SuppressionList.email == email.lower()
        )
    )
    return result.scalar_one_or_none() is not None

async def add_suppression(db, workspace_id, email, reason): ...
```

**Done when:** Tests U07-01, U07-02, U07-03 pass.

---

### Task 5 — Email Send Service (suppression-first)

**RED first:** Test that calling `send_email()` for a suppressed email raises `SuppressedError` BEFORE adapter is called.

**File:** `services/outreach-service/app/services/email_service.py`

```python
async def send_email(db, redis, workspace_id, mailbox_id, to, subject, body, ...) -> EmailSend:
    # 1. Suppression check — FIRST
    if await suppression_service.check_suppressed(db, workspace_id, to):
        raise SuppressedError(email=to)
    # 2. Daily send cap
    if not await check_daily_send_cap(redis, mailbox_id, mailbox.daily_send_limit):
        raise DailySendLimitError()
    # 3. Route to ESP adapter
    ...
```

**Done when:** Tests U07-01, U07-05 pass.

---

### Task 6 — Webhook Processing (bounce/complaint → suppression)

**RED first:** Test U07-02 (bounce → suppression). Fails because handler missing.

**File:** `services/outreach-service/app/services/webhook_service.py`

**Done when:** Tests U07-02, U07-03, U07-04 (idempotency) pass.

---

### Task 7 — Webhook Signature Validation

**RED first:** Test I07-04 — invalid signature returns 403. Fails without validation.

**File:** `services/outreach-service/app/routers/webhooks.py`

**Done when:** Test I07-04 passes; valid signature test passes.

---

### Task 8 — Health Score Computation

**RED first:** Test U07-06 — `compute_health_score(bounce_rate=0.08)` returns < 50.

**File:** `services/outreach-service/app/services/health_score_service.py`

**Done when:** Tests U07-06, I07-03 pass.

---

### Task 9 — Warmup Effective Limit

**RED first:** Test U07-07 — warmup day 3 gives effective limit = 10.

**File:** `services/outreach-service/app/utils/warmup.py`

**Done when:** Test U07-07 passes.

---

### Task 10 — Integration Test: Bounce → Enrollment Stop

**RED first:** Write test I07-02 — confirm enrollment NOT stopped initially. Verify with suppression + Pub/Sub fan-out.

**File:** `services/outreach-service/tests/integration/test_bounce_flow.py`

**Done when:** Test I07-02 passes end-to-end.

---

### Task 11 — Frontend Mailbox Settings Page

**RED first:** Vitest test for `MailboxCard` — fails because component missing.

**Files:**
- `frontend/app/(dashboard)/settings/mailboxes/page.tsx`
- `frontend/components/email/MailboxCard.tsx`
- `frontend/components/email/HealthScoreGauge.tsx`

**Done when:** Component tests pass; E2E-07-01 passes.

---

## Completion Checklist

- [ ] Migration: upgrade + downgrade succeed
- [ ] Suppression check is FIRST in send_email() (code reviewed)
- [ ] Test U07-01 passes (suppressed email blocked)
- [ ] Test I07-02 passes (bounce → suppression → enrollment stop)
- [ ] Test I07-04 passes (invalid webhook rejected)
- [ ] Credentials in Secret Manager only — no plaintext in DB
- [ ] Idempotent webhook processing verified (U07-04)
- [ ] Health score refresh Cloud Scheduler job configured
- [ ] `mypy app/` passes
- [ ] `npx tsc --noEmit` passes
