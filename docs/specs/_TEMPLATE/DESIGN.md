# NN — <FEATURE> — DESIGN

**Status:** 📝 Draft
**Confidence:** X/10
**Last updated:** YYYY-MM-DD

## Architecture
**Owning service:** <service>
**Touches:** <other services + how>

```
<ASCII diagram of request / event flow>
```

<Narrative of the flow. Note bounded-context boundaries. No cross-service ORM imports.>

## Data Model
**Owning service:** <service>

### New / modified tables
```sql
CREATE TABLE <name> (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,            -- soft FK if external service
  ...
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_<name>_workspace_<...> ON <name> (workspace_id, ...);
```

### RLS
<policy summary; mirror existing workspace RLS pattern>

### Migration
`alembic/versions/YYYY_MM_DD_NNN_<slug>.py`

## API Contract
All routes under `services/<service>/app/api/v1/<router>.py`. Standard envelope `{ data, error, meta }`.

### `<METHOD> /v1/<path>`
```python
class <Name>Request(BaseModel):
    ...

class <Name>Response(BaseModel):
    ...
```

### Error codes
| Code | HTTP | Meaning |
|---|---|---|
| `<CODE>` | 4XX | <when> |

## Event / Outbox Design
All events written to `outbox_events` atomically with the relevant DB write. Subscribers idempotent on a stable key.

| Event type | Producer | Subscribers | Payload |
|---|---|---|---|
| `<domain>.<entity>.<verb>` | <service> | <service(s)> | `{ workspace_id, ... }` |

## Credits & Cost
- **Deduction point:** <where in code>
- **Pricing:** <X credits per op>
- **Our cost:** <$/month at target scale>
- **Margin:** <%>
- **Token caps / rate limits:** <values>

## Scale Design
**Target:** 100 workspaces × 100k leads × 1M outbound msgs/month from day one.

| Concern | Plan |
|---|---|
| <bottleneck> | <mitigation> |
| 10× load | <how it holds> |

## CPO ↔ CTO Debate Summary
**Round 1 (gap: N):** CPO X / CTO Y — <core disagreement>
**Round 2 (gap: N):** CPO X / CTO Y — <what shifted>
**Round 3 (converged):** CPO X / CTO Y — <consensus>

**Final consensus: X/10.** Why not 9–10: <residual unknowns + how they resolve in implementation>
