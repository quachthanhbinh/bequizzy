# 04 — Inbound Anchors & Campaign Forms

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (webhook auth, hosted form XSS, provider credential handling)
**Priority:** P0
**Parallel Track:** C (Inbound Growth)
**Depends on:** 01, 03
**Blocks:** 10 (channel attribution), 13 (routing), 09 (source analytics)
**Owning service:** campaign-service (form metadata) + lead-service (ingest)

## One-line summary
Multi-provider inbound engine: a drag-and-drop form builder, hosted + embeddable forms, and adapters for Facebook Lead Ads, Google Ads, Zalo, TikTok — all funneling leads into a unified ingest pipeline with dedup, enrichment, and source attribution.

## Why it matters
- Inbound leads convert 3–5× better than cold outreach — this is RevLooper's growth flywheel
- Single-form creation with multi-provider sync eliminates the ops burden solo founders hate
- Source attribution (FB vs Google vs Zalo) enables ROI-based budget decisions

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria |
| [DESIGN.md](DESIGN.md) | Form schema, ingest pipeline, provider adapters, sync health |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan (FB/Google first; Zalo/TikTok flagged) |
| [TASKS.md](TASKS.md) | Task-by-task TDD plan |
| [TESTS.md](TESTS.md) | Form validation, webhook idempotency, XSS, replay |
| [SECURITY.md](SECURITY.md) | Webhook auth, CSRF, XSS, provider credential storage |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Scope Boundary
**Spec 04 covers:** Paid ad form submissions (Facebook Lead Ads structured forms), form builders, hosted/embeddable forms, provider webhook ingestion (Facebook Lead Ads, Google Ads, Zalo, TikTok).

**Spec 04 does NOT cover:** Comment-keyword capture from organic Facebook posts. If a user comments on a post and receives an automated DM — that is [Spec 36 (Content-Driven Inbound Engine)](../36_CONTENT_DRIVEN_INBOUND/README.md), which uses a completely different ingestion path (webhook-handler → comment-processor), different tables (social_posts, comment_captures), and different API (Facebook Private Replies API, not Lead Ads API).

## Pointers
- Related: [03_LEAD_MANAGEMENT/](../03_LEAD_MANAGEMENT_ENRICHMENT/), [10_MULTICHANNEL/](../10_MULTICHANNEL_OUTREACH/), [36_CONTENT_DRIVEN_INBOUND/](../36_CONTENT_DRIVEN_INBOUND/)
- Skills: `spec-driven-development`, `tdd-workflow`
