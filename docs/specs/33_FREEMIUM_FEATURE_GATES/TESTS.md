# 33 — Freemium Feature Gates — TESTS

**Status:** 📝 Draft
**Coverage gate:** ≥ 80% on gate component + hook
**Last updated:** 2025-05-05

## Unit Tests

### useFeatureGate hook
- [ ] `test_returns_allowed_true_when_plan_permits`
- [ ] `test_returns_allowed_false_when_plan_insufficient`
- [ ] `test_fires_feature_gate_hit_event_on_first_block`
- [ ] `test_does_not_fire_duplicate_gate_hit_in_same_session`

### GateWall component
- [ ] `test_renders_children_when_allowed`
- [ ] `test_renders_gate_wall_when_not_allowed`
- [ ] `test_upgrade_button_fires_feature_gate_upgrade_clicked_event`
- [ ] `test_dismiss_button_fires_feature_gate_dismissed_event`
- [ ] `test_preview_panel_renders_for_g1_to_g5_gates`

### Server-side gate enforcement (billing-service)
- [ ] `test_unknown_feature_key_returns_not_allowed` — default-deny
- [ ] `test_correct_plan_returns_allowed`
- [ ] `test_insufficient_plan_returns_reason_and_upgrade_url`

## Integration Tests
- [ ] API endpoint with gated feature: Free plan → 403 with gate metadata
- [ ] API endpoint with gated feature: Pro plan → 200
- [ ] Upgrade flow: gate hit → Paddle checkout → webhook → plan updated → gate cleared

## E2E Tests (Playwright)
- [ ] G1: Import 101st lead as Free user → GateWall shown with lead preview
- [ ] G2: Use 51st credit as Free user → GateWall shown referencing last AI draft
- [ ] G3: Add LinkedIn step as Free user → GateWall with LinkedIn preview
- [ ] Upgrade CTA opens checkout (mocked Paddle in test env)
- [ ] After upgrade, gate clears and feature is accessible

## Plan Bypass Tests
- [ ] Calling `POST /sequences/{id}/steps` with LinkedIn type as Free user directly → 403
- [ ] Removing auth token from request to gated endpoint → 401 (not gate bypass)
