# Spec 20 — Data Governance & Retention: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (erasure job) | ≥ 80% | pytest |
| Integration | Erasure + retention + consent lookup | pytest + testcontainers |

---

## Unit Tests

### U20-01: Erasure Pseudonymizes All PII Fields
```python
async def test_erasure_pseudonymizes_lead(db, lead):
    await execute_erasure(db, lead_id=lead.id, workspace_id=W)
    lead_db = await db.get(Lead, lead.id)
    assert lead_db.email.endswith("@erased.invalid")
    assert lead_db.first_name == "[ERASED]"
    assert lead_db.phone is None
```

### U20-02: Consent Lookup Returns True When Consent Exists
```python
async def test_consent_lookup(db):
    await create_consent(db, workspace_id=W, lead_id=L, channel="sms")
    assert await has_consent(db, workspace_id=W, lead_id=L, channel="sms") is True
    assert await has_consent(db, workspace_id=W, lead_id=L, channel="linkedin") is False
```

---

## Integration Tests

### I20-01: Erasure Cross-Workspace Blocked
```python
async def test_erasure_cross_workspace_blocked(client, lead_ws_a):
    resp = await client.post("/compliance/erasure",
        json={"lead_id": str(lead_ws_a.id)},
        headers={"X-Workspace-ID": str(workspace_b_id)})
    assert resp.status_code == 404
```

### I20-02: Retention Job Deletes Old Records
```python
async def test_retention_job_deletes_old_records(db):
    await insert_email_event(db, created_at=datetime.now() - timedelta(days=100))
    await run_retention_job(db)
    count = await count_email_events(db, older_than=timedelta(days=90))
    assert count == 0
```

---

## Coverage Gates
| Gate | Threshold |
|---|---|
| Erasure job unit | ≥ 80% |
| Cross-workspace erasure blocked | MUST PASS |
| Retention job correctness | MUST PASS |
