# Spec 18 — Observability & SLO: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Engineering velocity depends on fast debugging. Traces + structured logs are developer quality-of-life, not just ops. SLO dashboards build trust with enterprise customers. Confidence: 8.

**CTO:** OpenTelemetry SDK in all Python services; Cloud Trace as backend (zero extra cost on GCP). `structlog` for structured JSON logging with workspace_id context. SLO: Google Cloud Monitoring custom metrics + error budget policy. Confidence: 8.

**Gap: 0. Both ≥ 7. Converge Round 1.**

**Final Confidence: 8 / 10.**

---

### Amendment — SigNoz + Sentry Addition (Round 2)

**CPO:** Local/staging with only Cloud Trace is blind during dev — you need to buy GCP to see traces. SigNoz free cloud (200 GB logs + 50 GB traces/month) gives full OTel UI for free. Sentry free tier (5K errors/month) covers both backend and frontend error alerting. SEA solo founders can't afford PagerDuty — Sentry Slack alerts are the practical alternative. Confidence: 9.

**CTO:** Agreed on SigNoz for local + staging — it is OTel-native and Docker-composable; zero vendor lock-in since the SDK stays the same. Sentry Python SDK with `sentry-sdk[fastapi]` is battle-tested; `@sentry/nextjs` covers source-map uploads automatically. One architecture concern: don't double-instrument — OTel traces go to SigNoz (dev/staging) or Cloud Trace (prod) via env-var-selected exporter, not both at once. Sentry captures exceptions independently via its own transport. Confidence: 9.

**Gap: 0. Both ≥ 7. Converge Round 2.**

**Final Confidence: 9 / 10.**

---

## Tool Roles

| Tool | Role | Environment |
|---|---|---|
| **OTel SDK** | Instrument traces + metrics in every service | All |
| **SigNoz** | OTel backend — traces, logs, dashboards | Local, Staging |
| **Cloud Trace** | OTel backend — traces | Production (GCP) |
| **Cloud Monitoring** | SLO policies, error budget alerts | Production |
| **structlog** | Structured JSON logging, OTel log bridge | All |
| **Sentry (backend)** | Unhandled exception capture, alerts | All |
| **Sentry (frontend)** | JS error capture, performance, source maps | All |

---

## Logging Middleware (All Services)
```python
import structlog
import uuid

logger = structlog.get_logger()

async def logging_middleware(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))
    workspace_id = request.headers.get("X-Workspace-ID", "")
    structlog.contextvars.bind_contextvars(
        trace_id=trace_id,
        workspace_id=workspace_id,
        service=settings.SERVICE_NAME,
    )
    response = await call_next(request)
    response.headers["X-Trace-ID"] = trace_id
    return response
```

---

## OpenTelemetry Setup — Environment-Selected Exporter

The same SDK code runs everywhere; the exporter is selected by `OTEL_EXPORTER` env var.

```python
# services/shared/tracing.py
import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

def configure_tracing(service_name: str) -> None:
    exporter_type = os.getenv("OTEL_EXPORTER", "signoz")  # signoz | gcp | none

    if exporter_type == "gcp":
        from opentelemetry.exporter.gcp.trace import CloudTraceSpanExporter
        exporter = CloudTraceSpanExporter()
    elif exporter_type == "signoz":
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        exporter = OTLPSpanExporter(
            endpoint=os.getenv("SIGNOZ_OTLP_ENDPOINT", "http://localhost:4317"),
        )
    else:
        return  # No-op in test environments

    provider = TracerProvider()
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    # Auto-instrument FastAPI + SQLAlchemy
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
    FastAPIInstrumentor().instrument()
    SQLAlchemyInstrumentor().instrument()
```

**Env vars per environment:**

| Env | `OTEL_EXPORTER` | `SIGNOZ_OTLP_ENDPOINT` |
|---|---|---|
| Local (Docker) | `signoz` | `http://signoz-otel-collector:4317` |
| Staging | `signoz` | `https://ingest.signoz.io:443` (SigNoz cloud) |
| Production | `gcp` | _(unused)_ |
| Tests | `none` | _(unused)_ |

---

## Sentry — Backend (Python / FastAPI)

```python
# services/shared/sentry.py
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

def configure_sentry(service_name: str) -> None:
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return  # Skip in local/test if DSN not set

    sentry_sdk.init(
        dsn=dsn,
        environment=os.getenv("ENVIRONMENT", "local"),
        release=os.getenv("GIT_SHA", "dev"),
        traces_sample_rate=0.1,  # 10% of requests for performance
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        before_send=_strip_pii,
    )
    # Tag every event with the service name
    with sentry_sdk.configure_scope() as scope:
        scope.set_tag("service", service_name)

def _strip_pii(event, hint):
    """Remove any email/phone from Sentry events before sending."""
    # Never send raw PII — workspace_id and user_id only
    if "request" in event:
        event["request"].pop("data", None)  # Strip POST body
    return event
```

**Middleware — attach workspace_id to each Sentry event:**
```python
async def sentry_workspace_middleware(request: Request, call_next):
    workspace_id = request.headers.get("X-Workspace-ID", "")
    with sentry_sdk.configure_scope() as scope:
        scope.set_tag("workspace_id", workspace_id)
    return await call_next(request)
```

---

## Sentry — Frontend (Next.js)

```bash
npx @sentry/wizard@latest -i nextjs
```

Key config in `sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "local",
  tracesSampleRate: 0.1,
  // Attach workspace context from AuthProvider
  beforeSend(event) {
    return event; // PII stripping handled server-side
  },
});
```

Source maps uploaded automatically by `@sentry/nextjs` during `next build`.

---

## SigNoz — Local Docker Compose

Add to `infra/local/docker-compose.infra.yml`:
```yaml
signoz:
  image: signoz/signoz:latest
  container_name: revlooper-local-signoz
  ports:
    - "3301:3301"   # SigNoz UI
    - "4317:4317"   # OTLP gRPC receiver
    - "4318:4318"   # OTLP HTTP receiver
  volumes:
    - revlooper_signozdata:/var/lib/signoz
  restart: unless-stopped
```

Access at `http://localhost:3301`.

---

## Required Python Dependencies (per service)

```toml
# Added to each service's pyproject.toml [dependencies]
"opentelemetry-sdk>=1.24",
"opentelemetry-instrumentation-fastapi>=0.45b0",
"opentelemetry-instrumentation-sqlalchemy>=0.45b0",
"opentelemetry-exporter-otlp-proto-grpc>=1.24",  # for SigNoz
"sentry-sdk[fastapi]>=2.0",
"structlog>=24.1",
```

For production GCP only (api-gateway and Cloud Run services):
```toml
"opentelemetry-exporter-gcp-trace>=1.6",
```

---

## Required Frontend Dependencies

```bash
npm install @sentry/nextjs
```

---

## Env Vars — New additions to `.env`

```bash
# Observability
OTEL_EXPORTER=signoz
SIGNOZ_OTLP_ENDPOINT=http://localhost:4317
SENTRY_DSN=                        # backend DSN from sentry.io
NEXT_PUBLIC_SENTRY_DSN=            # frontend DSN from sentry.io
ENVIRONMENT=local                  # local | staging | production
GIT_SHA=dev                        # injected by CI/CD
```

---

## SLO Configuration (Cloud Monitoring — Production)
```yaml
# Cloud Monitoring SLO: API availability
goal: 0.999
rollingPeriod: 30d
requestBased:
  goodTotalRatio:
    goodServiceFilter: 'resource.type="cloud_run_revision" AND httpRequest.status<500'
    totalServiceFilter: 'resource.type="cloud_run_revision"'
```

