# 34 — Campaign Content Studio — TASKS

**Status:** 📝 Draft
**Last updated:** 2026-05-05

> RED-first. Every task: write failing test first, observe red, then implement.

## Task List

### Task 1 — DB migration: content_assets + content_asset_versions
- **Files:** `services/campaign-service/alembic/versions/XXXX_add_content_assets.py`
- **Test:** `test_migration_creates_content_assets_table_with_all_columns`
- **RED:** migration not created → `alembic upgrade head` fails / table absent
- **GREEN:** migration applies cleanly; all columns, indexes created; `alembic downgrade -1` removes tables

### Task 2 — ContentAsset SQLAlchemy model + Pydantic schemas
- **Files:**
  - `services/campaign-service/app/models/content_asset.py`
  - `services/campaign-service/app/schemas/content_asset.py`
- **Tests:**
  - `test_content_asset_model_defaults_status_to_draft`
  - `test_content_asset_schema_rejects_missing_asset_type`
  - `test_content_asset_schema_null_campaign_id_accepted`
- **RED:** model file not created
- **GREEN:** model has all fields from data model; schema validates correctly

### Task 3 — ContentAsset CRUD routes (GET/POST/PUT/DELETE)
- **Files:** `services/campaign-service/app/routers/content_assets.py`
- **Tests:**
  - `test_get_campaign_assets_returns_only_own_workspace`
  - `test_post_asset_writes_version_record_on_create`
  - `test_put_asset_creates_new_version_row`
  - `test_delete_asset_sets_status_archived_not_hard_delete`
  - `test_create_asset_free_plan_6th_asset_returns_403`
- **RED:** routes not registered
- **GREEN:** all 5 CRUD operations work; plan limit enforced server-side; soft delete confirmed

### Task 4 — Workspace library + promote-to-library
- **Files:** `services/campaign-service/app/routers/content_library.py`
- **Tests:**
  - `test_library_returns_only_null_campaign_id_assets`
  - `test_promote_to_library_sets_campaign_id_null_and_writes_version`
  - `test_library_response_paginated_cursor`
- **RED:** library endpoint not registered
- **GREEN:** all 3 tests pass; cursor pagination defaults to 50 items max

### Task 5 — Version history + restore
- **Files:** `services/campaign-service/app/routers/content_assets.py` (version sub-routes)
- **Tests:**
  - `test_version_history_returns_all_versions_descending`
  - `test_restore_version_updates_main_record_and_adds_new_version_entry`
- **RED:** version routes not registered
- **GREEN:** restore writes audit version; main record reflects restored content

### Task 6 — ai-service: prompt builder with injection protection
- **Files:**
  - `services/ai-service/app/services/prompt_builder.py`
- **Tests:**
  - `test_user_input_xml_special_chars_escaped_in_prompt`
  - `test_rag_chunk_with_xml_delimiters_escaped`
  - `test_prompt_contains_language_instruction_for_vi`
  - `test_prompt_contains_language_instruction_for_th`
- **RED:** prompt builder not created
- **GREEN:** all 4 security + language tests pass

### Task 7 — ai-service: text generation endpoint (SSE)
- **Files:**
  - `services/ai-service/app/routers/content_generation.py`
  - `services/ai-service/app/services/content_gen_service.py`
- **Tests:**
  - `test_credit_deduction_called_before_litellm_invocation`
  - `test_generation_fails_with_402_if_credits_insufficient`
  - `test_sse_response_includes_final_content_and_model_used`
  - `test_rag_context_ids_attached_to_response`
- **RED:** endpoint not registered
- **GREEN:** all 4 tests pass; credits deducted before any LLM call

### Task 8 — image-gen-service: OIDC middleware + health check
- **Files:**
  - `services/image-gen-service/app/main.py`
  - `services/image-gen-service/app/middleware/oidc_auth.py`
- **Tests:**
  - `test_request_without_oidc_token_returns_401`
  - `test_request_with_valid_oidc_token_passes`
  - `test_health_endpoint_returns_200` (unauthed — used by Cloud Run health check)
- **RED:** service not created
- **GREEN:** OIDC middleware rejects invalid tokens; health check unprotected

### Task 9 — image-gen-service: Playwright template renderer
- **Files:**
  - `services/image-gen-service/app/services/playwright_renderer.py`
  - `services/image-gen-service/app/routers/render_template.py`
  - `services/image-gen-service/templates/generic-announcement/template.html.j2`
- **Tests:**
  - `test_render_template_returns_png_bytes`
  - `test_render_uses_sandboxed_jinja2`
  - `test_render_script_tag_in_template_var_is_escaped`
  - `test_renders_correct_size_1080x1080`
  - `test_renders_correct_size_1200x628`
- **RED:** render endpoint not created
- **GREEN:** all 5 tests pass; PNG bytes returned; SSTI test confirms escaping

### Task 10 — image-gen-service: R2 upload + campaign-service callback
- **Files:**
  - `services/image-gen-service/app/services/r2_uploader.py`
  - `services/image-gen-service/app/services/callback_client.py`
- **Tests:**
  - `test_r2_upload_uses_workspace_id_in_key_prefix`
  - `test_callback_patches_campaign_service_on_success`
  - `test_callback_patches_campaign_service_on_failure`
- **RED:** R2 uploader not created; callback not implemented
- **GREEN:** all 3 tests pass; key prefix includes `workspace_id`

