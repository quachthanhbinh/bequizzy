# Spec 16 — Platform Reliability: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Users shouldn't see 500 errors because a downstream service blipped. Circuit breakers and retries should be invisible — the platform just works. Confidence: 8.

**CTO:** Tenacity for Python retry (`@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=30))`). Circuit breaker: custom state machine in Redis (shared across Cloud Run instances). Health endpoints: all services get a standard `HealthRouter` with DB ping + Redis ping. Bulkhead: Cloud Run concurrency limits per service (separate pools = separate Cloud Run services by definition). Confidence: 8.

**Gap: 0. Both ≥ 7. Converge Round 1.**

**Final Confidence: 8 / 10.** Why not 10: Circuit breaker state in Redis adds a Redis dependency to the health path — if Redis is down, circuit breaker loses state. Acceptable trade-off; documented.

---

## Reliability Primitives

### Retry Decorator (Tenacity)
```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=30),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.ConnectError))
)
async def call_service(url: str, payload: dict) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        return resp.json()
```

### Circuit Breaker (Redis State)
```python
STATES = {"closed", "open", "half_open"}

async def check_circuit(redis, service: str) -> str:
    state = await redis.get(f"circuit:{service}:state")
    return state.decode() if state else "closed"

async def record_failure(redis, service: str, threshold: int = 5, timeout: int = 30):
    key = f"circuit:{service}:failures"
    failures = await redis.incr(key)
    await redis.expire(key, timeout)
    if failures >= threshold:
        await redis.set(f"circuit:{service}:state", "open", ex=timeout)
```

### Health Router (Standard — all services)
```python
from fastapi import APIRouter
router = APIRouter()

@router.get("/healthz")
async def healthz():
    return {"status": "ok"}

@router.get("/readyz")
async def readyz(db: AsyncSession = Depends(get_db), redis = Depends(get_redis)):
    await db.execute("SELECT 1")
    await redis.ping()
    return {"status": "ready"}
```
