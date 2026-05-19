# Spec 36 — Content-Driven Inbound Engine — Product Requirements

**Status:** 📝 Draft
**Confidence:** 9/10 (CPO)
**Last updated:** 2026-05-08

---

## 1. Problem Statement

SEA content-driven operators — travel agents, insurance agents, recruiters, marketing freelancers — post regularly on Facebook and receive hundreds of comments expressing buying intent. These operators have no system to:

1. **Detect** which comments express genuine buying intent (keywords: "thông tin", "báo giá", "apply", "register", "price")
2. **Respond instantly** with a personalized private DM before the interest window closes
3. **Create a structured lead record** from the commenter's identity
4. **Route the lead** into an automated follow-up sequence

The result: interest expressed publicly, but never converted. The travel agent posts a Đà Lạt itinerary at 8 PM, wakes up to 40 cold comments — the window is gone.

This is not a hypothetical scenario. BUSINESS.md §1 identifies "content-to-revenue gap" as one of the three primary "Why Now" tailwinds and names content-driven operators as the primary addressable segment. ManyChat exists but creates zero lead records, zero enrichment, zero revenue attribution — it is a chat automation tool, not a revenue system.

---

## 2. Target Personas

**Primary:** SEA Content-Driven Operator
- Vietnamese travel agents, Thai insurance agents, Indonesian recruiters, Filipino marketing freelancers
- Already posting on Facebook regularly; already getting engagement
- Not technical — cannot configure webhooks or APIs manually
- Speaks Vietnamese/Thai/Bahasa; expects Vietnamese keyword defaults out of the box

**Secondary:** Solo Founder / BDR
- Posts product updates and case studies; wants prospects who comment to auto-enter pipeline
- Less urgency than content operators (can fall back to inbox monitoring), but benefits from automation

---

## 3. User Stories

### 3.1 Connect Facebook Page
```
AS a Pro+ workspace owner
I WANT to connect my Facebook Page to RevLooper via OAuth
SO THAT RevLooper can monitor my post comments and send DMs on my behalf
```
**Acceptance criteria:**
- [ ] User can initiate Facebook OAuth from Settings → Integrations → Social Channels
- [ ] RevLooper requests exactly: `pages_read_engagement`, `pages_messaging`, `pages_show_list` permissions
- [ ] RevLooper verifies `pages_messaging` scope was granted before allowing post registration; shows error if missing
- [ ] User is a Page Admin (not just Editor) — enforced via Graph API token role check
- [ ] Multiple pages per workspace supported (future); MVP: one active page per workspace
- [ ] Disconnect removes all active webhook subscriptions for that page

### 3.2 Register a Facebook Post
```
AS a Pro+ operator
I WANT to paste a Facebook post URL and register it in RevLooper
SO THAT RevLooper will monitor comments on that post
```
**Acceptance criteria:**
- [ ] User pastes a valid Facebook post URL
- [ ] RevLooper resolves `external_post_id` via Graph API and stores it in `social_posts`
- [ ] RevLooper registers/updates the Facebook webhook subscription for comment events on the page
- [ ] Post caption is fetched and displayed as a preview (max 280 chars; truncated with "...")
- [ ] Status starts as `active`; user can set to `paused` or `archived`
- [ ] Error shown if post does not belong to the connected page
- [ ] Plan gate enforced: Free = 0 posts, Pro = 1 active post, Business/Agency = unlimited

### 3.3 Define Keyword Rules
```
AS a Pro+ operator
I WANT to define which keywords in comments trigger an auto-DM
SO THAT only comments expressing intent are captured (not every comment)
```
**Acceptance criteria:**
- [ ] User can add a list of keywords per post (comma-separated)
- [ ] Match mode: `any` (default) — any one keyword in the comment triggers capture
- [ ] Keyword matching is case-insensitive and Unicode-NFC-normalized (supports Vietnamese diacritics)
- [ ] Keywords also match after `unidecode` transliteration — e.g., "bao gia" matches "báo giá" comments (for commenters who type without tones)
- [ ] Vertical keyword presets offered as quick-add: Travel (báo giá, thông tin, đặt tour, giá tour, tư vấn), Insurance (tư vấn, phí, bảo hiểm, đăng ký, mua), Recruitment (ứng tuyển, apply, CV, nộp đơn, job)
- [ ] Rule limit per plan enforced (Pro: 3, Business: 10, Agency: 20)
- [ ] "Preview matching" tool: shows recent public comments on the registered post that would match current rules before saving
- [ ] Rules can be enabled/disabled without deletion

