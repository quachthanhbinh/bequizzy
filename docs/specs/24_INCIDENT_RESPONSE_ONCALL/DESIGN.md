# Spec 24 — Incident Response & On-Call: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Enterprise customers need SLA commitments. A public status page (Instatus or StatusPage) builds trust. Post-mortem culture reduces churn from outage-related frustration. Confidence: 7.

**CTO:** Cloud Monitoring uptime check → PagerDuty via webhook. On-call rotation: 1-week rotations in PagerDuty. Runbooks as Markdown in repo under `docs/runbooks/`. Status page: Instatus (integrates with PagerDuty, free tier). Confidence: 8.

**Gap: 1. Both ≥ 7. Converge.**

**Final Confidence: 8 / 10.**

---

## Alert Flow

```
Cloud Monitoring → Alert Policy → PagerDuty Webhook → On-call Engineer
                                                     → Escalation (15 min) → Tech Lead
                                                     → Escalation (30 min) → CTO
```

## Post-Mortem Template Structure
```markdown
## Incident: [Title]
**Severity:** P0/P1
**Date:** YYYY-MM-DD
**Duration:** Xh Ym
**Impact:** [# customers affected]

## Timeline
- HH:MM UTC — [what happened]

## Root Cause
[Single sentence]

## Contributing Factors
- ...

## Action Items
| Action | Owner | Due |
|---|---|---|
```
