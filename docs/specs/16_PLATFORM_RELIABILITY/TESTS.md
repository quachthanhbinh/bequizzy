# Spec 16 — Platform Reliability: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (shared reliability module) | ≥ 80% | pytest |
| Integration | Circuit breaker state transitions | pytest + Redis testcontainers |

---

## Unit Tests

### U16-01: Retry — Succeeds on Third Attempt
```python
@pytest.mark.asyncio
async def test_retry_succeeds_on_third_attempt(mock_httpx):
    mock_httpx.side_effect = [
        httpx.ConnectError("fail"),
        httpx.ConnectError("fail"),
        httpx.Response(200, json={"ok": True}),
    ]
    result = await call_service("http://test", {})
    assert result == {"ok": True}
    assert mock_httpx.call_count == 3
```

### U16-02: Retry — Exhausts All Attempts and Raises
```python
async def test_retry_exhausted(mock_httpx):
    mock_httpx.side_effect = httpx.ConnectError("fail")
    with pytest.raises(httpx.ConnectError):
        await call_service("http://test", {})
    assert mock_httpx.call_count == 3
```

### U16-03: Circuit Breaker Opens After Threshold
```python
async def test_circuit_opens(redis):
    for _ in range(5):
        await record_failure(redis, "billing-service")
    state = await check_circuit(redis, "billing-service")
    assert state == "open"
```

---

## Integration Tests

### I16-01: /readyz Returns 200 When DB + Redis Healthy
```python
async def test_readyz_healthy(client):
    resp = await client.get("/readyz")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ready"
```

### I16-02: /readyz Returns 503 When DB Unavailable
```python
async def test_readyz_db_unhealthy(client, kill_db):
    resp = await client.get("/readyz")
    assert resp.status_code == 503
    assert "stack_trace" not in resp.text  # no info disclosure
```

---

## Coverage Gates
| Gate | Threshold |
|---|---|
| Reliability module unit | ≥ 80% |
| Circuit breaker state machine | All 3 states tested |
| /readyz no info disclosure | MUST PASS |
