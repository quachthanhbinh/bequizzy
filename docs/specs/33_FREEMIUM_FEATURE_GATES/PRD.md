# 33 — Freemium Feature Gates — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Last updated:** 2025-05-05

## Problem Statement

RevLooper has a free plan — but without a consistent gate UX, free users either never hit limits (no upgrade pressure) or hit hard errors that feel punishing and create churn. Neither converts.

PRD §10.9.7 defines the philosophy: "never show a hard error — always show a value prompt before the block." This spec implements that philosophy as a design system component used consistently across all 12 gate moments.

### Evidence
- Freemium SaaS benchmark: the highest-converting plan walls are contextual (appear when the user has just experienced value), not time-limited (Reforge 2024 PLG benchmarks)
- Without a spec, gate UX is each feature team's responsibility → inconsistent copy, missing previews, no funnel tracking
- "Track gate-to-upgrade conversion per gate" (PRD §10.9.7) requires a measurement spec

## Goals
1. Every gate moment shows a value prompt, never a hard error
2. "Show what they're missing" previews are implemented for the 4 highest-impact gates
3. Gate-to-upgrade conversion is tracked per gate in the analytics pipeline
4. Gate enforcement is server-side (spec 32) — frontend is presentation only

## Non-Goals
- ❌ Annual billing or discount codes (Phase 2)
- ❌ Personalised upgrade messaging based on usage patterns (Phase 3 ML)
- ❌ Trial / time-limited free plan (explicitly out of scope — free is permanent)

## Gate Inventory (from PRD §10.9.7)

| # | Gate | Free Wall | Trigger Moment | Preview? |
|---|---|---|---|---|
| G1 | Lead limit (100) | Free → Pro | Import hits cap mid-campaign | ✅ Show "what 5,000 leads looks like" |
| G2 | Credit limit (50) | Free → Pro | First AI draft depletes credits | ✅ Show last AI draft quality |
| G3 | LinkedIn step in sequence | Free → Pro | User adds LinkedIn step | ✅ Show LinkedIn outreach example |
| G4 | Remove RevLooper branding | Free → Pro | User books meeting; wants clean page | No |
| G5 | 2nd active campaign | Free → Pro | First campaign got reply; user wants more | ✅ Show multi-campaign stats |
| G6 | Zalo / WhatsApp channel | Pro → Business | User's leads are on Zalo | No |
| G7 | AI Reply Assistant | Pro → Business | 10+ replies backed up | No |
| G8 | CRM Kanban with deal values | Pro → Business | Pipeline grew; needs deal values | No |
| G9 | 3rd+ seat | Pro → Business | User hired an assistant | No |
| G10 | 2nd workspace | Business → Agency | User has a second client | No |
| G11 | API access | Business → Agency | User wants to automate imports | No |
| G12 | White-label booking page | Business → Agency | User presenting to a client | No |

## Acceptance Criteria

### Gate Component Behaviour
- [ ] Gate never shows a hard error — always shows a GateWall component with upgrade CTA
- [ ] GateWall shows: feature name, what they're missing, current plan, target plan, upgrade button
- [ ] GateWall includes "Maybe later" dismiss (non-blocking; re-shows on next gate hit)
- [ ] For G1–G5: preview panel shows "what you're missing" (animated or image-based preview)
- [ ] Upgrade button opens Paddle checkout (via billing-service topup/upgrade endpoint)

### Server-side Enforcement
- [ ] `GET /billing/features/{feature_key}` returns `{ allowed: bool }` — all feature checks use this
- [ ] No feature gate is enforced client-side only
- [ ] If a user bypasses the gate UI and calls the API directly, the API returns 403

### Conversion Tracking
- [ ] `feature_gate_hit` analytics event fired when gate is shown: `{ gate_id, plan, feature_key }`
- [ ] `feature_gate_upgrade_clicked` event fired when CTA clicked: `{ gate_id }`
- [ ] `feature_gate_dismissed` event when "Maybe later" clicked: `{ gate_id }`
- [ ] Conversion funnel dashboard in analytics: `gate_hit → upgrade_clicked → upgrade_completed`

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Gate-to-upgrade conversion (G1 lead limit) | ≥ 8% | `feature_gate_hit{G1} → upgrade_completed` |
| Gate-to-upgrade conversion (G2 credits) | ≥ 10% | `feature_gate_hit{G2} → upgrade_completed` |
| Overall gate-to-upgrade conversion | ≥ 5% | all gates aggregate |
| Gates with < 2% conversion | 0 (or reviewed within 30 days) | Weekly gate report |

## In-Scope Deliverables
- `GateWall` React component (used in all 12 gate moments)
- `useFeatureGate(featureKey)` React hook (calls `GET /billing/features/{feature_key}`)
- Preview panels for G1–G5 (static/animated content)
- `feature_gate_hit/upgrade_clicked/dismissed` analytics events
- Gate conversion dashboard in analytics

## Out of Scope
- Annual billing / discounts
- Personalised gate messaging

## Dependencies

| Dep | What we need from it |
|---|---|
| 32_BILLING_CREDITS | `GET /billing/features/{feature_key}` — source of truth for gate state |
| 09_ANALYTICS | Event taxonomy for gate conversion tracking |
| 23_FEATURE_FLAGS | Rollout of new gates without a deploy |

## Open Questions
1. Should gate previews be actual feature screenshots or illustrations? **Recommendation:** real screenshots of the gated feature from a demo workspace — more credible and easier to maintain than custom illustrations.
