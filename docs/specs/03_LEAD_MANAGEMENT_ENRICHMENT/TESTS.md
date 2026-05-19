# 03 — Lead Management & Enrichment — TESTS

**Status:** 📝 Draft
**Coverage gate:** lead-service 90% | Frontend 80% | Security tests 100%
**Last updated:** 2026-05-04

## Test Pyramid

```
         /\          E2E (~12 scenarios, Playwright)
        /  \         ── Lead import, enrichment, bulk ops
       /----\
      / Integ \      Integration (~50 tests)
     /  tests  \     ── Import pipeline, Hunter/Apollo clients, dedup, bulk
    /------------\
   /  Unit tests  \  Unit (~40 tests)
  /________________\ ── CSV parsing, dedup logic, enrichment state machine, limit enforcement
```

## Unit Tests
**File:** `services/lead-service/tests/unit/`

| Test | What it validates |
|---|---|
| `test_csv_formula_injection_sanitized` | Export with `=CMD(...)` cell → prefixed with `'` |
| `test_csv_parse_handles_utf8_bom` | BOM prefix in CSV does not break column detection |
| `test_csv_parse_handles_windows_line_endings` | CRLF rows parsed correctly |
| `test_email_normalization_lowercases` | `User@Example.COM` → `user@example.com` |
| `test_dedup_exact_email_match_detected` | Same email in same workspace → duplicate flag |
| `test_dedup_different_workspace_not_duplicate` | Same email, different workspace → not duplicate |
| `test_enrichment_state_machine_happy_path` | unverified → verified → enriched |
| `test_enrichment_state_machine_invalid_path` | unverified → invalid (Hunter result) |
| `test_free_plan_limit_100_enforced` | 101st lead write raises `LEAD_LIMIT_REACHED` |
| `test_source_attribution_fields_all_present` | Lead created from form has all source fields |
| `test_lead_soft_delete_sets_deleted_at` | DELETE sets deleted_at, not hard-deleted |
| `test_bulk_delete_requires_confirm_flag` | Without `confirm_delete: true` → validation error |

## Integration Tests
**File:** `services/lead-service/tests/integration/`

### CSV Import Pipeline
| Test | What it validates |
|---|---|
| `test_csv_import_1000_rows_in_under_30s` | Performance gate — fail if >30s |
| `test_csv_import_partial_success` | 30% invalid rows → good rows imported; error CSV URL returned |
| `test_csv_import_malicious_file_rejected` | Executable with .csv extension → 415 |
| `test_csv_import_over_25mb_rejected` | 26MB file → 413 |
| `test_csv_import_duplicate_rows_flagged` | 10% duplicate emails → flagged as duplicates |
| `test_csv_import_creates_enrichment_jobs` | Hunter verify jobs created after import |
| `test_csv_import_column_mapping_required_email` | Missing email column mapping → 422 |

### Enrichment
| Test | What it validates |
|---|---|
| `test_hunter_verify_sets_verified_status` | Hunter returns valid → status = 'verified' |
| `test_hunter_verify_sets_invalid_status` | Hunter returns invalid → status = 'invalid' |
| `test_apollo_enrich_deducts_3_credits_first` | billing-service called before Apollo API |
| `test_apollo_enrich_fills_title_company_fields` | Apollo response mapped to lead fields |
| `test_apollo_enrich_fails_with_zero_credits` | 402 returned; Apollo not called |
| `test_enrichment_retry_on_provider_timeout` | Provider 504 → job retried up to 3 times |
| `test_enrichment_job_partial_success` | Hunter success + Apollo failure → lead updated partially |

### Free Plan Enforcement
| Test | Priority | What it validates |
|---|---|---|
| `[SECURITY] test_concurrent_import_does_not_exceed_free_limit` | 🔴 | Concurrent imports → max 100 leads (SELECT FOR UPDATE) |
| `test_101st_lead_import_blocked` | | 101st import → 402 + upgrade CTA in response |

### Cross-Workspace Isolation
| Test | Priority | What it validates |
|---|---|---|
| `[SECURITY] test_workspace_a_cannot_read_workspace_b_leads` | 🔴 | RLS enforced |
| `[SECURITY] test_workspace_a_cannot_bulk_delete_workspace_b_leads` | 🔴 | Bulk action scoped |

### Bulk Operations
| Test | What it validates |
|---|---|
| `test_bulk_tag_applies_to_all_selected_leads` | 5 leads tagged in one operation |
| `test_bulk_delete_creates_audit_log` | Bulk delete → `lead_activities` audit entry |
| `test_bulk_export_respects_role` | Viewer role → bulk export returns 403 |

### Lead CRUD
| Test | What it validates |
|---|---|
| `test_create_lead_emits_lead_created_event` | Outbox event created |
| `test_duplicate_email_in_workspace_returns_409` | Unique constraint message |
| `test_lead_list_fts_search` | Search "acme" returns leads with company Acme |
| `test_lead_list_filter_by_status` | `status=invalid` filter works |
| `test_lead_list_cursor_pagination` | Correct cursor pagination (no duplicate rows) |
| `test_lead_activity_timeline_sorted_desc` | Activities returned in created_at DESC order |

## E2E Tests
**File:** `frontend/tests/e2e/leads/`

| Scenario | Steps |
|---|---|
| Manual lead create | Fill form → lead appears in list with source=manual |
| CSV import success | Upload 100-row CSV → map columns → import completes → 100 leads visible |
| CSV import with errors | Upload CSV with 10 bad rows → 90 imported → error CSV downloadable |
| Duplicate handling | Import email that already exists → "3 duplicates skipped" shown |
| Enrichment trigger | Click Enrich on lead → credits deducted → enriched status appears |
| Free plan limit | Import 95 leads; try import 10 more → upgrade modal shown |
| Bulk tag | Select 5 leads → Apply tag "Hot" → all 5 show Hot tag |
| Lead detail timeline | Click lead → activity timeline shows import + enrich events |
| Search and filter | Search "acme" → filtered results; add status filter → correct subset |
| Bulk export | Select 10 leads → Export CSV → file downloaded with correct columns |
| Viewer cannot export | Switch to viewer role → Export button disabled |
| Lead soft delete | Delete lead → gone from list; recoverable via admin panel |

## Coverage Gates

| Layer | Gate | Enforcement |
|---|---|---|
| lead-service unit + integration | 90% | `pytest --cov --cov-fail-under=90` |
| Security tests | 100% must pass | CI gate |
| Frontend (Vitest) | 80% | `vitest --coverage` |
| E2E | All 12 scenarios green | CI playwright job |
| Import performance | 1k rows < 30s | Timed in CI integration test |
