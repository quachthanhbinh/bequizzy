# 33 — Freemium Feature Gates — TASKS

**Status:** 📝 Draft
**Last updated:** 2025-05-05

> RED-first.

## Task List

### Task 1 — featureKeys.ts registry
- **Files:** `frontend/lib/featureKeys.ts`
- **Test:** `test_feature_keys_registry_has_12_entries`
- **RED:** file not created
- **GREEN:** all 12 keys defined as const enum

### Task 2 — useFeatureGate hook: success path
- **Files:** `frontend/hooks/useFeatureGate.ts`
- **Test:** `test_returns_allowed_true_when_plan_permits`
- **RED:** hook not implemented
- **GREEN:** returns `allowed: true` from mocked billing API

### Task 3 — useFeatureGate hook: gate blocked path
- **Test:** `test_returns_allowed_false_when_plan_insufficient`
- **RED:** no blocked state
- **GREEN:** returns `allowed: false`, `requiredPlan`, `reason`

### Task 4 — useFeatureGate hook: analytics event on block
- **Tests:** `test_fires_feature_gate_hit_on_first_block`, `test_no_duplicate_event_same_session`
- **RED:** no event firing
- **GREEN:** `feature_gate_hit` fired once per session per gate

### Task 5 — GateWall component: renders children when allowed
- **Files:** `frontend/components/gates/GateWall.tsx`
- **Test:** `test_renders_children_when_allowed`
- **RED:** component not created
- **GREEN:** children rendered without wrapper

### Task 6 — GateWall component: renders gate UI when blocked
- **Test:** `test_renders_gate_wall_when_not_allowed`
- **RED:** no blocked rendering
- **GREEN:** GateWall shown with upgrade CTA and required plan name

### Task 7 — GateWall: upgrade button → analytics + Paddle
- **Test:** `test_upgrade_button_fires_event_and_navigates`
- **RED:** button not wired
- **GREEN:** clicks fire `feature_gate_upgrade_clicked` and open upgrade modal

### Task 8 — GateWall: dismiss button → analytics
- **Test:** `test_dismiss_fires_dismissed_event`
- **RED:** dismiss not wired
- **GREEN:** `feature_gate_dismissed` event fired; gate re-shows on next hit

### Task 9 — Preview panels for G1–G5
- **Test:** `test_preview_panel_renders_for_lead_limit_gate`
- **RED:** no preview component
- **GREEN:** G1 preview shows "5,000 leads" illustration; G2 shows AI draft quality preview

### Task 10 — Wire G1 (lead limit) gate into LeadImport
- **Test:** `test_lead_import_shows_gate_at_101_leads`
- **RED:** no gate in import flow
- **GREEN:** GateWall renders when Free workspace hits 100 lead limit

### Task 11 — Wire G2 (credits) gate into AI email draft
- **Test:** `test_ai_draft_shows_gate_when_credits_zero`
- **RED:** no credits gate in draft flow
- **GREEN:** GateWall renders with credits-related copy

### Task 12 — Wire G3 (LinkedIn step) gate into SequenceStepPicker
- **Test:** `test_linkedin_step_shows_gate_for_free_plan`
- **RED:** no gate for LinkedIn step
- **GREEN:** GateWall with LinkedIn preview shown for Free users

### Task 13 — Wire remaining gates G4–G12
- Wire GateWall into all remaining gate locations
- Integration test for each: confirm server-side 403 matches client-side gate

### Task 14 — Gate conversion analytics events wired to analytics-service
- **Test:** `test_feature_gate_hit_event_sent_to_analytics`
- **RED:** events not sent
- **GREEN:** events reach analytics-service event ingestion endpoint

### Task 15 — Verify-RED + coverage check
- Full suite passes; coverage ≥ 80% on hook + component
- E2E: G1, G2, G3 gates all show and block correctly
- Server-side bypass test: direct API call to gated endpoint as Free user → 403
