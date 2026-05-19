# Spec 20 — Data Governance & Retention: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** GDPR/PDPA compliance is a hard sales requirement for enterprise. Right-to-erasure must be self-serve (workspace admin can submit). Compliance dashboard shows: leads with consent, pending erasure requests, upcoming data expiry. Confidence: 7.

**CTO:** Erasure is a two-step process: (1) REQUEST: log to `gdpr_erasure_requests`; (2) PROCESS: batch Cloud Run Job (nightly) executes the actual PII nulling across tables. Retention job: separate Cloud Run Job (daily). Consent log: `consent_log` table (workspace_id, lead_id, channel, consented_at, source) — B-tree index on `(workspace_id, lead_id, channel)` for < 50ms lookup. Confidence: 7.

**Gap: 0. Both ≥ 7. Converge.**

**Final Confidence: 8 / 10.**

---

## Data Model

### Table: `consent_log`
```sql
CREATE TABLE consent_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  lead_id       UUID NOT NULL,
  channel       TEXT NOT NULL,  -- sms|email|linkedin|all
  consented_at  TIMESTAMPTZ NOT NULL,
  source        TEXT NOT NULL,  -- form|import|manual
  revoked_at    TIMESTAMPTZ,
  UNIQUE (workspace_id, lead_id, channel)
);
CREATE INDEX idx_consent_log_lookup ON consent_log (workspace_id, lead_id, channel);
```

### Erasure Job Logic
```python
async def execute_erasure(db: AsyncSession, lead_id: UUID, workspace_id: UUID):
    # Pseudonymize lead
    await db.execute(
        update(Lead)
        .where(Lead.id == lead_id, Lead.workspace_id == workspace_id)
        .values(
            first_name="[ERASED]",
            last_name="[ERASED]",
            email=f"erased_{lead_id}@erased.invalid",
            phone=None,
            linkedin_url=None,
        )
    )
    # Hard delete inbox messages
    await db.execute(
        delete(InboxMessage).where(
            InboxMessage.workspace_id == workspace_id,
            InboxMessage.thread_id.in_(
                select(InboxThread.id).where(InboxThread.lead_id == lead_id)
            )
        )
    )
    # Mark request complete
    await db.execute(
        update(GDPRErasureRequest)
        .where(GDPRErasureRequest.lead_id == lead_id)
        .values(status="completed", completed_at=func.now())
    )
```

### Retention Job Logic
```python
RETENTION_RULES = {
    "email_events": timedelta(days=90),
    "email_sends": timedelta(days=90),
    "inbox_messages": timedelta(days=90),
    "outbox_events": timedelta(days=30),
    "leads": timedelta(days=730),
}
```
