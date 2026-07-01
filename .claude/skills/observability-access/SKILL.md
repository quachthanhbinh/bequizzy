---
name: observability-access
description: "Use when debugging a bug, investigating a production issue, or verifying a fix. Teaches how to query logs, metrics, and traces for BeQuizzy's polyglot Go/Python/Java/Node.js services."
---

# Observability Access — How to Query Runtime Signals

> Access signals directly from tools below rather than guessing from code inspection.
> BeQuizzy uses structured JSON logging (zerolog for Go, structlog for Python, logback for Java, pino for Node.js).

---

## 1. Local Development

### Service logs (by language)

```bash
# All services (docker-compose)
docker-compose logs -f --tail=100

# One service
docker-compose logs -f api-gateway --tail=100

# Filter errors across all services
docker-compose logs 2>&1 | grep -E '"level":"error"|"level":"fatal"'

# Filter by org/tenant ID
docker-compose logs 2>&1 | grep "org_id=<ORG_ID>"
```

### Go service — zerolog fields

```json
{
  "level": "error",
  "time": "2026-07-01T03:00:00Z",
  "message": "assessment session failed",
  "trace_id": "abc123",
  "org_id": "org-uuid",
  "user_id": "usr-uuid",
  "service": "assessment-engine",
  "latency_ms": 342,
  "error": "scoring timeout after 5s"
}
```

### Python service — structlog fields

```json
{
  "timestamp": "2026-07-01T03:00:00Z",
  "level": "error",
  "event": "scoring.failed",
  "trace_id": "abc123",
  "org_id": "org-uuid",
  "service": "scoring-service"
}
```

### Database queries (debug mode)

```go
// Go — GORM debug (enable per session only)
db.Debug().Where("org_id = ?", orgID).Find(&results)
// prints: SELECT * FROM assessments WHERE org_id = 'uuid'
```

```python
# Python — SQLAlchemy echo
engine = create_async_engine(DATABASE_URL, echo=True)
```

---

## 2. Shared log fields across ALL services

Filter by these to correlate a request across multiple services:

| Field | Purpose |
|---|---|
| `trace_id` | Single request across all services |
| `org_id` | Tenant scoping — always present |
| `user_id` | Individual user within org |
| `session_id` | Assessment session ID |
| `service` | Which microservice emitted this |
| `latency_ms` | Request duration |

---

## 3. Production / Staging (adapt to your hosting)

### Cloud logs (if on GCP Cloud Run)

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="api-gateway"
   AND severity>=ERROR' \
  --limit=50 --project=bequizzy
```

### Postgres slow queries

```sql
-- Queries taking > 500ms
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 500
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Redis (assessment session state)

```bash
redis-cli keys "session:*"          # active sessions
redis-cli ttl "session:<id>"        # time-to-live
redis-cli get "session:<id>"        # full JSON state
```

---

## 4. Non-negotiable signals to check when debugging

1. **Tenant scope leak** — if `org_id` is missing from a log line in a service, that's a non-negotiable §1 violation
2. **AI cost gate** — check logs for `ai_cost_recorded=true` BEFORE any scoring API call; missing = non-negotiable §4
3. **Assessment integrity** — verify response body never contains `rubric`, `answer_key`, `model_answer` fields
4. **PII in logs** — `candidate_voice_url` and `video_url` should never appear in plain text logs; check for `[REDACTED]`

---

## 5. Adding observability to a new service

Regardless of language, every new service endpoint must emit:

```
# Entry log
{"level":"info", "event":"<domain>.<action>.start", "trace_id":"...", "org_id":"..."}

# Exit log (success)
{"level":"info", "event":"<domain>.<action>.done", "trace_id":"...", "latency_ms":N}

# Exit log (error)
{"level":"error", "event":"<domain>.<action>.failed", "error":"...", "trace_id":"..."}
```

Use the language-native structured logger:
- Go → `zerolog`
- Python → `structlog`
- Java → `logback` + `logstash-logback-encoder`
- Node.js → `pino`
