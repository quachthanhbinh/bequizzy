# Spec 18 — Observability & SLO: IMPLEMENTATION

## Phases
1. **Logging Middleware**: `shared/logging.py` — structlog JSON config + context binding
2. **OpenTelemetry**: Cloud Trace exporter; trace propagation in all service clients
3. **SLO Dashboards**: Cloud Monitoring policy + error budget alert in Terraform
4. **Rollout**: Add middleware to all services

## File Map
```
services/shared/
  logging.py           # structlog config + middleware
  tracing.py           # OpenTelemetry setup

infra/
  monitoring-slos.tf   # Cloud Monitoring SLO + alert policies
```
