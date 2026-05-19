# 37 — LangGraph AI Orchestration — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-10

---

## 1. Feature Flag

**Name:** `langgraph_advisor_enabled`  
**Implementation:** Cloud Run environment variable `LANGGRAPH_ADVISOR_ENABLED` (string `"true"` / `"false"`)  
**Default:** `"false"` (opt-in rollout)  
**Read by:** `app/core/config.py` → `settings.LANGGRAPH_ADVISOR_ENABLED: bool`  
**Checked in:** `advisor_chat.py` — single if/else branch before graph invocation  

Feature flag is **not** a database flag (no latency hit per request). Environment variable propagation in Cloud Run takes ≤ 2 minutes (SLO for rollback).

```python
# app/core/config.py (amendment)
class Settings(BaseSettings):
    LANGGRAPH_ADVISOR_ENABLED: bool = False
    # ... existing fields
```

---

## 2. Migration from Ad-Hoc LiteLLM Loop

The migration is **additive, not destructive**. The existing LiteLLM loop code (Spec 31) remains intact and is the default code path. LangGraph is enabled only when the feature flag is set.

### Phase 1 — Parallel deployment (Week 1–2)
- Deploy ai-service with LangGraph installed and graph code present
- `LANGGRAPH_ADVISOR_ENABLED=false` in Cloud Run (all traffic to legacy loop)
- Run EDD eval suite against both paths offline (using test workspace data)
- Compare quality scores: LangGraph path must score ≥ 90% on compound queries

