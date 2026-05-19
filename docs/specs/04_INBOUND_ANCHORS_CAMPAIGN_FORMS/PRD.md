# 04 — Inbound Anchors & Campaign Forms — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (webhook authentication, XSS in form fields, provider credential handling)
**Last updated:** 2026-05-04

## Problem Statement
Most RevLooper users run ads (Facebook, Google) or own landing pages that already generate inbound leads — but those leads live in disconnected systems (Facebook Ads Manager, Google Ads, random Typeform accounts). Connecting those sources to outreach sequences is manual, slow, and error-prone.

### Evidence
- 73% of SEA SMB users surveyed run at least one paid ad channel (Facebook primary)
- Manual lead export-import cycle: 20–40 minutes/week, prone to missed leads
- Inbound leads from ads convert 3–5× better than cold lists — yet most users don't act on them within 5 minutes (the 5-minute rule for B2B)
- RevLooper hosted forms (no external dependency) = lowest-friction entry for solo founders

### Who has this problem
- Solo founders: want a hosted form with instant-to-sequence routing
- Growth marketers: want FB/Google/Zalo/TikTok lead forms mapped to campaigns

## Goals
1. Workspace owner can create a branded hosted form + embeddable JS widget in < 5 minutes
2. Facebook Lead Ads + Google Ads leads flow into RevLooper within 60 seconds of submission
3. Inbound submissions → lead created → enriched → routed to campaign → sequence enrolled, all automatically
4. Source attribution on every lead so users know which ad/form drives meetings
5. Provider adapters behind feature flags for progressive rollout (FB/Google first; Zalo/TikTok flagged)

## Non-Goals
- ❌ Full survey / multi-page form (v1 = single-page forms only)
- ❌ Payment collection in forms
- ❌ Form A/B testing (separate spec 09 covers campaign-level A/B)
- ❌ Real-time form analytics (page views, conversion rate) — v2

## Acceptance Criteria
- [ ] Form builder: drag-and-drop fields (text, email, phone, dropdown, checkbox, radio, date, hidden)
- [ ] Each form has a hosted URL (`revlooper.com/f/{workspace_slug}/{form_slug}`) + JS embed snippet + iframe embed
- [ ] Form can be linked to a campaign; submissions auto-route to that campaign's lead pool
- [ ] Workspace can have multiple forms; each form can map to one campaign
- [ ] Custom fields map to lead schema fields (email required; others optional)
- [ ] Hidden fields support UTM params (`utm_source`, `utm_medium`, `utm_campaign`)
- [ ] Form submission: dedup against existing leads (same email = update, not create)
- [ ] Facebook Lead Ads: connect FB Page → map form fields → submissions arrive via webhook within 60s
- [ ] Google Ads lead form: connect Google Ads account → map fields → submissions arrive via webhook within 60s
- [ ] Zalo OA form: connect Zalo OA → form capture (behind `zalo_forms_enabled` flag)
- [ ] TikTok lead form: connect TikTok account → form capture (behind `tiktok_forms_enabled` flag)
- [ ] Sync health dashboard: per-connection status, last submission timestamp, error count
- [ ] Replay failed submissions: re-process failures with idempotent ingest
- [ ] Source attribution: every lead created via form has `source_type=form|facebook_lead_ads|google_ads|zalo|tiktok` + form/provider IDs
- [ ] Auto-enrichment on inbound leads (Pro+): Hunter verify → Apollo enrich after ingest
- [ ] Form analytics: submissions count, duplicate rate, source breakdown (per form)

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Submission → lead created latency | < 5s (hosted form), < 60s (provider webhook) | ingest job metric |
| Provider webhook delivery failure rate | < 1% | sync health dashboard |
| Replay recovery rate | ≥ 95% | failed submission log |
| Inbound lead → sequence enrollment rate | ≥ 80% (when auto-route configured) | analytics event |
| Source attribution coverage | 100% of inbound leads have `source_type` | DB assertion |
| Form setup time | < 5 minutes for hosted form | product analytics |

## In-Scope Deliverables
- `campaign_forms`, `form_fields`, `form_submissions`, `form_sync_connections`, `lead_sources` tables + migration
- Form builder UI (drag-and-drop)
- Hosted form page (public Next.js route)
- JS embed snippet generator
- Form submit endpoint (public, rate-limited, anti-spam)
- Ingest pipeline: validate → dedup → create/update lead → source attr → route → enrich queue
- Facebook Lead Ads adapter (webhook + field mapper)
- Google Ads lead form adapter (webhook + field mapper)
- Zalo form adapter (behind flag)
- TikTok form adapter (behind flag)
- Sync health dashboard frontend
- Replay endpoint + UI

## Out of Scope
- Multi-page forms
- Payment collection
- Form analytics beyond submission count/source breakdown
- RevLooper-hosted thank-you page customization (v2)

## Dependencies

| Dep | What we need |
|---|---|
| 01_AUTH_WORKSPACE | workspace_id, OAuth for provider connections |
| 03_LEAD_MANAGEMENT | Lead create/update/dedup API + enrichment pipeline |
| 23_FEATURE_FLAGS | `zalo_forms_enabled`, `tiktok_forms_enabled` flags |

## Test Checklist
- [ ] Hosted form submit → lead created with correct source attribution
- [ ] Duplicate email submission → lead updated, not duplicated
- [ ] FB Lead Ads webhook → lead created within 60s
- [ ] Webhook with invalid signature → 401 rejected
- [ ] UTM hidden field → lead `source_id` populated correctly
- [ ] Replay failed submission → idempotent (no duplicate lead)
- [ ] Sync health shows error state after provider webhook failure

## Open Questions
1. Should forms support conditional logic (show field B if field A = X)? **Recommendation:** v2; v1 = linear single-page.
2. GDPR/PDPA consent checkbox — required or optional? **Recommendation:** required for VN/TH/SG workspaces (spec 15 + 20 enforce this); optional for others but shown by default.
3. Maximum form fields? **Recommendation:** 20 fields per form.
