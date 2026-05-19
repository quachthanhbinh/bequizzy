# RevLooper — GitHub Copilot Instructions

## Project Overview
RevLooper (revlooper.com) is an AI Sales Representative SaaS — an automated outreach and revenue generation platform for solo founders, salespeople, and small B2B teams. The product is an AI-native alternative to HubSpot + Instantly + 11x.ai, purpose-built to be affordable and Southeast-Asia aware.

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Python 3.12+, FastAPI (async), Pydantic v2
- **Database:** PostgreSQL (primary via SQLAlchemy + Alembic), Redis (cache + job queue)
- **AI Layer:** LiteLLM router — routes to OpenAI (GPT-4o), Anthropic (Claude 3.5), Google (Gemini 1.5 Pro)
- **Job Queue:** Celery + Redis
- **Email Infra:** Resend (transactional), Amazon SES (bulk outreach)
- **Email Infra:** Novu (notification orchestration) → Resend (transactional email) + Twilio (SMS global) + ESMS.vn (SMS Vietnam)
- **Cold Outreach Email:** User's Gmail / Outlook (OAuth) + Amazon SES fallback
- **Auth:** Supabase Auth (JWT, Google/Microsoft/Facebook OAuth, SAML SSO for enterprise)
- **Lead Enrichment:** Hunter.io (email verification, auto on import) + Apollo.io API (B2B enrichment, on-demand, 3 credits)
- **Inbound Lead Capture Anchors:** Facebook Lead Ads + Google Ads lead form + RevLooper hosted lead page forms
- **Campaign Forms Module:** multiple custom forms per campaign; embeddable and hosted; optional sync to Facebook/Google/Zalo/TikTok forms
- **Email Warm-Up:** Mailreach API (3rd-party warm-up network, enrolled per mailbox, status tracked in `email_warmup` table)
- **Calendar:** Google Calendar API + Microsoft Graph (Outlook)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Payments:** Stripe (subscriptions + usage-based credits)
- **Payments:** Paddle (global, Merchant of Record, Phase 1) → Stripe via Stripe Atlas (Phase 2+); Vietnam: payOS (free, bank transfer) + MoMo (recurring, wallets) + VNPay (full coverage) + 9Pay (intl cards)
- **Notifications:** Novu SDK (single interface) — never call Resend/Twilio/SendGrid SDKs directly, always via Novu
- **Hosting:** Vercel (frontend) + Railway (FastAPI + Celery workers)

## Code Conventions
- Use TypeScript strict mode; no `any` types
- All API responses follow `{ data, error, meta }` envelope
- Python: async/await everywhere in FastAPI; use Pydantic models for all request/response shapes
- Database: always use Alembic migrations; never mutate schema directly
- AI calls: always route through the `ai_router` service, never call OpenAI/Anthropic SDKs directly
- Credits system: every AI operation must deduct credits via `credit_service.deduct()` before executing
- Error handling: use custom `AppError` class with `code`, `message`, `status_code`
- Multi-tenancy: every DB query must be scoped to `workspace_id` — never query without it
- Suppression list: always check `suppression_list` table before dispatching any outbound email — enforced in `email_service.send()`, never bypassed
- Lead enrichment: `enrichment_status` on leads is `not_enriched|verified|enriched|invalid`; invalid leads are excluded from sequences by default
- Inbound lead capture: all leads from Facebook/Google/hosted lead pages must be ingested via `lead_capture_events`, deduplicated by workspace, and assigned source attribution fields (`source_type`, `source_id`, `source_campaign_id`)
- Campaign forms: form submissions are stored in `form_submissions`, then resolved/upserted into `leads`; each submission retains `source_channel`, `external_submission_id`, and consent snapshot
- Inbound-to-workflow bridge: after ingest, always run enrichment (Hunter first), then scoring, then routing to campaign/owner/tags based on `lead_sources.routing_config`
- Form sync: `form_sync_connections` owns provider mappings; failed syncs must be replayable and visible in integrations health
- AI form generation: always build form schema from campaign objective + ICP + workflow context; output structured JSON schema before publish or provider-sync
- A/B testing: `campaign_leads.ab_variant_id` determines which variant a lead sees; winner detection uses chi-squared test, min 50 sends per variant
- **Email threading:** inbound replies must be matched to the original outbound message via `thread_id` (Gmail `threadId`) or `in_reply_to` (MIME header). The AI Reply Assistant always loads the full thread — `SELECT * FROM messages WHERE thread_id = :thread_id ORDER BY sent_at ASC` — before generating suggestions. Never generate reply suggestions without full thread context.
- **Mobile-first:** All UI must work at 375px min viewport. Touch targets ≥ 44×44px. No hover-only interactions. **LinkedIn automation requires Chrome Extension (desktop) in Phase 2** — on mobile, show queue status only with a non-blocking "requires desktop extension" banner. Phase 3 Cloud Browser removes this limitation.
- **SEA data privacy:** Before processing any personal data in Vietnam/Thailand/Singapore workspaces, explicit consent must be recorded in `consent_log`. The CSV import flow requires a mandatory consent checkbox. `consent_service.log_consent()` must be called on every lead import. Never bypass this check for SEA workspaces.
- Environment variables: all secrets in `.env`, documented in `.env.example`, never hardcoded

