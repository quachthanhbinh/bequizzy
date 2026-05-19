# Spec 10 — Multichannel Outreach: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (outreach-service) | ≥ 80% | pytest |
| Integration | Suppression + consent gate + routing | pytest + testcontainers |

---

## Unit Tests

### U10-01: SMS Routing — VN Number Goes to ESMS.vn
```python
def test_sms_routing_vn():
    assert get_sms_provider("+84901234567") == "esms_vn"
    assert get_sms_provider("+15551234567") == "twilio"
```

### U10-02: Consent Gate — No Consent Skips Step
```python
async def test_no_consent_skips_sms(outreach_service, db):
    lead = await create_lead(db, phone="+84901234567")
    # No consent record
    result = await send_sms_step(lead, step, db=db)
    assert result.status == "skipped"
    assert result.skipped_reason == "no_consent"
    assert mock_esms.send.call_count == 0
```

### U10-03: LinkedIn Rate Limit Blocks at 25
```python
async def test_linkedin_rate_limit(redis):
    for _ in range(25):
        assert await check_linkedin_rate_limit(redis, "account_1") is True
    assert await check_linkedin_rate_limit(redis, "account_1") is False
```

### U10-04: Suppression Check Blocks Channel Send
```python
async def test_suppressed_lead_blocked_sms(outreach_service, db):
    await add_suppression(db, workspace_id=W, email_or_phone="+84901234567", reason="manual")
    with pytest.raises(SuppressedError):
        await outreach_service.send_sms(workspace_id=W, phone="+84901234567", body="Hi")
```

---

## Integration Tests

### I10-01: Full SMS Flow — Twilio Delivery Confirmed
```python
async def test_sms_twilio_delivery(client, db, mock_twilio):
    resp = await client.post("/channels/sms/send", json={
        "lead_id": str(lead.id), "phone": "+15551234567", "body": "Hello from RevLooper"
    })
    assert resp.status_code == 200
    mock_twilio.send.assert_called_once()
```

### I10-02: PDPA Consent Gate Integration Test
```python
async def test_pdpa_consent_gate_integration(client, db):
    lead = await create_lead(db, phone="+84901234567")
    # No consent record in consent_log
    resp = await client.post("/channels/sms/send", json={
        "lead_id": str(lead.id), "phone": lead.phone, "body": "Hi"
    })
    assert resp.json()["status"] == "skipped"
    assert resp.json()["skipped_reason"] == "no_consent"
```

---

## Coverage Gates
| Service | Gate |
|---|---|
| outreach-service multichannel unit | ≥ 80% |
| Suppression bypass | Zero tolerance — MUST PASS |
| PDPA consent gate | Zero tolerance — MUST PASS |
