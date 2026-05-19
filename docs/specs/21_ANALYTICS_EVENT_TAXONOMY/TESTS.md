# Spec 21 — Analytics Event Taxonomy: TESTS

## Test Strategy

| Layer | Gate | Framework |
|---|---|---|
| Unit | Schema validation | pytest |
| Unit | PII field rejection | pytest |
| Integration | Event round-trip | pytest |

## Tests

### U21-01: Valid Event Passes Schema
```python
def test_valid_event_passes():
    event = AnalyticsEvent(workspace_id=W, event_name="leads.created", timestamp=utcnow())
    assert event.version == "v1"
```

### U21-02: PII Field Rejected
```python
def test_pii_field_rejected():
    with pytest.raises(ValidationError):
        AnalyticsEvent(workspace_id=W, event_name="leads.created",
                       timestamp=utcnow(), properties={"email": "x@y.com"})
```
