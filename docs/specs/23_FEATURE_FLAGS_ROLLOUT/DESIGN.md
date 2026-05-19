# Spec 23 — Feature Flags & Rollout: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Kill switch is the priority — when a rollout goes wrong, we need instant off. Percentage rollout for beta features. Workspace-specific override for design partners. Confidence: 7.

**CTO:** GrowthBook self-hosted (GKE) or Cloud; Python SDK for services; Next.js SDK for frontend (server-side). Flags cached in Redis (30s TTL) to avoid GrowthBook load. `is_feature_enabled(flag, workspace_id)` helper in each service. Confidence: 8.

**Gap: 1. Both ≥ 7. Converge.**

**Final Confidence: 8 / 10.**

---

## Helper Pattern

```python
# services/shared/flags.py
def is_feature_enabled(flag: str, workspace_id: UUID) -> bool:
    gb = get_growthbook_client()
    gb.set_attributes({"workspace_id": str(workspace_id)})
    return gb.is_on(flag)
```

## Frontend Pattern

```tsx
// app/layout.tsx — server component
import { getFeatureFlags } from "@/lib/flags";
const flags = await getFeatureFlags(workspaceId);
```
