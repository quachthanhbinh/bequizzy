# RevLooper — System Architecture

**Version:** 2.0  
**Last Updated:** May 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture — Microservices on GCP](#4-backend-architecture--microservices-on-gcp)
5. [Database Design](#5-database-design)
6. [AI Layer](#6-ai-layer)
7. [RAG System — System Knowledge Base & Private AI Brain](#7-rag-system--system-knowledge-base--private-ai-brain)
8. [Job Queue, Scheduling & Workers](#8-job-queue-scheduling--workers)
9. [Notifications Infrastructure](#9-notifications-infrastructure)
10. [Email Infra (Outreach)](#10-email-infra-outreach)
11. [Billing, Subscriptions & Payments](#11-billing-subscriptions--payments)
12. [Channel Integrations](#12-channel-integrations)
13. [API Design](#13-api-design)
14. [Security Architecture](#14-security-architecture)
15. [Infrastructure & Deployment](#15-infrastructure--deployment)

---

## 1. System Overview

RevLooper is a multi-tenant SaaS platform that connects the entire revenue lifecycle — generating demand through outbound outreach and content-driven inbound, capturing and converting leads, managing pipeline and post-sale operations, and surfacing financial growth intelligence. It is built as a collection of loosely-coupled microservices. The frontend is a Next.js 14 application deployed on **Cloudflare Pages** (global CDN, edge delivery). All backend services run on **Google Cloud Platform (GCP)** and are decomposed by bounded domain context — each service owns its data, exposes its own API, and communicates with other services either synchronously via REST over private VPC, or asynchronously via **Cloud Pub/Sub** event topics.

Identity and authentication is fully delegated to **Supabase Cloud** (Auth + JWT). The database layer is **Supabase Cloud PostgreSQL** (with pgvector for AI embeddings and RLS for tenant isolation). Secrets and API keys are managed in **GCP Secret Manager**. Background workers use **Cloud Tasks** for delayed job scheduling and **GKE Autopilot** for long-running stateful workers (sequence executor, lead scorer).

The AI layer is abstracted behind the `ai-service` microservice using LiteLLM, which routes requests to the cheapest appropriate model (OpenAI GPT-4o-mini for drafts, Claude 3.5 Sonnet for high-quality generation) and handles retries and fallbacks automatically.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USERS (Browser / Mobile)                    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│               CLOUDFLARE (CDN + DDoS + WAF)                          │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │            Cloudflare Pages — Next.js 14 (App Router)           │ │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────┐ ┌─────────────┐  │ │
│  │  │  Auth    │ │  Dashboard │ │   Campaign   │ │  Booking    │  │ │
│  │  │(Supabase)│ │  Pages     │ │   Builder    │ │   Pages     │  │ │
│  │  └──────────┘ └────────────┘ └──────────────┘ └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  Cloudflare Workers (Edge): auth token validation, geo-routing        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS + JWT  (api.revlooper.com)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD PLATFORM (GCP)                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         Cloud Load Balancer + Cloud Armor (WAF/DDoS)         │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │               api-gateway  (Cloud Run)                        │   │
│  │   JWT validation · rate limiting · routing · request tracing  │   │
│  └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───┘   │
│     │      │      │      │      │      │      │      │      │        │
│  ┌──▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐  │
│  │wksp │ │lead│ │cmpg│ │ ai │ │book│ │ crm│ │bill│ │intg│ │ntfy│  │
│  │ svc │ │ svc│ │ svc│ │ svc│ │ svc│ │ svc│ │ svc│ │ svc│ │ svc│  │
│  │Cloud│ │ CR │ │ CR │ │ CR │ │ CR │ │ CR │ │ CR │ │ CR │ │ CR │  │
│  │ Run │ │    │ │    │ │    │ │    │ │    │ │    │ │    │ │    │  │
│  └─────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘  │
│     ▲outreach-svc (Cloud Run)   ▲analytics-svc (Cloud Run)          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Cloud Pub/Sub (Async Event Bus)                     │   │
│  │  topics: lead.events  campaign.events  deal.events            │   │
│  │          booking.events  message.events  billing.events       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  GKE Autopilot     │  │  Cloud Tasks    │  │ Cloud Scheduler │  │
│  │  sequence-worker   │  │  (job queue)    │  │  (cron jobs)    │  │
│  │  scoring-worker    │  │                 │  │                 │  │
│  └────────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                      │
│  ┌────────────────────┐  ┌─────────────────┐                        │
│  │ Cloud Functions    │  │  Memorystore    │                        │
│  │ webhook-handler    │  │  (Redis)        │                        │
│  │ rag-processor      │  │  cache · locks  │                        │
│  │ email-inbound      │  │  rate limits    │                        │
│  └────────────────────┘  └─────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
           │                          │                  │
           ▼                          ▼                  ▼
┌─────────────────┐      ┌────────────────────┐  ┌────────────────────┐
│ Supabase Cloud  │      │  LiteLLM Proxy     │  │ External Services  │
│ PostgreSQL      │      │  (ai-service uses) │  │ Novu → Resend/SMS  │
│ + pgvector      │      │  OpenAI GPT-4o     │  │ Google Calendar    │
│ + RLS           │      │  Claude 3.5 Sonnet │  │ Stripe / Paddle    │
│ + Auth (JWT)    │      │  Gemini Flash      │  │ VNPay / MoMo/payOS │
│ + Realtime      │      └────────────────────┘  │ Mailreach (warmup) │
└─────────────────┘                              │ Apollo.io / Hunter │
                                                 │ Cloudflare R2      │
                                                 │ Secret Manager     │
                                                 └────────────────────┘
```

**CR** = Cloud Run  
**wksp svc** = workspace-service, **lead svc** = lead-service, **cmpg svc** = campaign-service,  
**ai svc** = ai-service, **book svc** = booking-service, **crm svc** = crm-service,  
**bill svc** = billing-service, **intg svc** = integration-service, **ntfy svc** = notification-service

---

## 3. Frontend Architecture

### Deployment: Cloudflare Pages

- Next.js 14 deployed as a **static export + Edge Runtime** on **Cloudflare Pages**
- Assets served from Cloudflare's global CDN (300+ PoPs) — zero cold start latency
- **Cloudflare Workers** at the edge handle:
  - Auth token validation (verify Supabase JWT signature) before proxying API requests
  - Geo-based routing (route VN users to `asia-southeast1` GCP region)
  - Security headers injection (HSTS, CSP, X-Frame-Options)
  - Bot detection and rate limiting at edge (before hitting GCP)
- **Cloudflare R2** for user file uploads (RAG documents, CSV imports) — zero egress cost
- **Cloudflare Images** for avatar/asset optimisation (optional Phase 2)

> **Why Cloudflare Pages over Vercel?** Better global performance for SEA users (Singapore/HCM PoPs), tighter integration with R2 storage, Workers for edge logic, and lower cost at scale. Cloudflare's network is also used as a security layer (DDoS/WAF) in front of the GCP backend.

### Stack
- **Next.js 14** with App Router (React Server Components + Client Components)
- **TypeScript** (strict mode)
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives)
- **TanStack Query** (data fetching, caching, optimistic updates)
- **Zustand** (client-side state for UI state only)
- **React Hook Form** + **Zod** (form validation)
- **Supabase JS Client** (`@supabase/supabase-js`) for auth token management and Realtime subscriptions

### Cloudflare Apps Configuration

The frontend is split into two separate Cloudflare-deployed apps:

```
apps/
  portal/          # Main app (app.revlooper.com) — deployed via @opennextjs/cloudflare
    wrangler.toml  # name=portal, route=app.revlooper.com/*
  page/            # Marketing / landing pages (revlooper.com) — static export
    wrangler.toml  # name=page, route=revlooper.com/*
  api-proxy/       # Cloudflare Worker proxying api.revlooper.com → GCP api-gateway
    wrangler.toml  # name=api-proxy, route=api.revlooper.com/*
    worker.js      # JWT passthrough + ORIGIN env var pointing to Cloud Run URL
  admin/           # Internal staff app (admin.revlooper.com) — Phase 2; separate Cloudflare Pages deploy
    wrangler.toml  # name=admin, route=admin.revlooper.com/*
    # Strict CSP, no third-party scripts, mandatory MFA for staff. Auth via Supabase staff role claim.
    # Hosts: agent catalog CRUD, version lifecycle, publish/deprecate workflow, RBAC, audit trail.
```

`apps/portal` is deployed with **OpenNext** (`@opennextjs/cloudflare`) so the Next.js App Router runs as a Cloudflare Worker with no Node.js runtime. The `api-proxy` Worker handles proxying all `/api/*` calls to the GCP API Gateway, injecting security headers.

### Route Structure
```
app/
  (auth)/
    sign-in/page.tsx
    sign-up/page.tsx
    onboarding/page.tsx
  (dashboard)/
    layout.tsx                 # Sidebar, nav, auth guard
    page.tsx                   # Overview dashboard
    leads/
      page.tsx                 # Lead list
      [id]/page.tsx            # Lead detail + timeline
    campaigns/
      page.tsx                 # Campaign list (with execution_mode badge)
      new/page.tsx             # AI Campaign Builder (chat)
      [id]/page.tsx            # Campaign detail + sequence builder
      [id]/analytics/page.tsx  # Campaign analytics
      [id]/content/page.tsx    # Content Studio (Spec 34)
      [id]/approval-queue/page.tsx  # Approval queue for Review mode (Spec 35)
    inbox/
      page.tsx                 # Unified inbox
    crm/
      page.tsx                 # Kanban board
    analytics/
      page.tsx                 # Overview analytics
    employees/
      page.tsx                 # AI Employee marketplace (Spec 40 Phase 1)
      [rentalId]/page.tsx      # Rental detail: SOPs, model selection, run history
      [rentalId]/approvals/page.tsx  # CEO approval inbox for this rental
      [rentalId]/settings/page.tsx   # Spend caps, dry-run, model switch
    settings/
      page.tsx                 # Workspace settings
      billing/page.tsx         # Plan + credits
      integrations/page.tsx    # Connected accounts
      team/page.tsx            # Team members
      ai-employees/page.tsx    # AI disclosure template + employee-scoped settings
  book/
    [workspace]/[user]/page.tsx  # Public booking page (no auth)
```

### Data Fetching Strategy
- **Server Components** for initial page renders (pass data as props)
- **TanStack Query** for all client-side mutations and real-time updates
- **Optimistic updates** for Kanban drag-drop and inbox read/unread
- API client in `lib/api/` — typed fetch wrappers pointing to `api.revlooper.com` (GCP API Gateway), centralized error handling, Supabase JWT auto-attach
- **Supabase Realtime** for inbox unread counts and live pipeline updates (WebSocket)

### Key Component Patterns
```
components/
  ui/               # shadcn/ui re-exports (Button, Input, Dialog, etc.)
  shared/
    DataTable.tsx   # Reusable table with sort/filter/pagination
    Timeline.tsx    # Activity timeline component
    CreditBadge.tsx # Shows current credit balance
    UpgradePrompt.tsx
  features/
    campaigns/
      ChatBuilder.tsx      # AI chat → campaign generation
      SequenceBuilder.tsx  # Drag-drop sequence editor
      StepEditor.tsx       # Email step editor with preview
    leads/
      LeadTable.tsx
      LeadImport.tsx       # CSV upload → Cloudflare R2 signed URL → rag-processor
      LeadDetail.tsx
    inbox/
      InboxThread.tsx
      ReplyComposer.tsx    # With AI suggestion chips
    crm/
      KanbanBoard.tsx
      DealCard.tsx
    content-studio/        # Spec 34 — Campaign Content Studio
      ContentStudio.tsx    # Main tab layout (campaign Content tab)
      StarterPackPanel.tsx # First-visit 5-preview-card prompt
      AssetLibrary.tsx     # Workspace-wide asset browser
      PowerFunctionMenu.tsx
    solo-operator/         # Spec 35 — Solo Operator Mode
      ExecutionModeSelector.tsx   # 3-option segmented control (campaign wizard + settings)
      DailyOpsBriefPanel.tsx      # Morning 7-card dashboard panel
      BriefCard.tsx               # Reusable card (count + previews + 1-click action)
      ApprovalQueueTable.tsx      # Review-mode queue with bulk approve + progress bar
    ai-employees/          # Spec 40 — AI Employee Platform
      EmployeeMarketplace.tsx     # Catalog grid with "coming soon" empty state
      RentalCard.tsx              # Per-rental summary card (status, spend, last run)
      RentalDetail.tsx            # Full rental page: SOPs editor, run history, model picker
      SopEditor.tsx               # Markdown SOP editor with versioning
      ApprovalInbox.tsx           # CEO approval inbox (proposals + approve/reject)
      ProposalCard.tsx            # Single approval proposal with reasoning + cost + risk score
      SpendCapForm.tsx            # Daily/monthly/per-run cap configuration
      ModelPicker.tsx             # LLM model selector per rental (from ai_models catalog)
      RunHistoryTable.tsx         # Paginated run log with token/credit breakdown
      DisclosureTemplateEditor.tsx # Configurable AI disclosure footer template
```

---

## 4. Backend Architecture — Microservices on GCP

### Design Principles
1. **Bounded context ownership** — each service owns its tables; no service reads another service's tables directly
2. **Sync communication** — REST over private VPC for request/response between services
3. **Async communication** — Cloud Pub/Sub events for cross-service side effects (e.g., `deal.won` → crm-service publishes → customer-service creates customer record)
4. **Transactional outbox** — services write domain events to an `outbox_events` table atomically with their data changes; a Cloud Run Job polls and publishes to Pub/Sub (guarantees at-least-once delivery)
5. **Shared database, isolated ownership** — single Supabase PostgreSQL instance in Phase 1–2; each service connects with a dedicated Postgres role that only has access to its own tables
6. **No shared code libraries** — each service is independently deployable; shared types are communicated via OpenAPI contracts

---

### Service Catalogue

| Service | Runtime | Purpose | Tables Owned |
|---|---|---|---|
| `api-gateway` | Cloud Run | JWT validation, routing, rate limiting, request tracing | — |
| `workspace-service` | Cloud Run | Workspaces, users, teams, invitations, agency groups | workspaces, users, workspace_memberships, team_invitations, workspace_groups, workspace_group_members |
| `lead-service` | Cloud Run | Lead CRUD, CSV import, enrichment, suppression, consent | leads, lead_notes, suppression_list, consent_log |
| `campaign-service` | Cloud Run | Campaigns, sequences, A/B tests, lead enrollment, execution mode, approval queue, social posts & keyword rules for content-driven inbound, comment captures | campaigns, sequences, sequence_steps, ab_test_variants, campaign_leads, step_approval_queue, social_posts, comment_keyword_rules, comment_captures |
| `outreach-service` | Cloud Run | Email/multi-channel send dispatch, mailbox management, warm-up | messages, ai_reply_suggestions, connected_mailboxes, email_warmup, linkedin_job_queue |
| `ai-service` | Cloud Run | LiteLLM routing, RAG retrieval, content generation, AI Advisor, Daily Ops Brief, Content Studio | workspace_knowledge, workspace_knowledge_chunks, knowledge_documents, ai_advisor_sessions, advisor_notifications, content_assets, content_jobs |
| `booking-service` | Cloud Run | Booking links, availability calc, calendar sync | booking_links, bookings |
| `crm-service` | Cloud Run | Deals, Kanban pipeline, tasks | deals, tasks |
| `customer-service` | Cloud Run | Customer lifecycle, health scores, NPS/CSAT | customers, customer_feedback, customer_notes |
| `billing-service` | Cloud Run | Credits, subscriptions, payment gateway abstraction | subscriptions, payment_transactions, credit_transactions, credit_top_up_packs |
| `analytics-service` | Cloud Run | Event ingestion, stats aggregation, campaign reporting | events |
| `notification-service` | Cloud Run | Novu orchestration, in-app notification store | notifications |
| `inbox-service` | Cloud Run | Unified inbox: thread management, message storage, AI reply drafts | inbox_threads, inbox_messages, ai_reply_drafts |
| `integration-service` | Cloud Run | OAuth management, channel connections | integrations, webhook_endpoints, webhook_deliveries |
| `ai-employee-service` | Cloud Run | AI Employee marketplace, rentals, runs, orchestration, SOPs, CEO approval inbox, spend guardrails, eval infra. Phase 2: `/v1/admin/*` for agent authoring + versioning | ai_employee_catalog, ai_employee_rentals, ai_employee_runs, ai_employee_tools, ai_employee_tool_invocations, ai_employee_sops, ai_employee_approval_requests, ai_employee_memory, ai_employee_run_feedback, ai_employee_workspace_settings |
| `webhook-handler` | Cloud Functions (2nd gen) | Inbound webhooks from payment providers and channel platforms; Facebook comment/delivery event handling with HMAC-SHA256 verification | — (writes via other service APIs or Pub/Sub) |
| `comment-processor` | Cloud Functions (2nd gen) | Content-driven inbound engine: keyword matching (Vietnamese NFD normalization), DM template rendering (Jinja2), Redis quota manager (500 DMs/day), cooldown manager | — (writes comment_captures via campaign-service internal API) |
| `rag-processor` | Cloud Functions (2nd gen) | Triggered by GCS file upload — extracts, chunks, embeds documents | — (updates workspace_knowledge via ai-service) |
| `email-inbound` | Cloud Functions (2nd gen) | Gmail/Outlook push notification processor | — (writes to outreach-service via Pub/Sub) |
| `sequence-worker` | GKE Autopilot | Long-running worker consuming Cloud Tasks queue for scheduled sequence steps | — |
| `scoring-worker` | GKE Autopilot | Periodic lead scoring and customer health score recomputation | — |
| `analytics-aggregator` | Cloud Run Job | Refresh `campaign_stats` materialized view, weekly digest generation | — |

---

### `api-gateway` (Cloud Run)

The single ingress point for all frontend requests. Built with **FastAPI** or a lightweight proxy (e.g., Traefik on Cloud Run).

```
Responsibilities:
  1. Verify Supabase JWT (JWKS endpoint) — reject 401 on invalid/expired token
  2. Extract workspace_id from JWT claims
  3. Enforce plan-level rate limits (Redis/Memorystore sliding window)
  4. Route request to the correct downstream service (path-based)
  5. Inject X-Workspace-ID, X-User-ID, X-Trace-ID headers for downstream services
  6. Aggregate health checks: GET /health proxies to all services

Routing table:
  /api/v1/workspaces/*          → workspace-service
  /api/v1/leads/*               → lead-service
  /api/v1/campaigns/*           → campaign-service
  /api/v1/campaigns/*/approval-queue → campaign-service
  /api/v1/inbox/*               → inbox-service
  /api/v1/ai/*                  → ai-service
  /api/v1/ai/content/*          → ai-service (Content Studio)
  /api/v1/advisor/daily-brief   → ai-service (Daily Ops Brief)
  /api/v1/bookings/*            → booking-service
  /api/v1/deals/*               → crm-service
  /api/v1/customers/*           → customer-service
  /api/v1/billing/*             → billing-service
  /api/v1/analytics/*           → analytics-service
  /api/v1/integrations/*        → integration-service
  /api/v1/social-posts/*        → campaign-service (Content-Driven Inbound)
  /api/v1/employees/*           → ai-employee-service (AI Employee Platform; workspace-owner surface)
  /api/v1/webhooks/*            → webhook-handler (Cloud Functions URL)
  # Phase 2 (admin.revlooper.com has its own Cloudflare Worker that adds X-Staff-ID header):
  /api/v1/admin/agents/*        → ai-employee-service (/v1/admin/* namespace; staff-only)
```

---

### Service Template (Python FastAPI)

All Cloud Run services follow the same internal structure:

```
{service-name}/
  app/
    main.py               # FastAPI app factory, middleware, CORS
    core/
      config.py           # Pydantic Settings — reads from Secret Manager via env vars
      dependencies.py     # get_db(), get_workspace_id() (from X-Workspace-ID header)
      exceptions.py       # AppError, global handlers
    api/
      v1/
        router.py         # All routes for this service
    models/               # SQLAlchemy ORM models (only THIS service's tables)
    schemas/              # Pydantic request/response models
    services/             # Business logic
    events/
      publishers.py       # Write to outbox_events table
      subscribers.py      # Cloud Pub/Sub push endpoint handlers
  Dockerfile
  requirements.txt
  cloudbuild.yaml         # Cloud Build CI/CD
```

**Key difference from monolith:** No service imports another service's SQLAlchemy models. Cross-service data is fetched via HTTP calls to the owning service's internal URL (resolved via Cloud Run service-to-service authentication using IAM).

---

### Inter-Service Communication

#### Synchronous (REST over VPC)
```python
# Internal service call example (booking-service → lead-service)
async def get_lead(lead_id: str, workspace_id: str) -> LeadDTO:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.LEAD_SERVICE_URL}/internal/leads/{lead_id}",
            headers={"X-Workspace-ID": workspace_id},
            auth=GCPServiceAuth(),   # IAM-based service-to-service auth (no JWT)
        )
    return LeadDTO(**response.json())
```

All internal service URLs are Cloud Run private URLs (not publicly accessible). Only `api-gateway` is publicly exposed.

#### Asynchronous (Cloud Pub/Sub)
```
Event topics:
  revlooper.lead.events      → {type: lead.created | lead.scored | lead.scored_hot | lead.bounced}
  revlooper.campaign.events  → {type: campaign.launched | lead.enrolled | step.completed | step.queued_for_approval | campaign.execution_mode_changed | campaign.auto_paused}
  revlooper.deal.events      → {type: deal.won | deal.lost | stage.changed | pipeline.dropped}
  revlooper.booking.events   → {type: booking.confirmed | booking.cancelled}
  revlooper.message.events   → {type: message.sent | message.opened | message.replied}
  revlooper.billing.events   → {type: plan.upgraded | credits.exhausted | credits.low}
  revlooper.content.events       → {type: content.generated | content.job_completed | content.job_failed}
  revlooper.ai_employee.events   → {type: ai.employee.rented | ai.employee.run.completed | ai.employee.approval.requested | ai.employee.approval.approved | ai.employee.spend_cap_hit | ai.employee.auto_paused | ai.employee.model_changed | ai.employee.rental_cancelling | ai.employee.rental_cancelled}

Example flow — deal.won:
  1. crm-service writes deal stage=won + outbox_events row (same DB transaction)
  2. outbox-publisher Cloud Run Job polls outbox_events → publishes to revlooper.deal.events
  3. customer-service subscription handler → creates customers record
  4. analytics-service subscription handler → records deal_won event
  5. notification-service subscription handler → sends in-app notification
  6. billing-service subscription handler → no-op (deal attribution for future LTV calc)
```

---

### API Router Pattern (per service)

```python
# All service routers follow this pattern:
# - Handler reads X-Workspace-ID header (set by api-gateway; trusted header in VPC)
# - Handler calls service layer
# - Service returns domain object or raises AppError
# - Handler returns typed Pydantic response

@router.post("/", response_model=LeadResponse, status_code=201)
async def create_lead(
    body: LeadCreate,
    db: AsyncSession = Depends(get_db),
    workspace_id: str = Depends(get_workspace_id),  # from X-Workspace-ID header
):
    return await lead_service.create(db, workspace_id=workspace_id, data=body)
```

### Standard API Response Envelope
```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 243
  }
}
```

---

## 5. Database Design

### Core Tables

```sql
-- Multi-tenancy root
workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',   -- free|pro|business|agency
  credits_remaining INT NOT NULL DEFAULT 50,
  credits_reset_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Users (synced from Supabase Auth via webhook)
users (
  id UUID PRIMARY KEY,                  -- matches Clerk user ID
  workspace_id UUID REFERENCES workspaces(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',  -- owner|admin|member|viewer
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Leads
leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  industry TEXT,
  company_size TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  score TEXT DEFAULT 'cold',           -- hot|warm|cold
  enrichment_status TEXT DEFAULT 'not_enriched',  -- not_enriched|verified|enriched|invalid
  enriched_at TIMESTAMPTZ,
  source_type TEXT NOT NULL DEFAULT 'manual',     -- manual|csv|facebook_lead_ads|google_lead_form|zalo_form|tiktok_form|landing_page_form|campaign_form|api|webhook
  source_id TEXT,                                  -- external source/form/page ID
  source_campaign_id TEXT,                         -- ad campaign ID or landing campaign ID
  source_payload JSONB DEFAULT '{}',               -- raw normalized payload from source
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
)

-- Configured inbound lead sources per workspace
lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  type TEXT NOT NULL,                              -- facebook_lead_ads|google_lead_form|zalo_form|tiktok_form|landing_page_form|campaign_form|webhook
  name TEXT NOT NULL,
  external_account_id TEXT,
  external_form_id TEXT,
  mapping_config JSONB NOT NULL DEFAULT '{}',      -- source field -> lead field mapping
  routing_config JSONB NOT NULL DEFAULT '{}',      -- destination campaign, owner, tags, sequence
  status TEXT NOT NULL DEFAULT 'active',           -- active|paused|error
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Ingestion audit log for inbound lead capture
lead_capture_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  lead_source_id UUID REFERENCES lead_sources(id),
  external_event_id TEXT,
  status TEXT NOT NULL,                            -- received|processed|deduplicated|failed
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Campaign forms (multiple forms per campaign)
campaign_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',           -- draft|active|paused|archived
  schema JSONB NOT NULL DEFAULT '{}',             -- field definitions, validation rules, labels
  routing_config JSONB NOT NULL DEFAULT '{}',     -- owner/tags/sequence mapping
  embed_config JSONB NOT NULL DEFAULT '{}',       -- hosted URL, theme, success redirect
  ai_generated BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
)

-- Raw form submissions before/after lead resolution
form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  campaign_form_id UUID NOT NULL REFERENCES campaign_forms(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  source_channel TEXT NOT NULL,                   -- hosted_form|embed_form|facebook_form|google_form|zalo_form|tiktok_form
  external_submission_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  utm JSONB DEFAULT '{}',
  consent_snapshot JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'received',        -- received|processed|failed
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Sync map between campaign forms and external platform forms
form_sync_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  campaign_form_id UUID NOT NULL REFERENCES campaign_forms(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                         -- facebook|google|zalo|tiktok
  external_account_id TEXT NOT NULL,
  external_form_id TEXT NOT NULL,
  field_mapping JSONB NOT NULL DEFAULT '{}',      -- external field -> internal field
  status TEXT NOT NULL DEFAULT 'active',          -- active|paused|error
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, provider, external_form_id)
)

-- Campaigns
campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',  -- draft|active|paused|completed
  execution_mode TEXT NOT NULL DEFAULT 'autopilot'  -- autopilot|review|manual (Spec 35)
    CHECK (execution_mode IN ('autopilot', 'review', 'manual')),
  industry TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Sequences (1 per campaign in Phase 1)
sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Sequence Steps
sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  position INT NOT NULL,
  type TEXT NOT NULL,                   -- email|wait|condition
  config JSONB NOT NULL DEFAULT '{}',   -- email body, delay, condition config
  ab_test_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- A/B Test Variants (per sequence step)
ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                  -- 'A' | 'B'
  subject TEXT,
  body TEXT NOT NULL,
  send_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Lead-Campaign enrollment
campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  status TEXT NOT NULL DEFAULT 'enrolled',  -- enrolled|completed|stopped|unsubscribed
  ab_variant_id UUID REFERENCES ab_test_variants(id),  -- assigned variant (if A/B active)
  current_step_position INT DEFAULT 0,
  next_step_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
)

-- Messages (all inbound + outbound)
messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  campaign_id UUID REFERENCES campaigns(id),
  step_id UUID REFERENCES sequence_steps(id),
  direction TEXT NOT NULL,             -- outbound|inbound
  channel TEXT NOT NULL,              -- email|linkedin|facebook|zalo|whatsapp
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- scheduled|sent|delivered|opened|clicked|bounced|failed
  external_id TEXT,                    -- provider message ID
  thread_id TEXT,                      -- Gmail threadId or Outlook conversationId (provider-native)
  in_reply_to TEXT,                    -- MIME Message-ID header (RFC-2822) for email threading
  reply_to_message_id UUID REFERENCES messages(id),  -- internal parent message for full context
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Deals (CRM)
deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  stage TEXT NOT NULL DEFAULT 'contacted',  -- contacted|replied|qualified|meeting|won|lost
  value DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  close_reason TEXT,
  close_date DATE,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Customers (post-sale lifecycle — separate from leads)
customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  lead_id UUID NOT NULL REFERENCES leads(id),   -- source lead (for history continuity)
  assigned_to UUID REFERENCES users(id),
  customer_since DATE NOT NULL,
  lifetime_value DECIMAL(15,2) DEFAULT 0,
  health_score TEXT NOT NULL DEFAULT 'green',   -- green|yellow|red
  nps_score INTEGER,                            -- latest NPS 0-10
  last_contact_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  churned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Customer feedback (NPS + CSAT)
customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  type TEXT NOT NULL,           -- nps|csat
  score INTEGER,                -- NPS: 0-10; CSAT: 1-5
  comment TEXT,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Bookings
bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  prospect_email TEXT NOT NULL,
  prospect_name TEXT,
  prospect_timezone TEXT,              -- IANA timezone (e.g. 'Asia/Ho_Chi_Minh') — auto-detected from browser
  owner_timezone TEXT NOT NULL,        -- Meeting owner's IANA timezone at time of booking
  calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed|cancelled|rescheduled
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Suppression list (per workspace — never send to these addresses)
suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  email TEXT NOT NULL,
  reason TEXT NOT NULL,                 -- bounced|unsubscribed|manual|spam_complaint
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
)

-- Email warm-up state per connected mailbox
email_warmup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  mailbox_email TEXT NOT NULL,
  provider TEXT NOT NULL,               -- gmail|outlook|smtp
  mailreach_mailbox_id TEXT,            -- Mailreach API reference
  enabled BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  current_daily_volume INT DEFAULT 0,
  inbox_placement_score DECIMAL(5,2),   -- % landing in inbox (from Mailreach)
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  amount INT NOT NULL,                 -- positive = top-up, negative = deduction
  operation TEXT NOT NULL,             -- email_generation|reply_suggestion|enrichment|meeting_brief
  reference_id UUID,                   -- ID of the entity that consumed credits
  balance_after INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Activity events (analytics + timeline)
events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  lead_id UUID REFERENCES leads(id),
  campaign_id UUID REFERENCES campaigns(id),
  type TEXT NOT NULL,                  -- email_sent|email_opened|email_clicked|replied|meeting_booked|stage_changed|deal_won|customer_created|nps_sent|nps_responded|health_changed|...
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
)

-- Agency workspace groups (Agency plan — one agency manages multiple client workspaces)
workspace_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- agency name
  owner_user_id UUID NOT NULL REFERENCES users(id),
  plan TEXT NOT NULL DEFAULT 'agency',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Links a workspace to a group (agency account)
workspace_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES workspace_groups(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, workspace_id)
)

-- SEA data privacy: explicit consent log (Vietnam PDPD, Thailand PDPA, Singapore PDPA)
consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  consent_type TEXT NOT NULL,          -- outreach|data_processing|marketing
  consented BOOLEAN NOT NULL,
  consent_source TEXT NOT NULL,        -- import_checkbox|web_form|manual|reply
  ip_address INET,                     -- for audit trail
  user_agent TEXT,
  consented_at TIMESTAMPTZ DEFAULT NOW()
)

-- Step approval queue (Spec 35 — Review / Manual execution mode)
-- Owned by campaign-service; modeled on linkedin_job_queue pattern
step_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  campaign_lead_id UUID NOT NULL,
  step_position INT NOT NULL,
  idempotency_key TEXT NOT NULL,       -- '{campaign_lead_id}:{step_position}' UNIQUE
  status TEXT NOT NULL DEFAULT 'pending',  -- pending|dispatching|dispatched|rejected|expired|failed
  subject_preview TEXT,
  body_preview TEXT,                   -- 300-char snapshot taken at queue time
  content_changed BOOLEAN DEFAULT FALSE,  -- set if step template edited after queuing
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,              -- DEFAULT scheduled_at + 48h
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idempotency_key)
)

-- AI Advisor + Daily Ops Brief notifications (Spec 31 / Spec 35)
-- Owned by ai-service
advisor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,          -- hot_lead_no_followup|low_reply_rate|pipeline_drop|daily_ops_brief|...
  payload JSONB NOT NULL DEFAULT '{}', -- brief cards payload (for daily_ops_brief trigger_type)
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_taken BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
)

-- Content Studio assets (Spec 34 — owned by ai-service)
content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  campaign_id UUID,                    -- NULL = workspace library asset
  type TEXT NOT NULL,                  -- ad_copy|social_post|broadcast_message|email_newsletter|sms_template|banner|infographic|ai_image|email_template|brochure
  channel TEXT,                        -- facebook|linkedin|zalo|whatsapp|email|sms|tiktok
  title TEXT NOT NULL,
  content TEXT,                        -- text assets; NULL for binary assets
  file_url TEXT,                       -- R2 URL for image/PDF assets
  file_type TEXT,                      -- image/png|application/pdf
  status TEXT NOT NULL DEFAULT 'draft',  -- draft|published|archived
  generation_config JSONB DEFAULT '{}',  -- template ID, brand colors, inputs used
  credits_used INT DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Content Studio async generation jobs (banners, infographics, brochures, AI images)
content_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  content_asset_id UUID REFERENCES content_assets(id),
  type TEXT NOT NULL,                  -- banner|infographic|ai_image|brochure
  status TEXT NOT NULL DEFAULT 'pending',  -- pending|processing|completed|failed
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
)
```

### Key Indexes
```sql
CREATE INDEX idx_leads_workspace ON leads(workspace_id);
CREATE INDEX idx_leads_email ON leads(workspace_id, email);
CREATE INDEX idx_leads_status ON leads(workspace_id, status);
CREATE INDEX idx_leads_enrichment ON leads(workspace_id, enrichment_status);
CREATE INDEX idx_leads_source ON leads(workspace_id, source_type, source_campaign_id);
CREATE INDEX idx_suppression_workspace ON suppression_list(workspace_id, email);
CREATE INDEX idx_lead_sources_workspace ON lead_sources(workspace_id, type, status);
CREATE INDEX idx_lead_capture_events_workspace ON lead_capture_events(workspace_id, status, created_at);
CREATE INDEX idx_campaign_forms_workspace ON campaign_forms(workspace_id, campaign_id, status);
CREATE INDEX idx_form_submissions_workspace ON form_submissions(workspace_id, campaign_form_id, created_at);
CREATE INDEX idx_form_sync_connections_workspace ON form_sync_connections(workspace_id, provider, status);
CREATE INDEX idx_customers_workspace ON customers(workspace_id);
CREATE INDEX idx_customers_health ON customers(workspace_id, health_score);
CREATE INDEX idx_customers_lead ON customers(lead_id);
CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_events_workspace_lead ON events(workspace_id, lead_id);
CREATE INDEX idx_events_campaign ON events(campaign_id, type, occurred_at);
CREATE INDEX idx_campaign_leads_next_step ON campaign_leads(next_step_at) WHERE status = 'enrolled';
CREATE INDEX idx_workspace_group_members ON workspace_group_members(group_id);
CREATE INDEX idx_consent_log_lead ON consent_log(workspace_id, lead_id);
-- Spec 35 — Solo Operator Mode
CREATE INDEX idx_step_approval_queue_workspace_pending ON step_approval_queue(workspace_id, campaign_id) WHERE status = 'pending';
CREATE INDEX idx_step_approval_queue_expires ON step_approval_queue(expires_at) WHERE status = 'pending';
-- Spec 34 — Content Studio
CREATE INDEX idx_content_assets_workspace ON content_assets(workspace_id, type, status);
CREATE INDEX idx_content_assets_campaign ON content_assets(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_content_jobs_status ON content_jobs(workspace_id, status) WHERE status IN ('pending', 'processing');
-- Spec 31/35 — Advisor notifications
CREATE INDEX idx_advisor_notifications_workspace ON advisor_notifications(workspace_id, user_id, is_read);
```

---

## 6. AI Layer

### LiteLLM Router

All AI calls route through a central `ai_service` which uses LiteLLM to:
- Route to the cheapest model for the task
- Handle retries on transient provider failures
- Fall back to backup model if primary fails
- Track token usage per workspace

```python
# ai_service.py
ROUTER_CONFIG = {
    "model_list": [
        # Draft generation (cheap, fast)
        {"model_name": "fast", "litellm_params": {"model": "gpt-4o-mini", "api_key": OPENAI_KEY}},
        # High-quality generation
        {"model_name": "quality", "litellm_params": {"model": "claude-3-5-sonnet-20241022", "api_key": ANTHROPIC_KEY}},
        # Fallback
        {"model_name": "fallback", "litellm_params": {"model": "gemini/gemini-1.5-flash", "api_key": GOOGLE_KEY}},
    ],
    "routing_strategy": "cost-based",
    "fallbacks": [{"quality": ["fallback"]}, {"fast": ["fallback"]}],
    "num_retries": 3,
}
```

### AI Operations & Credit Costs

| Operation | Model Used | Credits Cost |
|---|---|---|
| Campaign structure generation (chat) | quality | 5 credits |
| Single email step generation | fast | 1 credit |
| Email regeneration / refinement | quality | 2 credits |
| AI reply suggestion (3 options) | fast | 2 credits |
| Lead enrichment (AI-powered) | fast | 3 credits |
| Meeting brief generation | quality | 5 credits |
| Lead scoring (batch) | fast | 0 (background, no charge) |

### Prompt Architecture

```
System Prompt Components:
├── Role definition: "You are an expert B2B sales copywriter..."
├── Workspace context: industry, ICP description, product description
├── Tone setting: {tone} style (Professional/Friendly/Direct)
├── Constraints: length limit, no hard sells, include personalization vars
└── Output format: JSON schema for structured responses

User Prompt:
└── User's natural language goal + selected playbook context
```

---

## 7. RAG System — System Knowledge Base & Private AI Brain

### Overview

RevLooper uses a two-layer Retrieval-Augmented Generation (RAG) architecture. Every AI operation — campaign generation, email writing, reply suggestions, and advisor recommendations — is grounded in relevant retrieved context before the LLM generates output. This is the primary driver of AI output quality and the key differentiator from generic AI writing tools.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI GENERATION REQUEST                        │
│   "Generate a 5-step campaign for recruiting Java developers"       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   RAG Retrieval      │
                    │   Service           │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌─────────────────────────┐
│   SYSTEM RAG          │             │   WORKSPACE RAG         │
│   (Shared Knowledge)  │             │   (Private AI Brain)    │
│                       │             │                         │
│   • Vertical playbooks│             │   • Company/product info│
│   • Email templates   │             │   • Pricing & packages  │
│   • Objection library │             │   • ICP & personas      │
│   • Sales tactics     │             │   • Brand voice guide   │
│   • Industry insights │             │   • Past winning emails │
│   • Subject line bank │             │   • Competitor analysis │
│   • Cadence guides    │             │   • Client case studies │
└───────────┬───────────┘             └──────────────┬──────────┘
            │    pgvector similarity search           │
            └──────────────────┬──────────────────────┘
                               │  Top-K relevant chunks
                               ▼
                    ┌──────────────────────┐
                    │  Augmented Prompt    │
                    │  = System prompt     │
                    │  + Retrieved context │
                    │  + User request      │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   LiteLLM Router     │
                    │  (OpenAI/Claude/     │
                    │   Gemini)            │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Generated Output   │
                    │   (contextually      │
                    │   grounded in user's │
                    │   business reality)  │
                    └──────────────────────┘
```

---

### 7.1 System RAG — Shared Knowledge Base

**Purpose:** RevLooper's built-in intelligence. Contains all vertical playbooks, email templates, objection handlers, sales tactics, subject line formulas, and cadence best practices from `docs/VERTICAL_PLAYBOOKS.md` and ongoing research.

**Indexed content:**
- All email templates per vertical (Recruitment, Insurance, Travel, Marketing Agency, B2B SaaS, Real Estate)
- Objection handler library (universal + vertical-specific)
- Subject line formulas and patterns
- Follow-up cadence guides
- Sales psychology principles
- Industry-specific pain points and value propositions
- RevLooper feature usage guides (for AI advisor)

**Update cadence:** Updated by RevLooper team quarterly; new verticals added as Phase 2–3 targets expand.

**Access:** All workspaces query System RAG. No workspace can modify it.

---

### 7.2 Workspace RAG — Private AI Brain

**Purpose:** Each workspace's private knowledge store. The AI uses this context to write emails that sound like the user's actual business, give advice grounded in the user's real situation, and make recommendations specific to the user's pipeline and goals.

**What users can upload:**

| Document Type | Examples | AI Usage |
|---|---|---|
| **Product / Service Info** | Features list, service brochure PDF, website content | AI uses to write accurate, specific email copy |
| **Pricing & Packages** | Price sheet, tiered plan doc, quote template | AI references correct prices, avoids fabrication |
| **ICP & Personas** | Buyer persona docs, target company profiles | AI tailors tone and pain point framing per persona |
| **Brand Voice Guide** | Writing style guide, tone examples, words to avoid | AI matches brand voice in every generated message |
| **Past Winning Emails** | 5–10 emails that generated replies/meetings | AI learns patterns that work for this specific sender |
| **Competitor Analysis** | Competitor comparison, displacement talking points | AI Reply Assistant uses for objection handling |
| **Case Studies / Social Proof** | Client success stories, testimonials | AI inserts relevant proof points in email steps |
| **Company Context** | About us, founding story, team background | AI personalizes sender credibility statements |
| **Objection Responses** | Custom objection scripts from the user | Overrides system-level objection library |

**Upload formats supported:** PDF, DOCX, TXT, MD, CSV (for past emails), plain text paste, URL scraping (scrapes and indexes a public URL)

---

### 7.3 RAG Processing Pipeline

```
File Upload / URL / Text Input
       │
       ▼
┌─────────────────────┐
│  Text Extraction    │  PyMuPDF (PDF), python-docx (DOCX),
│                     │  trafilatura (URL scraping), plain text
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Chunking           │  Recursive text splitter
│                     │  chunk_size=512 tokens
│                     │  chunk_overlap=50 tokens
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Embedding          │  OpenAI text-embedding-3-small
│                     │  (1536 dimensions, $0.00002/1K tokens)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Store in pgvector  │  workspace_knowledge table
│                     │  with workspace_id namespace
└─────────────────────┘
```

**Processing is async** — handled by a Celery worker. User sees a "Processing" status on the document until indexing completes (typically < 30 seconds for most documents).

---

### 7.4 RAG Retrieval at Generation Time

```python
# rag_service.py

async def retrieve_context(
    query: str,
    workspace_id: str,
    vertical: str | None = None,
    top_k: int = 5,
) -> RagContext:
    """
    Retrieve relevant chunks from both System RAG and Workspace RAG.
    Returns merged, deduplicated context sorted by relevance score.
    """
    query_embedding = await embed(query)  # OpenAI text-embedding-3-small

    # System RAG: filter by vertical if known
    system_chunks = await vector_search(
        table="knowledge_documents",
        embedding=query_embedding,
        filters={"vertical": vertical} if vertical else {},
        top_k=top_k,
    )

    # Workspace RAG: scoped to workspace
    workspace_chunks = await vector_search(
        table="workspace_knowledge",
        embedding=query_embedding,
        filters={"workspace_id": workspace_id},
        top_k=top_k,
    )

    # Workspace chunks take priority (higher weight)
    return merge_and_rank(system_chunks, workspace_chunks, workspace_weight=1.5)
```

**Context injection into prompt:**
```
[SYSTEM KNOWLEDGE]
{system_rag_chunks}  ← vertical playbook excerpts, objection patterns

[YOUR BUSINESS CONTEXT]
{workspace_rag_chunks}  ← user's product info, brand voice, past emails

[TASK]
{user_request}
```

---

### 7.5 AI Advisor — Proactive Recommendations

Beyond generation, the RAG system powers a proactive **AI Advisor** that monitors workspace activity and surfaces recommendations grounded in both the user's private context and RevLooper's system knowledge.

**Triggered recommendations (Phase 2+):**

| Trigger | Recommendation Example |
|---|---|
| Campaign reply rate < 5% after 50 sends | "Your subject lines may be too generic. Based on your ICP, try these 3 alternatives: ..." |
| Lead scored Hot but no reply sent in 24h | "{{lead_name}} opened your email 3 times — now is the right time to follow up. Here's a suggested message:" |
| 5+ leads in Replied stage for > 7 days | "You have 5 leads stuck in 'Replied' — they may need a meeting push. Want me to draft a booking request?" |
| User uploads new product doc | "I've updated my knowledge about your new {{product_feature}}. Your existing email templates mention the old version — want me to refresh them?" |
| Pipeline value drops week-over-week | "Your pipeline dropped 20% this week. Your Recruitment campaign has the highest reply rate — consider launching another batch to refill the top of funnel." |

**AI Advisor interface:** Chat panel accessible from any page in the dashboard. User can ask natural language questions:
- *"Which of my campaigns is performing best?"*
- *"Write a follow-up for the leads who opened but didn't reply this week"*
- *"What should I focus on today to hit my meeting target?"*
- *"Rewrite my step 2 email based on the objections I've been getting"*

---

### 7.6 Database Schema — RAG Tables

```sql
-- pgvector extension required
CREATE EXTENSION IF NOT EXISTS vector;

-- System knowledge base (populated by RevLooper team)
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,          -- playbook|objection|tactic|subject_line|cadence
  vertical TEXT,                   -- recruitment|insurance|travel|marketing|saas|real_estate|universal
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_embedding ON knowledge_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_vertical ON knowledge_documents(vertical);

-- Workspace private AI brain
CREATE TABLE workspace_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,       -- file|url|text|email
  source_name TEXT,                -- original filename or URL
  doc_type TEXT,                   -- product|pricing|persona|brand_voice|past_email|competitor|case_study|company|objection
  content TEXT NOT NULL,           -- full extracted text
  embedding vector(1536),          -- embedding of full content (for small docs)
  status TEXT NOT NULL DEFAULT 'processing',  -- processing|ready|error
  chunk_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual chunks for large documents
CREATE TABLE workspace_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES workspace_knowledge(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_workspace_chunks_embedding ON workspace_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_workspace_chunks_workspace ON workspace_knowledge_chunks(workspace_id);
```

---

### 7.7 Workspace RAG — Frontend (AI Brain UI)

**Location in app:** Settings → AI Brain

**Features:**
- Document list: shows all uploaded docs with type, status (Processing / Ready / Error), chunk count, upload date
- Upload: drag-and-drop or file picker; supports PDF, DOCX, TXT, MD; max 10MB per file
- URL import: paste a URL → system scrapes and indexes it
- Text import: paste raw text directly
- Delete document: removes doc + all chunks + embeddings
- Document types: user assigns type (Product Info, Pricing, Persona, Brand Voice, Past Emails, etc.) on upload — improves retrieval precision
- **AI Brain status indicator:** Shows "AI knows about: 5 documents, 47 topics" — gives user confidence the AI is trained
- **Test AI Brain:** User can ask a test question and see what the AI retrieves + generates — validates the knowledge is working

**Plan limits:**
| Plan | Max Documents | Max Total Size |
|---|---|---|
| Free | 3 | 3MB |
| Pro | 20 | 50MB |
| Business | 100 | 500MB |
| Agency | Unlimited | 2GB |

---

## 8. Job Queue, Scheduling & Workers

### Architecture Overview

The monolithic Celery + Redis approach is replaced with a GCP-native stack:

| Old (Railway) | New (GCP) | Purpose |
|---|---|---|
| Redis broker | **Cloud Pub/Sub** | Async event bus between services |
| Celery workers | **GKE Autopilot pods** | Long-running sequence execution |
| Celery Beat | **Cloud Scheduler** | Cron-like periodic jobs |
| Celery `eta` delayed tasks | **Cloud Tasks** | Delayed job execution (sequence step delays) |
| Redis cache | **Memorystore (Redis)** | Caching, rate limits, LinkedIn rate state |

---

### Cloud Tasks — Sequence Step Scheduling

When a sequence step completes and the next step has a delay (e.g., “wait 3 days”), `campaign-service` enqueues a Cloud Task with an `eta`:

```python
# campaign-service / services/sequence_service.py
from google.cloud import tasks_v2

async def schedule_next_step(campaign_lead_id: str, delay_seconds: int):
    client = tasks_v2.CloudTasksAsyncClient()
    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST,
            "url": f"{SEQUENCE_WORKER_URL}/execute-step",
            "oidc_token": {"service_account_email": WORKER_SA_EMAIL},
            "body": json.dumps({"campaign_lead_id": campaign_lead_id}).encode(),
        },
        "schedule_time": Timestamp(seconds=int(time.time()) + delay_seconds),
    }
    await client.create_task(parent=TASK_QUEUE_PATH, task=task)
```

**Queue configuration:**
```
Cloud Tasks queues:
  sequence-steps     → max_dispatches_per_second: 500, max_concurrent_dispatches: 100
  email-sends        → max_dispatches_per_second: 200 (plan-based throttling done in worker)
  reminders          → max_dispatches_per_second: 50
  enrichment         → max_dispatches_per_second: 20 (API rate limit)
```

---

### `sequence-worker` (GKE Autopilot)

Runs as a **GKE Autopilot Deployment** (not Cloud Run) because it needs:
- Persistent HTTP server to receive Cloud Tasks push requests
- Stateful connection to Supabase (connection pool maintained across requests)
- Predictable latency (no cold start on Cloud Run)

```python
# sequence-worker / app/main.py
@app.post("/execute-step")
async def execute_step(body: ExecuteStepRequest):
    campaign_lead = await load_campaign_lead(body.campaign_lead_id)
    if not should_execute(campaign_lead):   # check stop conditions
        return {"status": "skipped"}
    step = await load_step(campaign_lead.current_step_position)
    await dispatch_step(step, campaign_lead)  # email send, LinkedIn job, wait, etc.
    await advance_campaign_lead(campaign_lead, step)
    await publish_event("revlooper.campaign.events", {"type": "step.completed", ...})
    return {"status": "ok"}
```

Autoscaling: `minReplicas: 2` (always warm), `maxReplicas: 20` (burst capacity).

---

### `scoring-worker` (GKE Autopilot)

Long-running worker triggered by Cloud Scheduler every hour. Recomputes:
- Lead scores (hot/warm/cold) based on recent event activity
- Customer health scores (green/yellow/red) based on engagement signals

Runs as a **GKE Autopilot CronJob** (not Deployment):

```yaml
# k8s/scoring-worker-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scoring-worker
spec:
  schedule: "0 * * * *"   # every hour
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: scorer
              image: gcr.io/revlooper/scoring-worker:latest
              command: ["python", "-m", "app.score_all_workspaces"]
```

---

### Cloud Functions (2nd gen)

#### `webhook-handler`
Handles inbound webhooks from payment providers and channel platforms. Stateless, low latency.

```
Triggers:
  POST /webhooks/stripe        → verify Stripe-Signature → publish billing.events
  POST /webhooks/paddle        → verify Paddle-Signature → publish billing.events
  POST /webhooks/payos         → verify HMAC-SHA256     → publish billing.events
  POST /webhooks/momo          → verify HMAC-SHA256     → publish billing.events
  POST /webhooks/facebook      → verify X-Hub-Signature → publish message.events
  POST /webhooks/facebook/lead-ads → verify X-Hub-Signature → publish lead.capture.events
  POST /webhooks/google/lead-form  → verify Google signature/token → publish lead.capture.events
  POST /webhooks/zalo/form          → verify Zalo secret/token → publish lead.capture.events
  POST /webhooks/tiktok/lead-form   → verify TikTok signature/token → publish lead.capture.events
  POST /webhooks/lead-pages/{workspace_id}/{secret} → validate secret → publish lead.capture.events
  POST /webhooks/zalo          → verify Zalo-OA-Secret  → publish message.events
  GET  /webhooks/facebook      → Facebook webhook verification challenge
```

#### `rag-processor`
Triggered by **Cloud Storage event** when a file is uploaded to the RAG bucket.

```
Trigger: google.cloud.storage.object.v1.finalized (bucket: revlooper-rag-uploads)
Process:
  1. Download file from GCS
  2. Extract text (PyMuPDF / python-docx / trafilatura)
  3. Chunk (512 tokens, 50 overlap)
  4. Embed (OpenAI text-embedding-3-small)
  5. Write chunks to workspace_knowledge_chunks via ai-service internal API
  6. Update workspace_knowledge.status = 'ready'
```

#### `email-inbound`
Handles Gmail Pub/Sub push notifications and Outlook change notifications.

```
Triggers:
  POST /email-inbound/gmail    → Gmail API Pub/Sub push (historyId)
  POST /email-inbound/outlook  → Microsoft Graph change notification
Process:
  1. Fetch new messages via Gmail/Graph API
  2. Parse sender, subject, body, thread_id
  3. Match to lead by email address (call lead-service)
  4. Publish to revlooper.message.events {type: message.inbound}
  5. outreach-service subscription creates messages record
```

---

### Cloud Scheduler — Periodic Jobs

```
Schedule                  Job
────────────────────────────────────────────────────────────────────────────
0 * * * *                 scoring-worker: recalculate lead + health scores
*/5 * * * *               sequence-worker: find overdue campaign_leads (failsafe)
*/15 * * * *              booking-service: send 24h + 1h meeting reminders
0 0 1 * *                 billing-service: reset monthly credits for all workspaces
0 3 * * 1                 analytics-aggregator: refresh campaign_stats MV + weekly digest
0 6 * * *                 outreach-service: sync email warmup stats from Mailreach
0 2 * * *                 lead-service: re-verify email deliverability for stale leads
*/10 * * * *              integration-service: form sync health check + failed submission replay queue
```

---

## 9. Notifications Infrastructure

### Overview
RevLooper uses **Novu** as the notification orchestration layer — a single open-source platform that routes notifications to multiple providers per channel. Provider credentials are configured in Novu; application code only calls Novu's SDK. Swapping or adding providers requires no application code changes.

### Notification Channels & Providers

| Channel | Provider | Use Case |
|---|---|---|
| **Transactional Email** | **Resend** (primary) | Booking confirmations, reminders, credit alerts, team invites, password reset |
| **Transactional Email fallback** | **SendGrid** | Failover if Resend is unavailable |
| **SMS — Global** | **Twilio** | Meeting reminders, 2FA, important alerts (international users) |
| **SMS — Vietnam** | **ESMS.vn** | Same use cases for VN users — significantly cheaper than Twilio for VN numbers |
| **In-App Notifications** | **Novu native** | Real-time bell icon + notification center in dashboard (WebSocket) |
| **Push Notifications (Phase 3+)** | **Firebase Cloud Messaging** via Novu | Mobile app notifications |

### Novu Integration
```python
# notification_service.py — single interface for all notification types
from novu.api import EventApi

async def send_notification(
  event: str,           # e.g. "booking-confirmed", "credits-low", "hot-lead-alert"
  recipient_id: str,    # user_id
  payload: dict,        # template variables
  channels: list[str],  # ["email", "in_app", "sms"] — Novu routes per channel preference
):
  EventApi().trigger(
    name=event,
    recipients={"subscriberId": recipient_id},
    payload=payload,
  )
```

### Notification Events
| Event | Channels | Trigger |
|---|---|---|
| `booking-confirmed` | Email + In-App | Prospect books a meeting |
| `booking-reminder-24h` | Email + SMS | 24 hours before meeting |
| `booking-reminder-1h` | SMS + In-App | 1 hour before meeting |
| `credits-low` | Email + In-App | Credits drop below 10% of plan limit |
| `credits-exhausted` | Email + In-App | Credits reach 0 |
| `hot-lead-alert` | In-App | Lead scored as Hot |
| `advisor-recommendation` | In-App | AI Advisor proactive trigger fires |
| `bounce-rate-warning` | Email + In-App | Workspace bounce rate exceeds 3% |
| `campaign-completed` | In-App | All leads in a campaign have finished the sequence |
| `team-invite` | Email | User invited to workspace |
| `weekly-digest` | Email | Weekly performance summary (opt-in) |

---

## 10. Email Infra (Outreach)

### Strategy
Outreach email (cold email campaigns) is handled separately from transactional notifications. Outreach must originate from the user's own domain for deliverability reasons — RevLooper acts as the scheduler and orchestrator but sends via the user's own connected mailbox.

| Use Case | Provider | Why |
|---|---|---|
| Cold outreach campaigns | **User's Gmail / Outlook** (OAuth) | Best deliverability — comes from user's own domain and IP |
| Cold outreach fallback | **Amazon SES** with custom domain | When user hasn't connected a mailbox yet or hits Gmail limits |
| Transactional / system emails | **Resend** (via Novu) | See Notifications section above |

### Deliverability Architecture

```
User's Sending Domain (e.g., acme.com)
  ├── SPF record: includes revlooper's sending IPs
  ├── DKIM: RevLooper generates keypair; user adds public key as DNS TXT
  ├── DMARC: RevLooper provides policy template
  └── Custom tracking domain: track.acme.com (CNAME → RevLooper)

Per-workspace send queue:
  ├── Daily send limit enforced (plan-based)
  ├── Send time window respected (e.g., Mon–Fri 9am–5pm recipient TZ)
  ├── Min gap between emails to same domain: 5 minutes
  └── Bounce rate monitor: pause workspace if > 5% bounce rate
```

---

---

## 11. Billing, Subscriptions & Payments

### Architecture Overview
RevLooper uses a **two-layer payment architecture**: a billing engine for subscription management and a multi-gateway abstraction layer for accepting payments from different regions.

```
┌─────────────────────────────────────────────────────────────┐
│                    BILLING ENGINE LAYER                     │
│                                                             │
│   Stripe (global, USD/EUR)     Paddle (MoR, global tax)    │
│   ├── Subscription management  ├── Sells on your behalf     │
│   ├── Dunning / retry logic    ├── Handles VAT globally     │
│   ├── Usage-based billing      └── ~5% fee, no entity req. │
│   ├── Invoicing + tax                                       │
│   └── Requires US entity (via Stripe Atlas)                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ payment_service abstraction
┌─────────────────────────────────────────────────────────────┐
│                  PAYMENT GATEWAY LAYER                      │
│                                                             │
│  Global          │  Vietnam — Wallets  │  Vietnam — Cards   │
│  ─────────────── │  ─────────────────  │  ────────────────  │
│  Stripe (card)   │  MoMo (30M users)   │  VNPay (Visa/MC)   │
│  PayPal          │  ZaloPay            │  9Pay (intl cards) │
│                  │  payOS (zero fees)  │  OnePay            │
└─────────────────────────────────────────────────────────────┘
```

### Global Payment Strategy

**Option A — Stripe Atlas (Recommended for scale)**
- Incorporate a US LLC via Stripe Atlas ($500 one-time) → unlocks full Stripe
- Best subscription engine, dunning, tax (Stripe Tax), invoicing, global card acceptance
- Revenue lands in a US bank account (Mercury/Relay) → transfer to Vietnam periodically

**Option B — Paddle (Recommended for speed/simplicity)**
- Paddle acts as Merchant of Record — they sell the product on your behalf
- No US entity needed, handles global VAT/GST compliance automatically
- Fee: ~5% + $0.50 per transaction (higher than Stripe but zero compliance overhead)
- Supports subscriptions, usage billing, tax invoices for global customers

> **Recommendation for Phase 1:** Start with **Paddle** (zero setup friction, handles tax). Migrate to Stripe Atlas at $10K+ MRR when the cost difference justifies the overhead.

### Vietnam Local Payment Gateways

| Gateway | Methods | Recurring | Fees | Best For |
|---|---|---|---|---|
| **payOS** | VietQR, bank transfer (Napas 247) | ⚠️ New (Apr 2026) | **Free** | Default VN gateway — zero cost, 5-min setup |
| **MoMo** | MoMo wallet, QR, bank transfer | ✅ Automated Payments API | ~1.5–2% | Subscriptions for MoMo wallet users (30M users) |
| **VNPay** | QR (30+ banks), ATM, Visa/MC, bank transfer | ⚠️ Token-based | ~1.5–2.5% | Widest VN coverage, built-in e-invoice |
| **9Pay** | Visa/MC/JCB, e-wallet, bank transfer | ✅ Thu hộ/Chi hộ | ~1.5–2.5% | International cards for VN users |
| **OnePay** | Visa/MC, ATM, bank transfer | ⚠️ Token-based | ~1.5–2.5% | Established, oldest licensed PSP (since 2006) |

### Payment Abstraction Layer
All payment operations go through `payment_service` — no router or service calls a gateway SDK directly:

```python
# payment_service.py
class PaymentService:
    def get_gateway(self, gateway: str) -> BasePaymentGateway:
        return {
            "stripe": StripeGateway,
            "paddle": PaddleGateway,
            "payos": PayOSGateway,
            "momo": MoMoGateway,
            "vnpay": VNPayGateway,
            "9pay": NinePayGateway,
        }[gateway]()

    async def create_subscription(self, workspace_id, plan, gateway, ...): ...
    async def create_checkout(self, workspace_id, amount, gateway, ...): ...
    async def cancel_subscription(self, workspace_id, ...): ...
    async def handle_webhook(self, gateway, payload, signature): ...
```

### Subscription & Billing Logic
- **Plan enforcement:** checked via `workspace.plan` field on every request — no live gateway call required for feature gating
- **Dunning:** Stripe/Paddle handle retry logic for failed payments; on final failure → downgrade workspace to Free plan
- **Credit top-ups:** one-time purchases via same gateway abstraction layer
- **Plan changes:** upgrade = immediate, prorate unused time; downgrade = effective at end of billing cycle

### Invoicing & Tax

**Global users:**
- Stripe Tax or Paddle automatically calculate and remit VAT/GST by country
- Invoice PDF generated per payment, downloadable from billing settings
- Optional: company name, address, tax/VAT ID field on billing profile (for B2B customers)

**Vietnam B2B (hóa đơn điện tử — e-invoice):**
Under Decree 123/2020, B2B invoices in Vietnam must be issued as certified electronic invoices (hóa đơn điện tử có mã của cơ quan thuế). Payment collection and invoicing are **legally separate** in Vietnam.

| Approach | Provider | Notes |
|---|---|---|
| Bundled (simplest) | **VNPay-Invoice** | Only works if using VNPay for payment collection |
| Standalone (recommended) | **MISA Invoice** or **VNPT Invoice** | Integrates with any payment gateway; API-based; widely used by VN SMEs |
| Alternative | **Viettel-s Invoice** or **Fast Invoice** | Lower cost, smaller support team |

**Billing profile fields for VN B2B:**
```
- Company name (optional)
- Tax code / MST — Mã số thuế (optional)
- Registered address (optional)
- E-invoice email address (where invoice PDF is sent)
```
All optional — individual users skip this; companies fill it in for compliant invoicing.

### Database Schema — Billing
```sql
-- Billing profile per workspace
ALTER TABLE workspaces ADD COLUMN billing_profile JSONB DEFAULT '{}';
-- Structure: { company_name, tax_code, address, invoice_email, gateway, gateway_customer_id }

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  gateway TEXT NOT NULL,                -- stripe|paddle|momo|vnpay
  gateway_subscription_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,                 -- active|past_due|cancelled|paused
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  gateway TEXT NOT NULL,
  gateway_transaction_id TEXT,
  type TEXT NOT NULL,                   -- subscription|top_up|refund
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,                 -- pending|succeeded|failed|refunded
  invoice_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. Channel Integrations

### Inbound Acquisition Anchors (Phase 1-2)
- **Goal:** let users acquire new leads from external anchors and auto-inject them into RevLooper workflow
- Lead ingestion flow: Source webhook/poll -> normalize -> dedup -> enrich -> score -> route to campaign -> notify owner

### Campaign Forms Engine (per campaign)
- One campaign can own multiple forms for distinct intents and audiences
- Forms can be hosted on RevLooper, embedded in external landing pages, or synced to social ad forms
- Submission flow: form submit -> `form_submissions` -> dedup/lead upsert -> enrichment -> campaign routing -> sequence enrollment
- AI Form Generator uses campaign context (objective, ICP, sequence, offer) to draft field schema + validation + thank-you CTA

#### Facebook Lead Ads
- User connects Facebook Page + Ad account in Integrations
- RevLooper subscribes to Meta leadgen webhooks
- Inbound lead form submission -> `/webhooks/facebook/lead-ads` -> normalize fields -> create/update lead
- Routing: map `page_id/form_id/campaign_id` to destination campaign + owner + tags

#### Google Ads Lead Forms
- User connects Google Ads account (OAuth)
- RevLooper ingests lead form submissions from Google lead form assets
- Inbound event -> `/webhooks/google/lead-form` -> normalize -> dedup -> lead create/update
- Source IDs retained for attribution (`source_campaign_id`, `source_id`)

#### Zalo Forms (Phase 2, SEA)
- User connects Zalo Official Account and form endpoint
- Inbound form event -> `/webhooks/zalo/form` -> normalize -> dedup -> lead create/update
- Form source attribution retained for campaign analytics and routing

#### TikTok Lead Forms (Phase 2)
- User connects TikTok Ads account
- Inbound lead event -> `/webhooks/tiktok/lead-form` -> normalize -> dedup -> lead create/update
- Supports campaign-level mapping to form routing config

#### RevLooper Hosted Lead Page
- Lightweight hosted page/form generated from template per workspace or campaign
- Public submit endpoint: `/webhooks/lead-pages/{workspace_id}/{secret}`
- Supports UTM capture and custom hidden fields for attribution
- On submit: auto create lead, run enrichment, assign routing rule, trigger follow-up sequence

#### Form Sync (Unified)
- `form_sync_connections` maps one internal campaign form to one or more external forms
- Field-level mapping supports bidirectional sync for schema updates (where provider supports API write)
- Failed sync/submission events are logged and replayable from integrations health panel

### Email
- **Outbound:** Gmail API (send-as) or MS Graph API (send-as); falls back to SES with user's SMTP
- **Inbound:** Gmail Push Notifications (Pub/Sub) or MS Graph Change Notifications → webhook → normalize → store in messages table

### LinkedIn (Phase 2 + Phase 3)

#### Phase 2: Chrome Extension (Manifest V3)
- **Approach:** Chrome Extension (Manifest V3) for desktop users
- Extension authenticates with RevLooper API using same JWT
- Background service worker polls RevLooper API for pending LinkedIn jobs
- Executes: profile visit, connection request, message send
- Sends completion event back to API
- **Mobile limitation:** LinkedIn automation via Chrome Extension requires desktop Chrome. On mobile, users see queue status and can approve/cancel pending actions, but execution requires desktop extension running.
- **Rate limits (per account, to mimic human behavior and avoid bans):**
  - Connection requests: max 20/day, max 100/week
  - Messages (to 1st connections): max 50/day
  - Profile visits: max 80/day
  - Minimum gap between actions: 30–120 seconds (randomised)
- Rate limit state stored in Redis per `{workspace_id}:{linkedin_account}` key with daily TTL
- If limit reached: job stays in queue, rescheduled for next day; user notified via in-app notification

#### Phase 3: Cloud Browser (Mobile-Compatible)
- **Approach:** Server-side headless browser (Playwright) with residential proxy rotation — no user install required
- User authenticates LinkedIn once via RevLooper's secure Cloud Browser environment (session stored encrypted, workspace-scoped)
- LinkedIn actions execute server-side; fully mobile-compatible (user triggers/monitors from phone)
- Session isolation: each workspace uses a separate browser context with dedicated proxy IP
- **Anti-detect strategy:** human-timing simulation (30–120s gaps), randomised user-agent, viewport fingerprint matching the authenticated session
- **AdsPower / GenLogin integration (Agency add-on):** Users who already run AdsPower or GenLogin can connect their anti-detect profiles via AdsPower Local API or GenLogin API. RevLooper pushes LinkedIn jobs to the connected profile. This is an optional Agency-tier power feature — not the default approach.
- **Rate limits:** same as Phase 2 above; enforced server-side in Celery tasks

### Facebook Messenger (Phase 2)
- Facebook Pages API (v21+)
- User connects Facebook Page (OAuth, `pages_messaging` scope)
- Inbound: Facebook webhook → RevLooper `/webhooks/facebook` → normalize → inbox
- Outbound: POST to `/{page-id}/messages` with recipient's PSID

### Zalo (Phase 2, SEA)
- Zalo Official Account API
- User creates/connects Zalo OA (business account)
- Inbound: Zalo webhook → RevLooper `/webhooks/zalo` → normalize → inbox
- Outbound: Zalo OA API (template messages for bulk; free-form for replies within 48h window)
- **TODO (Phase 3):** Standard OA is capped at 1,000 broadcast messages/day. For workspaces with >1,000 VN contacts/day, Verified OA status is required. Add milestone for Verified OA application guide in Phase 3 onboarding.

### WhatsApp (Phase 2)
- Meta Cloud API (WhatsApp Business Platform)
- User registers WhatsApp Business number
- Template messages for outbound (requires Meta template approval)
- Free-form within 24h customer service window

---

## 13. API Design

### Base URL
`https://api.revlooper.com/api/v1`

### Authentication
All endpoints (except `/health`, public booking page, webhooks) require:
```
Authorization: Bearer {clerk_jwt}
```

### Core Endpoints

#### Leads
```
GET    /leads                     List leads (paginated, filterable)
POST   /leads                     Create single lead
POST   /leads/import              Upload CSV and create leads in bulk
GET    /leads/{id}                Get lead detail
PATCH  /leads/{id}                Update lead
DELETE /leads/{id}                Delete lead
GET    /leads/{id}/timeline       Get lead activity timeline
POST   /leads/bulk                Bulk operations (tag, delete, add to campaign)
```

#### Lead Sources (Inbound Anchors)
```
GET    /lead-sources                    List connected lead sources
POST   /lead-sources                    Create lead source (facebook/google/landing)
PATCH  /lead-sources/{id}               Update mapping/routing config
POST   /lead-sources/{id}/pause         Pause ingestion
POST   /lead-sources/{id}/resume        Resume ingestion
GET    /lead-sources/{id}/events        List capture events + failures
POST   /lead-sources/{id}/events/{eid}/replay   Replay failed capture event
```

#### Campaigns
```
GET    /campaigns                 List campaigns
POST   /campaigns                 Create campaign
GET    /campaigns/{id}            Get campaign detail
PATCH  /campaigns/{id}            Update campaign (name, status)
DELETE /campaigns/{id}            Delete campaign
POST   /campaigns/{id}/launch     Activate campaign (starts sequence execution)
POST   /campaigns/{id}/pause      Pause campaign
GET    /campaigns/{id}/analytics  Get campaign analytics
```

#### AI
```
POST   /ai/campaign              Generate campaign from natural language prompt
POST   /ai/email                 Generate single email step
POST   /ai/reply                 Generate 3 reply suggestions for a message
POST   /ai/meeting-brief         Generate pre-meeting brief for a lead
POST   /ai/forms/generate        Generate campaign form schema from campaign/workflow context
GET    /ai/playbooks             List available vertical playbooks
```

#### Campaign Forms
```
GET    /campaigns/{id}/forms                     List forms for campaign
POST   /campaigns/{id}/forms                     Create campaign form
GET    /campaigns/{id}/forms/{formId}            Get form detail + analytics
PATCH  /campaigns/{id}/forms/{formId}            Update form schema/routing/embed config
POST   /campaigns/{id}/forms/{formId}/publish    Publish hosted form
POST   /campaigns/{id}/forms/{formId}/archive    Archive form
GET    /campaigns/{id}/forms/{formId}/embed      Get embed snippet (iframe/js)
GET    /campaigns/{id}/forms/{formId}/submissions  List submissions
```

#### Form Sync Connections
```
GET    /campaigns/{id}/forms/{formId}/sync-connections
POST   /campaigns/{id}/forms/{formId}/sync-connections          Create provider sync connection
PATCH  /campaigns/{id}/forms/{formId}/sync-connections/{sid}    Update field mapping/status
POST   /campaigns/{id}/forms/{formId}/sync-connections/{sid}/create-provider-form   Create external provider form from internal schema
POST   /campaigns/{id}/forms/{formId}/sync-connections/{sid}/sync-now                Force sync now
POST   /campaigns/{id}/forms/{formId}/sync-connections/{sid}/replay/{submissionId}   Replay failed submission
```

#### Sequences
```
GET    /campaigns/{id}/sequence         Get sequence with steps
PUT    /campaigns/{id}/sequence         Replace full sequence (rebuild)
POST   /campaigns/{id}/sequence/steps   Add step
PATCH  /campaigns/{id}/sequence/steps/{stepId}  Update step
DELETE /campaigns/{id}/sequence/steps/{stepId}  Delete step
```

#### Messages / Inbox
```
GET    /inbox                    List all inbound messages (paginated, filterable)
GET    /inbox/{id}               Get message thread
POST   /inbox/{id}/reply         Send reply to a message
PATCH  /inbox/{id}               Mark read/unread, assign, snooze
```

#### CRM
```
GET    /deals                    List deals (Kanban data)
POST   /deals                    Create deal for a lead
PATCH  /deals/{id}               Update deal (stage, value, assignee)
DELETE /deals/{id}               Delete deal
```

#### Bookings
```
GET    /bookings/availability    Get available time slots (public endpoint, no auth)
POST   /bookings                 Create booking (public endpoint, no auth)
GET    /bookings                 List all bookings for workspace
PATCH  /bookings/{id}            Cancel or reschedule booking
```

#### Credits
```
GET    /credits/balance          Current credit balance + usage this cycle
GET    /credits/transactions     Credit transaction history
POST   /credits/purchase         Purchase credit top-up pack (Stripe)
```

#### Analytics
```
GET    /analytics/overview       Workspace-level KPIs (last 30 days)
GET    /analytics/campaigns      All campaign stats summary
GET    /analytics/funnel         Lead funnel data
GET    /analytics/revenue        Pipeline + revenue signals
```

---

## 14. Security Architecture

### Authentication & Authorization
- **Auth provider: Supabase Auth** — JWTs issued and verified by Supabase; verified using Supabase's public JWKS endpoint
- **SSO providers supported:** Google, Facebook OAuth via Supabase Auth providers
- **Enterprise SAML SSO** (Agency plan): configurable per workspace via Supabase SAML 2.0 support
- **RBAC:** roles stored in `users.role` (`owner` | `admin` | `member` | `viewer`); enforced in FastAPI dependency `require_role()`
- Workspace membership validated on every request via `get_workspace_id()` dependency (reads `X-Workspace-ID` header set by api-gateway)

### Data Isolation
- Every service method requires `workspace_id` — never skipped
- SQLAlchemy queries always include `WHERE workspace_id = :workspace_id`
- **PostgreSQL Row-Level Security (RLS) enabled from day 1** via Supabase — enforces `workspace_id` isolation at the database engine level, independent of application logic
- RLS policy example: `CREATE POLICY workspace_isolation ON leads USING (workspace_id = current_setting('app.workspace_id')::uuid);`

### Secrets Management
- API keys (OpenAI, Resend, Novu, Twilio, etc.) stored in Railway/Vercel environment variables
- OAuth tokens (Gmail, Outlook, LinkedIn) encrypted with AES-256 before storing in DB
- Payment webhook signatures verified on every webhook call (Stripe `stripe-signature`, Paddle `Paddle-Signature`, VNPay HMAC-SHA512, MoMo HMAC-SHA256)

### Input Validation
- All request bodies validated by Pydantic schemas before reaching service layer
- File uploads: MIME type validation, size limits, scanned for malicious content
- SQL injection: impossible via SQLAlchemy ORM parameterized queries
- XSS: all user-generated content sanitized before rendering (DOMPurify on frontend)

### Rate Limiting
- Global: 1,000 requests/minute per workspace (Redis sliding window)
- AI endpoints: 20 requests/minute per workspace
- Booking page: 10 booking attempts/minute per IP (DDOS protection)

### Compliance

#### GDPR / CAN-SPAM
- GDPR: data export endpoint, data deletion endpoint, cookie consent banner
- CAN-SPAM: unsubscribe link on all outreach emails, physical address in footer
- Data retention: deleted workspace data purged after 30-day grace period

#### SEA Data Privacy (Vietnam PDPD, Thailand PDPA, Singapore PDPA)
Vietnam's **Decree 13/2023 (PDPD)**, effective July 2023, is stricter than GDPR — it requires **explicit consent before processing any personal data** (no legitimate interest basis). Thailand PDPA (2022) and Singapore PDPA have similar requirements.

**Implementation requirements:**
- **Consent on lead import:** CSV import flow must show a consent acknowledgement checkbox. User confirms they have lawful basis (consent from the data subjects) to process imported contacts in RevLooper.
- **Consent timestamp stored:** `consent_log` table stores consent type, source, timestamp, and IP for every lead. Required for audit.
- **Right to erasure:** `DELETE /leads/{id}` triggers a full cascade wipe of the lead's messages, events, and consent log. Backed by a `data_erasure_jobs` Celery task for async cleanup.
- **Data processing agreement:** RevLooper's Terms of Service includes a DPA (Data Processing Agreement) template for B2B customers who process their clients' data inside RevLooper.
- **Data minimisation:** Lead enrichment (Apollo.io) is opt-in on Pro+ plans — never run enrichment without an explicit user action.
- **No cross-workspace data sharing:** Workspace RAG (AI Brain) documents are strictly workspace-scoped. System RAG only contains RevLooper-owned content (no user data).

---

## 15. Infrastructure & Deployment

### Environments

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Development | localhost:3000 | Docker Compose (all services) | Supabase local (supabase start) |
| Staging | staging.revlooper.com (CF Pages) | GCP project: `revlooper-staging` | Supabase staging project |
| Production | revlooper.com (CF Pages) | GCP project: `revlooper-prod` | Supabase production project |

---

### GCP Resource Map

| Resource | GCP Service | Config |
|---|---|---|
| Microservices (HTTP) | **Cloud Run** | Min 1 instance (prod), max 100; `asia-southeast1` region |
| Sequence worker | **GKE Autopilot** | Deployment: min 2 replicas, max 20; `asia-southeast1` |
| Scoring worker | **GKE Autopilot** | CronJob: hourly; `asia-southeast1` |
| Webhooks / file processor | **Cloud Functions 2nd gen** | Memory 512MB–1GB; max 500 instances |
| Batch jobs | **Cloud Run Jobs** | On-demand; 30min timeout |
| Event bus | **Cloud Pub/Sub** | Push subscriptions to Cloud Run services |
| Job queue | **Cloud Tasks** | `sequence-steps`, `email-sends`, `reminders` queues |
| Cron | **Cloud Scheduler** | Pushes to Cloud Tasks or Cloud Run URLs |
| Cache / rate limits | **Memorystore (Redis)** | 1GB Standard tier; private VPC |
| File storage | **Cloudflare R2** | RAG uploads, CSV imports, exports — zero egress cost |
| Secrets | **GCP Secret Manager** | All API keys, OAuth tokens, DB credentials |
| Container registry | **Artifact Registry** | `gcr.io/revlooper/{service}:{tag}` |
| DNS | **Cloudflare DNS** | `api.revlooper.com` → GCP Load Balancer; `revlooper.com` → CF Pages |
| TLS | **Cloudflare** (edge) + **GCP Managed Certs** (backend) | End-to-end TLS |
| Identity | **Supabase Cloud** | Auth, JWT, PostgreSQL, pgvector, RLS, Realtime |

---

### CI/CD (GitHub Actions + Cloud Build)

```yaml
# .github/workflows/deploy.yml

# On pull request:
- lint (ESLint + Ruff)
- type check (tsc --noEmit + mypy)
- unit tests (Vitest + pytest)
- Docker build (each changed service)

# On merge to main (staging):
- run full test suite
- docker build + push to Artifact Registry
- cloud run deploy --service={name} --image={image} --region=asia-southeast1 --project=revlooper-staging
- run Alembic migrations (Cloud Run Job: alembic upgrade head)
- update GKE Autopilot deployments (kubectl set image)
- deploy Cloudflare Pages (wrangler pages deploy .next --project-name revlooper-staging)

# On release tag (production):
- promote staging image to production (no rebuild)
- same deployment steps against revlooper-prod GCP project
```

**Service-specific Cloud Build triggers:** Each microservice has its own `cloudbuild.yaml` and is only rebuilt when files in its directory change (monorepo path filtering).

---

### Repository Structure

```
revlooper/
  .agents/
    copilot-instructions.md
  docs/
    PRD.md  ROADMAP.md  ARCHITECTURE.md  DATABASE_SCHEMA.md  BUSINESS.md
  apps/                             # Cloudflare-deployed apps
    portal/                         # Main Next.js 14 app (app.revlooper.com)
      app/
      components/
      wrangler.toml
      open-next.config.ts
      package.json
    page/                           # Marketing / landing pages (revlooper.com)
      app/
      wrangler.toml
      package.json
    api-proxy/                      # Cloudflare Worker (api.revlooper.com → GCP)
      worker.js
      wrangler.toml
  services/                         # All backend microservices
    api-gateway/
    workspace-service/
    lead-service/
    campaign-service/
    outreach-service/
    inbox-service/
    ai-service/
    booking-service/
    crm-service/
    customer-service/
    billing-service/
    analytics-service/
    notification-service/
    integration-service/
    webhook-handler/                # Cloud Functions
    comment-processor/              # Cloud Functions
    rag-processor/                  # Cloud Functions
    email-inbound/                  # Cloud Functions
    sequence-worker/                # GKE pod
    scoring-worker/                 # GKE CronJob
    analytics-aggregator/           # Cloud Run Job
  infra/                            # Terraform (GCP resources)
    main.tf
    cloud_run.tf
    gke.tf
    pubsub.tf
    cloud_tasks.tf
    cloud_scheduler.tf
    memorystore.tf
    secret_manager.tf
    iam.tf
  k8s/                              # Kubernetes manifests for GKE
    sequence-worker-deployment.yaml
    scoring-worker-cronjob.yaml
  alembic/                          # Shared DB migrations (run once, by migration job)
    versions/
  docker-compose.yml                # Local development: all services + Redis + Supabase local
  README.md
```

---

### Networking & Security

```
Public internet
    │
    ▼  (HTTPS)
Cloudflare (DDoS + WAF + CDN)
    │
    ▼  (HTTPS, Cloudflare-proxied)
GCP Cloud Load Balancer (with Cloud Armor)
    │
    ▼  (HTTPS, only api-gateway is publicly exposed)
api-gateway (Cloud Run — public)
    │
    ▼  (HTTP/2, private VPC Connector)
Downstream microservices (Cloud Run — internal ingress only)
    │
    ▼  (Private IP, VPC peering)
Supabase Cloud PostgreSQL + GCP Memorystore
```

- All Cloud Run services **except api-gateway** use `--ingress=internal` — they are unreachable from the public internet
- Service-to-service authentication uses **GCP Workload Identity + OIDC tokens** (no shared secrets)
- All secrets fetched from **Secret Manager** at service startup via Workload Identity (no `.env` files in containers)
- **VPC Service Controls** perimeter prevents data exfiltration from GCP services

---

### Monitoring & Observability

| Concern | Tool |
|---|---|
| Distributed tracing | **Cloud Trace** (X-Trace-ID propagated by api-gateway across all services) |
| Structured logging | **Cloud Logging** (all services log JSON with trace_id, workspace_id, service fields) |
| Metrics & alerts | **Cloud Monitoring** — custom dashboards per service (latency, error rate, queue depth) |
| Error tracking | **Sentry** (frontend + all backend services) — with workspace_id tag for tenant-scoped errors |
| Uptime | **Cloud Monitoring uptime checks** on api-gateway /health endpoint |
| Database insights | **Supabase Dashboard** — query performance, slow query log, connection pool stats |
| GKE workloads | **GKE Dashboard** + Cloud Monitoring GKE metrics |

---

### Scaling Strategy

| Phase | Strategy |
|---|---|
| Phase 1 (0–500 workspaces) | Cloud Run min=1, max=10 per service; GKE sequence-worker min=2; single Memorystore instance |
| Phase 2 (500–5K workspaces) | Cloud Run max=50; GKE autoscale to 20; Memorystore HA replica; read replica for analytics-service |
| Phase 3 (5K+ workspaces) | Cloud Run max=200; GKE cluster scale; Supabase → Cloud SQL (if needed); `events` table partitioned monthly |
