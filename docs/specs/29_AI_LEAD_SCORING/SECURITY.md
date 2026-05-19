# 29 — AI Lead Scoring — SECURITY

**Status:** 📝 Draft
**Risk rating:** 🟡 MEDIUM
**Last updated:** 2025-05-05

## Threat Model

### Assets
- Lead score data (competitive intelligence — knows who the user's best leads are)
- Score breakdown panel (reveals campaign engagement stats)
- Scoring config (if customisable in Phase 3)

### Threats

| OWASP | Threat | Mitigation |
|---|---|---|
| A01 Broken Access Control | User queries another workspace's lead scores | `workspace_id` enforced on every query; api-gateway validates `X-Workspace-ID` matches JWT sub |
| A01 | Replay `lead_scored_hot` events from another workspace | Pub/Sub subscriber validates `workspace_id` in message before processing |
| A03 Injection | Signal type field injected with arbitrary string | Allowlist validation: `signal_type` must match enum in `weights.py`; Pydantic validator rejects unknown types |
| A04 Insecure Design | Score manipulation: attacker opens email 1000× to inflate score | Per-signal cap enforced in score calculator (e.g. `email_opened` max +24 per email regardless of open count) |
| A05 Security Misconfiguration | scoring-worker CronJob has overly broad GCP SA permissions | SA bound to lead-service Workload Identity; can only publish to `lead_events` topic and write to `leads` + `lead_score_signals` tables |
| A07 Auth Failures | Breakdown panel accessible on Free plan by removing plan gate | Plan check enforced server-side in api-gateway route config, not client-side only |

## Controls
- All score reads/writes scoped to `workspace_id` (enforced in SQLAlchemy query layer via `get_workspace_id()` dependency)
- `lead_score_signals` cascade-deletes on lead delete (no orphaned PII)
- Rate limit on `GET /leads/{id}/score`: 60 rpm per workspace (prevents scraping all scores)
- No score data in error messages or logs beyond `lead_id` (no email addresses in score logs)

## Residual Risk
Low after mitigations. Score data is not directly PII but does reveal commercial intelligence about the user's pipeline — workspace isolation is the primary control.