### Task 11 — image-gen-service: Ideogram client + AI image endpoint
- **Files:**
  - `services/image-gen-service/app/services/ideogram_client.py`
  - `services/image-gen-service/app/routers/ai_image.py`
- **Tests:**
  - `test_ideogram_called_with_content_filter_true`
  - `test_ideogram_prompt_truncated_at_1000_chars`
  - `test_ideogram_failure_triggers_campaign_service_failed_status`
- **RED:** ideogram client not created
- **GREEN:** all 3 tests pass; content filter always enabled

### Task 12 — campaign-service: image generation Cloud Tasks enqueue
- **Files:** `services/campaign-service/app/services/image_gen_tasks.py`
- **Tests:**
  - `test_enqueue_render_task_sets_generation_status_pending`
  - `test_enqueue_task_deducts_5_credits_before_enqueue`
  - `test_enqueue_ideogram_task_deducts_20_credits`
  - `test_free_plan_image_request_returns_403_before_task_enqueue`
- **RED:** task enqueueing not implemented
- **GREEN:** all 4 tests pass; credits deducted before task enqueue; plan limit checked first

### Task 13 — campaign-service: Starter Pack
- **Files:** `services/campaign-service/app/services/starter_pack_service.py`
- **Tests:**
  - `test_starter_pack_deducts_8_credits_atomically_before_any_generation`
  - `test_starter_pack_saves_5_assets_and_outbox_event_in_one_transaction`
  - `test_second_trigger_returns_existing_status_not_duplicated`
  - `test_starter_pack_refunds_credits_on_generation_failure`
- **RED:** service not created
- **GREEN:** all 4 tests pass; idempotency confirmed; rollback confirmed

### Task 14 — Frontend: ContentStudioPage + AssetGallery + text power functions
- **Files:**
  - `frontend/app/(dashboard)/campaigns/[id]/content-studio/page.tsx`
  - `frontend/components/content-studio/AssetGallery.tsx`
  - `frontend/components/content-studio/AssetCard.tsx`
  - `frontend/components/content-studio/PowerFunctionPicker.tsx`
  - `frontend/hooks/useContentStudio.ts`
- **Tests:**
  - `test_gallery_shows_assets_for_campaign`
  - `test_free_plan_content_studio_images_gate_shown`
  - `test_power_function_picker_shows_14_functions`
  - `test_generate_text_streams_to_content_editor`
- **RED:** page not created
- **GREEN:** all 4 tests pass; Free plan image gate confirmed

### Task 15 — Frontend: StarterPackPanel + async image status
- **Files:**
  - `frontend/components/content-studio/StarterPackPanel.tsx`
  - `frontend/components/content-studio/PreviewCard.tsx`
  - `frontend/hooks/useStarterPack.ts`
  - `frontend/hooks/useAssetGeneration.ts`
- **Tests:**
  - `test_starter_pack_panel_shown_only_when_no_assets`
  - `test_create_this_saves_one_draft_asset`
  - `test_generate_all_calls_batch_endpoint_once_with_8_credits`
  - `test_image_asset_skeleton_transitions_to_thumbnail_on_realtime_ready_event`
- **RED:** panel not created; Realtime not wired
- **GREEN:** all 4 tests pass; auto-show confirmed off on return visit; Realtime update confirmed

### Task 16 — image-gen-service: WeasyPrint brochure renderer
- **Files:**
  - `services/image-gen-service/app/services/weasypaint_renderer.py`
  - `services/image-gen-service/app/routers/render_brochure.py`
  - `services/image-gen-service/templates/brochure/brochure_a4.html.j2`
- **Tests:**
  - `test_render_brochure_returns_pdf_bytes`
  - `test_render_brochure_sections_escaped_in_jinja2`
  - `test_render_brochure_vi_language_uses_noto_sans`
  - `test_render_brochure_pdf_uploaded_to_r2_public_bucket`
  - `test_render_brochure_callback_patches_campaign_service_on_success`
  - `test_render_brochure_callback_patches_campaign_service_on_failure`
- **RED:** route not created; WeasyPrint not installed in Dockerfile
- **GREEN:** all 6 tests pass; PDF bytes confirm valid PDF header (`%PDF`); R2 path uses `workspace_id` prefix

### Task 17 — ai-service: email template generation + campaign-service: default template endpoint
- **Files:**
  - `services/ai-service/app/routers/content_generation.py` (add email template generation endpoint)
  - `services/ai-service/app/services/email_template_builder.py`
  - `services/campaign-service/app/routers/content_assets.py` (add SET default template route)
  - `services/campaign-service/app/models/campaign.py` (add `default_email_template_id` nullable column)
  - `services/campaign-service/alembic/versions/XXXX_add_default_email_template_id.py`
- **Tests:**
  - `test_email_template_generation_deducts_3_credits_before_llm_call`
  - `test_email_template_generation_uses_ai_brain_rag_context`
  - `test_email_template_output_contains_body_placeholder_token`
  - `test_email_template_html_sanitized_before_storage` (no `<script>`, `javascript:` href)
  - `test_set_default_template_writes_outbox_event_atomically`
  - `test_set_default_template_free_plan_returns_403`
- **RED:** endpoints not created; `default_email_template_id` column absent
- **GREEN:** all 6 tests pass; HTML sanitiser confirmed removes `<script>` tags; plan gate confirmed at 403
