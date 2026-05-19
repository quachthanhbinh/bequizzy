# Spec 36 — Content-Driven Inbound Engine — Result

**Status:** ⬜ Not started

---

*This file is filled in after implementation completes.*

## Delivery Summary

| Item | Planned | Actual |
|---|---|---|
| Target milestone | M6b (Weeks 11–13) | — |
| Tasks completed | 15/15 | — |
| Test coverage (webhook-handler) | ≥ 90% | — |
| Test coverage (comment-processor) | ≥ 90% | — |
| Test coverage (campaign-service new) | ≥ 85% | — |

## Spec Compliance

| Acceptance Criterion | Status |
|---|---|
| Facebook HMAC-SHA256 verified | ⬜ |
| Keyword matching supports Vietnamese diacritics | ⬜ |
| Private Replies API used (not standard Messenger send) | ⬜ |
| Comment edit events filtered and ignored | ⬜ |
| UNIQUE(workspace_id, post_id, commenter_id) enforced | ⬜ |
| consent_log written for VN/TH/SG workspaces | ⬜ |
| Suppression check called before every DM | ⬜ |
| Credits deducted before DM dispatch | ⬜ |
| SandboxedEnvironment used for template rendering | ⬜ |
| comment_capture_id in comment.captured event payload | ⬜ |
| Outbox-only call chain (no direct comment-processor → lead-service) | ⬜ |
| Plan gating enforced (Pro+ only) | ⬜ |
| Feature flag `spec36_social_inbound_enabled` implemented | ⬜ |
| Meta App Review submitted | ⬜ |

## Post-Launch Metrics (30 days)

| Metric | Target | Actual |
|---|---|---|
| FB Page connections per active Pro+ workspace | ≥ 1 in 14 days | — |
| Comment-to-capture rate | ≥ 80% | — |
| DM delivery rate | ≥ 90% | — |
| Lead-to-sequence enrollment rate | ≥ 70% in 1h | — |
| Feature activation rate (Pro users, 60 days) | ≥ 20% | — |

## Deferred Items

| Item | Deferred To |
|---|---|
| Per-channel social suppression (suppression_list extension) | Phase 2 |
| STOP reply processing via Messenger webhook | Phase 2 |
| TikTok / Instagram comment capture | Phase 2 |
| Messenger follow-up sequences (24h window handling) | Future spec |
| AI-generated keyword rules | Future spec |

## Notes

*Fill in after implementation: any deviations from spec, technical discoveries, production incidents, UX findings from beta.*
