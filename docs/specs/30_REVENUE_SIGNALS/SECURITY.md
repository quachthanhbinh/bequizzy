# 30 — Revenue Signals — SECURITY

**Status:** 📝 Draft
**Risk rating:** 🟡 MEDIUM
**Last updated:** 2025-05-05

## Assets
- Pipeline value data (commercially sensitive; competitor could use to understand user's business scale)
- Historical snapshots (trend data reveals business health over time)

## Threat Model

| OWASP | Threat | Mitigation |
|---|---|---|
| A01 Broken Access Control | User fetches another workspace's revenue data | `workspace_id` enforced on all analytics queries; JWT sub validated against `X-Workspace-ID` |
| A01 | Agency owner sees client workspace revenue without permission | Workspace impersonation (spec 14) uses scoped tokens; revenue endpoint checks active workspace scope |
| A03 Injection | Currency or period param injected | Pydantic validator: `period` is enum (`30d`,`90d`,`1y`); `currency` is ISO 4217 allowlist |
| A04 Insecure Design | `pipeline_dropped` event contains deal IDs that another service could misuse | Event payload contains only aggregate values — no deal IDs or lead names |

## Controls
- analytics-aggregator reads crm-service via internal service-to-service REST (Workload Identity OIDC), not direct DB access
- `pipeline_snapshots` table has RLS enabled: `workspace_id = current_setting('app.workspace_id')`
- Rate limit on `GET /analytics/revenue`: 30 rpm per workspace

## Residual Risk
Low. Aggregate financial data is sensitive but not PII. Primary risk is cross-tenant access, which workspace_id scoping and RLS mitigate.