### 3.4 Configure Auto-DM Template
```
AS a Pro+ operator
I WANT to write a DM message template with personalization variables
SO THAT captured commenters receive a relevant, personal-feeling response
```
**Acceptance criteria:**
- [ ] Template editor with variable hints: `{{name}}` (commenter name), `{{post_caption}}` (first 100 chars of post)
- [ ] Template preview shown with sample values
- [ ] For VN/TH/SG workspaces: mandatory opt-out footer appended automatically (not editable): "Trả lời STOP để hủy nhận tin."
- [ ] Template max length: 1000 characters (including footer)
- [ ] Empty template prevents post activation (validation error)

### 3.5 Auto-Capture and DM Dispatch
```
AS a Pro+ operator
I WANT RevLooper to automatically DM commenters when their comment matches my keywords
SO THAT I never miss a hot lead even when offline
```
**Acceptance criteria:**
- [ ] When a comment arrives on an active registered post, RevLooper checks it against all active keyword rules
- [ ] If matched: DM sent via Facebook Private Replies API within 60 seconds
- [ ] Capture recorded in `comment_captures` (commenter_id, commenter_name, comment_text, matched_keyword, dm_sent, dm_sent_at)
- [ ] Each commenter captured only once per post (UNIQUE constraint enforced — subsequent comments by same commenter on same post are ignored)
- [ ] Comment edit events are ignored (not re-captured)
- [ ] If workspace has insufficient credits: DM not sent, `dm_error = "credits_exhausted"`, capture still recorded
- [ ] If commenter is a globally unsubscribed lead: DM not sent, `dm_error = "suppressed"`, capture still recorded
- [ ] Credit deduction: 1 credit per DM sent (deducted via billing-service BEFORE dispatch)
- [ ] If post is paused: comments still received but no DM sent, no capture created

### 3.6 Automatic Lead Creation
```
AS a Pro+ operator
I WANT RevLooper to automatically create a lead record from each captured commenter
SO THAT the lead enters my normal RevLooper pipeline
```
**Acceptance criteria:**
- [ ] Lead created from `commenter_name` (split into first/last if possible), `commenter_id` as `external_id` (platform: facebook)
- [ ] If a lead with `external_id = commenter_id` already exists in the workspace: merge (update, do not duplicate)
- [ ] Lead `source` = `social_comment`; `source_url` = original post URL
- [ ] `comment_captures.lead_id` backfilled after lead creation
- [ ] Lead auto-enrolled in campaign sequence if configured on the social post (user selects sequence in Social Post settings)
- [ ] For VN/TH/SG workspaces: consent_log entry written atomically with lead creation

### 3.7 View Comment Captures
```
AS a Pro+ operator
I WANT to see all comment captures per post in a structured table
SO THAT I can monitor performance and take manual action on missed leads
```
**Acceptance criteria:**
- [ ] "Social Inbound" tab accessible from Campaign detail view
- [ ] List of registered posts with capture count, DM sent count, DM error count
- [ ] Per-post captures table: commenter name, comment text (truncated), matched keyword, DM status, lead created link, captured_at
- [ ] Filter by: DM status (sent / error / suppressed), date range
- [ ] Retry button for DM errors (re-queues the capture for DM dispatch)
- [ ] Export to CSV (Business/Agency only)

---

## 4. Out of Scope (This Spec)

- Messenger follow-up sequences (subject to Meta 24h window; separate future spec)
- TikTok / Instagram / LinkedIn comment capture
- AI-generated keyword rules (future enhancement)
- A/B DM template testing
- Public comment replies (vs. private DM)
- Post creation from within RevLooper (Spec 34 — Content Studio)
- Zalo comment capture

---

## 5. Success Metrics

| Metric | Target | Window |
|---|---|---|
| Facebook Page connections per active Pro+ workspace | ≥ 1 | 14 days post-activation |
| Comment-to-capture rate (qualifying comments successfully processed) | ≥ 80% | 30 days |
| DM delivery rate (dm_sent / captures) | ≥ 90% | 30 days |
| Lead-to-sequence enrollment rate | ≥ 70% within 1 hour | 30 days |
| Feature activation rate (% Pro users who register ≥1 post) | ≥ 20% | 60 days post-launch |

---

## 6. Credit Pricing

| Operation | Credits |
|---|---|
| Comment capture (no DM, keyword matched) | 0 |
| DM send via Private Replies API | 1 |
| Lead enrichment from captured lead | Per enrichment spec (Spec 03) |

---

## 7. Non-Negotiables (from Architecture Principles)

- [ ] workspace_id on every DB query — no exceptions
- [ ] Suppression check before every DM dispatch (see scope limitation in SECURITY.md)
- [ ] consent_log write for VN/TH/SG workspaces (written atomically with lead creation)
- [ ] Credits deducted BEFORE DM dispatch
- [ ] Transactional outbox for all cross-service events
- [ ] No direct cross-service DB reads (bounded context enforced)
