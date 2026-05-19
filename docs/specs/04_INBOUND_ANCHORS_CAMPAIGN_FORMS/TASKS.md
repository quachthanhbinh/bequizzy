# 04 — Inbound Anchors & Campaign Forms — TASKS

**Status:** 📝 Draft
**Task count:** 11
**Pattern:** Red → Green → Refactor (TDD).
**Last updated:** 2026-05-04

## Tasks

### T-01 · Alembic migration — campaign_forms, form_fields, form_submissions, form_sync_connections, lead_sources
**Files:**
- `alembic/versions/2026_05_05_004_create_campaign_forms_submissions_sync.py`

**Done when:** `upgrade head` + `downgrade -1` clean; idempotency unique constraint verified.

---

### T-02 · InboundProviderAdapter base class + HMAC / JWT verification utils
**RED first:** `tests/unit/test_adapter_verification.py`

**Files:**
- `services/campaign-service/tests/unit/forms/test_adapter_verification.py`
- `services/campaign-service/app/adapters/base.py`
- `services/campaign-service/app/adapters/utils/hmac_verifier.py`

**Key tests:** valid FB HMAC → True; invalid HMAC → False; body not read before verification.

**Done when:** HMAC verification tests green; `[SECURITY]` test passes.

---

### T-03 · FacebookLeadAdsAdapter + GoogleAdsAdapter
**RED first:** `tests/unit/test_fb_adapter.py`, `tests/unit/test_google_adapter.py`

**Files:**
- `services/campaign-service/app/adapters/facebook_lead_ads_adapter.py`
- `services/campaign-service/app/adapters/google_ads_adapter.py`
- `services/campaign-service/tests/unit/forms/test_fb_adapter.py`
- `services/campaign-service/tests/unit/forms/test_google_adapter.py`

**Done when:** Both adapters parse sandbox payloads to `RawSubmission` correctly; both implement `verify_signature`.

---

### T-04 · Form CRUD service + API router
**RED first:** `tests/integration/test_form_crud.py`

**Files:**
- `services/campaign-service/app/services/form_service.py`
- `services/campaign-service/app/api/v1/campaign_forms.py`
- `services/campaign-service/tests/integration/test_form_crud.py`

**Key tests:** form publish makes URL accessible; draft form returns 404; XSS in label sanitized; max 20 fields enforced.

**Done when:** Form CRUD + field management tests green.

---

### T-05 · CSRF token generation + validation for hosted forms
**RED first:** `tests/unit/test_csrf.py`

**Files:**
- `services/campaign-service/tests/unit/forms/test_csrf.py`
- `services/campaign-service/app/security/csrf.py`

**Done when:** Unique token per GET; mismatch → validation failure; `SameSite=Strict` attribute verified.

---

### T-06 · Ingest pipeline (validate → dedup → create/update lead → route → source attr)
**RED first:** `tests/integration/test_ingest_pipeline.py`

**Files:**
- `services/lead-service/tests/integration/test_ingest_pipeline.py`
- `services/lead-service/app/services/ingest_service.py`

**Key tests:** duplicate email → lead updated not created; source_type populated; route to campaign if configured; idempotency on provider_submission_id.

**Done when:** Ingest pipeline integration tests green; duplicate test proves idempotency.

---

### T-07 · Webhook endpoints (FB + Google) + rate limiting
**RED first:** `tests/integration/test_webhooks.py`

**Files:**
- `services/campaign-service/app/api/v1/webhooks.py`
- `services/campaign-service/tests/integration/test_webhooks.py`

**Key tests:** invalid signature → 401 (body not parsed); valid signature → 200 + form_submission created; webhook ACK < 200ms; rate limit blocks at 101/min/form.

**Done when:** All webhook + rate limit tests green; `[SECURITY]` signature tests GREEN.

---

### T-08 · Sync health state machine + replay endpoint
**Files:**
- `services/campaign-service/app/services/sync_health_service.py`
- `services/campaign-service/app/api/v1/replay.py`
- `services/campaign-service/tests/integration/test_sync_health.py`

**Key tests:** 3 consecutive failures → status=error; replay is idempotent; re-replay already-processed = no-op.

**Done when:** Sync health state machine tests green; replay tests green.

---

### T-09 · Hosted form page (Next.js public route) + JS embed snippet
**Files:**
- `frontend/app/f/[workspaceSlug]/[formSlug]/page.tsx`
- `frontend/components/forms/HostedFormRenderer.tsx`
- `services/campaign-service/app/api/v1/embed.py`

**Done when:** Hosted form renders fields from DB; submit creates lead; JS snippet renders correctly in external page.

---

### T-10 · Frontend — form builder (drag-and-drop) + sync health dashboard
**Files:**
- `frontend/app/(dashboard)/campaigns/[id]/forms/page.tsx`
- `frontend/components/forms/FormBuilder.tsx`
- `frontend/components/forms/SyncHealthDashboard.tsx`
- `frontend/components/forms/ReplayButton.tsx`

**Done when:** All 10 E2E scenarios from TESTS.md pass.

---

### T-11 · Feature flags (zalo, tiktok) + monitoring alerts
**Files:**
- Flag configs in `services/campaign-service/app/config/feature_flags.py`
- `infra/monitoring/inbound-forms-alerts.yaml`

**Key test:** Zalo/TikTok webhooks return 403 when flags disabled; FB/Google active by default.

**Done when:** Flag tests green; 4 monitoring alert policies created.

## Completion Checklist
- [ ] Migrations clean
- [ ] campaign-service coverage ≥ 85%
- [ ] `[SECURITY]` HMAC verification test GREEN
- [ ] `[SECURITY]` CSRF test GREEN
- [ ] `[SECURITY]` XSS sanitization test GREEN
- [ ] Webhook ACK latency < 200ms performance gate GREEN
- [ ] Idempotency test: duplicate provider submission = no-op
- [ ] Zalo + TikTok flags default false, return 403 when disabled
- [ ] All 10 E2E scenarios green
