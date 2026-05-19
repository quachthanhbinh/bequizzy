# RevLooper — Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** May 2026  
**Author:** RevLooper Product Team  
**Status:** Active

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Users](#2-target-users)
3. [User Personas](#3-user-personas)
4. [Feature Map](#4-feature-map)
5. [Phase 1: Revenue Generation](#5-phase-1-revenue-generation)
6. [Phase 2: Revenue Management](#6-phase-2-revenue-management)
7. [Phase 3: Revenue Operations](#7-phase-3-revenue-operations)
8. [Phase 4: Financial Layer](#8-phase-4-financial-layer)
9. [AI Brain — Private Workspace RAG](#9-ai-brain--private-workspace-rag)
10. [Cross-Cutting Requirements](#10-cross-cutting-requirements)
11. [Out of Scope](#11-out-of-scope)

---

## 1. Product Overview

### Vision
RevLooper is an AI system that generates revenue, manages operations, and funds growth for solo founders, small teams, and growing businesses.

It connects the entire revenue lifecycle into one system:
- Generate demand (outbound + content-driven inbound)
- Capture and convert leads (multi-channel engagement)
- Manage operations (pipeline, workflows, team activities)
- Support growth with financial intelligence and capital (future phases)

### Problem Statement
Small teams and operators (recruitment, marketing, insurance, travel, etc.) struggle to grow consistently because:

1. Lead generation is manual and fragmented
   - Prospecting happens across multiple platforms (LinkedIn, Facebook, Google Maps)
   - Leads are collected manually (copy/paste, spreadsheets)
   - No unified system

2. Content creates engagement but not conversion
   - Users post regularly on Facebook/TikTok/Youtube
   - No structured way to capture leads, follow up and convert interest into revenue

3. Outreach and follow-up are inefficient
   - Time-consuming
   - Requires copywriting skill
   - Hard to maintain consistency

4. Existing tools are not designed for this market
   - CRMs:
      - too complex
      - focused on managing, not generating revenue
   - AI tools
      - focus on content OR outreach only
      - lack full funnel automation
      - expensive and enterprise-focused

### Solution
 An end-to-end platform that generates demand, captures leads, and helps to convert them into meetings and revenue automatically.

1. Outbound Revenue Generation
    - Find and import leads from Linkedin/Facebook/Google Maps
    - AI generates
      - personalized outreach
      - follow-up sequences

2. Content-Driven Inbound Engine
    - Users can create high-converting posts (not generic content), such as:
      - Travel itineraries (Đà Lạt, Sa Pa, Vũng Tàu…)
      - Marketing insights
      - Job opportunities
      - Financial advice
    - Each post is structured to:
      - attract attention
      - deliver value
      - include clear CTA (comment keyword / inbox)

    Revlooper automatically:
    - captures leads from comments/messages
    - creates structured lead profiles
    - triggers instant follow-up

3. Lead Capture & Conversion Automation
    - Comment → Lead (keyword detection)
    - Message → Lead
    - Form → Lead
  
    Then:
      - auto-tag leads
      - auto-send messages
      - auto-follow-up

4. AI Engagement & Meeting Conversion
    - AI reply suggestions
    - conversation handling
    - meeting booking links

5. Operations Layer (Phase 2+)
    - pipeline management
    - task automation
    - team collaboration
    - activity tracking

6. Financial Layer (Phase 3+)
    - revenue insights
    - growth recommendations
    - access to funding (via partners or embedded finance)

7. Chat-first Experience
    - Users interact naturally:
      - “Find spa owners in HCMC and start outreach”
      - “Create a Đà Lạt post for couples under 3M budget”

AI executes across:

content
targeting
outreach
follow-up

### Success Metrics (Phase 1)
- User books at least 1 meeting within 7 days of signup
- 30-day retention ≥ 40%
- Free-to-Pro conversion ≥ 8%
- Campaign setup time < 10 minutes (first campaign)



---

## 2. Target Users

### Primary (Phase 1)
| Segment | Use Case |
|---|---|
| Recruitment freelancers / agencies | Sourcing candidates, business development with hiring managers |
| Insurance agents | Life/health product outreach, renewal reminders, referrals |
| Travel agents / agencies | Package promotions, inquiry nurture, rebooking campaigns |
| Marketing freelancers / agencies | Client prospecting, retainer pitches |

### Secondary (Phase 1–2)
- Small B2B sales teams (2–10 people)
- SaaS founders doing founder-led sales

### Expand (Phase 2+)
- Real estate agents
- Multi-channel e-commerce sellers
- SMEs (10–100 employees)

---

## 3. User Personas

### Persona A — Solo Recruiter "Linh"
- **Role:** Independent recruitment consultant, Vietnam
- **Goal:** Consistently source candidates for 3–5 open roles and pitch new clients monthly
- **Pain:** Spends 3+ hours/day manually messaging candidates on LinkedIn and email
- **Jobs to be done:** Send 50+ personalized outreach messages/day without sounding spammy; follow up automatically; know which candidates replied
- **RevLooper value:** Upload a CSV of LinkedIn profiles → AI writes personalized messages → auto follow-up → inbox shows all replies

### Persona B — Insurance Agent "Minh"
- **Role:** Life insurance agent, Ho Chi Minh City
- **Goal:** Reach 200+ warm prospects per month, convert 5–10 into policy holders
- **Pain:** No system for follow-up; relies on memory and spreadsheets
- **Jobs to be done:** Send WhatsApp/email follow-ups automatically; know who is hot vs cold; book appointments
- **RevLooper value:** AI-powered multi-step sequence with Zalo + email; AI lead scoring; calendar booking link

### Persona C — Marketing Agency Owner "Tom"
- **Role:** Founder of a 3-person digital marketing agency, English-speaking market
- **Goal:** Land 2 new retainer clients per month
- **Pain:** Too busy running campaigns for clients to prospect for his own agency
- **Jobs to be done:** Run automated prospecting campaigns while he sleeps; manage replies in one inbox; track pipeline
- **RevLooper value:** AI campaign builder → runs outreach → Kanban pipeline → AI reply suggestions

### Persona D — AI-Employee-Enabled SMB Owner "Hoa"
- **Role:** Founder of a 5-person e-commerce brand in Ho Chi Minh City
- **Goal:** Run growth and content operations at the scale of a 20-person team without hiring
- **Pain:** Marketing, content scheduling, and competitor tracking consume half her week; can't afford specialists
- **Jobs to be done:** Have a Growth AI Employee post content daily, a Competitor Monitor track market pricing, and a Sales AI Employee follow up on warm leads — all requiring zero manual intervention on routine decisions
- **RevLooper value:** Rent 2–3 specialist AI employees from the marketplace; each shares Hoa's AI Brain for business context; CEO-level decisions (e.g. ad spend > $200) surface in a dedicated approval inbox rather than running autonomously

---

## 4. Feature Map

| Feature Area | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| Lead Management | ✅ CSV + manual + tags | ✅ Enrichment + scoring | ✅ Cross-channel identity | |
| AI Campaign Builder | ✅ Chat → campaign | ✅ Multi-channel | ✅ Advanced automation | |
| Email Outreach | ✅ Core | ✅ Enhanced deliverability | | |
| LinkedIn Outreach | | ✅ | ✅ | |
| Facebook Messenger | | ✅ | ✅ | |
| Zalo | | ✅ | ✅ | |
| WhatsApp | | ✅ | ✅ | |
| Follow-up Automation | ✅ Rule-based + AI | ✅ Multi-channel | ✅ Advanced | |
| Meeting Booking | ✅ | ✅ Round-robin | ✅ Team | |
| Analytics | ✅ Campaign-level | ✅ Lead-level | ✅ Revenue analytics | |
| AI Reply Assistant | | ✅ | ✅ | |
| CRM Kanban | | ✅ | ✅ | |
| Workflow Automation | | ✅ | ✅ | |
| Unified Inbox | | ✅ | ✅ | |
| **AI Brain (Private RAG)** | ✅ Basic (3 docs) | ✅ Full (20 docs) | ✅ Advanced (100 docs) | |
| **AI Brain Knowledge Harvester** | | ✅ Chat + Templates + Dump + Reflection | ✅ Advanced | |
| **AI Advisor (Proactive)** | | ✅ | ✅ | |
| **AI Lead Scoring** | | ✅ Weighted signals (0–100) | ✅ ML per workspace | |
| **Campaign Content Studio** | | ✅ 10 types, 14 functions | ✅ Publishing | |
| **Solo Operator Mode** | | ✅ Autopilot / Review / Manual | | |
| **Daily Ops Brief** | | ✅ 7-card morning panel | | |
| Team Workspace | | ✅ (3 seats) | ✅ Unlimited | |
| **AI Employee Marketplace** | | | ✅ Catalog API (empty catalog v1) | ✅ Full catalog agents |
| **AI Employee Rentals & Runs** | | | ✅ Rental lifecycle, spend caps, dry-run, CEO approval inbox | ✅ |
| **AI Employee SOPs** | | | ✅ Workspace + per-rental markdown SOPs | ✅ |
| **Multi-Agent Orchestration** | | | ✅ LangGraph-based agent graph execution | ✅ |
| **AI Employee Authoring Platform (admin)** | | | | ✅ Version lifecycle, two-person publish rule |
| Financial Dashboard | | | | ✅ |
| Credit Scoring | | | | ✅ |
| Loan Marketplace | | | | ✅ |

---

## 5. Phase 1: Revenue Generation

**Goal:** User imports leads, runs an AI-powered email campaign, and books meetings — all within RevLooper.

---

### 5.1 Authentication & Workspace

#### User Stories
- As a new user, I can sign up with email/password or Google OAuth so that I can access RevLooper quickly
- As a user, I can create or join a workspace so that my data is isolated from other organizations
- As a user, I can invite team members to my workspace (Business/Agency plans)

#### Acceptance Criteria
- [ ] Sign up with email + password (Supabase Auth)
- [ ] OAuth: Google, Facebook sign-in (Supabase providers)
- [ ] Email verification required before accessing dashboard
- [ ] On first login, **onboarding wizard** runs — see §5.1b below
- [ ] Workspace creation is automatic on signup (1 workspace per free user)
- [ ] JWT token used for all API calls; refreshed silently
- [ ] Password reset via email link

---

### 5.1b AI Brain Cold Start — Onboarding Wizard

When a new user has zero Workspace RAG documents, all AI outputs are generic. The onboarding wizard fixes this at the activation moment by extracting key business context through a short AI-guided chat and auto-creating the first AI Brain document.

#### User Stories
- As a new user, I am guided through a 5-question chat that teaches RevLooper about my business so that AI outputs are relevant from my very first campaign

#### Acceptance Criteria
- [ ] Triggered immediately after workspace creation, before the main dashboard is shown
- [ ] 5-question AI chat flow, one question at a time:
  1. "What do you sell or offer?" (product/service description)
  2. "Who is your ideal customer?" (ICP — company size, role, industry)
  3. "What problem do you solve for them?" (value proposition)
  4. "What makes you different from alternatives?" (differentiator)
  5. "Describe your tone — how do you naturally write?" (brand voice — user pastes a sample email or describes it)
- [ ] AI synthesizes answers into a single structured document: **"Business Profile"** — auto-created as the first AI Brain document (type: `Company Info`)
- [ ] User can skip the wizard ("I'll set this up later") — shown a reminder banner until AI Brain has ≥ 1 document
- [ ] After wizard completion: user lands on dashboard with AI Brain indicator showing "1 document · AI ready"
- [ ] Wizard can be re-run from Settings → AI Brain → "Redo Business Profile"

---

### 5.2 Lead Management

#### User Stories
- As a user, I can upload a CSV of leads so that I can import my existing contact list
- As a user, I can manually add individual leads so that I can add prospects one by one
- As a user, I can connect an acquisition anchor (Facebook Page/Lead Ads, Google Ads lead form, or hosted RevLooper lead page) so that new leads flow into RevLooper automatically
- As a user, I can tag and filter leads so that I can segment my audience for targeted campaigns
- As a user, I see a warning when duplicate emails are detected so that I don't send duplicate outreach
- As a user, I can view a lead's full activity timeline so that I can understand all past interactions

#### Acceptance Criteria
- [ ] CSV upload: accepts `.csv` files up to 10MB; required columns: `email`; optional: `first_name`, `last_name`, `company`, `title`, `phone`, `custom_*`
- [ ] Column mapping UI: user maps CSV columns to RevLooper fields
- [ ] Duplicate detection: flag leads with existing email in workspace; user can skip or overwrite
- [ ] Manual entry form: email (required), name, company, title, phone, tags, notes
- [ ] Lead list view: searchable, filterable by tag/status/campaign, sortable by created date or last activity
- [ ] Lead detail view: contact info, tags, notes, activity timeline (emails sent, replies, meetings, notes)
- [ ] Bulk actions: tag, delete, add to campaign, export CSV
- [ ] Every lead has source attribution fields: `source_type`, `source_id`, `source_campaign_id` (if applicable), and raw source payload in metadata
- [ ] Free plan limit: 100 leads total; show upgrade prompt when approaching limit

#### Lead Enrichment
When a lead is added (manually or via CSV), RevLooper can auto-enrich the record with additional data (company size, industry, LinkedIn URL, etc.).

| Provider | Role | Trigger |
|---|---|---|
| **Hunter.io** | Email verification + finder | On lead import; verify email deliverability before sending |
| **Apollo.io API** | Full B2B enrichment (title, company size, industry, LinkedIn, phone) | On-demand (1 click) or auto on Pro+ plans; costs 3 credits |

- [ ] Email verification via Hunter.io runs automatically on all imported leads (no credits — included in plan)
- [ ] Enrichment button on lead detail: "Enrich with Apollo" → fills in missing fields; costs 3 credits; result shown immediately
- [ ] Enrichment status field on lead: `not_enriched` | `verified` | `enriched` | `invalid`
- [ ] Invalid email (Hunter bounce prediction > 80%): lead flagged, excluded from sequences by default with override option
- [ ] Bulk enrich: select leads → "Enrich all" → credit cost preview → confirm
- [ ] Enrichment data stored on lead record; user can manually override any enriched field

#### Data Model
```
Lead {
  id: uuid
  workspace_id: uuid
  email: string (unique per workspace)
  first_name: string?
  last_name: string?
  company: string?
  title: string?
  phone: string?
  tags: string[]
  status: enum(new, contacted, replied, qualified, meeting, won, lost, unsubscribed, bounced)
  source_type: enum(manual, csv, facebook_lead_ads, google_lead_form, landing_page_form, api, webhook)
  source_id: string?
  source_campaign_id: string?
  source_payload: jsonb
  custom_fields: jsonb
  created_at: timestamp
  updated_at: timestamp
}
```

### 5.2b Inbound Acquisition Anchors

RevLooper must support acquisition anchor points where prospects find the user first, then auto-sync those leads into the existing RevLooper workflow (enrichment, scoring, sequence routing, inbox, CRM).

#### Supported Anchors (Phase 1-2)
- **Facebook Lead Ads / Instant Forms** (Meta)
- **Google Ads Lead Forms**
- **Zalo Lead Forms** (Official Account form capture)
- **TikTok Lead Forms** (Lead Generation ads)
- **RevLooper Hosted Lead Page** (lightweight page + form, one URL per workspace or campaign)

#### User Stories
- As a user, I can connect Facebook Lead Ads so that every new ad lead appears in RevLooper automatically
- As a user, I can connect Google Ads lead forms so that paid search leads are captured without manual export
- As a user, I can sync Zalo and TikTok forms so that social leads are captured without manual CSV exports
- As a user, I can create a simple hosted lead page in RevLooper and share one URL to collect leads directly
- As a user, inbound leads are enriched and routed into my campaign workflow automatically

#### Acceptance Criteria
- [ ] Integrations UI: connect Meta and Google ad accounts from Settings → Integrations → Lead Sources
- [ ] Integrations UI: connect Meta, Google, Zalo, and TikTok accounts from Settings → Integrations → Lead Sources
- [ ] Webhook/poll ingestion: new leads from connected anchors are ingested within 2 minutes
- [ ] Deduplication: same email/phone/domain merges with existing lead (workspace-scoped)
- [ ] Auto-enrichment waterfall on ingest: Hunter verify -> Apollo enrich (if Pro+) -> fallback retain partial record if enrichment fails
- [ ] Auto-routing rule engine: user-configurable mapping from source/campaign/form -> destination campaign, owner, tags, and sequence
- [ ] Source dashboard: leads by source, CPL proxy, reply rate, meeting rate, and won revenue per source
- [ ] Consent capture: consent statement text and timestamp stored per inbound lead (`consent_log`)
- [ ] Failure handling: failed ingestion events visible in Integrations health panel with replay option

### 5.2c Campaign Forms Module (Core Inbound Engine)

Each campaign can own multiple forms for different acquisition intents (demo request, pricing inquiry, webinar signup, consultation booking, recruitment intake, etc.). All submissions flow into the campaign's lead pool and continue in RevLooper's existing enrichment + sequence workflow.

#### User Stories
- As a user, I can create multiple forms inside one campaign so that each audience segment has a tailored intake experience
- As a user, I can add custom fields (text, dropdown, checkbox, phone, company size, budget range, etc.) per form
- As a user, I can embed campaign forms on my landing pages and websites
- As a user, I can map third-party forms (Facebook/Google/Zalo/TikTok) to the same campaign form schema
- As a user, I can ask AI to generate a complete form from campaign/workflow context and create the corresponding third-party forms automatically

#### Acceptance Criteria
- [ ] Campaign detail includes a **Forms** tab with list view and analytics per form
- [ ] One campaign supports unlimited forms (Free: 1 active form, Pro+: unlimited)
- [ ] Form builder supports field types: short text, long text, email, phone, dropdown, radio, checkbox, multi-select, number, date, hidden field
- [ ] Field-level validation: required, regex/pattern, min/max length, value ranges
- [ ] Form submit creates or updates lead in campaign lead pool (`campaign_leads`) with source attribution and submission payload
- [ ] Embeddable form options: JavaScript embed snippet + iframe embed + hosted public URL
- [ ] Form-to-campaign routing rules: assign owner, tags, sequence, priority by form
- [ ] Third-party sync supports form import + bidirectional field mapping for Facebook/Google/Zalo/TikTok
- [ ] Sync health panel shows: connected status, last sync, failed submissions, replay action
- [ ] AI Form Generator:
  - Input: campaign objective, ICP, offer, sequence steps, desired qualification depth
  - Output: form title, description, question set, field types, validation, and recommended thank-you CTA
  - One-click action: publish RevLooper hosted form and create mapped third-party forms on connected platforms
- [ ] Compliance: each form includes consent checkbox template + privacy text; stored with submission timestamp and source

#### Data Model
```
CampaignForm {
  id: uuid
  workspace_id: uuid
  campaign_id: uuid
  name: string
  slug: string
  status: enum(draft, active, paused, archived)
  schema: jsonb            // field definitions, validations, labels, localization
  routing_config: jsonb    // owner/tags/sequence mapping
  embed_config: jsonb      // theme, success redirect, tracking settings
  created_at: timestamp
  updated_at: timestamp
}

FormSubmission {
  id: uuid
  workspace_id: uuid
  campaign_form_id: uuid
  lead_id: uuid?
  source_channel: enum(hosted_form, embed_form, facebook_form, google_form, zalo_form, tiktok_form)
  external_submission_id: string?
  payload: jsonb
  utm: jsonb
  consent_snapshot: jsonb
  created_at: timestamp
}
```

---

### 5.3 AI Campaign Builder

#### User Stories
- As a user, I can describe my outreach goal in plain English and the AI builds a full campaign so that I don't need to be a copywriter
- As a user, I can edit the AI-generated campaign steps before sending so that I maintain control
- As a user, I can select an industry playbook as a starting point so that I have a proven starting template
- As a user, I can set tone, length, and personalization level for AI-generated emails so that the output matches my brand

#### Acceptance Criteria
- [ ] Chat interface: text input where user types goal (e.g., "I want to recruit Java developers for a fintech startup in Singapore")
- [ ] AI returns: campaign name suggestion, 3–5 email sequence steps, subject lines, email bodies with `{{first_name}}` / `{{company}}` variables, recommended send delays
- [ ] User can regenerate any step or edit inline
- [ ] Playbook selector: pre-built templates for Recruitment, Travel, Insurance, Marketing Agency
- [ ] Tone controls: Professional / Friendly / Direct / Consultative
- [ ] Length controls: Short (< 100 words) / Medium (100–200 words) / Long (200+ words)
- [ ] Preview: shows rendered email with sample lead data filled in
- [ ] AI generation consumes 1 credit per email step generated
- [ ] Free plan: limited to 1 active campaign at a time

#### AI Prompt Strategy
- System prompt includes workspace industry context, user's ICP description, tone setting
- Uses LiteLLM router: GPT-4o-mini for initial draft (cheap), Claude Sonnet for refinement if user requests
- Personalization variables injected at send time, not at generation time

---

### 5.4 Sequence Builder

#### User Stories
- As a user, I can build a multi-step sequence with emails, delays, and conditions so that my outreach runs automatically
- As a user, I can set stop conditions so that the sequence stops when a lead replies or books a meeting
- As a user, I can assign leads to a campaign so that they enter the sequence

#### Acceptance Criteria
- [ ] Drag-and-drop step builder with step types: Email, Wait (X days), Condition (replied? / opened? / clicked?)
- [ ] Wait step: configurable delay in hours or days
- [ ] Condition step: branch on "replied", "opened", "clicked booking link", "bounced"
- [ ] Stop conditions: auto-stop on reply, auto-stop on meeting booked, manual unsubscribe
- [ ] Sequence can have up to 10 steps (Pro+: unlimited)
- [ ] Lead assignment: add individual leads or full lead lists/segments to a campaign
- [ ] Campaign status: Draft, Active, Paused, Completed
- [ ] Sequence preview: visual flowchart view of all steps

#### Data Model
```
Campaign {
  id: uuid
  workspace_id: uuid
  name: string
  status: enum(draft, active, paused, completed)
  industry: string?
  created_at: timestamp
}

Sequence {
  id: uuid
  campaign_id: uuid
  steps: SequenceStep[]
}

SequenceStep {
  id: uuid
  sequence_id: uuid
  position: int
  type: enum(email, wait, condition)
  config: jsonb  // email body, delay value, condition type
}
```

---

### 5.5 Email Outreach Engine

#### User Stories
- As a user, I can send personalized cold emails from my own email address so that emails don't appear to come from a third-party tool
- As a user, I can connect my Gmail or Outlook account so that RevLooper sends via my own mailbox
- As a user, my emails include proper unsubscribe handling so that I stay compliant with anti-spam laws

#### Acceptance Criteria
- [ ] Gmail OAuth integration (Gmail API, send-as user's address)
- [ ] Outlook OAuth integration (Microsoft Graph API)
- [ ] SMTP custom connection option (Business/Agency plans)
- [ ] Personalization: `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{title}}`, `{{custom_*}}` variables
- [ ] Unsubscribe footer: automatically appended on all outreach emails (required on Free plan, optional on Pro+)
- [ ] Bounce handling: hard bounces → mark lead as `bounced`, remove from sequence; add to workspace suppression list
- [ ] Open tracking: pixel-based, opt-in per campaign (with disclaimer in UI)
- [ ] Click tracking: UTM parameter injection, opt-in per campaign
- [ ] Send time: user sets preferred send window (e.g., Mon–Fri, 9am–5pm recipient timezone)
- [ ] Daily send limits: Free = 20/day, Pro = 200/day, Business = 500/day, Agency = 2,000/day

#### Suppression List
- [ ] Per-workspace suppression list: email addresses that will never receive outreach (bounced + manually added + unsubscribed)
- [ ] Suppression enforced at send time — checked before every email dispatch
- [ ] User can view, search, and manually add/remove suppression entries in Settings → Suppression List
- [ ] Agency plan: workspace-level suppression lists (one per client workspace); no cross-client sharing
- [ ] Suppression list import: upload CSV of known-bad/do-not-contact addresses

#### Email Warm-Up (Pro+ plans)
New Gmail/Outlook accounts and custom domains have low sender reputation — emails land in spam. Warm-up gradually builds reputation by auto-sending and auto-replying within a peer network before real campaigns start.

- [ ] Warm-up toggle per connected mailbox in Settings → Email Accounts → Warm-Up
- [ ] Integration: **Mailreach** API (3rd-party warm-up network) — RevLooper calls Mailreach API to enroll the mailbox
- [ ] Warm-up schedule: starts at 5 emails/day, increases by 2/day, caps at 40/day over ~3 weeks
- [ ] Warm-up status visible in settings: day count, emails warmed, inbox placement score
- [ ] Warning shown if user tries to send a real campaign from a mailbox that has `<7 days` of warm-up
- [ ] Warm-up runs in background via Celery beat; does not consume sending quota
- [ ] Free plan: warm-up not available (no connected mailbox cold start protection — shown as an upgrade prompt)

---

### 5.6 Follow-up Automation

#### User Stories
- As a user, my follow-up emails are sent automatically based on the rules I set so that I don't miss any follow-up
- As a user, the AI generates varied follow-up messages so that my sequence doesn't look robotic

#### Acceptance Criteria
- [ ] Rule-based triggers: "if no reply within N days, send next step"
- [ ] AI variant generation: each follow-up step can have 2–3 AI-generated variants; system rotates them across leads (reduces spam flags)
- [ ] Stop conditions enforced: no message sent to a lead who has replied, unsubscribed, or bounced
- [ ] Celery worker executes scheduled steps; retries on transient failure (up to 3x)
- [ ] All scheduled/sent/failed events logged to message table

---

### 5.7 Meeting Booking

#### User Stories
- As a user, I can create a booking link that prospects use to schedule a call so that I eliminate back-and-forth scheduling
- As a user, booked meetings are automatically logged to the lead's activity timeline
- As a user, the prospect and I receive reminder emails before the meeting

#### Acceptance Criteria
- [ ] Booking page: `revlooper.com/book/{workspace_slug}/{user_slug}` — public, no login required
- [ ] Calendar sync: Google Calendar (OAuth) and Outlook (OAuth); show real availability
- [ ] Meeting types: user defines duration (15 / 30 / 45 / 60 min), buffer between meetings, advance notice minimum
- [ ] **Timezone auto-detection:** booking page detects the visitor's timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` (browser JS API). Available slots are displayed in the detected timezone with an explicit label (e.g., *"Times shown in Asia/Ho_Chi_Minh (GMT+7)"*). Visitor can manually switch timezone via dropdown.
- [ ] Meeting owner's availability is stored and calculated in UTC; converted to visitor's timezone client-side.
- [ ] Booking confirmation: email to prospect + user immediately after booking; confirmation shows meeting time in **both parties' timezones**.
- [ ] Reminders: automated email 24h and 1h before meeting to both parties
- [ ] Post-booking: lead status auto-updated to `meeting`; meeting logged on activity timeline
- [ ] Meeting brief: 24h before meeting, AI generates a 1-page brief on the lead (company info, past interactions, suggested talking points) — costs 5 credits
- [ ] Cancellation / reschedule: handled via booking page, calendar event updated automatically
- [ ] Multiple booking links per user (Pro+)

---

### 5.8 Analytics Dashboard

#### User Stories
- As a user, I can see a summary of my campaign performance so that I know what's working
- As a user, I can see per-campaign stats so that I can compare campaigns

#### Acceptance Criteria
- [ ] Overview dashboard: total leads, active campaigns, emails sent (last 30 days), open rate, reply rate, meetings booked
- [ ] Campaign detail: emails sent, open rate, click rate, reply rate, meetings booked, unsubscribes, bounces
- [ ] **A/B Testing (Pro+):**
  - User can create 2 variants per sequence step: Variant A (control) and Variant B (challenger)
  - Variants can differ on: subject line, email body, or both
  - System randomly assigns each lead to a variant at enroll time (50/50 split)
  - Winning condition: configurable — open rate (default), reply rate, or click rate
  - Winner declared after: minimum 50 sends per variant AND statistical significance ≥ 90% (chi-squared test)
  - After winner declared: remaining sends automatically use the winning variant
  - A/B test results panel: variant A vs B side-by-side stats, current winner badge, confidence level
  - Manual override: user can force-select a winner at any time
- [ ] Lead funnel: visual funnel showing leads at each stage (Contacted → Replied → Meeting → Won)
- [ ] Time-series chart: emails sent and replies per day over the campaign duration
- [ ] Export: download campaign report as CSV

---

## 6. Phase 2: Close, Care & Retain

### 6.1 Multi-Channel Outreach

#### Channels Supported
- **LinkedIn** — connection request + message via Chrome Extension (Phase 2) → Cloud Browser (Phase 3)
- **Facebook Messenger** — via Facebook Pages API (business account required)
- **Zalo** — via Zalo Official Account API (SEA differentiator)
- **WhatsApp** — via WhatsApp Business API (Meta Cloud API)

#### User Stories
- As a user, I can add a LinkedIn step to my sequence so that I reach prospects on multiple channels
- As a user, all replies from all channels appear in my unified inbox

#### Acceptance Criteria
- [ ] Channel selector in sequence builder: Email / LinkedIn / Facebook / Zalo / WhatsApp
- [ ] **LinkedIn Phase 2 — Chrome Extension (Manifest V3):** user installs extension in desktop Chrome; extension polls RevLooper API for queued LinkedIn jobs and executes them (profile visit, connection request, message send). Extension authenticates with same JWT.
- [ ] **LinkedIn mobile experience:** on mobile, user can see LinkedIn job queue status and approve/cancel pending actions. Execution is desktop-only until Phase 3. A clear banner is shown: *"LinkedIn actions require the Chrome extension — open RevLooper on your desktop to execute."*
- [ ] **LinkedIn Phase 3 — Cloud Browser:** server-side Playwright + residential proxy execution. User authenticates LinkedIn once via RevLooper; all actions run server-side. Fully mobile-compatible. No user installation required.
- [ ] **Agency add-on:** AdsPower Local API and GenLogin API integration available for Agency plan users who manage LinkedIn via anti-detect browser profiles. RevLooper pushes jobs to connected profiles.
- [ ] Facebook/Zalo/WhatsApp: server-side via official APIs; requires user to connect business account
- [ ] All inbound messages from all channels flow into Unified Inbox
- [ ] Per-step: user selects which channel to use; system validates channel is connected

---

### 6.2 AI Lead Scoring

#### User Stories
- As a user, leads are automatically scored Hot / Warm / Cold so that I know who to prioritize
- As a user, I can see why a lead is Hot (the signal breakdown) so I understand the score
- As a user, a workflow trigger fires when a lead turns Hot so I can act within minutes

#### Acceptance Criteria
- [ ] Every lead has a `score` (integer 0–100) and `score_label` (Hot / Warm / Cold)
- [ ] Hot = ≥ 70 (red badge), Warm = 40–69 (yellow), Cold < 40 (grey)
- [ ] Score recalculated asynchronously within 60 seconds of any scoring signal event (Pub/Sub)
- [ ] Score visible on lead list (badge column), lead detail, Kanban card, and inbox thread header
- [ ] Score breakdown panel: hover/tap the badge → shows last 5 signals and their weight contribution (Pro+ only; Free = badge only with upgrade prompt)
- [ ] Workflow trigger `lead_scored_hot` fires when a lead transitions from Warm/Cold → Hot
- [ ] AI Advisor notification triggered on `lead_scored_hot` (see §9.3)
- [ ] Score decay: −2 points per 24h of no engagement, floor at 10
- [ ] Unsubscribe or bounce immediately sets score to 0

#### Scoring Signal Model
| Signal | Weight |
|---|---|
| Email opened | +8 per unique open (max +24 per email) |
| Email link clicked | +15 per click |
| Replied to email | +25 per reply |
| Meeting booked | +40 one-time |
| LinkedIn profile viewed | +5 |
| LinkedIn replied | +20 |
| Deal stage advanced | +15 |
| Unsubscribed | −100 (floor 0) |
| Bounced | −50 |
| No engagement 7d | −5/day decay |

---

### 6.3 AI Reply Assistant

#### User Stories
- As a user, when a lead replies, I get 3 AI-suggested responses so that I can reply quickly without thinking
- As a user, I can choose the tone of the suggested reply so that it matches the conversation context

#### Acceptance Criteria
- [ ] On incoming reply, AI generates 3 response options (Formal / Neutral / Casual)
- [ ] Each suggestion is ≤ 150 words
- [ ] User can one-click send a suggestion, or edit before sending
- [ ] Generation consumes 2 credits
- [ ] AI has context of: **full thread history** (all messages in the same `thread_id`, ordered by `sent_at` ASC), lead profile, campaign context, suggested next action (book meeting, answer objection, send info)
- [ ] **Email threading:** inbound reply is matched to the original outbound message via `thread_id` (Gmail `threadId`) or `conversation_id` (Outlook `conversationId`). Inbox groups all messages with the same `thread_id` into a single thread view.
- [ ] Objection library: pre-built counter-responses for common objections (Not interested, Wrong timing, Already have a solution, Price too high)

---

### 6.4 CRM Kanban (Light)

#### User Stories
- As a user, I can manage my pipeline visually on a Kanban board so that I always know where each deal stands
- As a user, I can add a deal value to a lead so that I can track expected revenue
- As a user, when I mark a deal as Won, the lead is automatically promoted to a Customer record

#### Acceptance Criteria
- [ ] Kanban board with fixed stages: Contacted → Replied → Qualified → Meeting → Won → Lost
- [ ] Lead cards show: name, company, deal value, last activity date, lead score badge
- [ ] Drag-and-drop between stages; stage change logged to activity timeline
- [ ] Deal value: optional currency field on each card; pipeline total shown at top of board
- [ ] Filter board by campaign, tag, or assignee
- [ ] Won: prompt for close date, deal value (if not set), and optionally trigger post-sale sequence. **Automatically creates a Customer record from the lead.**
- [ ] Lost: prompt for loss reason. Lead stays as Lead.
- [ ] One pipeline per workspace (not configurable — intentionally simple)

#### Data Models
```
Deal {
  id: uuid
  workspace_id: uuid
  lead_id: uuid
  stage: enum(contacted, replied, qualified, meeting, won, lost)
  value: decimal?
  currency: string (default: USD)
  close_reason: string?
  close_date: date?
  assigned_to: uuid? (user_id)
  created_at: timestamp
  updated_at: timestamp
}
```

---

### 6.5 Customer Management (Post-Sale)

> **Lead vs Customer:** A Lead is a prospect being worked in the sales funnel. A Customer is a won lead with an active post-sale lifecycle. They are separate records. A Lead can only become a Customer when a deal is moved to Won. The Customer record inherits the lead’s contact data and full activity history.

#### User Stories
- As a user, I can see all my customers in a dedicated list separate from prospects so that I can manage post-sale separately
- As a user, I can set up automated post-sale sequences (onboarding, check-ins, upsell) for customers so that I maintain relationships without manual effort
- As a user, I receive NPS feedback from customers at configurable intervals so that I know how satisfied they are
- As a user, I can see a customer’s full history (deals, messages, NPS, meetings) in one timeline

#### Acceptance Criteria
- [ ] Customer list: separate from Leads, shows all won customers per workspace
- [ ] Customer record fields: contact info (inherited from Lead), company, customer since date, deal value, lifetime value (sum of all deals), assigned owner, health score, last contact date, NPS score
- [ ] Customer activity timeline: every message, meeting, NPS response, deal, note, and tag change in reverse-chronological order
- [ ] Post-sale sequence types: Onboarding (first 30 days), Check-in (periodic), Upsell, Re-engagement
- [ ] NPS collection: automated email with embedded 0–10 scale; sent at intervals configurable per workspace (e.g., 30 days post-close, then every 90 days); response stored on customer record
- [ ] CSAT collection: single-question rating email triggered after a meeting or key interaction
- [ ] Customer health score (computed): composite of recency of last contact, NPS score, email engagement, meeting frequency — shown as Green / Yellow / Red
- [ ] Notes: free-text notes on customer record, timestamped

#### Data Model
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  lead_id UUID NOT NULL REFERENCES leads(id),   -- source lead (for history continuity)
  assigned_to UUID REFERENCES users(id),
  customer_since DATE NOT NULL,
  lifetime_value DECIMAL(15,2) DEFAULT 0,
  health_score TEXT DEFAULT 'green',             -- green|yellow|red
  nps_score INTEGER,                             -- latest NPS (0-10)
  last_contact_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  type TEXT NOT NULL,                            -- nps|csat
  score INTEGER,                                 -- NPS: 0-10; CSAT: 1-5
  comment TEXT,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 6.6 Unified Inbox

#### User Stories
- As a user, all replies from all channels appear in one inbox so that I never miss a message
- As a user, I can reply from the inbox without switching tools

#### Acceptance Criteria
- [ ] Inbox shows all inbound messages across email, LinkedIn, Facebook, Zalo, WhatsApp
- [ ] Each message shows: channel icon, lead name, company, preview, timestamp, read/unread status
- [ ] Thread view: full conversation history for each lead
- [ ] Reply directly from inbox (channel auto-detected)
- [ ] AI Reply Assistant accessible inline
- [ ] Filter by channel, read/unread, assigned/unassigned
- [ ] Mark as done / snooze (resurface in N days)
- [ ] Assign conversation to team member (Business/Agency plans)

---

### 6.7 Post-Sale Sequences

#### User Stories
- As a user, when a lead becomes a customer, I want an onboarding sequence to start automatically
- As a user, I can build post-sale sequences the same way I build outreach campaigns

#### Acceptance Criteria
- [ ] Sequence builder supports a new sequence type: **Post-Sale** (separate from outreach sequences)
- [ ] Post-Sale sequence trigger: Customer created (from won deal), or manually applied
- [ ] Pre-built post-sale templates available in System RAG: Onboarding (Day 1/7/30), Quarterly Check-in, Upsell Intro, Re-engagement
- [ ] AI generates post-sale email content using Customer’s Workspace RAG context (product info, their purchase, their name/company)
- [ ] Step types in post-sale sequences: Email, Wait, NPS trigger, Task (create manual task for owner), Condition (if health = Red, branch to re-engagement flow)
- [ ] Sequence stops automatically if customer unsubscribes or marks as churned

---

### 6.8 Workflow Automation

#### User Stories
- As a user, I can define if/then rules so that pipeline actions happen automatically without manual work

#### Acceptance Criteria
- [ ] Trigger types: lead replied, lead clicked booking link, deal stage changed, lead scored as Hot, specific tag added
- [ ] Action types: move deal stage, send notification to user, assign to team member, add tag, send specific email template, create task
- [ ] Workflow builder: visual if-trigger → then-action UI (simple, 1 level deep — no nested conditions in Phase 2)
- [ ] Up to 5 active workflows (Business), unlimited (Agency)
- [ ] Workflow execution logged per lead

---

### 6.9 Revenue Signals

#### User Stories
- As a user, I can see my total pipeline value and projected revenue so that I can forecast my business

#### Acceptance Criteria
- [ ] Pipeline value: sum of all open deal values on Kanban board
- [ ] Win rate: percentage of deals moved to Won vs total closed (Won + Lost)
- [ ] Projected revenue: pipeline value × win rate (shown as range, not exact)
- [ ] Revenue by campaign: which campaigns drive the most pipeline value
- [ ] Historical chart: pipeline value over time (last 90 days)

---

### 6.10 Agency Workspace Management

> Agencies use RevLooper to run outreach for multiple clients. Each client gets their own isolated workspace. The agency owner manages all workspaces from a single account.

#### User Stories
- As an agency owner, I can see all my client workspaces at a glance so that I can monitor performance across all accounts
- As an agency owner, I can switch between client workspaces instantly so that I don't need to log in and out
- As an agency owner, I can create a new client workspace from a template so that onboarding a new client takes minutes

#### Acceptance Criteria
- [ ] **Workspace switcher:** dropdown in the top navigation bar showing all workspaces the user owns or is a member of. Switching workspaces reloads the dashboard in the selected workspace context — no re-authentication.
- [ ] **Agency Overview Dashboard:** top-level view (above individual workspace) showing all client workspaces in a table/grid. Columns: workspace name, plan, total leads, active campaigns, meetings booked (last 30 days), revenue attributed (last 30 days), health (green/yellow/red based on campaign activity).
- [ ] **Workspace templates:** Agency owner can mark an existing workspace as a template. When creating a new workspace, option to "Clone from template" — copies sequences, playbook settings, email signatures, AI Brain documents, and workflow automations. Lead data and messages are NOT cloned.
- [ ] **Centralized billing:** Agency plan covers all client workspaces under one subscription. Individual client workspaces do not require separate billing.
- [ ] **Sub-account roles:** Agency owner can invite team members to specific client workspaces with scoped permissions (Admin/Member/Viewer per workspace).
- [ ] **White-label:** Agency add-on (+$50/mo) removes RevLooper branding from all booking pages and client-facing emails across all managed workspaces.

#### Data Model
See `workspace_groups` and `workspace_group_members` tables in ARCHITECTURE.md §5 DB Schema.

---

### 6.11 Campaign Content Studio

RevLooper users currently leave the platform to produce campaign content — going to Canva, ChatGPT, or Jasper — losing campaign context, AI Brain grounding, and brand voice in the process. The Content Studio brings multi-format AI content generation into RevLooper, grounded in the workspace AI Brain (RAG) and SEA-channel-aware.

#### Content Types
| # | Type | Format | Channel |
|---|---|---|---|
| 1 | Ad Copy | Headline + body + CTA | Facebook, Google, Zalo |
| 2 | Social Post | Text + hashtags (≤ 2,200 chars) | Facebook, LinkedIn, Zalo, TikTok |
| 3 | Broadcast Message | ≤ 1,000 chars | Zalo, WhatsApp |
| 4 | Email Newsletter | Rich text / HTML | Email |
| 5 | SMS Template | ≤ 160 chars | SMS |
| 6 | Banner / Social Card | PNG image (1080×1080 / 1200×628 / 1080×1920) | Facebook, LinkedIn, Display |
| 7 | Infographic | PNG with layout | Email, Social |
| 8 | AI-generated Image | Free-form PNG via Ideogram 2.0 | Any |
| 9 | Email Template | Reusable HTML email shell (header/footer/brand) | Email |
| 10 | Brochure / Flyer | PDF (A4) via WeasyPrint | Email attachment, download |

#### User Stories
- As a user, I can generate ad copy, social posts, banners, and email templates without leaving RevLooper, all grounded in my AI Brain
- As a user, when I create a new campaign with no content assets, a Starter Pack of 5 preview cards is shown so I can one-click generate the most useful assets
- As a user, I can browse and manage all workspace content assets in a shared library
- As a user, I can adapt existing content for a different channel (e.g., email → Zalo broadcast) in one click
- As a user, I can generate Vietnamese / Thai text in banner images natively

#### Acceptance Criteria
- [ ] Content Studio accessible from Campaign Detail → **Content** tab and from global sidebar (all workspace content)
- [ ] **Starter Pack:** shown on first visit per campaign with 0 assets; AI analyzes campaign context + top 3 AI Brain chunks → generates 5 preview cards (3 ad headline variants, 1 social post, 1 email newsletter intro); "Generate all & save" costs 8 credits; individual card creation = 1–2 credits
- [ ] Starter Pack is shown only on first visit (0-assets state) and when user explicitly clicks "Re-run Starter Pack" — never auto-triggered on repeat visits
- [ ] **14 power functions:** Write Ad Copy (1 cr), Social Post (1 cr), Broadcast Message (1 cr), Email Newsletter (2 cr), Adapt for Channel (1 cr), Translate EN/VI/TH (1 cr), A/B Variants (1 cr), Generate Banner (5 cr), Create Infographic (5 cr), AI-generated Image (20 cr), Improve This (1 cr), ICP Personalize (1 cr), Build Brochure (8 cr), Create Email Template (3 cr)
- [ ] All text generation grounded in workspace AI Brain (top-K RAG chunks in system prompt); zero additional credits for RAG retrieval
- [ ] Image generation: HTML Jinja2 template → Playwright headless render → PNG → Cloudflare R2; async job with status polling; 5 built-in templates (recruitment-card, insurance-promo, travel-deal, generic-announcement, event-invite)
- [ ] Image templates use Google Fonts Noto Sans for VI/TH/EN multilingual text rendering
- [ ] Brochure: HTML sections → WeasyPrint PDF → Cloudflare R2; PDF URL stored on asset record
- [ ] Email Template: AI generates full HTML shell; inline HTML editor for final edits (no drag-and-drop WYSIWYG)
- [ ] AI-generated Image: Ideogram 2.0 API; prompt from user + AI Brain context; async
- [ ] Content asset library: workspace-scoped; search/filter by type / channel / status; `draft | published | archived` lifecycle
- [ ] Campaign association: each asset can be linked to a campaign; unlinked = workspace library asset
- [ ] Credits enforced before generation; generation failure = no credit deduction

#### Plan Limits
| Plan | Text assets / mo | Image + PDF generations / mo |
|---|---|---|
| Free | 3 | 0 |
| Pro | 100 | 20 |
| Business | 500 | 100 |
| Agency | Unlimited | Unlimited |

---

### 6.12 Solo Operator Mode

Solo operators — recruiters, founders, insurance agents — need two things RevLooper's original model lacked: an explicit choice of how autonomous their campaigns run, and a morning briefing that tells them what to act on without checking 4 separate dashboards.

#### Feature A — Campaign Execution Mode

Every campaign has a formal execution model:
- **Autopilot** — `sequence-worker` dispatches steps at scheduled time automatically (default for Pro+)
- **Review** — steps are queued in `step_approval_queue` for the operator's batch approval before dispatch
- **Manual** — operator triggers each send explicitly (Free-plan default)

**Non-negotiable safety invariants (all modes):**
- Suppression check always enforced in `outreach-service` — cannot be bypassed by any mode
- Daily send limits always enforced
- Bounce circuit breaker: if campaign bounce rate > 5% in a 1-hour rolling window (minimum 20 sends), campaign is auto-paused and a Daily Ops Brief alert fires

#### Feature B — AI Daily Ops Brief

A morning dashboard panel surfacing the 7 most important action items:
| Card | Data Source | 1-Click Action |
|---|---|---|
| 1. Overnight replies | outreach-service | Open Inbox with overnight filter |
| 2. Hot leads with no follow-up | lead-service + scoring | Open lead detail |
| 3. Steps due today (Review queue) | campaign-service | Open Approval Queue |
| 4. Autopilot anomaly (circuit breaker) | campaign-service | Resume / inspect |
| 5. Credit warning (< 20% of plan limit) | billing-service | Top up / upgrade |
| 6. Stalled deals (Business+) | crm-service | Open deal |
| 7. Pipeline velocity (Business+) | analytics-service | Open revenue report |

Brief is assembled from structured data across 5 services — **zero LLM calls, zero credits**.

#### User Stories
- As a solo operator, I can set a campaign to Autopilot so that sequences dispatch on schedule without any daily manual action
- As a cautious operator, I can set a campaign to Review so that I approve steps in batch before they are sent
- As a solo operator, I see a Daily Ops Brief panel on my first dashboard visit each day, showing the 5–7 most important things to act on
- As a free-plan user, I see a Brief teaser with locked cards and an upgrade prompt

#### Acceptance Criteria — Execution Mode
- [ ] `campaigns.execution_mode` column: `autopilot | review | manual` (default: `autopilot`)
- [ ] Execution mode selectable in campaign wizard (Launch step) and in Campaign Settings
- [ ] Changing execution mode on an `active` campaign is blocked (API returns 409); UI requires pausing first
- [ ] Mode change restricted to `owner` / `admin` roles (member = 403)
- [ ] Every mode change written to `audit_log`
- [ ] Execution mode badge shown on Campaign List and Campaign Detail header
- [ ] Review queue: approval queue shows lead email, step preview, expiry countdown; bulk "Approve All" chunked in batches of 500 with progress bar
- [ ] Queued steps expire after 48h (configurable); expired rows reset `campaign_leads.next_step_at`

#### Acceptance Criteria — Daily Ops Brief
- [ ] Brief panel shown automatically on first dashboard visit each day (dismissed via client-side storage flag; does not re-open until next day)
- [ ] Zero LLM calls — pure structured data assembly; 0 credits consumed
- [ ] Redis cache: `ops_brief:{workspace_id}:{user_id}:{date}` TTL 26h (workspace_id mandatory in key)
- [ ] Each of the 7 cards shows count + 2–3 preview rows + 1-click action button
- [ ] Cards 6–7 shown only for Business+ users with Spec 30 (Revenue Signals) data
- [ ] Free plan: cards 1–3 shown as teaser with blurred content + "Upgrade to Pro" CTA
- [ ] Brief generated lazily on first `GET /advisor/daily-brief` request if Cloud Scheduler hasn't fired yet

#### Plan Gating
| Feature | Required Plan |
|---|---|
| Autopilot mode | Pro+ |
| Review mode | Pro+ |
| Manual mode | All plans (Free default) |
| Daily Ops Brief cards 1–5 | Pro+ |
| Daily Ops Brief cards 6–7 (pipeline) | Business+ |

---

## 7. Phase 3: Revenue Operations

### 7.1 SEA Deep Channel Integrations
- Zalo Official Account API: full automation (message, broadcast, QR flow)
- TikTok Business Messaging API
- Shopee Seller Messaging API
- Lazada Seller Center API

### 7.2 Unified Revenue Dashboard
- Revenue by channel (email, LinkedIn, Zalo, TikTok, Shopee, etc.)
- Orders, leads, and performance in one view
- Cross-channel attribution (first touch, last touch, linear)

### 7.3 Unified Customer Timeline
- All messages, meetings, purchases, and interactions per contact across all channels and time
- Merge duplicate contacts across channels (email + Zalo ID + Facebook ID → one record)

### 7.4 AI Operations Assistant
- Natural language query interface: "Which campaign had the highest reply rate last month?"
- Proactive recommendations: "Your Zalo campaign has 3x higher reply rate than email — consider shifting budget"
- Anomaly detection: "Lead reply rate dropped 40% this week — possible deliverability issue"

### 7.5 Team Workspace
- Roles: Owner, Admin, Member, Viewer
- Shared inbox with assignment
- Task creation and assignment per lead/deal
- Performance dashboard per team member (emails sent, replies, meetings booked, deals won)
- Activity logs

---

## 8. Phase 4: Financial Layer

### 8.1 Financial Dashboard
- Monthly revenue, MoM growth, projected annual revenue
- Pipeline-to-revenue conversion rates
- Profit estimation (manual input or connected to accounting integration)

### 8.2 AI Financial Insights
- "Based on your pipeline, you can safely invest in 1 more sales hire"
- "Your revenue consistency over 6 months qualifies you for growth capital"
- "Top 3 actions to increase revenue by 20% next quarter"

### 8.3 Credit Scoring Engine
- Score based on RevLooper behavioral data: revenue consistency, pipeline health, engagement trends, account age
- Score feeds into loan marketplace eligibility

### 8.4 Loan Marketplace
- Partner integration with banks and fintech (Vietnam: TPBank, VPBank, MoMo; Global: Clearco, Pipe)
- Show matched loan offers based on credit score
- 1-click application flow
- Status tracking within RevLooper

---

## 9. AI Brain — Private Workspace RAG

### Overview
The AI Brain is the user's private knowledge store that makes RevLooper's AI deeply aware of their specific business. Instead of generic AI outputs, every generated email, reply suggestion, campaign recommendation, and advisor insight is grounded in the user's own product info, brand voice, personas, and past wins.

This is available from **Phase 1 Day 1** (limited on Free, full on paid plans) — it is the primary mechanism for AI output quality differentiation.

---

### 9.1 Document Management

#### User Stories
- As a user, I can upload documents about my business so that the AI generates emails that sound like me and reference my actual product
- As a user, I can see all my uploaded documents and their processing status so that I know what the AI knows
- As a user, I can delete documents to remove outdated information from the AI's knowledge
- As a user, I can import content from a URL so that I can quickly index my own website or a competitor's page
- As a user, I can test the AI Brain so that I can confirm it's using my documents correctly before launching a campaign

#### Acceptance Criteria
- [ ] Upload UI in Settings → AI Brain: drag-and-drop or file picker
- [ ] Supported formats: PDF, DOCX, TXT, MD (max 10MB per file)
- [ ] URL import: input field, scrape button, scraping done server-side via `trafilatura`
- [ ] Text paste: textarea for raw text input (useful for pricing, personas written directly)
- [ ] Document type selector on upload: Product Info / Pricing / ICP & Personas / Brand Voice / Past Emails / Competitor Analysis / Case Studies / Company Info / Custom Objection Scripts
- [ ] Processing status badge: Processing → Ready / Error
- [ ] Document list: title, type, source, status, chunk count, upload date, delete button
- [ ] AI Brain status summary: "AI knows about X documents covering Y topics" (shown at top of AI Brain settings page and as a tooltip on the AI campaign chat input)
- [ ] Test AI Brain: text input → shows retrieved context chunks + a sample AI response
- [ ] Plan limits enforced with upgrade prompt when limit is reached

#### Plan Limits
| Plan | Max Documents | Max Storage |
|---|---|---|
| Free | 3 | 3MB |
| Pro | 20 | 50MB |
| Business | 100 | 500MB |
| Agency | Unlimited | 2GB |

---

### 9.2 AI Context Integration

#### How AI Brain affects generation

When any AI operation is requested, the `rag_service` performs a semantic similarity search across:
1. **System RAG** — RevLooper's shared knowledge base (vertical playbooks, objection library, tactics)
2. **Workspace RAG** — the user's private AI Brain documents

The top retrieved chunks are injected into the AI prompt as context, before the user's request.

**Impact on each AI feature:**

| Feature | Without AI Brain | With AI Brain |
|---|---|---|
| Email generation | Generic, template-like | References real product, uses actual pricing, matches brand voice |
| Follow-up generation | Standard patterns | Adapts to user's past email style; uses their case studies as proof points |
| AI Reply Assistant | Generic suggestions | Answers objections using user's actual counter-arguments and product details |
| Campaign structure | Vertical best practices | Adds ICP-specific pain points, uses user's real value proposition |
| AI Advisor | Generic recommendations | Specific to user's business situation, product, and goals |

---

### 9.3 AI Advisor — Proactive Recommendations

#### User Stories
- As a user, I receive proactive AI recommendations when a situation warrants action so that I never miss an opportunity
- As a user, I can chat with the AI Advisor to ask questions about my campaigns, leads, and pipeline so that I have an always-on sales coach
- As a user, AI recommendations reference my business context so that they feel relevant, not generic

#### Acceptance Criteria
- [ ] AI Advisor chat panel: accessible via floating button on all dashboard pages
- [ ] AI Advisor has read access to: campaign analytics, lead scores, pipeline data, inbox messages, workspace RAG
- [ ] Proactive notifications (in-app badge + optional email): triggered by specific conditions (see below)
- [ ] Every recommendation includes a **1-click action**: "Draft follow-up", "Move to next step", "Launch new batch"
- [ ] Advisor chat remembers conversation context within a session (not persisted across sessions in Phase 1; full history in Phase 3)

#### Proactive Trigger Conditions (Phase 2+)
| Condition | Notification |
|---|---|
| Campaign reply rate < 5% after 50 sends | "Your subject lines may need refreshing — here are 3 alternatives based on your ICP" |
| Hot lead hasn't been followed up in 24h | "{{Lead name}} opened your email 3x — now is the best time to send a follow-up" |
| 5+ leads stuck in Replied > 7 days | "5 warm leads are stalling — want me to draft a meeting push for each?" |
| Pipeline value drops > 20% week-over-week | "Pipeline dropped — your Recruitment campaign has the highest conversion rate, consider a new batch" |
| New doc uploaded to AI Brain | "I've learned about your new {{topic}} — want me to refresh your active campaign emails?" |
| Bounce rate exceeds 3% | "Your bounce rate is elevated — check your email list quality and sending domain health" |
| Meeting booked | "Great! I've prepared a pre-meeting brief for {{lead name}}. [View brief]" |

#### AI Advisor Natural Language Queries (examples to support)
- *"Which of my campaigns is performing best this month?"*
- *"Write a follow-up for leads who opened but didn't reply this week"*
- *"What should I focus on today to hit my meeting target?"*
- *"Rewrite my step 2 email using my brand voice guide"*
- *"How many deals do I need to close to hit $10K this month?"*
- *"Generate a new subject line for my insurance campaign"*

---

### 9.4 AI Brain Knowledge Harvester

#### Overview
The AI Brain Knowledge Harvester extends the AI Brain beyond the cold-start onboarding wizard by giving workspace owners **four on-ramps** to continuously capture deep, tacit business expertise and commit it to the workspace RAG.

**The problem the Wizard cannot solve:** The 5-question cold-start wizard captures surface-level context (~500–1,500 chars). Mature AI-SDR performance requires 10–50 KB of nuanced, workspace-specific knowledge. Form fields suppress depth; expert business owners think by talking, not by writing. No single input method suits all owners.

**The four knowledge capture methods:**

| Method | Best For | Credits |
|---|---|---|
| **Socratic Chat Interview** | Owners who think by talking; complex nuanced topics | **Always free** |
| **Topic Templates** | Owners with blank-page anxiety; guided interview tracks for ICP, objections, pricing, brand voice, etc. | **Always free** |
| **Quick Brain Dump** | Owners who already know what to write; fastest path to a committed doc | **Always free** |
| **Reflection & Gap Detection** | Ensuring no knowledge topic is ever missed; weekly AI audit of the existing Brain | **Always free** |

#### User Stories
- As a workspace owner, I can start a chat session about a specific business topic and be interviewed by an AI Business Analyst so that my tacit knowledge is captured in depth
- As a workspace owner, I can choose from pre-built topic templates (ICP, Objection Handling, Pricing, Brand Voice, Competitive Positioning, Sales Playbook, Product USPs, Onboarding Process) so that I never face a blank start
- As a workspace owner, I can paste raw notes or a bullet list and have AI synthesise them into a Brain document immediately (Quick Dump) so that I can add knowledge in under 2 minutes
- As a workspace owner, I can request a Knowledge Reflection scan that surfaces which topics my AI Brain is missing so that no important expertise goes uncaptured
- As a workspace owner, I can pause and resume any session, preview the synthesised Markdown draft, and only commit it when I am satisfied so that I remain in full control of what enters the AI Brain
- As a workspace owner, I can delete any harvested document and its embeddings are completely purged from the RAG so that outdated information cannot affect AI outputs

#### Acceptance Criteria
- [ ] Owner starts a new harvest session from the AI Brain page; required input is a **topic name** (1–80 chars) and optional template selection
- [ ] **Chat mode:** AI asks 1–2 targeted follow-up questions per turn; mirrors user's language (English, Vietnamese, Thai)
- [ ] **Quick Dump mode (`mode='dump'`):** owner pastes text (1–10,000 chars); AI synthesises directly to draft via SSE stream; no back-and-forth interview; costs 5 credits
- [ ] **Template list:** ≥ 8 system-defined templates at launch (ICP, Objection Handling, Pricing & Packaging, Brand Voice, Competitive Positioning, Sales Playbook, Product USPs, Onboarding Process); selectable in the "Start Session" modal
- [ ] Session paused and resumed at any time within 30 days; idle sessions (`active` or `draft`, no activity for 30 days) auto-purged by daily cron
- [ ] "Synthesize" produces a structured Markdown document with YAML frontmatter (topic, tags, date_captured, workspace_id, version); streams to UI via SSE
- [ ] Owner can continue chatting after a draft and "Re-synthesize"; AI **rewrites** the draft seamlessly (does NOT append or add "Update:" sections)
- [ ] "Commit to AI Brain" ingests the draft through the existing `chunk_and_embed_document` pipeline; document appears in AI Brain list with `source='harvester'`
- [ ] "Delete session" hard-deletes the session, its committed document, and **all pgvector embeddings** via `ON DELETE CASCADE`
- [ ] `POST /v1/brain/harvester/reflect` analyses all committed Brain documents and returns ≤ 10 prioritised gap topic suggestions; AI Brain page shows a suggestion banner; clicking a suggestion pre-fills the new session topic modal
- [ ] Weekly automated reflection scan runs per workspace (Cloud Scheduler → internal endpoint); in-app notification triggered when gaps are found
- [ ] **Session hard caps** (server-enforced): 30 user turns / session; 3 synthesis runs / session; 20 new sessions / day / workspace
- [ ] **SEA workspaces (VN/TH/SG):** first session creation requires explicit data-processing consent; returns `412 CONSENT_REQUIRED` until owner accepts; consent recorded in `consent_log`
- [ ] All harvester operations are **always free** — knowledge capture is never credit-gated regardless of plan or workspace age; LLM calls are tracked via `billing-service` with `credits: 0` for analytics only
- [ ] Cross-user and cross-workspace isolation: all requests for sessions not owned by the requester return **403** (not 404 — prevents enumeration)
- [ ] AI never invents business facts not stated in the conversation (EDD no-hallucination pass rate ≥ 95%)

#### Plan Limits

| Plan | Max Committed Harvester Docs | New Sessions / Day |
|---|---|---|
| Free | 3 (shared with doc upload limit) | 2 |
| Pro | 20 (shared) | 10 |
| Business | 100 (shared) | 20 |
| Agency | Unlimited | 50 |

#### Session Credit Costs

All harvester operations are **always free** — knowledge capture is never credit-gated. LLM calls are still reported to `billing-service` with `credits: 0` for analytics but will never return `402 INSUFFICIENT_CREDITS`.

#### Detailed Spec
See [`docs/specs/39_AI_BRAIN_HARVESTER/`](specs/39_AI_BRAIN_HARVESTER/) for full data model, API contracts, state machine, SSE streaming protocol, EDD eval strategy, and security design.

---

## 10. Cross-Cutting Requirements

### 10.1 Credits System
- Every AI operation checks available credits before executing
- If credits = 0: AI features disabled, previously scheduled sends still execute, user shown upgrade prompt
- Credit deduction is atomic with AI execution (no credit deduction if AI call fails)
- Credit history: user can see all credit transactions (what used credits and when)
- Credit top-up: users can purchase extra credit packs (all plans) — $5 per 500 credits

### 10.2 Multi-Tenancy
- All data is scoped to `workspace_id`
- No query executes without workspace scope (enforced in service layer)
- User can belong to multiple workspaces with different roles

### 10.3 Email Deliverability
- SPF, DKIM, DMARC setup guide shown on onboarding
- Sending domain health check (DNS validation on connect)
- Daily send limits enforced per plan (anti-spam protection)
- Bounce rate monitoring: if workspace bounce rate > 5%, sending paused and user notified
- Unsubscribe handling: one-click unsubscribe link in all outreach emails; compliance with CAN-SPAM / GDPR

### 10.4 Security
- All passwords hashed and sessions managed by Supabase Auth
- API keys encrypted at rest (AES-256)
- User data encrypted in transit (TLS 1.3)
- OAuth tokens stored encrypted, never exposed via API
- GDPR: data export and deletion available in workspace settings
- Rate limiting on all public API endpoints

### 10.5 SEA Data Privacy Compliance

RevLooper's primary markets — Vietnam, Thailand, Singapore — have strict data privacy regulations. Compliance is non-negotiable for any workspace processing contacts in these countries.

#### Vietnam — Decree 13/2023 (PDPD), effective July 2023
- **Explicit consent required** before processing any personal data. Unlike GDPR, there is no "legitimate interest" basis in Vietnam — only consent.
- **On lead import:** checkbox required: *"I confirm I have obtained consent from these individuals to be contacted for [purpose]."* Consent timestamp, source, and user IP are recorded in `consent_log` table.
- **Right to erasure:** Full cascade delete available via `DELETE /leads/{id}` or workspace Settings → Data → Export/Delete.
- **Data localization:** No requirement to store data in Vietnam as of 2026, but monitor for updates; hosting on global cloud (Railway/Supabase) is permissible with appropriate contractual safeguards.

#### Thailand — PDPA (2022)
- Consent-based processing; data subjects have rights of access, rectification, and erasure.
- For large-scale processing: Data Protection Officer (DPO) appointment may be required — document this for agency customers.

#### Singapore — PDPA
- Purpose limitation: personal data collected for outreach may only be used for the stated purpose.
- Data subjects must be notified of collection; notification is satisfied by the consent checkbox on import.
- Do Not Call (DNC) Registry: phone/SMS outreach to Singapore numbers must check the DNC registry. Integrate DNC check before SMS step in sequences targeting Singapore contacts.

#### Implementation Checklist
- [ ] Consent acknowledgement checkbox on CSV import (required, non-dismissable)
- [ ] `consent_log` table entries created for every lead on import
- [ ] Data export: `GET /workspace/export` generates full workspace data ZIP
- [ ] Data deletion: `DELETE /workspace` triggers cascade delete of all workspace data + 30-day grace period
- [ ] Privacy Policy and DPA (Data Processing Agreement) template available in RevLooper legal docs
- [ ] Cookie consent banner on all public pages (booking page, marketing site)

### 10.6 Mobile Strategy
- **Phase 1–2:** Responsive web only — no native app
- All dashboard screens must be functional and usable on mobile (375px min viewport)
- Priority mobile screens: Inbox (reply on the go), Kanban (move deals), Notifications, Booking page
- Touch targets minimum 44×44px; no hover-only interactions
- **LinkedIn exception:** LinkedIn automation via Chrome Extension is desktop-only in Phase 2. On mobile, users see LinkedIn job queue status and can approve/cancel pending items, but execution requires the desktop extension. A clear, non-blocking banner communicates this. In Phase 3, Cloud Browser removes this limitation.
- **Phase 3:** Evaluate native mobile app (React Native) based on user demand. Decision trigger: ≥ 30% of sessions from mobile devices

### 10.7 Integrations (Phase 2+)
RevLooper is not a silo — solo founders use Notion, Google Sheets, Airtable, Typeform daily. Integration unlocks RevLooper as a workflow hub.

#### Inbound Acquisition Anchors (Phase 1-2)
- [ ] **Facebook Lead Ads / Forms:** subscribe to leadgen webhooks for connected Pages; ingest form submissions into Leads automatically
- [ ] **Google Ads Lead Forms:** ingest lead form submissions from connected Google Ads account and map fields to lead schema
- [ ] **Zalo Forms:** ingest submissions from connected Official Account forms
- [ ] **TikTok Lead Forms:** ingest lead generation submissions from connected TikTok Ads account
- [ ] **RevLooper Campaign Forms:** lightweight multi-form builder per campaign (custom fields, validation, embed snippet, hosted URL)
- [ ] **Auto workflow bridge:** each source can map to destination campaign, owner, tags, and follow-up sequence
- [ ] **Auto enrichment + scoring:** inbound leads immediately enter enrichment and lead scoring jobs
- [ ] **Attribution:** each inbound lead stores source + campaign IDs and is included in source-level conversion analytics
- [ ] **AI Form Generator:** generate and publish campaign forms from campaign/workflow context; optionally create mapped third-party forms in connected channels

#### Zapier / Make (Phase 2)
- [ ] RevLooper Zapier app published on Zapier marketplace
- [ ] Triggers available: `lead_replied`, `meeting_booked`, `deal_won`, `deal_stage_changed`, `customer_created`, `nps_responded`
- [ ] Actions available: `create_lead`, `update_lead`, `add_lead_to_campaign`, `move_deal_stage`, `add_tag`
- [ ] Make (Integromat) module: same triggers + actions via Make's API module system
- [ ] Webhook support: outbound webhooks from workspace settings (send any trigger event to a custom URL)
- [ ] Inbound webhook: `POST /webhooks/inbound/{workspace_id}/{secret}` to create leads from any source (Typeform, website, etc.)

#### Native Integrations (Phase 3)
- **Google Sheets:** export leads and campaign stats to a connected sheet (sync on demand)
- **Notion:** create a Notion page per deal won (auto-populated with lead data, deal value, meeting notes)
- **Slack:** notify a Slack channel on `meeting_booked`, `deal_won`, `hot_lead_detected`
- API keys encrypted at rest (AES-256)
- User data encrypted in transit (TLS 1.3)
- OAuth tokens stored encrypted, never exposed via API
- GDPR: data export and deletion available in workspace settings
- Rate limiting on all public API endpoints

### 10.8 Localization
- UI language: English (v1), Vietnamese (v2)
- Timezone: user-configurable per workspace
- Date/time formats: localized
- Currency: user-configurable per workspace

### 10.9 Freemium Feature-Gate Strategy

RevLooper is **free forever, no time limit**. The philosophy: the user needs time to learn the product, and the product needs time to understand the user's business. Both sides need to build trust before money changes hands. Upgrades are driven by **value gates** — moments where the user has experienced real value and wants more of it.

#### Upgrade Trigger Framework

| Gate | Plan wall | Trigger moment |
|---|---|---|
| Lead limit (100) | Free → Pro | User imported their full list and hit the cap mid-campaign |
| Credit limit (50) | Free → Pro | User ran out of credits after seeing their first AI draft |
| LinkedIn/Facebook step in builder | Free → Pro | User tried to add LinkedIn outreach step to a sequence |
| Remove RevLooper branding | Free → Pro | User booked a meeting and wants a professional booking page |
| 2nd active campaign | Free → Pro | First campaign got a reply; user wants to run another one simultaneously |
| Zalo / WhatsApp channel | Pro → Business | User's leads are primarily reachable on Zalo (Vietnam) |
| AI Reply Assistant | Pro → Business | User had 10+ replies to manage and wanted faster responses |
| CRM Kanban with deal values | Pro → Business | User's pipeline grew; they want to track deal values |
| 3rd+ seat | Pro → Business | User hired an assistant or junior salesperson |
| 2nd workspace | Business → Agency | User started working with a second client |
| API access | Business → Agency | User wants to automate lead imports from their own systems |
| White-label booking page | Business → Agency | User is presenting RevLooper to a client as their own tool |
| Content Studio — image / PDF generation | Pro → Business | User generated ad copy and now wants to create a banner image or brochure |
| Autopilot execution mode | Free → Pro | User wants sequences to run without manual daily triggers |
| Daily Ops Brief (full 5 cards) | Free → Pro | User sees teaser on dashboard and wants actionable full brief |
| Daily Ops Brief — pipeline cards 6–7 | Pro → Business | User wants pipeline velocity and stalled deal alerts in their brief |

#### Upgrade Wall UX Principles
- Never show a hard error — always show a **value prompt** before the block: *"You've reached your lead limit. Upgrade to Pro and add up to 5,000 leads — [Upgrade now]"*
- **Show what they're missing:** when a user hits the LinkedIn gate, display a preview of what LinkedIn outreach looks like with real results from other users' stats.
- **Track gate-to-upgrade conversion** per gate (metric: `feature_gate_hit → upgrade` funnel). Gates with <2% conversion are reviewed for repositioning.
- **Never time-limit the free plan** — no "your trial ends in N days" messaging. Free is a genuine tier, not a trial.

---

## 11. Out of Scope

The following features are explicitly excluded from RevLooper to maintain focus:

| Excluded Feature | Why Excluded |
|---|---|
| Help desk / ticketing system | Not a customer support tool |
| Full landing website builder | Out of product scope. RevLooper supports only lightweight hosted lead pages for lead capture, not full website design/CMS |
| Social media publishing (organic posts) | Not a marketing tool |
| CPQ / quote builder / e-signatures | Complexity not justified for target users |
| Custom pipeline stages | One opinionated pipeline is the UX goal |
| Full survey builder | Embedded NPS (0–10) and CSAT (1–5) are sufficient for Phase 1-2; survey logic is a separate product |
| Customer success portal (external) | RevLooper is an internal tool for the seller, not a portal for their customers |
| Multiple pipelines per workspace | Adds complexity without proportional value |
| Invoicing / billing to clients | Accounting tools handle this better |
| Advertising campaign management | Not in scope |
| SEO / content marketing tools | Not in scope |
| Full accounting integration (Phase 1–3) | Phase 4 only, via partner APIs |