### Phase 2 — Canary (Week 3)
- Set `LANGGRAPH_ADVISOR_ENABLED=true` on `revlooper-staging` Cloud Run service
- Enable for one internal workspace (RevLooper's own workspace) in production
- Monitor Cloud Logging for `advisor_graph_error` events
- Monitor Cloud Monitoring → P95 latency on `/advisor/chat`
- Monitor billing-service credit transactions for double-deduction incidents (must be 0)

### Phase 3 — Gradual rollout (Week 4–5)
- Enable `LANGGRAPH_ADVISOR_ENABLED=true` in Cloud Run production service
- Monitor error rate vs baseline (alert if error rate > 2× baseline)
- Monitor P95 latency (alert if > 5s)
- Roll back instantly by setting `LANGGRAPH_ADVISOR_ENABLED=false` if any alert fires

### Phase 4 — Legacy loop removal (Week 8+)
- After 4 weeks stable on LangGraph with no P0 incidents:
  - Remove legacy `_legacy_litellm_loop` function
  - Remove feature flag check
  - Remove `LANGGRAPH_ADVISOR_ENABLED` from config

**Rollback procedure (< 2 minutes):**
```bash
gcloud run services update ai-service \
  --region asia-southeast1 \
  --update-env-vars LANGGRAPH_ADVISOR_ENABLED=false
```

No code change or new deployment is required for rollback.

---

## 3. File Map

```
services/ai-service/
├── pyproject.toml                              ← ADD: langgraph>=0.2,<0.4
├── app/
│   ├── core/
│   │   └── config.py                          ← ADD: LANGGRAPH_ADVISOR_ENABLED field
│   ├── advisor/
│   │   ├── __init__.py                        ← CREATE (empty)
│   │   ├── graph_state.py                     ← CREATE: AdvisorState TypedDict
│   │   ├── graph.py                           ← CREATE: build_advisor_graph(), ADVISOR_GRAPH singleton
│   │   ├── advisor_chat.py                    ← MODIFY: add graph path behind feature flag
│   │   └── nodes/
│   │       ├── __init__.py                    ← CREATE (empty)
│   │       ├── classify.py                    ← CREATE: classify node
│   │       ├── retrieve.py                    ← CREATE: retrieve node
│   │       ├── tool_call.py                   ← CREATE: tool_call node
│   │       ├── synthesize.py                  ← CREATE: synthesize node
│   │       └── critique.py                    ← CREATE: critique node
├── tests/
│   ├── unit/
│   │   ├── advisor/
│   │   │   ├── test_classify.py               ← CREATE
│   │   │   ├── test_retrieve.py               ← CREATE
│   │   │   ├── test_tool_call.py              ← CREATE
│   │   │   ├── test_synthesize.py             ← CREATE
│   │   │   └── test_critique.py               ← CREATE
│   │   └── test_graph_wiring.py               ← CREATE
│   ├── integration/
│   │   └── test_advisor_chat_graph.py         ← CREATE
│   └── evals/
│       └── test_advisor_quality.py            ← CREATE (EDD eval suite)
```

---

## 4. pyproject.toml Amendment

```toml
# services/ai-service/pyproject.toml
[project]
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.29",
    "alembic>=1.13",
    "pydantic>=2.7",
    "pydantic-settings>=2.3",
    "litellm>=1.40",
    "pgvector>=0.3",
    "httpx>=0.27",
    "psycopg2-binary>=2.9",
    "opentelemetry-sdk>=1.24",
    "opentelemetry-instrumentation-fastapi>=0.45b0",
    "opentelemetry-instrumentation-sqlalchemy>=0.45b0",
    "opentelemetry-exporter-otlp-proto-grpc>=1.24",
    "sentry-sdk[fastapi]>=2.0",
    "structlog>=24.1",
    "langgraph>=0.2,<0.4",   # ← ADD THIS LINE ONLY
]
```

No other dependency changes. Total new deps added: **1**.

---

## 5. Monitoring

### Cloud Monitoring Alerts

| Alert | Condition | Action |
|---|---|---|
| Advisor P95 latency | > 5000ms for 5 consecutive minutes | Page on-call; auto-rollback flag |
| Advisor error rate | > 2% of requests return 5xx | Page on-call; auto-rollback flag |
| Credits double-deduction | Any `credit_transactions` with duplicate `(workspace_id, session_id, operation)` within 10s | P0 — immediate rollback |
| Graph node error | `advisor_graph_error` log events > 5/min | Slack alert to #ai-alerts |

### Cloud Logging Queries

```
# All node traces for a session (for debugging)
resource.type="cloud_run_revision"
jsonPayload.session_id="<session-uuid>"
jsonPayload.event=~"advisor_graph"

# Latency distribution by node
resource.type="cloud_run_revision"
jsonPayload.event="advisor_graph_node"
| histogram jsonPayload.duration_ms by jsonPayload.node

# Critique failure rate
resource.type="cloud_run_revision"
jsonPayload.event="advisor_graph_node"
jsonPayload.node="critique"
jsonPayload.critique_passed=false
```

### Dashboard

Add to existing ai-service Cloud Monitoring dashboard:
- `advisor_graph_node` duration heatmap (by node)
- `advisor_tool_call` duration heatmap (by tool)
- Critique pass/fail rate (pie)
- Query class distribution: rag_only / simple / complex / draft (bar)

---

## 6. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LangGraph version breaking change on upgrade | Low | Medium | Pin to `<0.4`; test on upgrade in staging before prod |
| Critique loop causes > 5s latency on complex queries | Low | Medium | Max 2 critique iterations; fast model for critique; timeout budget managed in synthesize |
| `classify` credits deduction races with billing-service unavailability | Low | High | If billing-service returns 5xx, fail fast with `AppError("BILLING_UNAVAILABLE", 503)` — do NOT proceed without deduction |
| Graph state grows large (very long session history) | Medium | Low | `load_session_history` capped at 10 turns; rag_results capped at 5 chunks; state stays < 50KB |
| `asyncio.TaskGroup` exception propagation swallows errors | Low | Medium | All task group exceptions are caught and re-raised with original context; test coverage for failure modes |
| LangGraph `ainvoke()` does not honour asyncio cancellation | Low | Low | Cloud Run request timeout (30s) handles this at infra level; not a concern within 5s budget |

---

## 7. No Schema Migration Required

The `advisor_chat_sessions` table schema is unchanged. The only schema addition is the `graph_node_trace` field appended to the JSONB `messages` array — JSONB fields are schema-free and require no Alembic migration.

**Alembic migration count for this spec: 0**

---

## 8. Definition of Done

- [ ] All 10 tasks in TASKS.md completed (RED → GREEN each)
- [ ] Unit test coverage ≥ 85% on `app/advisor/` module
- [ ] Integration test: full graph run with mocked tools and LLM returns correct response shape
- [ ] EDD eval suite: ≥ 90% quality score on compound query set
- [ ] P95 latency measured in staging < 5s
- [ ] No `advisor_graph_error` events in staging smoke test
- [ ] Feature flag rollback verified: flip to false → legacy loop works
- [ ] Cloud Monitoring dashboard updated with graph node panels
- [ ] Security review: SECURITY.md all mitigations verified
- [ ] specs/README.md status grid updated to reflect Spec 37
