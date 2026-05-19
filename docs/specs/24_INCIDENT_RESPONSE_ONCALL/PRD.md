# Spec 24 — Incident Response & On-Call: PRD

## Problem Statement

Without a defined incident process, team members improvise under pressure during outages, leading to longer MTTRs and repeated incidents.

## Acceptance Criteria

### AC-24-01: Severity Matrix
| Severity | Definition | Page SLA | Owner |
|---|---|---|---|
| P0 | Full service outage (all customers impacted) | 5 min | On-call eng |
| P1 | Major degradation (>25% customers) | 15 min | On-call eng |
| P2 | Minor degradation (few customers) | 2 hours | Next business hour |
| P3 | Cosmetic / UX issue | Next sprint | Product |

### AC-24-02: PagerDuty Integration
- Alert triggers from Cloud Monitoring → PagerDuty
- Escalation: L1 (on-call) → L2 (tech lead) → L3 (CTO) at 15/30 min

### AC-24-03: Runbook Library
- Runbook per P0/P1 scenario in `docs/runbooks/`
- Each runbook: title, symptoms, diagnosis steps, resolution, post-mortem link

### AC-24-04: Post-Mortem Template
- Blameless; required within 48h for P0, 1 week for P1
- Sections: timeline, impact, root cause, contributing factors, action items
