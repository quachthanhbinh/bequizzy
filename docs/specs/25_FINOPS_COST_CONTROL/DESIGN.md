# Spec 25 — FinOps & Cost Control: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Cost caps protect us from abuse but also from billing surprises. Workspace admins need visibility — "why is my AI spend high" dashboard. Custom caps for enterprise customers are a premium feature. Confidence: 7.

**CTO:** `llm_cost_events` table in analytics-service (not billing-service — it's read-heavy). Daily cap check in ai-service before each LLM call using Redis counter (INCR + TTL reset at midnight UTC). GCP labels: `workspace_id` on all Cloud Run services for billing breakdowns. Confidence: 8.

**Gap: 1. Both ≥ 7. Converge.**

**Final Confidence: 7 / 10 (dependency on LiteLLM cost accuracy).**

---

## Daily Cap Check Pattern

```python
async def check_and_record_cost(
    redis: Redis,
    workspace_id: UUID,
    estimated_cost_usd: float,
    daily_cap_usd: float = 10.0,
) -> None:
    key = f"ai_cost:{workspace_id}:{date.today().isoformat()}"
    current = float(await redis.get(key) or 0)
    if current + estimated_cost_usd > daily_cap_usd:
        raise AppError("DAILY_AI_BUDGET_EXCEEDED", "Daily AI budget reached", 429)
    await redis.incrbyfloat(key, estimated_cost_usd)
    await redis.expire(key, 86400)
```
