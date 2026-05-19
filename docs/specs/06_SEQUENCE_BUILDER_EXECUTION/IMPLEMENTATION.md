# Spec 06 — Sequence Builder & Execution: IMPLEMENTATION

## Phases

### Phase 1 — Schema + Campaign-Service Builder API
- Alembic migration: `sequences`, `sequence_steps`, `sequence_enrollments`, `sequence_step_executions`
- SQLAlchemy models for all tables
- Sequence CRUD endpoints in `campaign-service`
- Step CRUD with position ordering (atomic reorder)
- Enrollment create endpoint with idempotency guard (partial unique index)
- Enrollment list + detail endpoints

### Phase 2 — sequence-worker (GKE)
- `sequence-worker` GKE Autopilot Deployment
- Cloud Tasks HTTP target: `/tasks/execute-step`
- Step handler dispatch (email/wait/condition/ab_split/linkedin/sms stubs)
- Suppression check client (calls outreach-service)
- Execution logging to `sequence_step_executions`
- Outbox event emission after each step
- Daily send cap (Redis counter)

### Phase 3 — Unsubscribe Fan-out
- Pub/Sub subscription: `lead.unsubscribed` topic → `sequence-worker`
- Bulk enrollment status update handler
- Dead-letter queue + PagerDuty alert on DLQ message

### Phase 4 — Frontend Sequence Builder
- Drag-and-drop step canvas (react-dnd or dnd-kit)
- Step configuration panels per type
- Enrollment management table
- Enrollment status badges + progress tracker

---

## File Map

```
services/campaign-service/
  app/
    models/sequence.py              # Sequence, SequenceStep, SequenceEnrollment models
    schemas/sequence.py             # Pydantic v2 schemas
    routers/sequences.py            # Sequence + enrollment endpoints
    services/sequence_service.py    # CRUD, enrollment logic, status transitions
  alembic/versions/0006_sequences.py

services/sequence-worker/           # GKE Autopilot Deployment
  app/
    main.py                         # FastAPI app (Cloud Tasks HTTP target)
    handlers/
      email_step.py
      wait_step.py
      condition_step.py
      ab_split_step.py
      linkedin_step.py
      sms_step.py
    services/
      execution_engine.py           # Core execute_step() with suppression-first
      suppression_client.py         # HTTP client for outreach-service
      enrollment_service.py         # Enrollment state advancement
    pubsub/
      unsubscribe_handler.py        # Pub/Sub consumer for lead.unsubscribed
    utils/
      daily_cap.py                  # Redis daily send cap

frontend/
  components/sequences/
    SequenceCanvas.tsx              # Drag-and-drop step builder
    StepBlock.tsx                   # Individual step card
    StepConfigPanel.tsx             # Config form for each step type
    EnrollmentTable.tsx             # Enrollment list with status
```

---

## Integration Points

| From | To | Method | Auth |
|---|---|---|---|
| sequence-worker | outreach-service | HTTP GET `/suppression/check` | Workload Identity OIDC |
| sequence-worker | outreach-service | HTTP POST `/email/send` | Workload Identity OIDC |
| sequence-worker | outreach-service | HTTP POST `/sms/send` | Workload Identity OIDC |
| sequence-worker | Pub/Sub | Subscribe `lead.unsubscribed` | Service account |
| Cloud Tasks | sequence-worker | HTTP POST `/tasks/execute-step` | OIDC token |
| campaign-service | Cloud Tasks | HTTP POST (enqueue) | Workload Identity |

---

## k8s Deployment (sequence-worker)

```yaml
# k8s/sequence-worker/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sequence-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sequence-worker
  template:
    spec:
      containers:
      - name: sequence-worker
        image: gcr.io/revlooper/sequence-worker:latest
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"
```
