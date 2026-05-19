# Spec 16 — Platform Reliability: IMPLEMENTATION

## Phases
1. **Shared Module**: `services/shared/reliability.py` — retry decorator, circuit breaker, health router
2. **Rollout**: Add `HealthRouter` to all 14 services; add retry decorator to all inter-service HTTP calls
3. **Monitoring**: Cloud Monitoring SLO dashboards; uptime check alerts

## File Map
```
services/shared/
  reliability.py          # retry, circuit_breaker, HealthRouter

services/*/app/main.py    # Include HealthRouter in every service

k8s/
  liveness-probe.yaml     # /healthz
  readiness-probe.yaml    # /readyz
```

## Rollout Order
1. Implement `shared/reliability.py`
2. Add to api-gateway (highest traffic)
3. Roll out to all other services
4. Set Cloud Run health check probes to `/healthz`
