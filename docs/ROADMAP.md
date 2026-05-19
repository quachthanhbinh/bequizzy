# RevLooper — Product Roadmap

**Version:** 1.0  
**Last Updated:** May 2026  
**Owner:** RevLooper Product Team

---

## Roadmap Summary

| Phase | Timeline | Focus | Core Value | Status |
|---|---|---|---|---|
| **Phase 1** | Months 0–3 | Find, Reach & Capture | Import leads, run AI outreach, capture inbound from content, book meetings | 🔴 Building |
| **Phase 2** | Months 3–6 | Close, Care & Retain | Win deals → care for customers → retain | ⚪ Planned |
| **Phase 3** | Months 6–12 | Revenue Operations | Churn prevention, re-engagement, team ops, advanced analytics | ⚪ Planned |
| **Phase 4** | Months 12–18 | Financial Layer | Fund and scale growth | ⚪ Planned |
| **Wave 4 — AI Employee Platform** | Months 9–18 (overlay) | Autonomous AI Workforce | Rent specialist AI employees that share the AI Brain and operate as a complete AI-powered business; CEO approval inbox for high-stakes decisions | ⚪ Planned |

---

## Phase 1 — Find, Reach & Capture (Months 0–3)

### Objective
A solo operator can import leads, build an AI-powered email campaign, send personalized outreach, auto-follow-up, and book meetings. They can also publish high-converting social posts that capture inbound leads automatically from Facebook comments — all within RevLooper, within 10 minutes of signing up.

### Milestones

#### M1 — Foundation (Weeks 1–2)
- [ ] Repository setup (monorepo: `apps/` for Cloudflare frontends, `services/` for GCP microservices)
- [ ] Docker Compose for local dev (PostgreSQL + Redis)
- [ ] FastAPI app scaffold (router, middleware, error handling, health check)
- [ ] Next.js app scaffold (App Router, Tailwind CSS, shadcn/ui)
- [ ] **Supabase Auth** integration (sign up, sign in, JWT middleware, Google/Facebook OAuth)
- [ ] PostgreSQL schema v1 + Alembic migrations (users, workspaces, leads)
- [ ] Supabase RLS policies for workspace isolation
- [ ] **Paddle** integration (subscription plans, webhook handler)
- [ ] CI pipeline (GitHub Actions: lint, type check, test)

#### M2 — Lead Management + Enrichment (Weeks 3–4)
- [ ] Lead data model + CRUD API endpoints (with `enrichment_status`, `linkedin_url`, `industry`, `company_size` fields)
- [ ] CSV upload endpoint (file validation, column mapping, bulk insert)
- [ ] Manual lead entry form (frontend)
- [ ] Inbound lead source model (`lead_sources`, `lead_capture_events`) + source attribution fields on leads (`source_type`, `source_campaign_id`, `source_id`)
- [ ] RevLooper hosted lead page (lightweight template + form + thank-you screen)
- [ ] Public lead page submit endpoint (`/webhooks/lead-pages/{workspace_id}/{secret}`) with dedup + replay-safe ingestion
- [ ] Campaign forms data model (`campaign_forms`, `form_submissions`, `form_sync_connections`) + migrations
- [ ] Campaign Forms tab UI (list/create/edit/publish/archive)
- [ ] Custom field builder (text/email/phone/dropdown/radio/checkbox/multi-select/date/number/hidden)
- [ ] Embed delivery (`iframe` + JS snippet) and hosted form URL per campaign form
- [ ] Lead list view with search, filter, sort (frontend)
- [ ] Lead detail view + activity timeline (frontend)
- [ ] Duplicate detection on import
- [ ] Bulk actions (tag, delete, export)
- [ ] Free plan: 100 lead limit enforcement
- [ ] **Hunter.io integration:** auto-verify email on import; flag invalid emails; no credits consumed
- [ ] **Apollo.io integration:** on-demand enrichment (title, company size, industry, LinkedIn URL); 3 credits per lead; bulk enrich with preview
- [ ] Auto-enrichment on inbound captured leads (Hunter verify -> Apollo enrich for Pro+)
- [ ] Enrichment status badge on lead list (Not enriched / Verified / Enriched / Invalid)

