# Spec 23 — Feature Flags & Rollout: PRD

## Problem Statement

Shipping risky features (Zalo, WhatsApp, AI Brain v2) requires safe rollout mechanisms. Without feature flags, all-or-nothing deploys risk platform-wide failures.

## Acceptance Criteria

### AC-23-01: GrowthBook Integration
- Feature flags evaluated per workspace via GrowthBook SDK
- SDK initialized at service startup; flag evaluation < 5ms (local cache)

### AC-23-02: Flag Inventory
- Initial flags: `zalo_outreach`, `whatsapp_outreach`, `linkedin_native_api`, `ai_brain_v2`, `new_sequence_editor`, `compliance_dashboard`
- Each flag: on/off, percentage rollout, or workspace-specific override

### AC-23-03: Gradual Rollout
- % rollout: hash(workspace_id) % 100 < threshold
- Kill switch: set flag to 0% to instantly disable

### AC-23-04: Frontend Integration
- Flags fetched server-side in Next.js layouts (no client-side polling)
- Unavailable features return graceful fallback
