# NN — <FEATURE> — SECURITY

**Status:** 📝 Draft
**Security flag:** 🟢 LOW | 🟡 MEDIUM | 🔴 HIGH
**Auditor:** awaiting security-auditor agent review pre-launch

## Threat Model Summary
<2–3 sentences: what is the worst plausible failure and why this flag level>

## Trust Boundaries
```
[user] ─jwt→ [api-gateway] ─OIDC→ [<service>] ─OIDC→ [<other services>]
                                       │
                                       └──→ [<external — UNTRUSTED>]
```
**Untrusted inputs:** <list>
**Trusted:** <list>

## Mitigations (mapped to threats)

### T1 — <threat>
- ✅ <mitigation>
- ✅ <test that verifies it>

### T2 — <threat>
- ✅ ...

## OWASP Top 10 Walkthrough

| OWASP | Status | Notes |
|---|---|---|
| **A01 Broken Access Control** | ✅ / ⏳ | <how workspace_id + RLS + permission check apply> |
| **A02 Cryptographic Failures** | ✅ | <secrets, TLS, PII> |
| **A03 Injection** | ✅ | <SQL, prompt injection, XSS> |
| **A04 Insecure Design** | ✅ | <outbox, idempotency, rate limit> |
| **A05 Security Misconfiguration** | ✅ | <ingress, CORS> |
| **A06 Vulnerable Components** | ⏳ | <pip-audit / npm-audit pinning> |
| **A07 Auth Failures** | ✅ | <JWT validation point, service-to-service> |
| **A08 Software Integrity** | ✅ | <signed images, no runtime install> |
| **A09 Logging Failures** | ✅ | <structured JSON, no PII at INFO+, trace_id> |
| **A10 SSRF** | ✅ | <allowlisted outbound> |

## Platform Non-Negotiables Check
- [ ] Every DB query scoped by `workspace_id`
- [ ] No imports of another service's SQLAlchemy models
- [ ] Credits deducted via billing-service BEFORE AI call
- [ ] Suppression check applied (if outbound)
- [ ] Outbox pattern for all domain events
- [ ] Soft FKs across service boundaries
- [ ] No hardcoded secrets — all via Secret Manager
- [ ] No direct LLM SDK imports — only LiteLLM router
- [ ] SEA consent: `consent_log` covers this data use

## Open Security Items
1. <item> — owner / blocker phase

## Done Definition
- [ ] All mitigations implemented and tested
- [ ] All adversarial evals pass (if AI feature)
- [ ] security-auditor agent review with no BLOCKER findings