#### M3 — AI Campaign Builder (Weeks 5–6)
- [ ] LiteLLM router service (OpenAI + Anthropic + Google, fallback chain)
- [ ] Credits system (deduct, top-up, balance check, transaction log)
- [ ] Campaign + Sequence + Step data models + API
- [ ] Chat interface UI (frontend — text input → AI response with campaign structure)
- [ ] Playbook selector UI (4 industry templates: Recruitment, Travel, Insurance, Marketing)
- [ ] Sequence builder UI (drag-drop steps, delays, conditions)
- [ ] Tone + length controls
- [ ] Email preview with sample data
- [ ] AI Form Generator: generate form schema/questions/validation from campaign context
- [ ] One-click action: create internal campaign form from AI output

#### M4 — Email Outreach + Warm-Up (Weeks 7–8)
- [ ] Gmail OAuth integration (Google API, send-as user)
- [ ] Outlook OAuth integration (Microsoft Graph)
- [ ] Cloud Tasks queue setup + sequence-worker scaffold (GKE Autopilot)
- [ ] Sequence execution worker (schedule steps, send emails, handle stop conditions)
- [ ] **Suppression list** (per workspace): bounced + unsubscribed auto-added; manual import via CSV; checked before every send
- [ ] **Email warm-up (Pro+):** Mailreach API integration; warm-up toggle per mailbox; status dashboard; Cloud Scheduler daily task for warm emails; warning shown if < 7 days warm-up on campaign launch
- [ ] Personalization variable substitution engine
- [ ] Bounce handling (hard/soft bounce detection, status update, suppression list auto-add)
- [ ] Open tracking (pixel endpoint)
- [ ] Click tracking (redirect endpoint)
- [ ] Daily send limit enforcement per plan
- [ ] Unsubscribe link handling

#### M5 — Meeting Booking (Weeks 9–10)
- [ ] Booking page (`/book/{workspace}/{user}`) — public Next.js route
- [ ] Google Calendar availability query
- [ ] Outlook Calendar availability query
- [ ] Booking form (name, email, message, time slot picker)
- [ ] Booking confirmation emails (to prospect + user)
- [ ] Reminder emails (24h + 1h before)
- [ ] Meeting logged to lead activity timeline
- [ ] Lead status auto-updated on booking
- [ ] AI meeting brief generation (5 credits)

#### M6 — Analytics, A/B Testing & Polish (Weeks 11–12)
- [ ] Analytics data model (events table)
- [ ] Campaign analytics API (sent, opens, clicks, replies, meetings)
- [ ] Analytics dashboard UI (overview + per-campaign)
- [ ] Lead funnel visualization
- [ ] **A/B test engine (Pro+):** `ab_test_variants` table + Alembic migration; random 50/50 variant assignment at enroll time; chi-squared winner detection (min 50 sends + 90% confidence); auto-switch to winner; results panel in campaign detail
- [ ] **AI Brain onboarding wizard:** 5-question chat flow on first login; auto-creates "Business Profile" document in Workspace RAG; skip option with reminder banner
- [ ] Onboarding checklist (connect email → complete AI Brain wizard → import leads → create campaign → go live)
- [ ] In-app notifications (credits low, bounce rate high)
- [ ] Mobile-responsive UI audit (priority screens: inbox, Kanban, notifications, booking page; min 375px viewport)

#### M6b — Content-Driven Inbound Engine (Weeks 11–13)
> Enables operators to capture leads automatically from Facebook post comments — converting social engagement into a structured lead pipeline.

- [ ] Alembic migration: `social_posts`, `comment_keyword_rules`, `comment_captures` tables + `unaccent` extension
- [ ] `campaign-service`: social post & keyword rule CRUD (v1 API); comment capture list with cursor pagination; internal endpoints for comment-processor (OIDC auth)
- [ ] `webhook-handler` (Cloud Function): Facebook webhook HMAC-SHA256 verification; comment event handler; delivery event handler; entry point
- [ ] `comment-processor` (Cloud Function): keyword matcher (Vietnamese NFD normalization via `unidecode`); Jinja2 SandboxedEnvironment DM template renderer; Redis quota manager (500 DMs/day per page); cooldown manager (prevent double-DM); page resolver (SETNX cache); orchestration handler
- [ ] Frontend: Social Inbound page (`/social-inbound`): post list, keyword rule builder, capture log with lead linking
- [ ] Lead creation: each captured comment creates or merges a lead record in `lead-service`; comment capture logged to lead activity timeline
- [ ] Plan gating: content-driven inbound available on Pro+ plans

