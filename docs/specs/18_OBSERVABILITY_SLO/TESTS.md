# Spec 18 — Observability & SLO: TESTS

## Test Strategy

| Layer | Verification | Framework |
|---|---|---|
| Unit | Logging middleware adds trace_id + workspace_id | pytest |
| Integration | Trace propagation across 2 services | pytest + testcontainers |

---

## Unit Tests

### U18-01: Logging Middleware Adds Required Fields
```python
async def test_logging_middleware_adds_trace_id(client):
    resp = await client.get("/healthz",
        headers={"X-Trace-ID": "test-trace-123", "X-Workspace-ID": "ws-456"})
    # Check response header propagation
    assert resp.headers["X-Trace-ID"] == "test-trace-123"
    # Check log context (via caplog)
    assert "test-trace-123" in caplog.text
    assert "ws-456" in caplog.text
```

### U18-02: Log Format Is Structured JSON
```python
def test_log_format_is_json():
    with capture_logs() as cap:
        logger.info("test event", workspace_id="W1")
    log_entry = json.loads(cap[0])
    assert "workspace_id" in log_entry
    assert "trace_id" in log_entry
    assert "service" in log_entry
    assert "timestamp" in log_entry
```

---

## Coverage Gates
| Gate | Threshold |
|---|---|
| Unit coverage | ≥ 80% |
| PII never in log values | Code review gate |
