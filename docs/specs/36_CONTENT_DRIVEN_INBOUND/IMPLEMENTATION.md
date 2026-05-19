# Spec 36 — Content-Driven Inbound Engine — Implementation Plan

**Status:** 📝 Draft
**Last updated:** 2026-05-08

---

## 1. Prerequisites (must be complete before any Spec 36 implementation begins)

| Prerequisite | Status | Owner |
|---|---|---|
| Spec 01 (Auth & Workspace) — workspace plan-gating middleware | Required | backend-developer |
| Spec 03 (Lead Management) — lead creation endpoint + consent_log | Required | backend-developer |
| `integration-service` Facebook OAuth connect flow (Page Admin verify) | Required | backend-developer |
| Meta Business App Review submission (pages_read_engagement + pages_messaging) | ⚠️ Start immediately | DevOps / Product |
| Alembic migration: social_posts, comment_keyword_rules, comment_captures tables | First task | database-architect |

---

## 2. Meta App Review (Critical Path)

⚠️ **Start in parallel with implementation.** Do NOT wait for code to be done before submitting.

**Submission checklist:**
- [ ] Create a Facebook App under the RevLooper Meta Business account (if not yet done)
- [ ] Request permissions: `pages_read_engagement`, `pages_messaging`, `pages_show_list`
- [ ] Record a screen demo: workspace owner connects Page → registers post → test comment triggers DM
- [ ] Privacy policy URL must list: "We process Facebook comment data (commenter name, comment text, Facebook User ID) to send automated responses on behalf of connected Facebook Pages. Data is processed in accordance with Meta's Platform Terms."
- [ ] Submit for Standard Access initially; escalate to Advanced Access if needed
- [ ] Timeline estimate: 4–8 weeks from submission

---

## 3. Feature Flags

All Spec 36 code ships behind a feature flag from day one.

| Flag | Description | Default |
|---|---|---|
| `spec36_social_inbound_enabled` | Master flag — gates all Spec 36 functionality | `false` |
| `spec36_facebook_only` | Restricts platform to Facebook only (no TikTok/Instagram UI) | `true` |
| `spec36_preview_matching_tool` | Shows comment preview before keyword rule activation | `true` |

**Rollout plan:**
1. **Internal testing (Week 11):** Enable `spec36_social_inbound_enabled` for `revlooper-internal` workspace only
2. **Beta (Week 12):** Enable for 5 Pro workspaces in Vietnam (content-driven operator segment)
3. **GA (Week 13+):** Enable for all Pro+ workspaces after Meta App Review approval
4. **TikTok/Instagram (Phase 2):** Set `spec36_facebook_only = false` — gates platform expansion

---

## 4. Rollout Sequence (M6b — Weeks 11–13)

### Week 11 — Infrastructure + Core Backend

**Day 1–2: Database migration**
- Alembic migration: create `social_posts`, `comment_keyword_rules`, `comment_captures` tables
- Add `comment_id TEXT NOT NULL` to comment_captures (from design decision)
- Apply RLS policies for all 3 tables
- Run migration on staging

**Day 3–4: integration-service internal endpoint**
- `GET /internal/integrations/resolve?channel=facebook&external_id={page_id}`
- OIDC auth enforced
- Redis cache write with TTL 1h
- `integration.disconnected` event subscription for cache invalidation

**Day 5–7: webhook-handler Cloud Function**
- HMAC-SHA256 verification with `hmac.compare_digest`
- Comment verb filter (edited → drop)
- Pub/Sub publish to `facebook.comment.received`
- Facebook webhook verification endpoint (`GET /webhooks/facebook` with hub.challenge)
- Deploy to Cloud Functions staging

### Week 12 — comment-processor + campaign-service

**Day 8–10: comment-processor Cloud Function**
- Page resolver (Redis cache + integration-service client)
- Post config cache (Redis TTL 5min)
- Keyword matching algorithm (normalize_text + normalize_ascii)
- Suppression check via lead-service internal endpoint
- Credit deduction via billing-service (before DM dispatch)
- DM dispatch via Facebook Private Replies API
- VN/TH/SG opt-out footer append
- `POST /internal/comment-captures` call to campaign-service
- Idempotency lock (Redis SETNX, set BEFORE DB write)

**Day 11–12: campaign-service additions**
- `POST /internal/comment-captures` endpoint + outbox write
- `GET /internal/social-posts/{post_id}/config` endpoint
- `comment.captured` Pub/Sub event with comment_capture_id
- `post.config.updated` outbox event on keyword rule / DM template save
- CRUD endpoints for social_posts and comment_keyword_rules (public API)

**Day 13: lead-service additions**
- `comment.captured` Pub/Sub subscriber
- Lead create/merge for social_comment source
- Consent log write for VN/TH/SG (atomic with lead INSERT)
- `lead.created` event with nullable comment_capture_id
- `GET /internal/leads/find-by-social-id` endpoint

### Week 13 — Frontend + E2E + GA prep

**Day 14–15: Settings → Integrations → Social Channels**
- Facebook Page OAuth connect button
- Pages list selector
- Disconnect flow
- `pages_messaging` scope validation at connect time

**Day 16–17: Campaign → Social Inbound tab**
- Social post registration (URL paste + resolve + preview)
- Keyword rules editor + vertical presets
- DM template editor + variable hints + preview
- Active/paused/archived status toggle
- Plan gate enforcement in UI

**Day 18–19: Comment Captures table**
- Per-post captures list (commenter name, comment, keyword, DM status, lead link)
- Filter by DM status + date range
- Retry button for DM errors
- CSV export (Business/Agency only)

**Day 20: E2E testing + security review**
- Full pipeline smoke test on staging (T11)
- HMAC invalid signature test (T1)
- SSTI attempt test (T2)
- Beta rollout to 5 Pro VN workspaces

---

## 5. Migration Notes

### Alembic Migration File Naming
```
alembic/versions/2026_05_08_037_create_social_posts_keyword_rules_captures.py
```

### Down-migration
The down migration must drop tables in reverse dependency order:
1. `DROP TABLE comment_captures`
2. `DROP TABLE comment_keyword_rules`
3. `DROP TABLE social_posts`

Do NOT use `CASCADE` — explicit ordering is safer for production.

### Zero-downtime deployment
All 3 tables are net-new — no existing data migration required. Deploy order:
1. Run Alembic migration (additive only)
2. Deploy campaign-service (new endpoints)
3. Deploy lead-service (new subscriber)
4. Deploy integration-service (new endpoint)
5. Deploy webhook-handler Cloud Function
6. Deploy comment-processor Cloud Function
7. Enable feature flag for internal workspace

---

## 6. Multi-Platform Strategy (Phase 2)

**Facebook (MVP):** Private Replies API, HMAC-SHA256, pages_messaging permission, comment via page webhook

**TikTok (Phase 2):** TikTok for Business API, TikTok comment webhooks (different auth: HMAC-SHA256 but different header format). Add `platform = 'tiktok'` to social_posts. Set `spec36_facebook_only = false`.

**Instagram (Phase 2):** Instagram Graph API (same Meta infrastructure as Facebook). Add `platform = 'instagram'`. Private Replies API same as Facebook.

**LinkedIn (Phase 3):** LinkedIn Marketing API — significantly more complex, requires Partner Program access.

**Platform abstraction:** The keyword matching and DM rendering logic is platform-agnostic. The platform-specific code is isolated in:
- `webhook-handler` — per-platform signature verification
- `comment-processor` — per-platform DM dispatch client
- `campaign-service` — `platform` field in social_posts (text enum)

No schema changes needed to add platforms — just extend the platform value set.