### Phase 1 Success Metrics
| Metric | Target |
|---|---|
| First campaign setup time | < 10 minutes |
| User books 1 meeting within 7 days of signup | ≥ 50% of active users |
| 30-day retention | ≥ 40% |
| Free-to-Pro conversion | ≥ 8% |
| Bounce rate across all campaigns | < 3% |

---

## Phase 2 — Close, Care & Retain (Months 3–6)

### Objective
Users can manage their pipeline, close deals, care for customers post-sale, collect feedback, and keep customers engaged — all without leaving RevLooper. A won deal becomes a customer with its own lifecycle.

### Features & Milestones

#### M7 — Multi-Channel Outreach (Month 4)
- [ ] Chrome Extension scaffold (Manifest V3, background service worker)
- [ ] LinkedIn queue consumer in extension (read jobs from RevLooper API, execute connection/message)
- [ ] LinkedIn rate limit enforcement server-side (Redis counters per workspace per day/week)
- [ ] Mobile LinkedIn queue view: show pending/completed LinkedIn actions; users can approve/cancel from mobile; clear "requires desktop extension" banner
- [ ] Facebook Pages API integration (send/receive Messenger messages)
- [ ] Zalo Official Account API integration (message + broadcast; 1,000 msg/day limit on Standard OA)
- [ ] WhatsApp Business API (Meta Cloud API) integration
- [ ] Channel selector in sequence builder
- [ ] Channel connection UI in settings (OAuth flows per channel)
- [ ] **Chrome Web Store submission** for LinkedIn extension (review process ~7 days; submit at M7 kickoff)

#### M8 — AI Lead Scoring (Month 4)
- [ ] Engagement event scoring model (opens, clicks, replies, meetings — weighted)
- [ ] Score calculation service (runs on each engagement event)
- [ ] Hot/Warm/Cold badge on lead list + Kanban cards
- [ ] Leads auto-sorted by score

#### M9 — Unified Inbox (Month 5)
- [ ] Message ingestion from all channels (webhooks → normalize → store)
- [ ] Inbox UI: thread list + message detail pane
- [ ] Read/unread, assign, snooze, mark done actions
- [ ] Reply from inbox (channel-aware send)
- [ ] AI Reply Assistant UI (3 suggested replies, one-click send)
- [ ] Objection library (pre-built counter-responses)

#### M10 — CRM Kanban + Customer Conversion (Month 5)
- [ ] Deal data model + API
- [ ] Kanban board UI (drag-drop, deal cards)
- [ ] Deal value input + pipeline total
- [ ] Stage change logged to activity timeline
- [ ] Filter board by campaign / tag / assignee
- [ ] **Won:** prompts for close date + deal value → **auto-creates Customer record** from lead
- [ ] Lost: prompts for loss reason
- [ ] Customer list view (separate from Leads)
- [ ] Customer detail page (contact info, timeline, health score, NPS, deals)
- [ ] Customer data model (`customers` + `customer_feedback` tables + Alembic migration)

#### M10b — Post-Sale Sequences & NPS (Month 5–6)
- [ ] Post-sale sequence type in sequence builder
- [ ] Pre-built post-sale templates: Onboarding (Day 1/7/30), Quarterly Check-in, Upsell Intro
- [ ] NPS email: embedded 0–10 score link, response handler endpoint
- [ ] CSAT email: embedded 1–5 rating link
- [ ] Feedback stored on customer record + shown on timeline
- [ ] Customer health score computed nightly (Cloud Scheduler → scoring-worker): recency, NPS, engagement → green/yellow/red
- [ ] Health score badge on customer list and customer detail

#### M11 — Workflow Automation (Month 6)
- [ ] Workflow data model + API
- [ ] Workflow builder UI (trigger → action)
- [ ] Workflow execution engine (event-driven, Cloud Pub/Sub + Cloud Tasks)
- [ ] Trigger types: replied, clicked booking, stage changed, lead scored hot, tag added
- [ ] Action types: move stage, send email, add tag, assign to user, create task, send notification

