# Spec 13 — Workflow Automation: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (campaign-service automation) | ≥ 80% | pytest |
| Integration | Event → rule match → action dispatch | pytest + testcontainers |

---

## Unit Tests

### U13-01: Condition Evaluator — Match
```python
def test_condition_match():
    result = evaluate_conditions(
        [{"field": "stage_name", "op": "eq", "value": "Won"}],
        {"stage_name": "Won"})
    assert result is True
```

### U13-02: Condition Evaluator — No Match
```python
def test_condition_no_match():
    result = evaluate_conditions(
        [{"field": "stage_name", "op": "eq", "value": "Won"}],
        {"stage_name": "Proposal"})
    assert result is False
```

### U13-03: Circular Rule Prevention
```python
async def test_no_execution_for_automated_events(rule_evaluator):
    event = build_event("deal.stage_changed", triggered_by_automation=True)
    executions = await rule_evaluator.evaluate(event)
    assert len(executions) == 0
```

---

## Integration Tests

### I13-01: Deal Won → Send Email Action Executed
```python
async def test_deal_won_triggers_send_email(db, client, mock_outreach):
    rule = await create_rule(db, trigger="deal.stage_changed",
        conditions=[{"field": "stage_name", "op": "eq", "value": "Won"}],
        actions=[{"type": "send_email", "template_id": "congrats"}])
    event = {"deal_id": str(D), "stage_name": "Won", "workspace_id": str(W)}
    await handle_event(event, db)
    mock_outreach.send.assert_called_once()
    execution = await get_execution(db, rule.id)
    assert execution.status == "success"
```

### I13-02: Idempotent Execution (Same Event ID)
```python
async def test_idempotent_execution(db, rule):
    event = {"event_id": "EVT-001", "deal_id": str(D), "stage_name": "Won"}
    await handle_event(event, db)
    await handle_event(event, db)  # second time
    executions = await get_executions_for_event(db, "EVT-001")
    assert len(executions) == 1
```

---

## Coverage Gates
| Gate | Threshold |
|---|---|
| Unit coverage | ≥ 80% |
| Cross-workspace isolation | MUST PASS |
| Circular rule prevention | MUST PASS |
