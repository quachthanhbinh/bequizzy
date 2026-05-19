# Spec 09 — Analytics & A/B Testing: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (analytics-service) | ≥ 80% | pytest |
| Unit (analytics-aggregator) | ≥ 80% | pytest |
| Integration | Aggregation job + API endpoints | pytest + testcontainers |

---

## Unit Tests

### U09-01: Campaign Metrics Rate Computation
```python
def test_campaign_metrics_rates():
    metrics = compute_rates(emails_sent=100, opens=35, clicks=12, replies=8, bounces=3)
    assert metrics["open_rate"] == pytest.approx(0.35)
    assert metrics["click_rate"] == pytest.approx(0.12)
    assert metrics["bounce_rate"] == pytest.approx(0.03)
```

### U09-02: A/B Significance — p < 0.05 Detected
```python
def test_ab_significance_detected():
    result = compute_ab_significance(a_opens=60, a_sent=100, b_opens=30, b_sent=100)
    assert result["is_significant"] is True
    assert result["winner"] == "a"
    assert result["p_value"] < 0.05
```

### U09-03: A/B Significance — Insufficient Sample Returns Not Significant
```python
def test_ab_insufficient_sample():
    result = compute_ab_significance(a_opens=5, a_sent=50, b_opens=3, b_sent=50)
    assert result["is_significant"] is False
    assert result["p_value"] is None
```

### U09-04: Zero Emails Sent — Rates Are Zero (No Division by Zero)
```python
def test_zero_emails_sent():
    metrics = compute_rates(emails_sent=0, opens=0, clicks=0, replies=0, bounces=0)
    assert metrics["open_rate"] == 0.0
    assert metrics["click_rate"] == 0.0
```

---

## Integration Tests

### I09-01: Aggregator Job Produces Correct Snapshot
```python
async def test_aggregator_produces_correct_snapshot(db, event_data):
    # Insert test email_events
    await insert_email_events(db, campaign_id="C1", sent=100, opens=35, replies=8)
    await run_aggregation_job(db)
    snapshot = await get_campaign_snapshot(db, "C1", date.today())
    assert snapshot.emails_sent == 100
    assert snapshot.opens == 35
    assert snapshot.replies == 8
```

### I09-02: Dashboard API Returns Pre-Aggregated Data
```python
async def test_dashboard_returns_pre_aggregated(client, db):
    await create_campaign_snapshot(db, workspace_id=W, emails_sent=500, opens=150)
    resp = await client.get("/analytics/dashboard",
        headers={"X-Workspace-ID": str(W)})
    assert resp.status_code == 200
    assert resp.json()["total_emails_sent_30d"] == 500
```

### I09-03: Cross-Workspace Metrics Isolation
```python
async def test_cross_workspace_metrics_isolation(client, workspace_a, workspace_b):
    await create_campaign_snapshot(db, workspace_id=workspace_a.id, campaign_id="C_A")
    resp = await client.get(f"/analytics/campaigns/C_A",
        headers={"X-Workspace-ID": str(workspace_b.id)})
    assert resp.status_code == 404
```

---

## Coverage Gates

| Service | Gate |
|---|---|
| analytics-service unit | ≥ 80% |
| analytics-aggregator unit | ≥ 80% |
| Integration — aggregation | All metric types verified |
| Integration — cross-workspace | MUST PASS |
