# Spec 23 — Feature Flags & Rollout: IMPLEMENTATION

## File Map
```
services/shared/flags.py            # is_feature_enabled() helper
services/shared/redis_flags.py      # Redis cache layer
frontend/lib/flags.ts               # getFeatureFlags() server-side helper
```
