# 33 — Freemium Feature Gates — SECURITY

**Status:** 📝 Draft
**Risk rating:** 🟡 MEDIUM
**Last updated:** 2025-05-05

## Assets
- Plan enforcement (gates control revenue-generating feature access)
- Upgrade tracking (conversion funnel data)

## Threat Model

| OWASP | Threat | Mitigation |
|---|---|---|
| A01 Broken Access Control | User bypasses client-side gate by calling API directly | Server-side enforcement: all gated API endpoints call `billing-service GET /billing/features/{key}` independently; client gate is presentation only |
| A01 | User modifies `localStorage`/cookies to fake Pro plan | Plan state fetched from server via JWT-authenticated API; no plan data stored client-side in localStorage |
| A04 Insecure Design | Gate component exposes the gated feature's code/content to scrapers (blurred UI but code present in DOM) | For content-heavy gated features (e.g. LinkedIn builder), render a preview placeholder in DOM — not the full component. Full component only renders when `allowed: true` |
| A05 Security Misconfiguration | Feature gate table not seeded for a new plan tier → all features appear allowed | Default-deny: `plan_feature_gates` missing entry → `allowed: false` (billing-service fallback) |

## Controls
- `GET /billing/features/{feature_key}` requires JWT auth + workspace scope — cannot be called anonymously
- Gate component uses `allowed` from server response, not from local plan state
- All 12 feature keys registered in an allowlist in billing-service; unknown keys return `allowed: false`
- `feature_gate_hit` events include `page_path` — enables detection of systematic bypass attempts

## Residual Risk
Low. Gate bypass is a revenue issue, not a security breach. Server-side enforcement prevents actual feature access. The risk is a user wasting engineering time trying to use a feature they can't fully use.
