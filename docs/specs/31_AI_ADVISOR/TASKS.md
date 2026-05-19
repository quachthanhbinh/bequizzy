# 31 — AI Advisor — TASKS

**Status:** 📝 Draft
**Last updated:** 2025-05-05

> RED-first: write the failing test first, confirm it fails for the right reason, then implement.

## Task List

### Task 1 — DB migration: advisor_notifications + advisor_chat_sessions
- **Test:** `test_advisor_notifications_table_exists`
- **RED:** tables don't exist
- **GREEN:** migration creates both tables with indexes

### Task 2 — Trigger handler: hot_lead → notification
- **Files:** `app/subscribers/advisor_trigger_handler.py`
- **Test:** `test_hot_lead_event_creates_notification`
- **RED:** handler not wired
- **GREEN:** `lead_scored_hot` event creates `advisor_notifications` row

### Task 3 — Trigger handler: batching debounce
- **Test:** `test_hot_lead_batching_debounce`
- **RED:** no debounce — 50 events create 50 rows
- **GREEN:** 50 events in 2 min → 1 batched notification

### Task 4 — Trigger handler: pipeline_drop + bounce triggers
- **Tests:** `test_pipeline_drop_event_creates_notification`, `test_bounce_threshold_creates_notification`
- **RED:** handlers not implemented
- **GREEN:** both triggers create correct notifications

### Task 5 — GET /advisor/notifications endpoint
- **Test:** `test_get_notifications_returns_unread_first`
- **RED:** endpoint not implemented
- **GREEN:** returns notifications sorted by created_at DESC, unread first

### Task 6 — PATCH /advisor/notifications/{id} (read + dismiss)
- **Tests:** `test_patch_notification_read`, `test_patch_notification_dismiss_sets_dismissed_until`, `test_patch_requires_ownership`
- **RED:** endpoint not implemented
- **GREEN:** read/dismiss updates correctly; 403 on wrong workspace

### Task 7 — Advisor tool registry
- **Files:** `app/advisor/tools.py`
- **Test:** `test_get_campaign_stats_tool_returns_correct_data`
- **RED:** tools not implemented
- **GREEN:** `get_campaign_stats` fetches from analytics-service with workspace scope

### Task 8 — Advisor chat: LLM function calling loop
- **Files:** `app/advisor/chat.py`
- **Test:** `test_campaign_query_calls_get_campaign_stats_tool`
- **RED:** no function calling
- **GREEN:** LLM selects correct tool for campaign question

### Task 9 — Advisor chat: prompt injection defence
- **Tests:** `test_external_content_wrapped_in_xml_tags`, `test_prompt_injection_does_not_leak_data`
- **RED:** external content injected raw into prompt
- **GREEN:** inbox content wrapped in `<external_data>` tags; injection test produces safe response

### Task 10 — Advisor chat: credit deduction
- **Test:** `test_chat_deducts_credits_before_llm_call`
- **RED:** no billing-service call
- **GREEN:** credits deducted before LLM; 0 credits returns 402

### Task 11 — POST /advisor/chat endpoint
- **Test:** `test_chat_endpoint_returns_response_and_session_id`
- **RED:** endpoint not implemented
- **GREEN:** returns structured response with session_id

### Task 12 — Frontend: NotificationBell + NotificationDrawer
- **Test:** Vitest `renders_badge_count_from_api`
- **RED:** component not created
- **GREEN:** badge shows unread count; drawer shows notification list

### Task 13 — Frontend: AdvisorChatPanel (floating drawer)
- **Test:** `renders_chat_input_and_sends_message`
- **RED:** component not created
- **GREEN:** panel opens, message sent, response rendered

### Task 14 — EDD: golden dataset eval
- Run 5 golden queries against chat endpoint
- Assert: groundedness ≥ 4/5, actionability ≥ 4/5, no PII leakage

### Task 15 — Verify-RED + coverage check
- Full suite passes; coverage ≥ 85% on trigger_handler + chat modules
- Prompt injection adversarial test passes
