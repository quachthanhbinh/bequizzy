# Spec 08 — Meeting Booking: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (booking-service) | ≥ 80% | pytest + pytest-asyncio |
| Integration | All critical paths + webhook/idempotency | pytest + testcontainers |
| E2E | Connect Cal.com → booking flow | Playwright |

---

## Unit Tests

### U08-01: Booking Creation — Idempotent on Duplicate cal_booking_id
```python
async def test_booking_idempotent(db):
    payload = {"cal_booking_id": "cal_abc", "workspace_id": W, ...}
    await create_booking(db, payload)
    result = await create_booking(db, payload)  # duplicate
    assert result.is_duplicate is True
    count = await count_bookings_by_cal_id(db, "cal_abc")
    assert count == 1
```

### U08-02: Round-Robin Host Assignment — Cycles Through Hosts
```python
async def test_round_robin_cycles(redis):
    hosts = ["user_1", "user_2", "user_3"]
    meeting_type_id = "mt_123"
    results = [
        await assign_round_robin_host(redis, meeting_type_id, hosts)
        for _ in range(6)
    ]
    assert results == ["user_1", "user_2", "user_3", "user_1", "user_2", "user_3"]
```

### U08-03: Booking Status Transition — Confirmed → Cancelled
```python
async def test_booking_cancellation(db):
    booking = await create_confirmed_booking(db)
    await cancel_booking(db, booking.id, workspace_id=booking.workspace_id)
    updated = await get_booking(db, booking.id)
    assert updated.status == "cancelled"
    assert updated.cancelled_at is not None
```

### U08-04: Reminder Flags Prevent Double-Send
```python
async def test_reminder_flags_prevent_double_send(db, mock_notification):
    booking = await create_booking(db, reminder_24h_sent=True)
    await send_reminders_for_window(db, "24h")
    mock_notification.send.assert_not_called()
```

### U08-05: Webhook HMAC Validation
```python
def test_hmac_validation_rejects_invalid_signature():
    valid_payload = b'{"uid":"cal_abc"}'
    secret = b"test_secret"
    bad_sig = "invalid"
    with pytest.raises(InvalidSignatureError):
        validate_cal_signature(valid_payload, bad_sig, secret)
```

---

## Integration Tests

### I08-01: Full Webhook → Booking Created → Notification Sent
```python
async def test_booking_webhook_full_flow(client, db, mock_notification):
    payload = {
        "triggerEvent": "BOOKING_CREATED",
        "payload": {
            "uid": "cal_001",
            "eventTypeId": "et_123",
            "attendee": {"email": "lead@company.com", "name": "John"},
            "startTime": "2025-03-01T10:00:00Z",
        }
    }
    sig = compute_cal_hmac(json.dumps(payload).encode(), secret=TEST_CAL_SECRET)
    resp = await client.post("/webhooks/cal",
        json=payload,
        headers={"cal-signature": sig})
    assert resp.status_code == 200
    booking = await get_booking_by_cal_id(db, "cal_001")
    assert booking.status == "confirmed"
    mock_notification.send.assert_called()
```

### I08-02: Duplicate Webhook — Idempotent (Returns 200, No Duplicate Booking)
```python
async def test_duplicate_webhook_idempotent(client, db, mock_notification):
    # Send same webhook twice
    await send_booking_webhook(client, cal_booking_id="cal_dup_001")
    await send_booking_webhook(client, cal_booking_id="cal_dup_001")
    count = await count_bookings_by_cal_id(db, "cal_dup_001")
    assert count == 1
    assert mock_notification.send.call_count == 1  # only sent once
```

### I08-03: Invalid Webhook Signature → 403
```python
async def test_invalid_webhook_rejected(client):
    resp = await client.post("/webhooks/cal",
        json={"triggerEvent": "BOOKING_CREATED", "payload": {...}},
        headers={"cal-signature": "bad_sig"})
    assert resp.status_code == 403
```

### I08-04: Cross-Workspace Booking Isolation
```python
async def test_cross_workspace_booking_isolation(client, workspace_a, workspace_b):
    booking_a = await create_booking(workspace_a)
    resp = await client.get(f"/bookings/{booking_a.id}",
        headers={"X-Workspace-ID": str(workspace_b.id)})
    assert resp.status_code == 404
```

### I08-05: Reminder Scheduler — Sends 24h Reminder
```python
async def test_reminder_scheduler_sends_24h(db, mock_notification):
    booking = await create_booking(db,
        scheduled_at=datetime.utcnow() + timedelta(hours=24),
        reminder_24h_sent=False)
    await send_reminders_for_window(db, "24h")
    mock_notification.send.assert_called_once()
    booking = await get_booking(db, booking.id)
    assert booking.reminder_24h_sent is True
```

---

## E2E Tests (Playwright)

### E2E-08-01: Create Meeting Type + Generate Booking Link
1. Login → Settings → Connect Cal.com (mock)
2. Create meeting type "30-min Discovery Call"
3. Assert booking link displayed: `/book/{workspace_slug}/30-min-discovery-call`
4. Copy link

### E2E-08-02: Booking Confirmed → Notification Received
1. Simulate Cal.com webhook with valid HMAC
2. Assert booking appears in Bookings list with status "confirmed"
3. Assert notification log shows confirmation sent to attendee

---

## Coverage Gates

| Service | Gate |
|---|---|
| booking-service unit | ≥ 80% |
| Integration — webhook validation | MUST PASS |
| Integration — idempotency | MUST PASS |
| Integration — cross-workspace | MUST PASS |
| E2E | ≥ 2 flows passing |
