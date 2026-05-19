# Spec 06 — Sequence Builder & Execution: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (campaign-service) | ≥ 85% | pytest + pytest-asyncio |
| Unit (sequence-worker) | ≥ 85% | pytest |
| Integration | All critical paths + suppression/unsubscribe | pytest + httpx + testcontainers |
| E2E | Enrollment → execution → complete flow | Playwright |

---

## Unit Tests

### U06-01: Enrollment — Duplicate Active Enrollment Rejected
```python
async def test_duplicate_active_enrollment_rejected(db):
    await enroll_lead(db, lead_id=X, sequence_id=Y, workspace_id=W)
    with pytest.raises(AppError) as exc:
        await enroll_lead(db, lead_id=X, sequence_id=Y, workspace_id=W)
    assert exc.value.code == "ALREADY_ENROLLED"
```

### U06-02: Suppression Check — Suppressed Lead Skips Step
```python
async def test_suppressed_lead_skips_step(mock_suppression_client):
    mock_suppression_client.is_suppressed.return_value = True
    enrollment = make_enrollment(status="active")
    result = await execute_step(enrollment, step, suppression_client=mock_suppression_client)
    assert result.enrollment.status == "unsubscribed"
    assert result.step_executed is False
```

### U06-03: Daily Send Cap — Blocks at Limit
```python
async def test_daily_send_cap_blocks_at_limit(redis):
    cap = 5
    for _ in range(cap):
        assert await check_daily_send_cap(redis, "seq_123", cap) is True
    assert await check_daily_send_cap(redis, "seq_123", cap) is False
```

### U06-04: A/B Split Routing
```python
async def test_ab_split_routing():
    # Deterministic: hash(lead_id) % 100 < 50 → variant A
    step = make_ab_split_step(split_pct=50, a_step_id="A", b_step_id="B")
    for lead_id in sample_lead_ids(100):
        result = route_ab_split(step, lead_id)
        assert result in {"A", "B"}
    # Roughly 50% each (allow 40-60 range)
    a_count = sum(1 for l in sample_lead_ids(100) if route_ab_split(step, l) == "A")
    assert 40 <= a_count <= 60
```

### U06-05: Condition Branch — email_opened Routes to True Branch
```python
async def test_condition_branch_email_opened(mock_activity_client):
    mock_activity_client.has_opened_email.return_value = True
    step = make_condition_step(rule="email_opened", true_step_id="T", false_step_id="F")
    result = await evaluate_condition(step, lead_id="L1", mock_activity_client)
    assert result.next_step_id == "T"
```

### U06-06: Status Transition — Completed Enrollment Cannot Be Paused
```python
async def test_completed_enrollment_cannot_be_paused(db):
    enrollment = await create_enrollment(db, status="completed")
    with pytest.raises(AppError) as exc:
        await update_enrollment_status(db, enrollment.id, "paused")
    assert exc.value.code == "INVALID_ENROLLMENT_TRANSITION"
```

---

## Integration Tests

### I06-01: Full Enrollment → Execute → Complete (Happy Path)
```python
async def test_full_enrollment_to_completion(client, db, worker, mock_outreach):
    sequence = await create_sequence_with_steps(db, steps=[
        {"type": "email", "config": {...}},
        {"type": "wait", "config": {"duration_seconds": 0}},  # 0 for test
        {"type": "email", "config": {...}},
    ])
    lead = await create_lead(db)
    await enroll_lead(client, lead.id, sequence.id)
    await worker.process_all_due()
    enrollment = await get_enrollment(db, lead.id, sequence.id)
    assert enrollment.status == "completed"
    assert mock_outreach.send_email.call_count == 2
```

### I06-02: Suppression Check Prevents Step Execution (CRITICAL — T06-SEC-01)
```python
async def test_suppressed_lead_never_receives_step(client, db, worker, suppression_service):
    await suppression_service.suppress_lead(lead_id="L1", workspace_id="W1")
    sequence = await create_sequence(db)
    await enroll_lead(client, "L1", sequence.id)
    await worker.process_all_due()
    enrollment = await get_enrollment(db, "L1", sequence.id)
    assert enrollment.status == "unsubscribed"
    assert mock_email_service.send.call_count == 0
```

### I06-03: Unsubscribe Propagates to All Active Enrollments
```python
async def test_unsubscribe_propagates_to_all_enrollments(db, pubsub, worker):
    lead = await create_lead(db)
    seq1 = await create_sequence(db)
    seq2 = await create_sequence(db)
    await enroll_lead_direct(db, lead.id, seq1.id)
    await enroll_lead_direct(db, lead.id, seq2.id)

    # Trigger unsubscribe event
    await pubsub.publish("lead.unsubscribed", {"lead_id": str(lead.id), "workspace_id": str(workspace.id)})
    await worker.process_pubsub_events()

    e1 = await get_enrollment(db, lead.id, seq1.id)
    e2 = await get_enrollment(db, lead.id, seq2.id)
    assert e1.status == "unsubscribed"
    assert e2.status == "unsubscribed"
```

### I06-04: Cross-Workspace Enrollment Isolation (T06-SEC-02)
```python
async def test_cross_workspace_enrollment_isolation(client, workspace_a, workspace_b):
    enrollment_a = await create_enrollment(workspace_a)
    resp = await client.get(f"/enrollments/{enrollment_a.id}",
        headers={"X-Workspace-ID": str(workspace_b.id)})
    assert resp.status_code == 404
```

### I06-05: Daily Send Cap Enforced Across Parallel Workers
```python
async def test_daily_send_cap_enforced(db, redis, worker):
    sequence = await create_sequence(db, daily_send_cap=5)
    leads = [await create_lead(db) for _ in range(10)]
    for lead in leads:
        await enroll_lead_direct(db, lead.id, sequence.id)
    await worker.process_all_due()
    assert mock_email_service.send.call_count == 5  # capped at 5
```

---

## E2E Tests (Playwright)

### E2E-06-01: Build Sequence + Enroll + Complete
1. Login as workspace owner
2. Create campaign → create sequence → add 3 steps (email, wait 0s, email)
3. Enroll 1 lead
4. Wait for completion signal (WebSocket or polling)
5. Assert enrollment status = completed; 2 emails sent

### E2E-06-02: Unsubscribe Stops Sequence
1. Enroll lead → trigger unsubscribe webhook
2. Assert enrollment status = unsubscribed within 2s
3. Assert no further emails sent

---

## Coverage Gates

| Service | Gate |
|---|---|
| campaign-service unit | ≥ 85% |
| sequence-worker unit | ≥ 85% |
| Integration — suppression bypass | MUST PASS (zero tolerance) |
| Integration — unsubscribe propagation | MUST PASS |
| E2E | ≥ 2 critical flows passing |
