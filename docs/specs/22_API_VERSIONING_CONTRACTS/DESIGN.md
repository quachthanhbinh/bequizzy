# Spec 22 — API Versioning & Contracts: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Agency and integration clients need guaranteed stable APIs. Sunset header as formal deprecation signal is good; 6 months is reasonable. Confidence: 7.

**CTO:** URL versioning `/v1/` is standard REST. FastAPI router prefix: `APIRouter(prefix="/v1")`. CI breaking-change detection: `oasdiff` GitHub Action. Pact contract tests: run on every PR for consumer-defined contracts. Confidence: 8.

**Gap: 1. Both ≥ 7. Converge.**

**Final Confidence: 8 / 10.**

---

## URL Versioning Pattern

```python
# services/*/app/main.py
router_v1 = APIRouter(prefix="/v1")
router_v1.include_router(leads_router)
app.include_router(router_v1)
```

## Sunset Header for Deprecated Endpoints

```python
@router_v1.get("/deprecated-endpoint",
               deprecated=True,
               responses={200: {"headers": {"Sunset": {"schema": {"type": "string"}}}}})
async def deprecated_endpoint():
    return Response(headers={"Sunset": "Sat, 01 Jan 2026 00:00:00 GMT"})
```

## oasdiff CI Check

```yaml
# .github/workflows/api-compat.yml
- name: Check API compatibility
  run: oasdiff breaking old-spec.json new-spec.json --fail-on-err
```