#### M12 — Revenue Signals + Zapier Integration (Month 6)
- [ ] Pipeline value calculation API
- [ ] Win rate calculation
- [ ] Projected revenue calculation
- [ ] Revenue signals dashboard section
- [ ] Historical pipeline chart (90-day)
- [ ] **Zapier app (Phase 2):** triggers: `lead_replied`, `meeting_booked`, `deal_won`, `deal_stage_changed`, `customer_created`, `nps_responded`; actions: `create_lead`, `update_lead`, `add_lead_to_campaign`, `move_deal_stage`, `add_tag`
- [ ] **Inbound webhook endpoint:** `POST /webhooks/inbound/{workspace_id}/{secret}` for creating leads from any external source (Typeform, website forms, etc.)
- [ ] **Facebook Lead Ads integration:** webhook subscription + field mapping + routing rules
- [ ] **Google Ads lead form integration:** account connection + lead form ingestion + attribution mapping
- [ ] **Zalo form integration:** connected OA form capture + field mapping + routing
- [ ] **TikTok lead form integration:** account connection + form ingestion + routing
- [ ] **Unified form sync:** map one campaign form to multiple external provider forms; monitor sync health + replay failed submissions
- [ ] **Provider form creation API bridge:** create third-party forms from internal campaign form schema (where provider APIs support create/update)
- [ ] Source-level dashboard: leads/replies/meetings/revenue by source and campaign
- [ ] **Outbound webhooks:** configurable per workspace from Settings → Integrations

#### M13 — Campaign Content Studio (Month 6)
- [ ] `content_assets` + `content_jobs` tables + Alembic migrations (owned by `ai-service`)
- [ ] `ai-service` content generation endpoints: ad copy, social post, broadcast message, email newsletter, SMS template, Adapt for Channel, Translate (EN/VI/TH), A/B Variants, Improve This, ICP Personalize
- [ ] Content Studio UI: campaign **Content** tab + workspace-wide asset library page
- [ ] **Starter Pack:** first-visit trigger (0 assets state); AI analyzes campaign context + top 3 AI Brain chunks; 5 preview cards generated; "Generate all & save" = 8 credits; individual card = 1–2 credits
- [ ] Image generation pipeline: HTML Jinja2 template → Playwright headless → PNG → Cloudflare R2; 5 in-house templates (recruitment-card, insurance-promo, travel-deal, generic-announcement, event-invite); Google Fonts Noto Sans for VI/TH/EN
- [ ] Brochure: AI fills sections → HTML → WeasyPrint PDF → Cloudflare R2 (8 credits)
- [ ] Email Template Builder: AI-generated full HTML shell + inline HTML editor (3 credits)
- [ ] AI-generated Image: Ideogram 2.0 API integration (20 credits)
- [ ] `content_jobs` status polling endpoint; Cloud Tasks for async image/PDF jobs
- [ ] Credit cost enforcement per content type; plan limits (Free: 3 text/mo; Pro: 100/mo + 20 images; Business: 500/mo + 100 images)
- [ ] Asset library: search/filter by type/channel/status; campaign association; draft/published/archived lifecycle

