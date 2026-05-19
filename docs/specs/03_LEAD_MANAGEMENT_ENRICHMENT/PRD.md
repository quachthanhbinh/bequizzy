# 03 — Lead Management & Enrichment — PRD

**Status:** 📝 Draft
**Confidence:** 9/10
**Security flag:** 🟡 MEDIUM (PII + file upload + external API credentials)
**Last updated:** 2026-05-04

## Problem Statement
Outreach is only as good as the data. RevLooper users import leads from spreadsheets, ad platforms, and manual entry — but raw data is dirty: duplicate emails, invalid addresses, missing company context. Sending to bad data burns domain reputation (the single most irreversible failure mode for email outreach).

### Evidence
- Industry average: 20–30% of imported CSV leads have invalid/duplicate emails
- A single 10%+ bounce rate can trigger ESP blacklisting — game over for the workspace
- Apollo.io enrichment provides title + company size + LinkedIn URL that personalizes copy 3× more effectively than first name alone

### Who has this problem
Every workspace that imports leads. Pain is worst for users migrating from spreadsheets (majority of SEA SMB users).

## Goals
1. Lead import is < 2 minutes for 1,000 rows (CSV + mapping + dedup + status feedback)
2. Email verification (Hunter.io) runs automatically on import; invalid emails flagged before any send
3. Apollo.io enrichment fills company/title context on demand + auto for inbound captured leads
4. Dedup prevents double-outreach to the same contact within a workspace
5. Lead detail page gives a complete activity timeline (all touches: emails sent/opened/clicked, replies, meetings)

## Non-Goals
- ❌ Cross-workspace lead sharing
- ❌ Real-time LinkedIn scraping (legal risk — separate spec 10)
- ❌ AI-powered lead scoring (separate spec in Track D)
- ❌ Global suppression across workspaces

## Acceptance Criteria
- [ ] CSV import: up to 50,000 rows; column mapping UI; required fields validated
- [ ] Import shows progress bar; partial success allowed (invalid rows skipped with download of error rows)
- [ ] Manual lead creation form (name, email, phone, company, title, linkedin_url, notes)
- [ ] Duplicate detection: same email within workspace → flag and let user choose merge/skip/overwrite
- [ ] Hunter.io email verify runs async after import; status: `unverified → verified | invalid | risky`
- [ ] Apollo.io enrichment runs on-demand (3 credits/lead shown before trigger) + bulk enrich with preview
- [ ] Auto-enrichment on inbound captured leads (Pro+ plan): Hunter verify → Apollo enrich pipeline
- [ ] Leads not enrollable in sequences if status = `invalid`
- [ ] Lead list: search by name/email/company; filter by status/tag/enrichment; sort by created_at/score
- [ ] Lead detail: full activity timeline; edit all fields; tag management; manual notes
- [ ] Bulk actions on lead list: tag, delete (soft), export CSV, add-to-campaign
- [ ] Free plan: 100 lead limit enforced server-side (import blocked at 100; clear CTA to upgrade)
- [ ] Source attribution fields on every lead: `source_type`, `source_id`, `source_campaign_id`, `source_form_id`
  - Valid `source_type` values: `manual`, `csv_import`, `api`, `form_submission`, `facebook_lead_ad`, `google_ad`, `comment_capture` (added by [Spec 36](../36_CONTENT_DRIVEN_INBOUND/README.md))

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Import p95 latency (1k rows) | < 30s | job duration metric |
| Post-import bounce rate at first send | < 3% (industry avg: 10%) | campaign analytics |
| Enrichment request success rate | ≥ 95% (Apollo/Hunter uptime) | provider health metric |
| Duplicate detection catch rate | ≥ 99% on same-email duplicates | test + prod sampling |
| Lead list page load (10k leads) | < 1s p95 | frontend perf trace |

## In-Scope Deliverables
- `leads`, `lead_activities`, `lead_tags`, `lead_tag_assignments`, `enrichment_jobs` tables + migration
- CSV upload endpoint + async processing job (Cloud Tasks)
- Column mapping API + UI
- Dedup engine (exact email match + optional fuzzy name+company match)
- Hunter.io client + verify webhook handler
- Apollo.io client (enrich endpoint)
- Lead CRUD REST API (all standard endpoints)
- Lead list + detail frontend pages
- Bulk action API + frontend
- Free plan limit enforcement middleware
- Source attribution fields

## Out of Scope
- Lead scoring (spec 09)
- LinkedIn enrichment / scraping (spec 10)
- AI-powered dedup (fuzzy matching v2)
- Cross-workspace dedup

## Dependencies

| Dep | What we need |
|---|---|
| 01_AUTH_WORKSPACE | `workspace_id`, role enforcement |
| billing-service | Credit deduction for Apollo enrichment |

## Test Checklist
- [ ] CSV 50k rows imports in <30s
- [ ] CSV with 30% bad rows: good rows imported, error CSV downloadable
- [ ] Duplicate email within workspace: user prompted to merge/skip
- [ ] Hunter verify: invalid email → not enrollable in sequence
- [ ] Apollo enrich: 3 credits deducted before call, not after
- [ ] Free plan: 101st lead import blocked with upgrade prompt
- [ ] Lead list filter/sort/search returns correct results
- [ ] Activity timeline shows email, reply, meeting events in order

## Open Questions
1. Fuzzy dedup (same person, different email domain)? **Recommendation:** v1 = exact email only; show "possible duplicates" suggestion UX in v2.
2. Should `invalid` leads be hard-deleted or kept with status? **Recommendation:** kept (audit trail, user can manually override with risk warning).
3. CSV import size limit? **Recommendation:** 50k rows / 25MB max per file; break larger lists into batches.
