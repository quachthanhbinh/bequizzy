# Spec 26 — Migration & Backfill: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** The only user concern is downtime. Expand-contract guarantees zero-downtime, which is the product promise. Confidence: 7.

**CTO:** All migrations MUST be zero-downtime compatible: no column drops/renames without expand-contract. Alembic review gate: PR checklist includes expand-contract phase declaration. Backfill job: `asyncpg` direct (not ORM) for bulk UPDATE performance. Checkpoint: last processed `id` stored in `backfill_jobs` row. Confidence: 8.

**Gap: 1. Both ≥ 7. Converge.**

**Final Confidence: 8 / 10.**

---

## Backfill Job Template

```python
async def run_backfill(db: asyncpg.Connection, job_name: str, batch_size=1000):
    job = await get_or_create_backfill_job(db, job_name)
    last_id = job["last_processed_id"]
    while True:
        rows = await db.fetch(
            "SELECT id FROM leads WHERE id > $1 ORDER BY id LIMIT $2",
            last_id, batch_size
        )
        if not rows:
            break
        # process rows
        last_id = rows[-1]["id"]
        await update_backfill_progress(db, job_name, last_id, len(rows))
```

## backfill_jobs Table
```sql
CREATE TABLE backfill_jobs (
  job_name            TEXT PRIMARY KEY,
  status              TEXT NOT NULL DEFAULT 'running',
  rows_done           BIGINT NOT NULL DEFAULT 0,
  last_processed_id   UUID,
  started_at          TIMESTAMPTZ DEFAULT now(),
  completed_at        TIMESTAMPTZ
);
```
