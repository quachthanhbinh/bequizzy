# Spec 26 — Migration & Backfill: TESTS

## Tests

### U26-01: Backfill Job Checkpoints on Failure
```python
async def test_backfill_checkpoint(db):
    # Simulate 2000 rows, crash after 1000
    with simulate_crash_after(1000):
        await run_backfill(db, "test_backfill", batch_size=1000)
    # Resume should start from checkpoint
    job = await get_backfill_job(db, "test_backfill")
    assert job["rows_done"] == 1000
    await run_backfill(db, "test_backfill", batch_size=1000)
    assert job_done(db, "test_backfill")
```

### U26-02: Migration Naming Convention Lint
```python
# CI check
def test_migration_naming():
    for f in Path("alembic/versions").glob("*.py"):
        assert re.match(r"\d{4}_[a-z_]+\.py", f.name), f"Bad name: {f.name}"
```
