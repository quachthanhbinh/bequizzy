# 33 — Freemium Feature Gates — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Phase Breakdown

### Phase 1 — Hook + GateWall component (Week 1)
- `frontend/components/gates/GateWall.tsx` — reusable gate UI
- `frontend/hooks/useFeatureGate.ts` — calls billing-service, fires analytics events
- `frontend/lib/featureKeys.ts` — registry of all 12 feature key constants
- Implement G1 (lead limit) and G2 (credits) gates as first two consumers

### Phase 2 — Remaining gates G3–G12 (Week 2)
- Wire GateWall into all 12 gate moments across features
- Preview panels for G3 (LinkedIn), G4 (branding), G5 (multi-campaign)
- Server-side 403 enforcement for all 12 feature keys

### Phase 3 — Analytics + dashboard (Week 2–3)
- `feature_gate_hit/upgrade_clicked/dismissed` events wired into analytics-service
- Gate conversion dashboard in analytics UI

## File Map
```
frontend/
  components/gates/
    GateWall.tsx
    GatePreview.tsx         # Preview panel (G1–G5)
    UpgradeModal.tsx        # Full upgrade CTA modal
  hooks/
    useFeatureGate.ts
  lib/
    featureKeys.ts
  components/features/
    leads/
      LeadImport.tsx        # G1: lead limit gate
    sequences/
      SequenceStepPicker.tsx  # G3: LinkedIn gate
    campaigns/
      CampaignList.tsx      # G5: 2nd campaign gate
    ... (all 12 gate locations)
```

## Feature Flags
- `freemium_gates_v2` — allows A/B testing new gate copy vs old

## Risks
| Risk | Mitigation |
|---|---|
| Gate added to UI but not API → bypass possible | Each gate PR checklist requires a server-side test |
| Stale gate state after plan change | TanStack Query `invalidateQueries('billing-plan')` on Paddle redirect return |
| Preview images become stale after UI changes | Screenshot previews generated from demo workspace on each deploy (CI step) |
