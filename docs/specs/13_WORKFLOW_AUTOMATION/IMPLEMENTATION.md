# Spec 13 — Workflow Automation: IMPLEMENTATION

## Phases
1. **Schema**: Alembic migration for automation_rules, automation_executions
2. **Rule Evaluator**: Condition evaluator; Pub/Sub consumer; action dispatcher (REST calls to services)
3. **Frontend**: Rule builder UI; execution history table; enable/disable toggle

## File Map
```
services/campaign-service/
  app/
    models/automation.py
    routers/automations.py
    services/
      automation_service.py    # CRUD
      rule_evaluator.py        # condition + action dispatch
    consumers/
      automation_consumer.py   # Pub/Sub event handler

alembic/versions/0013_automation.py
```

## Integration Points
| Trigger Event | From | Handler |
|---|---|---|
| `deal.stage_changed` | crm-service outbox | automation_consumer |
| `lead.replied` | customer-service outbox | automation_consumer |
| `booking.confirmed` | booking-service outbox | automation_consumer |
