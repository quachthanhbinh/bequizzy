# Spec 18 — Observability & SLO: TASKS

## TDD Task List

### Task 1 — Structured Logging Middleware
**RED first:** Test U18-02 fails.
**File:** `services/shared/logging.py`
**Done when:** JSON log format with all required fields (trace_id, workspace_id, service, level, timestamp).

### Task 2 — Trace Propagation Middleware
**RED first:** Test U18-01 fails.
**Done when:** trace_id and workspace_id in every log line; X-Trace-ID forwarded to all downstream calls.

### Task 3 — OTel Shared Tracing Module
**RED first:** Span not appearing in OTLP mock collector.
**File:** `services/shared/tracing.py`
**Done when:**
- `OTEL_EXPORTER=signoz` → emits spans to OTLP/gRPC endpoint
- `OTEL_EXPORTER=gcp` → emits to Cloud Trace
- `OTEL_EXPORTER=none` → no-op (used in all tests)
- FastAPI + SQLAlchemy auto-instrumented

### Task 4 — Add OTel + Sentry Deps to All Services
**RED first:** Import of `opentelemetry` fails in any service venv.
**File:** Each service's `pyproject.toml`
**Done when:** `opentelemetry-sdk`, `opentelemetry-instrumentation-fastapi`, `opentelemetry-instrumentation-sqlalchemy`, `opentelemetry-exporter-otlp-proto-grpc`, `sentry-sdk[fastapi]`, `structlog` present in all 20 services.

### Task 5 — Sentry Shared Backend Module
**RED first:** Exception raised in test does not call `sentry_sdk.capture_exception`.
**File:** `services/shared/sentry.py`
**Done when:**
- `SENTRY_DSN` unset → Sentry disabled, no error
- `SENTRY_DSN` set → Sentry initialised with correct environment + release tags
- `workspace_id` attached as tag on every event via middleware
- PII stripping: POST body and raw emails/phones removed before send

### Task 6 — Wire OTel + Sentry into Each Service `main.py`
**RED first:** Request to api-gateway produces no span in OTLP mock.
**Done when:** Every `app/main.py` calls `configure_tracing(SERVICE_NAME)` and `configure_sentry(SERVICE_NAME)` at startup.

### Task 7 — SigNoz in Local Docker Compose
**RED first:** `docker compose up signoz` fails or port 3301 unreachable.
**File:** `infra/local/docker-compose.infra.yml`
**Done when:** SigNoz container starts, UI accessible at `http://localhost:3301`, OTLP port 4317 accepting connections.

### Task 8 — New Env Vars in `.env`
**RED first:** Service fails to start when `OTEL_EXPORTER` is missing.
**File:** `.env` (root) + `.env.example`
**Done when:** `OTEL_EXPORTER`, `SIGNOZ_OTLP_ENDPOINT`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `ENVIRONMENT`, `GIT_SHA` documented and defaulted correctly.

### Task 9 — Sentry Frontend Integration
**RED first:** JS error thrown in portal does not appear in Sentry mock.
**Files:** `apps/portal/sentry.client.config.ts`, `apps/portal/sentry.server.config.ts`, `apps/portal/sentry.edge.config.ts`
**Done when:**
- `@sentry/nextjs` installed
- `NEXT_PUBLIC_SENTRY_DSN` wires up browser error capture
- Source maps uploaded on `next build`
- Workspace context injected from `useAuth()`

### Task 10 — SLO Terraform Resources
**RED first:** Terraform plan shows no SLO resources.
**File:** `infra/monitoring-slos.tf`
**Done when:** SLO policy + error budget alert created in Cloud Monitoring.

### Task 11 — PII-Free Log Verification
**RED first:** Code review gate — scan for email/phone patterns in log calls.
**Done when:** No PII values logged anywhere (UUIDs and IDs only). Sentry `_strip_pii` tested with fixture containing email field.

## Completion Checklist
- [ ] trace_id on all log entries
- [ ] workspace_id on all log entries
- [ ] No PII in logs or Sentry events
- [ ] OTel spans visible in SigNoz at http://localhost:3301 (local)
- [ ] OTel spans exported to Cloud Trace (production)
- [ ] Sentry backend project receiving test exception
- [ ] Sentry frontend project receiving test JS error with source map
- [ ] SigNoz container in docker-compose.infra.yml
- [ ] SLO dashboards visible in Cloud Monitoring
- [ ] Error budget alert configured
- [ ] All env vars documented in .env.example