#### M14 — Solo Operator Mode (Month 6)
- [ ] `campaigns.execution_mode` column Alembic migration (`DEFAULT 'autopilot'`, CHECK constraint)
- [ ] `step_approval_queue` table + indexes + idempotency_key UNIQUE constraint + Alembic migration
- [ ] `campaign-service`: execution mode PATCH endpoint (role gate + active-campaign gate + audit log + outbox event `campaign.execution_mode_changed`)
- [ ] `campaign-service`: `GET /campaigns/{id}/approval-queue` + `POST /approve` (batch loop of 500) + `POST /reject` endpoints
- [ ] `campaign-service`: internal `POST /internal/campaigns/{id}/auto-pause` endpoint (for bounce circuit breaker)
- [ ] `campaign-service`: Cloud Scheduler approval-queue expiry job (daily, resets `next_step_at` on expired rows)
- [ ] `sequence-worker`: dispatch fork — reads `execution_mode`; Autopilot path → `outreach-service`; Review/Manual path → `step_approval_queue` INSERT
- [ ] `sequence-worker`: Redis execution_mode cache (`campaign:exec_mode:{campaign_id}` TTL 5 min); cache invalidated on `campaign.execution_mode_changed` Pub/Sub event
- [ ] `sequence-worker`: bounce rate circuit breaker (Redis counter per campaign per hour; 5% threshold with min 20-send sample; calls `/internal/campaigns/{id}/auto-pause`)
- [ ] `ai-service`: `brief_assembler.py` standalone service (parallel fan-out to 5 services; structured payload; zero LLM calls; zero credits)
- [ ] `ai-service`: `GET /advisor/daily-brief` + `POST /internal/generate-briefs` Cloud Tasks fan-out handler
- [ ] Redis brief cache: `ops_brief:{workspace_id}:{user_id}:{date}` TTL 26h; workspace_id mandatory in key
- [ ] Cloud Scheduler: daily brief generation job (05:00 UTC) + approval queue expiry job (01:00 UTC)
- [ ] Novu notification templates: `steps_queued_for_review`, `daily_ops_brief_ready`
- [ ] Frontend: `ExecutionModeSelector.tsx` — 3-option segmented control in campaign wizard (Launch step) + Campaign Settings; plan gate (Free = Manual only)
- [ ] Frontend: `DailyOpsBriefPanel.tsx` — 7-card morning panel; Free teaser (blurred cards + upgrade CTA); dismissible until next day
- [ ] Frontend: `ApprovalQueueTable.tsx` — paginated queue; bulk approve with progress bar ("Approving 450 of 1,200…")
- [ ] Frontend: execution mode badge on Campaign List + Campaign Detail header
| Metric | Target |
|---|---|
| Pro-to-Business upgrade rate | ≥ 15% of Pro users |
| Multi-channel campaigns vs email-only | ≥ 30% of Pro+ campaigns use 2+ channels |
| AI Reply Assistant adoption | ≥ 60% of inbox replies use AI suggestion |
| Average pipeline value tracked per workspace | ≥ $5,000 |
| Workspaces with ≥ 1 customer record created | ≥ 40% of Business users |
| NPS collected from ≥ 1 customer | ≥ 30% of workspaces with customers |
| Inbound-captured leads share | ≥ 35% of new leads from connected sources |
| Lead capture to first-touch latency | ≤ 2 minutes median |
| Campaigns with 2+ active forms | ≥ 40% of campaigns using inbound |
| AI-generated form adoption | ≥ 50% of campaigns with forms |
| Autopilot adoption (Pro campaigns) | ≥ 40% of Pro campaigns use Autopilot within 30 days |
| Daily Ops Brief open rate | ≥ 50% of daily active Pro+ users |
| Content Studio asset created per workspace | ≥ 1 asset within 14 days of feature launch |

---

## Phase 3 — Loop & Scale (Months 6–12)

### Objective
Users see and operate the full revenue loop. At-risk customers are flagged automatically, win-back campaigns close the loop, and the Loop Dashboard makes the flywheel visible. Teams can manage the full lifecycle together.

### Features

#### Customer Retention & Loop (Month 7–8)
- Customer health score V2: churn prediction ML model trained on Phase 2 behavioral data
- At-risk customer view (Yellow + Red customers sorted by LTV)
- Churn risk alerts via Novu (in-app + email) on health transition
- Re-engagement campaign type (targets customers, not leads)
- Win-back sequence templates: empathy-first, references past interaction via Workspace RAG
- Reactivated customer: health resets + Workspace RAG logs win-back as case study
- Loop Dashboard: visual flywheel diagram with conversion rates per stage + North Star metric (Revenue Attributed this month)

#### LinkedIn Cloud Browser — Mobile-First LinkedIn (Month 7–8)
- Server-side Playwright + residential proxy infrastructure for LinkedIn execution (no Chrome Extension required)
- User authenticates LinkedIn once via RevLooper's Cloud Browser environment (encrypted session storage, workspace-scoped)
- All LinkedIn actions (visit, connect, message) execute server-side; fully mobile-compatible
- Migrate existing Chrome Extension users to Cloud Browser seamlessly (extension remains available as optional alternative)
- **AdsPower / GenLogin Agency add-on:** connect anti-detect browser profiles via AdsPower Local API or GenLogin API for Agency plan power users who manage LinkedIn at scale with multiple profiles

#### Agency Workspace Management (Month 7–8)
- `workspace_groups` DB schema + migrations
- Workspace switcher UI (top nav dropdown, instant context switch)
- Agency Overview Dashboard (all client workspaces: leads, campaigns, meetings, revenue at a glance)
- Workspace templates (clone sequences, playbooks, AI Brain docs to a new workspace)
- Centralized billing: one Agency subscription covers all managed workspaces
- Sub-account member invite with per-workspace role scoping

