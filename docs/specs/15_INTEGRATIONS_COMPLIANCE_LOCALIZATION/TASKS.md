# Spec 15 — Integrations, Compliance & Localization: TASKS

## TDD Task List

### Task 1 — Migration: webhook_endpoints, webhook_deliveries, gdpr_erasure_requests
**RED first:** Model import fails.
**Done when:** Upgrade + downgrade succeed.

### Task 2 — Webhook URL Validation (SSRF block)
**RED first:** Test U15-01 fails.
**Done when:** Private IP ranges blocked at validation layer.

### Task 3 — HMAC Signing
**RED first:** Test U15-02 fails.
**Done when:** sign/verify functions pass.

### Task 4 — Webhook Delivery with Retry
**RED first:** Test I15-01 fails.
**Done when:** HMAC delivered; 3-retry Cloud Tasks logic.

### Task 5 — GDPR Erasure Endpoint + Batch Job
**RED first:** Test I15-02 fails.
**Done when:** I15-02 passes; PII nulled, log updated.

### Task 6 — HubSpot OAuth + Sync Job
**RED first:** Mock HubSpot batch upsert fails.
**Done when:** Contacts sync within 5 min.

### Task 7 — i18n EN/VN Setup
**RED first:** Vietnamese translation key missing test fails.
**Done when:** next-intl configured; EN and VN translation files present.

## Completion Checklist
- [ ] SSRF blocked for private IP webhook URLs
- [ ] HMAC signature on all webhook deliveries
- [ ] GDPR erasure tested end-to-end
- [ ] `mypy app/` passes; coverage ≥ 80%
