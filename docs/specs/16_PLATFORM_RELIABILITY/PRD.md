# Spec 16 — Platform Reliability: PRD

## Problem Statement

RevLooper microservices call each other synchronously, creating cascading failures under load. Without circuit breakers, retry policies, and health endpoints, one flaky service can take down the entire platform.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-16-01 | Engineer | I want circuit breakers on all inter-service HTTP calls | P0 |
| US-16-02 | Engineer | I want exponential backoff retry on transient failures | P0 |
| US-16-03 | Engineer | I want `/healthz` and `/readyz` endpoints on all services | P0 |
| US-16-04 | Engineer | I want bulkhead isolation between service pools | P1 |
| US-16-05 | Engineer | I want SLA monitoring dashboards (uptime, p99 latency) | P1 |
| US-16-06 | Ops | I want automatic service restart on `/healthz` failure | P1 |

## SLA Targets

| Metric | Target |
|---|---|
| Uptime | 99.9% (< 8.7h/year downtime) |
| API p99 latency | < 2s |
| Sequence step execution p99 | < 30s |

## Acceptance Criteria

### AC-16-01: Circuit Breaker
- GIVEN a service makes N consecutive failed calls to a dependency
- WHEN `failure_threshold` (default: 5) is reached
- THEN circuit opens; subsequent calls fail-fast for `timeout` seconds (default: 30)
- AND circuit resets to half-open after timeout, allowing one test request

### AC-16-02: Retry with Exponential Backoff
- GIVEN an HTTP call returns 5xx or network error
- WHEN retried
- THEN retry with `2^attempt * base_delay` jitter (max 3 retries, max delay 30s)

### AC-16-03: Health Endpoints
- `GET /healthz` — returns 200 if service is alive; 503 if not
- `GET /readyz` — returns 200 if DB and Redis connections are healthy; 503 otherwise

## Non-Functional Requirements
| Requirement | Target |
|---|---|
| Circuit breaker implementation | Tenacity (Python) |
| Health check SLA | Cloud Run checks every 10s |
| Retry max | 3 attempts |
