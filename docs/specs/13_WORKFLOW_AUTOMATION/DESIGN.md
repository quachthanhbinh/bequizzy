# Spec 13 — Workflow Automation: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Simple trigger-action UI like Zapier but in-app. Conditions should support basic field matching (eq, contains, in). Rule execution must feel instant (< 2s). History helps users debug. P0 triggers are the 3 most common manual tasks. Confidence: 7.

**CTO:** `automation_rules` stores trigger type + conditions JSONB + actions JSONB. `campaign-service` (extended) evaluates rules — it already consumes Pub/Sub events. Idempotency: `UNIQUE (rule_id, event_id)` in `automation_executions`. Actions are dispatched via REST to respective services (not direct DB writes — service boundary). Max 10 actions per rule to prevent loops. Confidence: 7.

**Gap: 0. Both ≥ 7.**

### Round 2

**CPO + CTO joint:** Circular rule prevention: rule actions that emit events (e.g., update_deal_stage emits deal.stage_changed) could trigger other rules. Simple mitigation: actions executed with `triggered_by_automation=True` header; rules do NOT fire on automated events. Confidence: 8.

**Final Confidence: 7 / 10.** Why not higher: Condition evaluator complexity grows over time. P0 is simple eq/contains; advanced conditions (date range, regex) are P2.

---

## Data Model

### Table: `automation_rules`
```sql
CREATE TABLE automation_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  name          TEXT NOT NULL,
  is_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  trigger_type  TEXT NOT NULL,   -- deal.stage_changed|lead.replied|booking.confirmed
  conditions    JSONB NOT NULL DEFAULT '[]',
  actions       JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_automation_rules_workspace_trigger ON automation_rules (workspace_id, trigger_type)
  WHERE is_enabled = TRUE;
```

### Table: `automation_executions`
```sql
CREATE TABLE automation_executions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  rule_id       UUID NOT NULL REFERENCES automation_rules(id),
  event_id      TEXT NOT NULL,  -- Pub/Sub message ID
  action_index  INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending|success|failed|skipped
  error         TEXT,
  executed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rule_id, event_id, action_index)
);
```

---

## Condition Evaluator
```python
def evaluate_conditions(conditions: list, payload: dict) -> bool:
    for cond in conditions:
        field_val = payload.get(cond["field"])
        op = cond["op"]
        target = cond["value"]
        if op == "eq" and field_val != target:
            return False
        elif op == "contains" and target not in str(field_val):
            return False
        elif op == "in" and field_val not in target:
            return False
    return True
```

## Circular Rule Prevention
Actions set `triggered_by_automation=True` in event metadata. Rules skip evaluation if event carries this flag.
