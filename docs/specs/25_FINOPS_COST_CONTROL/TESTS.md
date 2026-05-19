# Spec 25 — FinOps & Cost Control: TESTS

## Tests

### U25-01: Cap Exceeded Returns 429
```python
async def test_cap_exceeded_returns_error(redis):
    await redis.set(f"ai_cost:{W}:{date.today()}", "9.99")
    with pytest.raises(AppError) as exc:
        await check_and_record_cost(redis, W, 0.02, daily_cap_usd=10.0)
    assert exc.value.code == "DAILY_AI_BUDGET_EXCEEDED"
```

### U25-02: Under Cap Increments Counter
```python
async def test_under_cap_increments(redis):
    await check_and_record_cost(redis, W, 0.05, daily_cap_usd=10.0)
    val = float(await redis.get(f"ai_cost:{W}:{date.today()}"))
    assert abs(val - 0.05) < 0.001
```