#### SEA Data Privacy Compliance (Month 8)
- Consent acknowledgement checkbox on CSV import (non-dismissable, required)
- `consent_log` table Alembic migration + auto-write on lead import
- Data export endpoint: `GET /workspace/export` → full workspace data ZIP
- Data deletion endpoint: `DELETE /workspace` → cascade delete + 30-day grace period Cloud Tasks delayed job
- Privacy Policy + DPA template published on revlooper.com/legal
- Singapore DNC Registry integration for SMS steps targeting Singapore contacts
- Cookie consent banner on all public pages

#### Deep SEA Channel Integrations (Month 7–8)
- Zalo OA API: full automation (broadcast, template messages, QR flow, chat history)
- TikTok Business Messaging API
- Shopee Seller Messaging API
- Lazada Seller Center API
- Shopify order triggers → lead enrichment

#### Unified Revenue Dashboard (Month 8–9)
- Revenue by channel with cross-channel comparison
- Order and lead volume by channel
- Multi-channel attribution (first-touch, last-touch, linear)
- Customizable date ranges and filtering

#### Unified Customer Timeline (Month 9–10)
- Contact identity merging across channels (email + Zalo ID + Facebook ID + phone → 1 record)
- Full cross-channel interaction history per contact
- Purchase history from e-commerce integrations

#### AI Operations Assistant (Month 10–11)
- Natural language query interface
- Proactive performance recommendations
- Anomaly detection and alerting
- Weekly AI-generated performance digest email

#### Team Workspace (Month 11–12)
- Role system: Owner, Admin, Member, Viewer
- Shared inbox with assignment rules
- Task system (create, assign, due date, status)
- Team performance dashboard
- Activity audit log

### Phase 3 Success Metrics
| Metric | Target |
|---|---|
| Business-to-Agency upgrade rate | ≥ 20% of Business users |
| Workspaces actively using health scores / at-risk view | ≥ 50% of Business+ users |
| Win-back campaigns launched vs churn events | ≥ 40% |  
| Loop Dashboard weekly active viewers | ≥ 60% of paid workspaces |
| Multi-platform channel adoption | ≥ 40% of Business users connect 3+ channels |
| AI Operations Assistant daily active use | ≥ 50% of Agency users |

---

## Phase 4 — Financial Layer (Months 12–18)

### Objective
High-performing RevLooper users can access growth capital directly through the platform based on their revenue data.

### Features

#### Financial Dashboard (Month 13–14)
- Monthly recurring revenue tracking
- MoM and YoY growth charts
- Revenue consistency score

#### AI Financial Insights (Month 14–15)
- Growth capacity analysis
- Investment recommendation engine (where to allocate capital for maximum ROI)
- Revenue projection scenarios (conservative, base, optimistic)

#### Credit Scoring Engine (Month 15–16)
- Proprietary score model using RevLooper behavioral data
- Score factors: revenue consistency, pipeline health, engagement trends, account tenure
- Score visible to user with improvement suggestions

#### Loan Marketplace (Month 16–18)
- Fintech partner API integrations
- Offer matching based on credit score
- Application flow within RevLooper
- Application status tracking

### Phase 4 Success Metrics
| Metric | Target |
|---|---|
| Financial dashboard activation rate | ≥ 70% of Agency users |
| Loan marketplace click-through | ≥ 20% of eligible users |
| Successful loan applications via RevLooper | ≥ 5% of eligible users |

---

## Wave 4 — AI Employee Platform (Months 9–18, overlaid with Phase 3+)

**Spec:** `docs/specs/40_AI_EMPLOYEE_PLATFORM/` (Approved 2026-05-18, Confidence 7/10)

**Depends on:** Spec 01 (Auth), Spec 02 (AI Brain), Spec 13 (Billing credits), Spec 15 (Solo Operator Mode), Spec 31 (AI Advisor), Spec 32 (Billing infrastructure), Spec 35 (LangGraph orchestration), Spec 37 (Campaign Content Studio — not blocking but shares AI Brain)

### Wave 4 Phase 1 — Runtime Platform (Months 9–12)

