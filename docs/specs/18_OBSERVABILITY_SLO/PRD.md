# Spec 18 — Observability & SLO: PRD

## Problem Statement

Distributed microservices fail silently. Engineers need distributed traces to diagnose latency issues, structured logs to correlate events across services, and SLO dashboards to track reliability commitments.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-18-01 | Engineer | I want a trace_id that flows through all services for a single request | P0 |
| US-18-02 | Engineer | I want structured JSON logs with workspace_id, service, trace_id | P0 |
| US-18-03 | Ops | I want SLO dashboards showing uptime and p99 latency | P0 |
| US-18-04 | Ops | I want error budget alerts when SLO is at risk | P1 |
| US-18-05 | Engineer | I want slow query detection (> 100ms) logged | P1 |
| US-18-06 | Engineer | I want unhandled backend exceptions captured in Sentry with workspace context | P0 |
| US-18-07 | Engineer | I want frontend JS errors and performance captured in Sentry | P0 |
| US-18-08 | Engineer | I want distributed traces visible in SigNoz during local and staging development | P0 |
| US-18-09 | Engineer | I want OTel traces to flow to Cloud Trace in production without code changes | P1 |

## SLO Definitions

| SLO | Target | Error Budget (30d) |
|---|---|---|
| API availability | 99.9% | 43.2 min |
| API p99 latency | < 2s | — |
| Sequence execution p99 | < 30s | — |
| Email delivery p95 | < 5min | — |

## Acceptance Criteria

### AC-18-01: Trace Propagation
- GIVEN a request enters api-gateway
- WHEN routed to downstream services
- THEN `X-Trace-ID` header is forwarded
- AND all log entries include `trace_id`
- AND Cloud Trace shows the full request tree

### AC-18-02: Structured Log Format
```json
{
  "level": "INFO",
  "service": "campaign-service",
  "workspace_id": "...",
  "trace_id": "...",
  "message": "...",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### AC-18-03: SLO Alert
- WHEN error budget is < 10% remaining
- THEN PagerDuty alert fires with severity P1

### AC-18-04: Sentry Backend Error Capture
- GIVEN any unhandled exception in a FastAPI service
- WHEN the exception propagates past the route handler
- THEN Sentry captures it with `workspace_id`, `service`, `trace_id` as tags
- AND the error appears in the Sentry `revlooper-backend` project within 30 seconds

### AC-18-05: Sentry Frontend Error Capture
- GIVEN any unhandled JS exception or failed API call in the portal
- WHEN it occurs in the browser
- THEN Sentry captures it with the user's workspace context
- AND source maps are uploaded so stack traces show original TypeScript

### AC-18-06: SigNoz Traces (Local / Staging)
- GIVEN a request enters api-gateway locally
- WHEN it fans out to downstream services
- THEN SigNoz shows a single trace with all child spans
- AND each span includes `workspace_id` and `service` attributes
