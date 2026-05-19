# Spec 23 — Feature Flags & Rollout: TESTS

## Tests

### U23-01: Flag Off Returns False
```python
def test_flag_off_returns_false(mock_gb):
    mock_gb.is_on.return_value = False
    assert is_feature_enabled("zalo_outreach", workspace_id=W) is False
```

### U23-02: Kill Switch Clears Cache
```python
async def test_kill_switch_clears_cache(redis):
    await redis.set("flag:zalo_outreach", "1")
    await kill_switch("zalo_outreach", redis)
    assert await redis.get("flag:zalo_outreach") is None
```
