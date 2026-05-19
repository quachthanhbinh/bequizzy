# 04 — Inbound Anchors & Campaign Forms — TESTS

**Status:** 📝 Draft
**Coverage gate:** campaign-service 85% | lead-service ingest 90% | Security tests 100%
**Last updated:** 2026-05-04

## Test Pyramid

```
         /\          E2E (~10 scenarios, Playwright)
        /  \         ── Form builder, hosted form submit, sync health
       /----\
      / Integ \      Integration (~45 tests)
     /  tests  \     ── Webhook ingest, provider adapters, idempotency
    /------------\
   /  Unit tests  \  Unit (~35 tests)
  /________________\ ── Adapter parsing, HMAC verification, field mapping, CSP
```

## Unit Tests
**File:** `services/campaign-service/tests/unit/forms/`

| Test | What it validates |
|---|---|
| `test_facebook_hmac_verification_valid_signature` | Correct `X-Hub-Signature-256` → True |
| `test_facebook_hmac_verification_invalid_signature` | Wrong signature → False |
| `test_google_ads_jwt_verification_valid` | Valid Google JWT → True |
| `test_google_ads_jwt_verification_expired` | Expired JWT → False |
| `test_facebook_adapter_parses_lead_gen_payload` | FB payload → RawSubmission list |
| `test_google_adapter_parses_payload` | Google payload → RawSubmission list |
| `test_field_mapping_maps_provider_to_lead_fields` | `{"lead_email": "email"}` mapping applied |
| `test_xss_in_form_label_escaped` | `<script>` in label → `&lt;script&gt;` stored |
| `test_form_slug_generated_from_name` | "Contact Us" → "contact-us" |
| `test_form_slug_uniqueness_per_workspace` | Duplicate slug → slug-2 |
| `test_csrf_token_generated_per_session` | Unique token per GET /f/{...} |
| `test_csrf_token_validation_rejects_mismatch` | Wrong token → validation failure |
| `test_rate_limit_counter_increments` | Submission counter increments in Memorystore |
| `test_rate_limit_blocks_at_101` | 101st submission → rate limited |
| `test_utm_hidden_field_extracted` | `utm_source` hidden field → lead.source_id populated |

## Integration Tests
**File:** `services/campaign-service/tests/integration/forms/`

### Webhook Ingest (🔴 CRITICAL — signature + idempotency)
| Test | Priority | What it validates |
|---|---|---|
| `[SECURITY] test_fb_webhook_invalid_signature_returns_401` | 🔴 | Body not parsed on sig failure |
| `[SECURITY] test_fb_webhook_valid_signature_accepted` | 🔴 | Correct sig → 200 + form_submission created |
| `test_webhook_body_not_parsed_before_sig_verified` | 🔴 | No DB write before verification |
| `test_duplicate_fb_webhook_is_idempotent` | | Same lead_id → second call is no-op |
| `test_fb_webhook_acks_within_200ms` | | Response time gate |
| `test_ingest_job_creates_lead_with_source_type` | | `source_type=facebook_lead_ads` |
| `test_ingest_job_deduplicates_existing_email` | | Existing email → update, not create |

### Hosted Form Submit
| Test | What it validates |
|---|---|
| `[SECURITY] test_submit_without_csrf_token_returns_403` | CSRF check enforced |
| `[SECURITY] test_submit_with_valid_csrf_token_succeeds` | Valid token → lead created |
| `test_hosted_form_submit_creates_form_submission_row` | form_submissions row created |
| `test_hosted_form_submit_creates_lead` | lead created with correct fields |
| `test_hosted_form_submit_with_utm_fields` | UTM values on lead source attribution |
| `test_hosted_form_required_field_missing_returns_422` | Missing required field → 422 |
| `test_duplicate_hosted_form_submit_is_idempotent` | Same email → lead updated, not duplicated |

### Sync Health + Replay
| Test | What it validates |
|---|---|
| `test_failed_ingest_creates_failed_submission_row` | ingest_status=failed on DB error |
| `test_replay_endpoint_processes_failed_submissions` | POST /replay → failed rows reprocessed |
| `test_replay_is_idempotent` | Re-replaying already-processed submission → no-op |
| `test_sync_health_shows_error_after_3_consecutive_failures` | status=error after 3 failures |
| `test_sync_health_recovers_after_successful_sync` | status=active after recovery |
| `test_form_sync_connection_error_fires_outbox_event` | `form.sync.connection.error` in outbox |

### Form CRUD
| Test | What it validates |
|---|---|
| `test_create_form_with_fields` | Form + 5 fields created |
| `test_form_publish_makes_hosted_url_accessible` | GET /f/{slug} returns 200 |
| `test_form_draft_not_publicly_accessible` | Draft form → 404 on public URL |
| `test_form_field_xss_sanitized_on_storage` | `<script>` in label stripped on POST |
| `test_max_20_fields_per_form_enforced` | 21st field → 422 |

### Feature Flags
| Test | What it validates |
|---|---|
| `test_zalo_adapter_blocked_without_flag` | `zalo_forms_enabled=false` → 403 |
| `test_tiktok_adapter_blocked_without_flag` | `tiktok_forms_enabled=false` → 403 |
| `test_fb_adapter_active_by_default` | No flag needed for FB |

## E2E Tests
**File:** `frontend/tests/e2e/forms/`

| Scenario | Steps |
|---|---|
| Create hosted form | Add form → add email + name fields → Publish → view hosted URL |
| Submit hosted form | Open hosted URL → fill form → submit → lead appears in CRM |
| Form embed snippet | Copy JS snippet → verify embed code contains correct form_id |
| Campaign form link | Create form → link to campaign → submission auto-routes to campaign |
| FB sync connect | Connect FB page → map fields → connection shows Active |
| Sync health dashboard | Simulate failed webhook → health shows Error + error count |
| Replay failed submissions | Click Replay → failed submissions reprocessed → count resets |
| UTM source attribution | Submit form with ?utm_source=google → lead.source_id = google |
| Duplicate submission | Submit same email twice → "Updated existing lead" confirmation |
| Form field validation | Submit without required email → inline validation error shown |

## Coverage Gates

| Layer | Gate | Enforcement |
|---|---|---|
| campaign-service unit + integration | 85% | `pytest --cov --cov-fail-under=85` |
| lead-service ingest path | 90% | Covered in spec 03 + ingest-specific tests |
| Security tests | 100% must pass | CI gate — webhook sig + CSRF |
| Frontend (Vitest) | 80% | `vitest --coverage` |
| E2E | All 10 scenarios green | CI playwright job |
| Webhook ACK latency | < 200ms p95 | Timed in CI integration test |