## Domain Concepts
- **Workspace:** The top-level tenant unit. One user can belong to multiple workspaces.
- **Lead:** A prospect contact with email, name, company, and enrichment data.
- **Lead Source:** A connected acquisition anchor (Facebook Lead Ads, Google Ads lead form, hosted lead page, or webhook) that continuously pushes inbound leads to RevLooper.
- **Campaign Form:** A campaign-scoped intake form with custom schema, routing rules, and embed settings. A campaign can have multiple forms.
- **Campaign:** A named outreach initiative containing one or more sequences.
- **Sequence:** An ordered list of steps (email, wait, condition) that runs automatically per lead.
- **Step:** A single action in a sequence — email send, delay, conditional branch.
- **Message:** A sent or received communication instance tied to a lead and step.
- **Deal:** A CRM record linking a lead to a pipeline stage and monetary value.
- **Customer:** A won lead promoted to a post-sale lifecycle record. Separate from Lead — created automatically when a Deal is moved to Won. Has its own health score, NPS history, and post-sale sequences. Never query customers and leads from the same table.
- **Health Score:** A computed signal on a Customer record: green / yellow / red. Derived from recency of contact, NPS score, email engagement, meeting frequency. Recalculated nightly via Celery beat.
- **North Star Metric:** Revenue Attributed per Active Workspace per Month — sum of Won deal values originating from RevLooper campaigns in a 30-day rolling window.
- **Credit:** The unit of AI consumption. 1 credit = 1 AI email generated or enrichment call.
- **Playbook:** A pre-built campaign template for a specific vertical (Recruitment, Travel, Insurance, Marketing).
- **System RAG:** RevLooper's shared knowledge base — vertical playbooks, objection library, email templates, sales tactics. Queried on every AI operation. Updated by the RevLooper team.
- **Workspace RAG (AI Brain):** Each workspace's private vector store. Users upload product docs, pricing, ICP personas, brand voice guides, past winning emails, competitor info. The AI retrieves and uses this context on every generation and recommendation, making outputs specific to the user's real business.
- **RAG Retrieval:** Before any AI call, `rag_service.retrieve_context()` performs a pgvector cosine similarity search across both System RAG and Workspace RAG and injects the top-K chunks into the prompt.

## Key Business Rules
- Free plan: 50 credits/month, 100 leads, 1 active campaign, email only, RevLooper footer branding
- Free plan includes one hosted lead page and one inbound lead source connection; additional source connections are Pro+
- Free plan includes one active campaign form; Pro+ supports multiple forms per campaign and third-party form sync
- Pro plan ($39/mo): 2,000 credits, 5,000 leads, unlimited campaigns, email + LinkedIn + Facebook
- Business plan ($79/mo): 10,000 credits, unlimited leads, all channels + Zalo, AI Reply, CRM Kanban, 3 seats
- Agency plan ($149/mo): unlimited credits, all channels, unlimited seats, API access
- Credits never roll over; they reset on billing cycle date
- If credits reach 0, AI features are disabled but previously scheduled sends still execute
- AI Brain document limits: Free=3 docs/3MB, Pro=20 docs/50MB, Business=100 docs/500MB, Agency=unlimited
- Every AI call must invoke `rag_service.retrieve_context()` first — never call the LLM without RAG context
- Workspace RAG chunks take priority over System RAG chunks (workspace_weight=1.5 in merge)

## Folder Structure (Backend)
```
backend/
  app/
    api/           # FastAPI routers (v1/)
    core/          # Config, security, dependencies
    models/        # SQLAlchemy ORM models
    schemas/       # Pydantic request/response schemas
    services/      # Business logic (campaign_service, ai_service, credit_service, etc.)
    workers/       # Celery tasks (send_email, run_sequence_step, etc.)
    utils/         # Helpers (email parser, timezone utils, etc.)
  alembic/         # DB migrations
  tests/
```

## Folder Structure (Frontend)
```
frontend/
  app/
    (auth)/        # Login, signup, onboarding
    (dashboard)/   # Main app shell
      leads/       # Lead management
      campaigns/   # Campaign builder
      inbox/       # Unified reply inbox
      crm/         # CRM Kanban + deal view
      analytics/   # Dashboard & reports
      settings/    # Workspace, billing, integrations
  components/
    ui/            # shadcn/ui primitives
    shared/        # App-wide shared components
    features/      # Feature-specific components (CampaignBuilder, LeadTable, etc.)
  lib/
    api/           # API client (typed fetch wrappers)
    hooks/         # Custom React hooks
    utils/
```

## What to Avoid
- Do not add HubSpot-style complexity (help desk, landing page builder, CPQ, social publishing)
- CRM is intentionally lean: contacts, activity timeline, Kanban deals, unified inbox, tasks, basic reporting only
- Do not use `useEffect` for data fetching — use React Query (TanStack Query)
- Do not mix business logic into API route handlers — keep handlers thin, delegate to services
- Do not use `SELECT *` in DB queries — always select explicit columns
