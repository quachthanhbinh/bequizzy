# Spec 36 — Content-Driven Inbound Engine

**Status:** 📝 Draft — ready for implementation planning
**Phase:** 1 (M6b — Weeks 11–13)
**Track:** C (Inbound)
**Wave:** 2 (parallel-safe with Wave 1 specs)
**Confidence:** CPO 9/10 | CTO 7/10 | Converged ✅
**Security:** 🔴 HIGH — Facebook webhook, PII handling, SEA consent, suppression

---

## Summary

Capture leads from Facebook post comments using keyword-matching automation. Users register a public Facebook post in RevLooper, define keyword trigger rules (e.g. "thông tin", "báo giá", "interested"), and RevLooper automatically sends a private DM to matching commenters via the Private Replies API, creates a lead record, and enrolls the lead in a campaign sequence.

---

## Specification Files

| File | Status | Contents |
|---|---|---|
| [README.md](README.md) | ✅ Written | Overview, dependencies, scope |
| [PRD.md](PRD.md) | ✅ Written | User stories, acceptance criteria, plan gating |
| [DESIGN.md](DESIGN.md) | ✅ Written | Architecture, data model, event schema, API contracts |
| [SECURITY.md](SECURITY.md) | ✅ Written | HMAC, SSTI, consent, suppression, IDOR analysis |
| [TESTS.md](TESTS.md) | ✅ Written | Test plan: unit, integration, E2E |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | ✅ Written | Rollout plan, feature flags, prerequisites |
| [TASKS.md](TASKS.md) | ✅ Written | TDD task list (RED-first) |
| [RESULT.md](RESULT.md) | ⬜ Empty | Filled after implementation completes |

---

## Dependencies

| Spec | Title | Type |
|---|---|---|
| [Spec 01](../01_AUTH_WORKSPACE/README.md) | Auth & Workspace | **Requires** — workspace_id, JWT auth, plan-gating middleware |
| [Spec 03](../03_LEAD_MANAGEMENT_ENRICHMENT/README.md) | Lead Management & Enrichment | **Requires** — lead creation, enrichment pipeline |
| [Spec 04](../04_INBOUND_ANCHORS_CAMPAIGN_FORMS/README.md) | Inbound Anchors & Campaign Forms | **Complements** — see scope boundary below |

## Blocks

This spec blocks nothing in Wave 1. Wave 2 analytics features (Spec 09) will include comment-capture conversion metrics.

---

## Scope Boundary

### What this spec covers
- Facebook organic post comment capture (keyword-triggered)
- Automated private DM via Facebook Private Replies API (initial message only)
- Lead creation from commenter identity
- Sequence enrollment from captured lead
- Social Inbound tab in Campaign UI

### What this spec does NOT cover
- **Spec 04 territory:** Paid ad form submissions (Facebook Lead Ads structured forms), form builders, form embed — entirely different ingestion path
- **Follow-up Messenger sequences:** Subsequent messages after the initial private reply are subject to Meta's 24-hour messaging window and are out of scope for Spec 36. Messenger follow-up sequences are a future enhancement requiring Messenger Channel support in `outreach-service`
- **Multi-platform:** TikTok, Instagram, LinkedIn comment capture is deferred (different API surfaces). Facebook-only MVP
- **Public comment replies:** Responding to comments publicly (vs. privately via DM) is out of scope — different Meta policy surface
- **AI post composer / Content Studio:** Composing posts from within RevLooper is covered by Spec 34
- **Zalo comment capture:** Different API, different market, deferred

---

## Plan Gating

| Feature | Free | Pro | Business | Agency |
|---|---|---|---|---|
| Register social post (max 1 active post) | ❌ | ✅ | ✅ | ✅ |
| Keyword rules per post | — | 3 rules | 10 rules | 20 rules |
| Auto-DM capture | — | ✅ | ✅ | ✅ |
| Comment Captures tab | — | ✅ | ✅ | ✅ |
| Bulk export captures | — | ❌ | ✅ | ✅ |

---

## SEA Priority

**Very High.** Facebook penetration in Vietnam and Thailand is among the highest globally. The "content-to-revenue gap" is the primary unmet pain for the target personas (travel agents, insurance agents, recruiters). Vietnamese-language keyword matching (Unicode/tonal) is a first-class requirement. This feature is the primary competitive differentiator vs. ManyChat in the SEA market.

---

## Go-to-Market Prerequisite

⚠️ **Meta App Review** — `pages_read_engagement` + `pages_messaging` permissions require Meta Business App Review (estimated 4–8 weeks after submission). App Review must be submitted **in parallel with implementation** — not after. See [IMPLEMENTATION.md](IMPLEMENTATION.md#meta-app-review) for submission checklist.
