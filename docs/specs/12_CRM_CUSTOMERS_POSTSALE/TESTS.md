# Spec 12 — CRM, Customers & Post-sale: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (crm-service) | ≥ 80% | pytest |
| Integration | Booking → deal, Won → customer | pytest + testcontainers |

---

## Unit Tests

### U12-01: Valid Stage Transition Accepted
```python
def test_valid_stage_transition():
    result = validate_transition("Meeting", "Proposal")
    assert result is True
```

### U12-02: Invalid Stage Transition Rejected
```python
def test_invalid_stage_transition():
    with pytest.raises(InvalidTransitionError):
        validate_transition("Won", "Lost")
```

### U12-03: Health Score Computation
```python
def test_health_score():
    signals = {"login_frequency": 0.8, "email_opens": 0.6}
    weights = {"login_frequency": 0.5, "email_opens": 0.5}
    score = compute_health_score(signals, weights)
    assert score == 70
```

### U12-04: Health Score Zero-Weight Defaults to 100
```python
def test_health_score_no_weights():
    assert compute_health_score({}, {}) == 100
```

---

## Integration Tests

### I12-01: Booking Confirmed → Deal Created Idempotently
```python
async def test_booking_confirmed_creates_deal(db, pubsub):
    event = {"booking_id": "BK-001", "lead_id": str(L), "workspace_id": str(W)}
    await handle_booking_confirmed(db, event)
    await handle_booking_confirmed(db, event)  # second time
    deals = await get_deals_by_booking(db, "BK-001")
    assert len(deals) == 1  # idempotent
    assert deals[0].stage.name == "Meeting"
```

### I12-02: Won Stage → Customer Created Idempotently
```python
async def test_won_creates_customer(db, client):
    deal = await create_deal(db, stage="Proposal", workspace_id=W)
    await client.patch(f"/deals/{deal.id}", json={"stage_name": "Won"})
    await client.patch(f"/deals/{deal.id}", json={"stage_name": "Won"})  # idempotent
    customers = await get_customers_by_deal(db, deal.id)
    assert len(customers) == 1
    assert customers[0].lifecycle_stage == "onboarding"
```

### I12-03: Cross-Workspace Deal Access Blocked
```python
async def test_cross_workspace_deal_blocked(client, deal_ws_a):
    resp = await client.get(f"/deals/{deal_ws_a.id}",
        headers={"X-Workspace-ID": str(workspace_b_id)})
    assert resp.status_code == 404
```

---

## Coverage Gates
| Gate | Threshold |
|---|---|
| crm-service unit | ≥ 80% |
| Booking → deal idempotency | MUST PASS |
| Won → customer idempotency | MUST PASS |
| Invalid transition rejection | MUST PASS |
