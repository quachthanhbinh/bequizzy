# Spec 08 — Meeting Booking: TASKS

## TDD Task List

---

### Task 1 — Migration: cal_connections, meeting_types, bookings

**RED first:** Import models, assert tables exist → fails because migration hasn't run.

**File:** `alembic/versions/0008_bookings.py`

```python
def upgrade():
    op.create_table('cal_connections', ...)
    op.create_table('meeting_types', ...)
    op.create_unique_index('idx_meeting_types_slug', 'meeting_types', ['workspace_id', 'slug'])
    op.create_table('bookings', ...)
    op.create_unique_index('idx_bookings_cal_id', 'bookings', ['cal_booking_id'])
    op.create_index('idx_bookings_scheduled', 'bookings', ['scheduled_at'],
        postgresql_where="status = 'confirmed'")
```

**Done when:** Upgrade + downgrade succeed.

---

### Task 2 — SQLAlchemy Models

**RED first:** Test `Booking(cal_booking_id=None)` raises IntegrityError.

**File:** `services/booking-service/app/models/booking.py`

**Done when:** All models import; column assertions pass.

---

### Task 3 — HMAC Webhook Validator

**RED first:** Test U08-05 — invalid signature raises `InvalidSignatureError`. Fails because validator missing.

**File:** `services/booking-service/app/utils/hmac_validator.py`

```python
import hmac, hashlib

def validate_cal_signature(payload: bytes, signature: str, secret: bytes) -> None:
    expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise InvalidSignatureError("Invalid Cal.com webhook signature")
```

**Done when:** Test U08-05 passes; test I08-03 (invalid signature → 403) passes.

---

### Task 4 — Booking Service (create, cancel, reschedule)

**RED first:** Test U08-01 — duplicate cal_booking_id returns is_duplicate=True. Fails because service missing.

**File:** `services/booking-service/app/services/booking_service.py`

```python
async def create_booking(db, workspace_id, payload) -> tuple[Booking, bool]:
    try:
        booking = Booking(workspace_id=workspace_id, **payload)
        db.add(booking)
        await db.flush()
        await db.commit()
        return booking, False  # (booking, is_duplicate)
    except IntegrityError:
        await db.rollback()
        existing = await get_booking_by_cal_id(db, workspace_id, payload["cal_booking_id"])
        return existing, True
```

**Done when:** Tests U08-01, U08-03 pass.

---

### Task 5 — Round-Robin Assignment

**RED first:** Test U08-02 — cycles through 3 hosts in order. Fails because function missing.

**File:** `services/booking-service/app/services/round_robin.py`

**Done when:** Test U08-02 passes.

---

### Task 6 — Webhook Endpoint + Full Booking Flow

**RED first:** Test I08-01 — POST `/webhooks/cal` with valid HMAC creates booking and sends notification. Fails because endpoint missing.

**File:** `services/booking-service/app/routers/webhooks.py`

```python
@router.post("/webhooks/cal")
async def cal_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    sig = request.headers.get("cal-signature", "")
    secret = await secret_manager.get(f"cal_webhook_secret_{workspace_id}")
    validate_cal_signature(body, sig, secret.encode())  # raises 403 if invalid
    ...
```

**Done when:** Tests I08-01, I08-02, I08-03 pass.

---

### Task 7 — Reminder Scheduler

**RED first:** Test I08-05 — reminder sent for booking in 24h window; flag set. Fails because handler missing.

**File:** `services/booking-service/app/services/reminder_service.py`

**Done when:** Tests U08-04, I08-05 pass.

---

### Task 8 — Cross-Workspace Isolation Test

**RED first:** Write test I08-04 — returns 200 initially (wrong). Verify 404 after workspace scoping.

**File:** `services/booking-service/tests/integration/test_cross_workspace.py`

**Done when:** Test I08-04 passes.

---

### Task 9 — Frontend Meeting Types + Bookings Pages

**RED first:** Vitest test for `MeetingTypeCard` — fails because component missing.

**Files:**
- `frontend/app/(dashboard)/settings/calendar/page.tsx`
- `frontend/components/booking/MeetingTypeCard.tsx`
- `frontend/components/booking/BookingTable.tsx`

**Done when:** Component tests pass; E2E-08-01 passes.

---

## Completion Checklist

- [ ] Migration: upgrade + downgrade succeed
- [ ] HMAC validation: invalid signature rejected (test I08-03)
- [ ] Idempotent webhook processing (test I08-02)
- [ ] Cross-workspace isolation (test I08-04)
- [ ] Round-robin cycles correctly (test U08-02)
- [ ] Reminders sent with idempotency flags (test I08-05)
- [ ] Cal.com OAuth tokens in Secret Manager only
- [ ] `mypy app/` passes
- [ ] `npx tsc --noEmit` passes
