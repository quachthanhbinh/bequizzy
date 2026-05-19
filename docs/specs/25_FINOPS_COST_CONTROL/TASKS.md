# Spec 25 — FinOps & Cost Control: TASKS

## TDD Task List

### Task 1 — Daily Cap Check + Redis Counter
**RED first:** Test U25-01 fails.
**File:** `services/ai-service/app/finops/cost_guard.py`
**Done when:** U25-01 and U25-02 pass.

### Task 2 — llm_cost_events Migration + Model
**RED first:** Migration import fails.
**Done when:** Table created; LiteLLM cost events written per call.

### Task 3 — GCP Billing Alerts
**Done when:** Terraform alerts apply; Slack notification fires on test trigger.

## Completion Checklist
- [ ] Daily cap blocks requests over budget
- [ ] Cost counter resets at midnight UTC
- [ ] GCP billing alerts active
