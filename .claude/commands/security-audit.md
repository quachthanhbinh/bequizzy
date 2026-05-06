---
description: "Run a security audit on a service, endpoint, auth flow, webhook, or the full codebase"
agent: security-auditor
argument-hint: "Describe what to audit: a service, endpoint, auth flow, webhook, or 'full'"
---

Run a security audit using OWASP Top 10 + RevLooper-specific risks.

**Target:** $ARGUMENTS

Methodology: zero-noise. Only report findings with **8/10+ confidence**, each with a concrete exploit scenario and a fix.

## Audit Checklist

### Tier 0 — RevLooper Non-Negotiables (CRITICAL if violated)
- [ ] workspace_id scope on every DB query
- [ ] Suppression check before every outbound message in outreach-service
- [ ] Credits deducted via billing-service BEFORE every AI call
- [ ] Webhook signature validation before processing (HMAC timing-safe compare)
- [ ] consent_log written for SEA personal data (VN/TH/SG workspaces)
- [ ] Internal Cloud Run services use `--ingress=internal`
- [ ] Service-to-service via Workload Identity + OIDC (no shared secrets)

### Tier 1 — OWASP Top 10
- [ ] **A01 Broken Access Control** — workspace_id, role checks, internal ingress
- [ ] **A02 Cryptographic Failures** — Secret Manager only, TLS, no plaintext secrets in logs
- [ ] **A03 Injection** — Pydantic + Zod validation, SQLAlchemy bound params, no raw SQL with `.format()`
- [ ] **A04 Insecure Design** — outbox pattern, idempotency keys on retried operations
- [ ] **A05 Security Misconfiguration** — CORS restricted, internal ingress, headers from Cloudflare Worker
- [ ] **A06 Vulnerable Components** — Dependabot, `pip-audit`, `npm audit`
- [ ] **A07 Auth Failures** — JWT validated at api-gateway only, JWKS from Supabase, exp/iss/aud checked
- [ ] **A08 Software Integrity** — signed Docker images, no direct pip/npm install in prod containers
- [ ] **A09 Logging Failures** — structured JSON, never log JWT/secrets/PII at INFO+
- [ ] **A10 SSRF** — validate URLs before outbound calls, block RFC-1918 in webhook callbacks

### Tier 2 — RevLooper-Specific Surfaces
- [ ] **Multi-tenant boundary** — try to access workspace B from workspace A's JWT
- [ ] **Public booking page** — rate limited? Spam protection? No internal data leak?
- [ ] **File upload (RAG)** — size limit, MIME allowlist, R2 path scoped to workspace
- [ ] **AI prompt injection** — lead notes / inbound emails sanitized before LLM
- [ ] **Cross-workspace RAG retrieval** — embeddings query filtered by workspace_id
- [ ] **Credit bypass** — any AI code path that skips billing-service?
- [ ] **Suppression bypass** — any send code path that skips suppression check?
- [ ] **Webhook replay** — idempotency on Paddle/payOS/Mailgun/Twilio webhooks?

### Tier 3 — Frontend / Edge
- [ ] No `dangerouslySetInnerHTML` on user-supplied content
- [ ] CSP headers from Cloudflare Worker
- [ ] CORS allowlist: `revlooper.com`, `staging.revlooper.com` only
- [ ] No client-side secrets (Supabase anon key is fine; service role key is NOT)

## Report Format

For each finding:
```
### [SEVERITY: CRITICAL | HIGH | MEDIUM | LOW] — Title

**Location:** `path/to/file.py:42`
**Exploit scenario:** Step-by-step how an attacker would exploit this
**Impact:** What happens if exploited (data loss, tenant breach, financial loss, etc.)
**Fix:** Specific code change needed
**Confidence:** X/10
```

If no findings above 8/10 confidence, output:
```
✅ No high-confidence findings in {target}.

Reviewed: {list of files / surfaces audited}
Lower-confidence observations (not blocking): {optional list}
```

Use the `security-auditor` agent's checklist as the canonical reference.