#### Objective
Workspace owners can browse the (initially empty) AI Employee catalog, rent an agent, configure SOPs and spend guardrails, dispatch manual runs, review CEO-level approval requests, and track token/credit usage — all without the authoring platform being live.

#### Milestones

**W4-M1 — Service Scaffold & Data Model (Month 9)**
- [ ] `services/ai-employee-service/` FastAPI scaffold with dependency injection, health check, Cloud Run Dockerfile
- [ ] Alembic migrations: all 10 Phase 1 tables (`ai_employee_catalog` through `ai_employee_workspace_settings`)
- [ ] Alembic amendments to `billing-service`: `ai_models`, `paddle_line_items` tables
- [ ] `billing-service`: `/credits/reserve` + `/credits/settle` endpoints (reserve-then-settle pattern, 30% margin)
- [ ] RLS policies: workspace-scoped select/insert/update on all tables; system tables (`ai_employee_catalog`, `ai_employee_tools`) service-account-only write
- [ ] api-gateway: route `/api/v1/employees/*` → `ai-employee-service`

**W4-M2 — Catalog, Rentals & Billing (Month 9–10)**
- [ ] `GET /catalog` — paged list of published agents (empty in v1)
- [ ] `POST /rentals` — rent an agent; validate plan gate (`min_plan`); create Paddle subscription line item; enforce one-active-rental-per-catalog UNIQUE constraint
- [ ] `PATCH /rentals/{id}` — model switch, spend cap update, pause/resume
- [ ] `DELETE /rentals/{id}` — cancellation with 7-day grace; all runs paused immediately; in-flight step finishes current tool
- [ ] Paddle webhook handler: process `subscription.activated`, `subscription.cancelled`, `subscription.payment_failed` → update `ai_employee_rentals.status`
- [ ] `billing-service`: agent rental fee is a **prepaid Paddle subscription** (separate from per-token credits)

**W4-M3 — Runs, Tools & Orchestration (Month 10–11)**
- [ ] `POST /rentals/{id}/runs` — dispatch run; pin all inputs (model_id, SOP snapshot, tool manifests) at dispatch time; enforce dry_run_until guard; check per-run credit ceiling; reserve credits before execution
- [ ] LangGraph graph execution: per-catalog `graph_module` loaded from `ai_employee_catalog.graph_module`; graph runs in `ai-employee-service` async worker
- [ ] Tool invocation engine: per-tool `side_effect_class` enforcement; `publish_public` tools require approval in dry-run AND first 30 days; `spend` tools require approval above `requires_approval_above_usd`
- [ ] Spend cap enforcement: daily + monthly + per-run caps checked before each tool invocation; `auto_paused` status on cap hit; outbox event `ai.employee.auto_paused`
- [ ] Credits settle on run completion; outbox event `ai.employee.run.completed`
- [ ] `GET /rentals/{id}/runs` — paginated run log with token/credit breakdown

**W4-M4 — SOPs, Approvals & Memory (Month 11)**
- [ ] `POST /rentals/{id}/sops` / `GET` / `PATCH` — versioned markdown SOPs (max 20KB), workspace-global or rental-scoped
- [ ] `GET /approvals` — workspace approval inbox; `POST /approvals/{id}/approve` / `/reject`
- [ ] Fail-closed approval lifecycle: pending proposals block tool execution; `expires_at` enforced; idempotency_key prevents duplicate proposals
- [ ] CEO approval inbox UI: `ApprovalInbox.tsx` with `ProposalCard.tsx` showing reasoning + expected outcome + risk score + estimated cost
- [ ] `ai_employee_memory` CRUD: per-rental key-value store for agent working memory
- [ ] AI disclosure template: `GET /settings` / `PATCH /settings` (1–280 chars; default `[Posted by AI on behalf of {workspace_name}]`)

**W4-M5 — Portal UI (Month 11–12)**
- [ ] `/employees/page.tsx` — AI Employee marketplace: catalog grid with empty state ("Coming soon — agents launching Q4")
- [ ] `/employees/[rentalId]/page.tsx` — Rental detail: SOPs editor, model picker, run history, spend dashboard
- [ ] `/employees/[rentalId]/approvals/page.tsx` — CEO approval inbox per rental
- [ ] `/settings/ai-employees/page.tsx` — AI disclosure template editor
- [ ] `ModelPicker.tsx` with per-model cost/capability comparison
- [ ] `SpendCapForm.tsx` with daily/monthly/per-run inputs and live “est. monthly cost” helper
- [ ] TanStack Query hooks for all ai-employee endpoints

