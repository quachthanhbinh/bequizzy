# 04 — Inbound Anchors & Campaign Forms — SECURITY

**Status:** 📝 Draft
**Security flag:** 🟡 MEDIUM
**Last updated:** 2026-05-04

## Threat Summary
Primary risks: unauthenticated webhook endpoints (need HMAC signature verification), XSS via custom form field labels, provider OAuth credential storage, CSRF on hosted forms, and replay attack on submission processing.

## OWASP Top 10 Mapping

| # | Risk | Applicable? | Mitigation |
|---|---|---|---|
| A01 | Broken Access Control | 🔴 YES | Webhook endpoints verify workspace ownership; form scoped to workspace |
| A02 | Cryptographic Failures | 🟡 YES | Webhook HMAC verification; signed CSRF tokens |
| A03 | Injection | 🟡 YES | XSS in form field labels/values rendered to browser |
| A04 | Insecure Design | 🟡 YES | Provider credentials stored via Secret Manager, not DB |
| A05 | Security Misconfiguration | 🟡 YES | Hosted form CSP; webhook endpoints internal rate-limited |
| A08 | Software Integrity | 🟡 YES | Provider webhook payload validation schema |

## Threat Model

### T01 — Unauthenticated Webhook Spoofing
**Attack:** Attacker sends crafted webhook payload to `/v1/webhooks/inbound/facebook_lead_ads/{workspace_id}` pretending to be Facebook.
**Impact:** Fake leads injected into workspace; campaign routing pollution.
**Mitigation:**
- Facebook: verify `X-Hub-Signature-256` header = `HMAC-SHA256(request_body, app_secret)`
- Google: verify JWT audience + issuer via Google's discovery endpoint
- Zalo: verify HMAC-SHA256 with OA secret
- TikTok: verify `X-TikTok-Signature` (HMAC-SHA256)
- Verification failure = 401 returned immediately; body not parsed
- Signature secret stored in GCP Secret Manager, fetched at handler cold start
**Test:** `[SECURITY] test_fb_webhook_invalid_signature_returns_401`, `test_fb_webhook_valid_signature_accepted`

### T02 — CSRF on Hosted Form Submission
**Attack:** Attacker embeds a hosted form on their own page in an iframe and pre-fills it, causing victims to unknowingly submit their data.
**Impact:** Unauthorized lead capture; data integrity pollution.
**Mitigation:**
- CSRF token: server sets a signed token cookie on form page GET; form submission must include matching token
- `SameSite=Strict` cookie attribute on CSRF token
- `Content-Security-Policy: frame-ancestors 'self' revlooper.com *.revlooper.com` — only allows embedding from trusted origins (user can add custom domains in settings)
- Cross-origin form submission rejected if Origin header doesn't match allowed list
**Test:** `test_hosted_form_submit_without_csrf_token_returns_403`

### T03 — XSS via Form Field Labels / Custom Options
**Attack:** Workspace admin creates a form field with label `<script>alert('xss')</script>` which renders to lead filling out the hosted form.
**Impact:** XSS attack on lead browser; session theft, malicious redirects.
**Mitigation:**
- All form field labels/placeholders/option labels sanitized with HTML escape on storage
- React rendering on hosted form uses JSX (auto-escapes by default) — never use `dangerouslySetInnerHTML` with user content
- CSP on hosted form page: `script-src 'self' 'nonce-{random}'` — blocks inline scripts
- Audit log when workspace admin creates/modifies form fields
**Test:** `test_xss_in_form_field_label_is_escaped_on_hosted_form`

### T04 — Provider OAuth Credential Exposure
**Attack:** Facebook/Google OAuth access tokens (used to pull lead form data) stored in database are accessed by an attacker who gets DB read access.
**Impact:** Attacker can access workspace's ad account; modify campaigns.
**Mitigation:**
- OAuth access tokens NEVER stored in database
- `form_sync_connections.credentials_secret` stores only the GCP Secret Manager resource name (e.g., `projects/123/secrets/fb_token_workspace_xyz/versions/latest`)
- Token fetch happens at runtime from Secret Manager — DB compromise doesn't expose tokens
- Token rotation: when provider issues a new token, update Secret Manager version only
**Test:** `test_sync_connection_credentials_not_stored_in_db`

### T05 — Replay Attack on Form Submission
**Attack:** Attacker replays a captured form submission webhook multiple times.
**Impact:** Duplicate leads; inflated metrics; wasted enrichment credits.
**Mitigation:**
- `UNIQUE (workspace_id, provider, provider_submission_id)` constraint in `form_submissions`
- DB `INSERT ... ON CONFLICT DO NOTHING` — replay is idempotent at DB level
- provider_submission_id extracted by adapter from provider's payload (FB lead ID, Google click ID, etc.)
**Test:** `test_duplicate_webhook_submission_is_idempotent`

### T06 — Rate Limiting on Hosted Form (DDoS / Spam)
**Attack:** Attacker submits form thousands of times with fake data.
**Impact:** Workspace lead DB flooded with junk; enrichment credits drained.
**Mitigation:**
- 100 submissions/minute/form enforced via Memorystore sliding window
- reCAPTCHA v3 (invisible) on hosted forms (score < 0.5 = soft reject, log for review)
- IP-based rate limit: 10 submissions/IP/hour across all forms
**Test:** `test_form_submission_rate_limit_blocks_at_101_per_minute`

## RevLooper Non-Negotiables Checklist

| Requirement | Status | Notes |
|---|---|---|
| workspace_id on every DB query | ✅ | All tables workspace-scoped |
| Provider credentials via Secret Manager | ✅ | T04 — never in DB |
| Transactional outbox | ✅ | lead.inbound.captured via outbox |
| Suppression check | ✅ | Inbound leads trigger suppression check via lead.created |
| SEA consent (consent_log) | ✅ | Consent checkbox required for VN/TH/SG; logged before processing |
| Webhook signature verification | ✅ | T01 — all 4 providers |

## Security Tests
- `[SECURITY]` `test_fb_webhook_invalid_signature_returns_401`
- `[SECURITY]` `test_hosted_form_submit_without_csrf_token_returns_403`
- `[SECURITY]` `test_xss_in_form_field_label_escaped_on_hosted_form`
- `[SECURITY]` `test_provider_credentials_stored_in_secret_manager_not_db`
- `[SECURITY]` `test_duplicate_webhook_submission_is_idempotent`
- `[SECURITY]` `test_form_submission_rate_limit_blocks_at_101`
