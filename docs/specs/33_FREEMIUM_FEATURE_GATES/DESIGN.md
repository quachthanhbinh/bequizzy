# 33 — Freemium Feature Gates — DESIGN

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Architecture

```
[Feature in UI attempts action]
           ↓
[useFeatureGate('feature_key') hook]
    ↓  GET /billing/features/{feature_key}  ↓
[billing-service: plan_feature_gates table]
    ↓ allowed: false
[GateWall component rendered inline]
    ↓ upgrade clicked
[billing-service: POST /billing/upgrade (Paddle checkout)]
    ↓  analytics events throughout
[analytics-service: feature_gate_* events]
```

## GateWall Component API

```tsx
interface GateWallProps {
  featureKey: string            // e.g. 'linkedin_sequence_step'
  requiredPlan: 'Pro' | 'Business' | 'Agency'
  title: string                 // "Unlock LinkedIn Outreach"
  description: string           // "Add LinkedIn steps to your sequences..."
  preview?: React.ReactNode     // Optional preview panel (G1–G5)
  children: React.ReactNode     // The gated UI (rendered but blurred/hidden)
}
```

Usage pattern:
```tsx
<FeatureGate featureKey="linkedin_sequence_step" requiredPlan="Pro" title="...">
  <LinkedInStepBuilder />
</FeatureGate>
```

When gate is closed (allowed: true), renders `children` directly — no wrapper overhead.

## useFeatureGate Hook

```tsx
function useFeatureGate(featureKey: string): {
  isLoading: boolean
  allowed: boolean
  requiredPlan: string | null
  reason: string | null
}
```
- Calls `GET /billing/features/{featureKey}` via TanStack Query (5-minute stale time)
- On gate hit: fires `feature_gate_hit` analytics event (once per session per gate)

## Feature Key Registry

```ts
export const FEATURE_KEYS = {
  LEAD_LIMIT: 'lead_limit',
  AI_CREDITS: 'ai_credits',
  LINKEDIN_STEP: 'linkedin_sequence_step',
  REMOVE_BRANDING: 'remove_branding',
  MULTI_CAMPAIGN: 'multi_campaign',
  ZALO_CHANNEL: 'zalo_channel',
  AI_REPLY_ASSISTANT: 'ai_reply_assistant',
  CRM_DEAL_VALUES: 'crm_deal_values',
  TEAM_SEATS_3PLUS: 'team_seats_3plus',
  MULTI_WORKSPACE: 'multi_workspace',
  API_ACCESS: 'api_access',
  WHITELABEL_BOOKING: 'whitelabel_booking',
} as const
```

## Analytics Events

```ts
// feature_gate_hit
{ gate_id: string, feature_key: string, current_plan: string, required_plan: string, page_path: string }

// feature_gate_upgrade_clicked
{ gate_id: string, feature_key: string }

// feature_gate_dismissed
{ gate_id: string, feature_key: string }
```

## CPO ↔ CTO Debate

### Round 1 — Client-side vs server-side gate enforcement

**CPO (confidence: 9):** Gate UX must be client-side for performance (no network round-trip on every UI render). But enforcement must be server-side — a client-side-only gate is trivially bypassed.

**CTO (confidence: 9):** Correct pattern: client-side gate uses cached plan state (TanStack Query, 5-min stale) for UX. Server-side API endpoints independently enforce the gate via `GET /billing/features/{key}` — any direct API call without the gate UI also hits the same check. Two independent enforcement layers.

**Gap:** 0.

### Round 2 — Gate position: before or after action

**CPO (confidence: 8):** Gate should appear at the moment of intent, not before. User clicks "Add LinkedIn step" → they see the preview of LinkedIn outreach → they feel the value → they upgrade. If we block them before they even click, they never feel the loss.

**CTO (confidence: 8):** Agreed. The `FeatureGate` wrapper renders `children` blurred/dimmed when gated — the feature is visible but not interactive. This is "show what you're missing" in its purest form.

**Gap:** 0.

### Round 3 — Stale gate state

**CTO (confidence: 8):** If a user upgrades in one tab and returns to another tab, the gate must clear within 5 minutes (TanStack Query stale time). For upgrade in the same tab (Paddle checkout redirect), we invalidate the billing plan query immediately on redirect. Edge case: user downgrades — gate should reappear within one billing cycle check.

**CPO (confidence: 8):** Acceptable. 5-minute stale is fine for the upgrade path. Downgrade is rare and the 5-minute window is not a security issue (server enforces independently).

**Final confidence: CPO 8 / CTO 8** — Approved.
