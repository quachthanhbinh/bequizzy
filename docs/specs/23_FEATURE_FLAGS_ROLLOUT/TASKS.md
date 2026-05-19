# Spec 23 — Feature Flags & Rollout: TASKS

## TDD Task List

### Task 1 — is_feature_enabled() Helper
**RED first:** Test U23-01 fails.
**Done when:** GrowthBook SDK wrapped; Redis cache applied.

### Task 2 — Kill Switch Cache Invalidation
**RED first:** Test U23-02 fails.
**Done when:** Kill switch event clears Redis cache immediately.

### Task 3 — Frontend Server-Side Flag Fetch
**RED first:** Vitest: feature flag not propagated to layout.
**Done when:** Flags available in Next.js server layouts.

## Completion Checklist
- [ ] Flag evaluation < 5ms (cached)
- [ ] Kill switch immediate (no 30s delay)
- [ ] workspace_id sourced from auth token only
