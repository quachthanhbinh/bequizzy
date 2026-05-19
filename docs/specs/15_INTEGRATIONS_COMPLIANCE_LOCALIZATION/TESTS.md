# Spec 15 — Integrations, Compliance & Localization: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (integration-service) | ≥ 80% | pytest |
| Integration | Webhook delivery + erasure + HubSpot sync | pytest + testcontainers |

---

## Unit Tests

### U15-01: Webhook URL Validation — Blocks Private IPs
```python
def test_webhook_ssrf_blocked():
    with pytest.raises(ValidationError):
        validate_webhook_url("http://169.254.169.254/metadata")
    with pytest.raises(ValidationError):
        validate_webhook_url("http://10.0.0.1/internal")
```

### U15-02: HMAC Signature Verification
```python
def test_hmac_signature():
    secret = "test_secret"
    payload = b'{"event": "lead.replied"}'
    sig = sign_payload(secret, payload)
    assert verify_signature(secret, payload, sig) is True
    assert verify_signature(secret, payload, "bad_sig") is False
```

---

## Integration Tests

### I15-01: Webhook Delivered with Correct HMAC
```python
async def test_webhook_delivery_hmac(client, mock_http_server):
    endpoint = await create_webhook_endpoint(db, url=mock_http_server.url)
    await trigger_event("lead.replied", lead_id=L)
    received = mock_http_server.last_request
    assert "X-RevLooper-Signature" in received.headers
    assert verify_signature(endpoint.secret, received.body,
                            received.headers["X-RevLooper-Signature"])
```

### I15-02: GDPR Erasure Nullifies PII
```python
async def test_gdpr_erasure(client, db, lead):
    await client.post(f"/compliance/erasure", json={"lead_id": str(lead.id)})
    await run_erasure_job(db)
    lead_db = await db.get(Lead, lead.id)
    assert lead_db.email is None
    assert lead_db.first_name is None
    request = await get_erasure_request(db, lead.id)
    assert request.status == "completed"
```

---

## Coverage Gates
| Gate | Threshold |
|---|---|
| Unit coverage | ≥ 80% |
| SSRF blocked | MUST PASS |
| GDPR erasure completeness | MUST PASS |
