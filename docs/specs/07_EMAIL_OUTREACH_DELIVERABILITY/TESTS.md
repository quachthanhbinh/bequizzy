# Spec 07 — Email Outreach & Deliverability: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (outreach-service) | ≥ 85% | pytest + pytest-asyncio |
| Integration | All critical paths + suppression/webhook | pytest + testcontainers |
| E2E | Send email → receive open event flow | Playwright + Mailpit (local SMTP) |

---

## Unit Tests

### U07-01: Suppression Check Blocks Send
```python
async def test_suppressed_email_blocks_send(outreach_service, db):
    await db.execute(insert(SuppressionList).values(
        workspace_id=W, email="blocked@example.com", reason="bounce"))
    with pytest.raises(SuppressedError):
        await outreach_service.send_email(
            workspace_id=W, to="blocked@example.com", ...)
```

### U07-02: Bounce Event → Auto-Suppress
```python
async def test_bounce_event_suppresses_lead(outreach_service, db):
    await outreach_service.process_esp_event({
        "event_type": "bounced",
        "email": "bounce@example.com",
        "esp_event_id": "evt_123",
        "workspace_id": W
    })
    result = await db.execute(
        select(SuppressionList).where(SuppressionList.email == "bounce@example.com"))
    assert result.scalar_one()
```

### U07-03: Complaint Event → Auto-Suppress + Alert
```python
async def test_complaint_event_suppresses_and_alerts(outreach_service, mock_notification, db):
    await outreach_service.process_esp_event({
        "event_type": "complained",
        "email": "complaint@example.com",
        "esp_event_id": "evt_456",
        "workspace_id": W
    })
    assert await is_suppressed(db, W, "complaint@example.com")
    mock_notification.send_alert.assert_called_once()
```

### U07-04: Webhook Idempotency — Duplicate Event ID Ignored
```python
async def test_webhook_idempotency(outreach_service, db):
    event = {"event_type": "bounced", "email": "x@x.com", "esp_event_id": "evt_999", ...}
    await outreach_service.process_esp_event(event)
    await outreach_service.process_esp_event(event)  # duplicate
    # Only one suppression record should exist
    result = await db.execute(
        select(func.count()).where(SuppressionList.email == "x@x.com"))
    assert result.scalar() == 1
```

### U07-05: Daily Send Limit — Blocks at Limit
```python
async def test_daily_send_limit_blocks(outreach_service, db, redis):
    mailbox = await create_mailbox(db, daily_send_limit=5)
    for _ in range(5):
        await outreach_service.send_email(mailbox_id=mailbox.id, ...)
    with pytest.raises(DailySendLimitError):
        await outreach_service.send_email(mailbox_id=mailbox.id, ...)
```

### U07-06: Health Score Computation
```python
def test_health_score_computation():
    score = compute_health_score(bounce_rate=0.03, complaint_rate=0.0008)
    assert 70 <= score <= 85  # moderate bounce, low complaint

    score = compute_health_score(bounce_rate=0.08, complaint_rate=0.002)
    assert score < 50  # red zone
```

### U07-07: Warmup Limit Is Minimum of Warmup and User Limit
```python
def test_warmup_limit_is_minimum():
    mailbox = Mailbox(warmup_enabled=True, warmup_day=3, daily_send_limit=200)
    # Day 3 warmup = 10/day; user limit = 200 → effective = 10
    assert get_effective_daily_limit(mailbox) == 10
```

---

## Integration Tests

### I07-01: End-to-End Send via SendGrid Adapter
```python
async def test_send_via_sendgrid(client, db, mock_sendgrid):
    mailbox = await create_mailbox(db, provider="sendgrid")
    resp = await client.post("/email/send", json={
        "mailbox_id": str(mailbox.id),
        "to": "lead@company.com",
        "subject": "Hello",
        "body": "..."
    })
    assert resp.status_code == 200
    assert mock_sendgrid.send.called
    send_row = await get_email_send(db, resp.json()["send_id"])
    assert send_row.status == "sent"
```

### I07-02: Bounce Webhook → Suppression → Enrollment Stop (T07-SEC-01)
```python
async def test_bounce_webhook_full_flow(client, db, worker):
    lead = await create_lead(db, email="bounce@example.com")
    enrollment = await create_active_enrollment(db, lead_id=lead.id)

    # Simulate ESP bounce webhook
    await client.post("/webhooks/sendgrid", json={
        "event": "bounce", "email": "bounce@example.com",
        "sg_event_id": "sg_001", "workspace_id": str(workspace.id)
    }, headers={"X-Twilio-Email-Event-Webhook-Signature": valid_signature})

    # Verify suppression
    assert await is_suppressed(db, workspace.id, "bounce@example.com")
    # Verify enrollment stopped
    enrollment = await get_enrollment(db, enrollment.id)
    assert enrollment.status == "unsubscribed"
```

### I07-03: Complaint Rate Threshold → Mailbox Auto-Pause
```python
async def test_complaint_rate_triggers_mailbox_pause(outreach_service, db):
    mailbox = await create_mailbox(db, complaint_rate_7d=0.0011)  # > 0.1%
    await outreach_service.refresh_health_scores()
    mailbox = await get_mailbox(db, mailbox.id)
    assert mailbox.status == "paused"
```

### I07-04: Webhook Signature Validation — Invalid Rejected
```python
async def test_invalid_webhook_signature_rejected(client):
    resp = await client.post("/webhooks/sendgrid", json={...},
        headers={"X-Twilio-Email-Event-Webhook-Signature": "invalid_sig"})
    assert resp.status_code == 403
```

---

## E2E Tests

### E2E-07-01: Connect Mailbox + Send Test Email
1. Login → Settings → Connect SendGrid (mock)
2. Verify connection success toast
3. Send test email → verify sent in email_sends table

### E2E-07-02: Bounce Received → Suppression Badge in Lead Profile
1. Send email to test lead
2. Trigger bounce webhook
3. Assert lead profile shows "Suppressed — bounce" badge

---

## Coverage Gates

| Service | Gate |
|---|---|
| outreach-service unit | ≥ 85% |
| Integration — suppression | MUST PASS (zero tolerance) |
| Integration — webhook signature | MUST PASS |
| E2E | ≥ 2 critical flows passing |