### Wave 4 Phase 2 — Authoring Platform (Months 12–18)

#### Objective
RevLooper staff (not customers) can author new AI Employee types, manage version lifecycles (major/minor/patch), publish to the catalog with a strict two-person rule, and deprecate old versions — all through a separate `apps/admin/` Cloudflare Pages app.

#### Milestones

**W4-M6 — Admin App Scaffold & Auth (Month 12)**
- [ ] `apps/admin/` Next.js 14 app scaffold (separate Cloudflare Pages deploy on `admin.revlooper.com`)
- [ ] Cloudflare Worker: `X-Staff-ID` injection + mandatory MFA enforcement (staff Supabase role claim)
- [ ] api-gateway: `/api/v1/admin/*` namespace → `ai-employee-service` (staff-only path, RBAC checked server-side)
- [ ] Alembic migrations: `agent_versions`, `agent_authoring_drafts`, `agent_version_upgrade_elections`, `agent_rbac_assignments`, `agent_authoring_audit`
- [ ] `ai_employee_rentals`: add `pinned_version_id`, `auto_upgrade_policy` columns (default `minor_and_patch`)

**W4-M7 — Version Lifecycle & Publish Workflow (Month 13–14)**
- [ ] Version CRUD: create draft, edit draft, promote draft → `review`, `publish_internal`, `publish_public`, `deprecated`
- [ ] Two-person publish rule: `publish_public` always requires a second staff member approval (blocking for minor/major; logged reason OK for patch)
- [ ] First-30-days auto-approval gate: all `publish_public` actions in new workspace’s first 30 days require CEO approval regardless of side-effect class
- [ ] Auto-upgrade elections: on new version publish, compute affected rentals; send `ai.employee.model_changed` event; grandfather old price on upgrade
- [ ] Tool registry CRUD: manage per-version tool manifests with executor mappings
- [ ] Admin UI: version list, diff viewer (current vs draft), publish/reject action panel, audit trail table

**W4-M8 — Eval Suite & Child Agent Specs (Month 14+)**
- [ ] Nightly eval suite: `ai_employee_run_feedback` ratings feed LLM-as-judge evaluation; EDD workflow (Spec edd-workflow skill) for all graph modules
- [ ] Golden dataset per agent category (marketing, growth, sales, support, ops)
- [ ] Child agent specs Spec 41–46 (each vertical agent: Marketing, Growth, Sales, Customer Support, Competitor Monitor, Content Creator) — **blocked on Wave 4 Phase 1 validation**

### Wave 4 Success Metrics
| Metric | Target |
|---|---|
| Workspaces with ≥ 1 active rental (after catalog launch) | ≥ 20% of Business+ workspaces |
| CEO approval inbox weekly active | ≥ 70% of workspaces with rentals |
| Run completion rate (succeeded / total dispatched) | ≥ 90% |
| Avg rental revenue per workspace | \> $60/mo |
| Dry-run-to-live conversion rate | ≥ 60% of rentals completing dry-run activate |

---

## Technical Debt & Infrastructure Milestones

| Quarter | Infrastructure Work |
|---|---|
| Q1 | CI/CD pipeline, staging environment, error monitoring (Sentry), uptime monitoring |
| Q2 | Load testing, Redis queue scaling, database indexing audit, API rate limiting |
| Q3 | Microservice extraction (AI service, notification service), multi-region deployment |
| Q4 | SOC2 readiness, GDPR compliance audit, penetration testing, disaster recovery |

---

## Decisions & Rationale

| Decision | Rationale |
|---|---|
| Phase 1 email-only (no LinkedIn/Zalo) | Reduces complexity; email is the core value; SEA channels in Phase 2 |
| One CRM pipeline (not configurable) | Opinionated UX lowers cognitive load for solo users |
| Credits model (not pure seat pricing) | Better fit for solo users who have variable monthly volume |
| LinkedIn via Chrome extension (not API) | LinkedIn's API doesn't allow automation; extension is the only safe approach |
| LiteLLM from day 1 | Avoids vendor lock-in; cost optimization via model routing |
| Clerk for auth | Fastest path for solo builder; handles MFA, social login, JWT without custom code |
