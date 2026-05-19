# RevLooper — Database Schema & Data Structure

**Version:** 1.1 (Microservices Architecture)  
**Last Updated:** May 2026  
**Database:** Supabase Cloud PostgreSQL 15+ with `pgvector` and `uuid-ossp` extensions  
**ORM:** SQLAlchemy 2.0 (async) + Alembic migrations  
**Multi-tenancy:** All user data is scoped to `workspace_id`; Row-Level Security (RLS) enforced at the PostgreSQL engine level via Supabase.

> **Architecture Note (v1.1):** The schema supports a GCP microservices backend (Cloud Run + GKE Autopilot). Each service connects to Supabase with a dedicated Postgres role scoped to its own tables. Cross-service references use **soft foreign keys** (plain UUID columns, no FK constraints) to allow independent deployment. Daily send-rate state is managed in GCP Memorystore (Redis), not persisted in the DB.

---

## Table of Contents

1. [Extensions & Enums](#1-extensions--enums)
2. [Core — Tenancy & Users](#2-core--tenancy--users)
3. [Leads & Contacts](#3-leads--contacts)
4. [Campaigns & Sequences](#4-campaigns--sequences)
5. [Messaging & Inbox](#5-messaging--inbox)
6. [CRM — Deals & Pipeline](#6-crm--deals--pipeline)
7. [Customers — Post-Sale Lifecycle](#7-customers--post-sale-lifecycle)
8. [Meeting Booking](#8-meeting-booking)
9. [Email Infrastructure](#9-email-infrastructure)
10. [Workflow Automation](#10-workflow-automation)
11. [Credits & Billing](#11-credits--billing)
12. [AI Brain — RAG System](#12-ai-brain--rag-system)
13. [Analytics & Activity Events](#13-analytics--activity-events)
14. [Notifications](#14-notifications)
15. [Integrations & Webhooks](#15-integrations--webhooks)
16. [Outbox Events (Transactional Outbox Pattern)](#16-outbox-events-transactional-outbox-pattern)
17. [Compliance & Privacy](#17-compliance--privacy)
18. [Key Indexes](#18-key-indexes)
19. [Entity-Relationship Summary](#19-entity-relationship-summary)

---

## 1. Extensions & Enums

### Required PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;         -- pgvector for AI Brain embeddings
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- trigram indexes for text search
```

### Enum Reference

Rather than PostgreSQL native ENUMs (which are hard to migrate), all status/type columns use `TEXT` with documented value sets and `CHECK` constraints where critical.

| Domain | Column | Allowed Values |
|---|---|---|
| Workspace | `plan` | `free` \| `pro` \| `business` \| `agency` |
| User | `role` | `owner` \| `admin` \| `member` \| `viewer` |
| Lead | `status` | `new` \| `contacted` \| `replied` \| `qualified` \| `meeting` \| `won` \| `lost` \| `unsubscribed` \| `bounced` |
| Lead | `score` | `hot` \| `warm` \| `cold` |
| Lead | `enrichment_status` | `not_enriched` \| `verified` \| `enriched` \| `invalid` |
| Campaign | `status` | `draft` \| `active` \| `paused` \| `completed` |
| Social Post | `platform` | `facebook` \| `tiktok` \| `instagram` \| `linkedin` |
| Social Post | `status` | `active` \| `paused` \| `archived` |
| Comment Keyword Rule | `match_mode` | `any` \| `all` \| `exact` |
| Sequence Step | `type` | `email` \| `wait` \| `condition` \| `linkedin` \| `facebook` \| `zalo` \| `whatsapp` \| `task` \| `nps_trigger` |
| Campaign Lead | `status` | `enrolled` \| `completed` \| `stopped` \| `unsubscribed` \| `bounced` |
| Inbox Thread | `status` | `open` \| `snoozed` \| `archived` |
| Inbox Message | `direction` | `inbound` \| `outbound` |
| Inbox Message | `intent_class` | `interested` \| `not_interested` \| `out_of_office` \| `question` \| `meeting_request` |
| Message | `direction` | `outbound` \| `inbound` |
| Message | `channel` | `email` \| `linkedin` \| `facebook` \| `zalo` \| `whatsapp` |
| Message | `status` | `scheduled` \| `sent` \| `delivered` \| `opened` \| `clicked` \| `bounced` \| `failed` \| `spam_complaint` |
| Deal | `stage` | `contacted` \| `replied` \| `qualified` \| `meeting` \| `won` \| `lost` |
| Customer | `health_score` | `green` \| `yellow` \| `red` |
| Feedback | `type` | `nps` \| `csat` |
| Booking | `status` | `confirmed` \| `cancelled` \| `rescheduled` \| `completed` |
| Mailbox | `provider` | `gmail` \| `outlook` \| `smtp` |
| Subscription | `status` | `active` \| `past_due` \| `cancelled` \| `paused` |
| Payment | `type` | `subscription` \| `top_up` \| `refund` |
| Payment | `status` | `pending` \| `succeeded` \| `failed` \| `refunded` |
| RAG Knowledge | `source_type` | `file` \| `url` \| `text` \| `email` |
| RAG Knowledge | `doc_type` | `product` \| `pricing` \| `persona` \| `brand_voice` \| `past_email` \| `competitor` \| `case_study` \| `company` \| `objection` \| `custom` |
| RAG Knowledge | `status` | `processing` \| `ready` \| `error` |
| Event | `type` | `email_sent` \| `email_opened` \| `email_clicked` \| `replied` \| `meeting_booked` \| `stage_changed` \| `deal_won` \| `deal_lost` \| `customer_created` \| `nps_sent` \| `nps_responded` \| `health_changed` \| `tag_added` \| `tag_removed` \| `note_added` \| `enrolled` \| `unsubscribed` \| `bounced` \| `credit_deducted` \| `workflow_triggered` |
| Suppression | `reason` | `bounced` \| `unsubscribed` \| `manual` \| `spam_complaint` |
| Workflow Trigger | `trigger_type` | `lead_replied` \| `lead_clicked_booking` \| `deal_stage_changed` \| `lead_scored_hot` \| `tag_added` \| `meeting_booked` \| `customer_created` \| `nps_responded` |
| Workflow Action | `action_type` | `move_deal_stage` \| `notify_user` \| `assign_to` \| `add_tag` \| `send_email_template` \| `create_task` \| `enroll_in_campaign` |
| Integration | `channel` | `gmail` \| `outlook` \| `linkedin` \| `facebook` \| `zalo` \| `whatsapp` \| `google_calendar` \| `outlook_calendar` \| `zapier` \| `make` \| `slack` \| `notion` |
| Consent | `consent_type` | `outreach` \| `data_processing` \| `marketing` |
| Consent | `consent_source` | `import_checkbox` \| `web_form` \| `manual` \| `reply` |
| AI Employee Catalog | `category` | `marketing` \| `growth` \| `sales` \| `support` \| `ops` |
| AI Employee Rental | `status` | `active` \| `paused` \| `auto_paused` \| `cancelling` \| `cancelled` |
| AI Employee Run | `status` | `pending` \| `running` \| `succeeded` \| `failed` \| `cancelled` |
| AI Employee Run | `triggered_by` | `manual` \| `schedule` \| `workflow` \| `approval` |
| AI Employee Tool | `side_effect_class` | `read` \| `write` \| `spend` \| `publish_public` |
| AI Employee Tool Invocation | `outcome` | `success` \| `failure` \| `simulated` \| `skipped_cap` |
| AI Employee Approval | `status` | `pending` \| `approved` \| `rejected` \| `expired` |

---

## Service → Table Ownership Map

Shows which GCP microservice owns (has write access to) each table. No service reads or writes another service's tables directly — cross-service data is fetched via REST or Pub/Sub.

| Service | Tables Owned |
|---|---|
| `workspace-service` | workspaces, users, workspace_memberships, team_invitations, workspace_groups, workspace_group_members |
| `lead-service` | leads, lead_notes, suppression_list, consent_log |
| `campaign-service` | campaigns, sequences, sequence_steps, ab_test_variants, campaign_leads, social_posts, comment_keyword_rules, comment_captures, workflow_definitions, workflow_triggers, workflow_action_logs |
| `outreach-service` | messages, ai_reply_suggestions, connected_mailboxes, email_warmup, linkedin_job_queue |
| `inbox-service` | inbox_threads, inbox_messages, ai_reply_drafts |
| `ai-service` | workspace_knowledge, workspace_knowledge_chunks, knowledge_documents, ai_advisor_sessions, advisor_notifications, content_assets, content_jobs |
| `booking-service` | booking_links, bookings |
| `crm-service` | deals, tasks |
| `customer-service` | customers, customer_feedback, customer_notes |
| `billing-service` | subscriptions, payment_transactions, credit_transactions, credit_top_up_packs, ai_models, paddle_line_items |
| `analytics-service` | events, campaign_stats (materialized view) |
| `notification-service` | notifications |
| `integration-service` | integrations, webhook_endpoints, webhook_deliveries |
| `ai-employee-service` | ai_employee_catalog, ai_employee_rentals, ai_employee_runs, ai_employee_tools, ai_employee_tool_invocations, ai_employee_sops, ai_employee_approval_requests, ai_employee_memory, ai_employee_run_feedback, ai_employee_workspace_settings |
| *(all services)* | outbox_events (each service writes its own rows; outbox-publisher reads all) |

---

## 2. Core — Tenancy & Users

### `workspaces`

The root multi-tenancy entity. Every data record belongs to a workspace.

```sql
CREATE TABLE workspaces (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL,             -- URL-safe identifier, e.g. "acme-corp"
  plan                 TEXT NOT NULL DEFAULT 'free',  -- free|pro|business|agency
  credits_remaining    INT NOT NULL DEFAULT 50,
  credits_reset_at     TIMESTAMPTZ,               -- next monthly reset timestamp
  daily_send_limit     INT NOT NULL DEFAULT 20,   -- plan-based; updated on plan change
  industry             TEXT,                       -- user-set primary industry (recruitment|insurance|travel|marketing|saas|real_estate)
  timezone             TEXT NOT NULL DEFAULT 'UTC', -- IANA timezone for workspace
  currency             TEXT NOT NULL DEFAULT 'USD',
  locale               TEXT NOT NULL DEFAULT 'en',
  is_template          BOOLEAN DEFAULT FALSE,      -- Agency: can be cloned as a template
  template_group_id    UUID,                       -- which workspace group owns this template
  billing_profile      JSONB DEFAULT '{}',         -- {company_name, tax_code, address, invoice_email, gateway, gateway_customer_id}
  settings             JSONB DEFAULT '{}',         -- {bounce_pause_threshold, send_window_start, send_window_end, nps_interval_days, csat_after_meeting, unsubscribe_footer_required, white_label, saml_enabled}
  ai_brain_summary     TEXT,                       -- cached "AI knows about X docs covering Y topics"
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug)
);
```

**Notes:**
- `slug` drives the public booking URL: `revlooper.com/book/{slug}/{user_slug}`
- `settings` JSONB holds workspace-level preferences to avoid schema migrations for minor config additions
- `billing_profile` is for invoice/tax data; actual payment state is in `subscriptions`

---

### `users`

Synced from Supabase Auth via webhook on signup/update/delete.

```sql
CREATE TABLE users (
  id                   UUID PRIMARY KEY,           -- matches Supabase Auth user ID
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email                TEXT NOT NULL,
  full_name            TEXT,
  avatar_url           TEXT,
  role                 TEXT NOT NULL DEFAULT 'member',  -- owner|admin|member|viewer
  slug                 TEXT,                        -- URL-safe for booking page, e.g. "linh-nguyen"
  booking_link_slug    TEXT,                        -- custom booking link, e.g. "book-with-linh"
  -- NOTE: daily_send_count and daily_send_reset_at are NOT stored here.
  -- They are managed in GCP Memorystore (Redis) as ephemeral counters:
  --   key: "daily_send:{workspace_id}:{user_id}:{date}"  TTL: 25h
  last_active_at       TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email),
  UNIQUE(workspace_id, slug)
);
```

**Notes:**
- A user can belong to multiple workspaces; for multi-workspace support a `workspace_memberships` join table is added in Phase 2 Agency plan
- `role` drives RBAC checks in `require_role()` FastAPI dependency

---

### `workspace_memberships`

Allows a single user to belong to multiple workspaces (Agency plan — multi-workspace switcher).

```sql
CREATE TABLE workspace_memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member',  -- owner|admin|member|viewer
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);
```

---

### `team_invitations`

Pending invitations to join a workspace.

```sql
CREATE TABLE team_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_by    UUID NOT NULL REFERENCES users(id),
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member',
  token         TEXT NOT NULL UNIQUE,             -- secure random token in invitation link
  accepted_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL,             -- 7-day expiry
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);
```

---

### `workspace_groups`

Agency plan: one agency account manages multiple client workspaces under a single billing umbrella.

```sql
CREATE TABLE workspace_groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,                    -- agency name
  owner_user_id  UUID NOT NULL REFERENCES users(id),
  plan           TEXT NOT NULL DEFAULT 'agency',
  white_label    BOOLEAN DEFAULT FALSE,            -- removes RevLooper branding (+$50/mo add-on)
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### `workspace_group_members`

Links client workspaces to an agency group.

```sql
CREATE TABLE workspace_group_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES workspace_groups(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, workspace_id)
);
```

---

## 3. Leads & Contacts

### `leads`

Core prospect entity. All sales activity targets a lead.

```sql
CREATE TABLE leads (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Contact info
  email              TEXT NOT NULL,
  first_name         TEXT,
  last_name          TEXT,
  company            TEXT,
  title              TEXT,
  phone              TEXT,
  linkedin_url       TEXT,
  facebook_id        TEXT,                         -- Facebook PSID (populated when they message via FB)
  zalo_id            TEXT,                         -- Zalo OA user ID
  whatsapp_number    TEXT,

  -- Enrichment data (from Apollo.io / Hunter.io)
  industry           TEXT,
  company_size       TEXT,                         -- e.g. "11-50", "51-200"
  company_linkedin   TEXT,
  company_domain     TEXT,
  location_city      TEXT,
  location_country   TEXT,
  enrichment_status  TEXT NOT NULL DEFAULT 'not_enriched',  -- not_enriched|verified|enriched|invalid
  enriched_at        TIMESTAMPTZ,
  enrichment_source  TEXT,                         -- hunter|apollo

  -- Status & scoring
  status             TEXT NOT NULL DEFAULT 'new',  -- new|contacted|replied|qualified|meeting|won|lost|unsubscribed|bounced
  score              TEXT NOT NULL DEFAULT 'cold', -- hot|warm|cold
  score_updated_at   TIMESTAMPTZ,

  -- Organisation
  tags               TEXT[] DEFAULT '{}',
  assigned_to        UUID REFERENCES users(id),
  source             TEXT,                         -- csv_import|manual|api|webhook|enrichment
  source_campaign_id UUID,                         -- which campaign sourced this lead (if applicable)

  -- Unsubscribe / suppression
  unsubscribed_at    TIMESTAMPTZ,
  bounced_at         TIMESTAMPTZ,

  -- Custom / flexible fields
  custom_fields      JSONB DEFAULT '{}',           -- user-defined extra fields from CSV mapping

  -- Timestamps
  last_contacted_at  TIMESTAMPTZ,
  last_replied_at    TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, email)
);
```

**Design notes:**
- Multi-channel identity fields (`facebook_id`, `zalo_id`, `whatsapp_number`) are populated progressively as the lead interacts across channels
- `custom_fields` JSONB allows arbitrary CSV columns to be stored without schema changes
- `score` is recomputed asynchronously by the `score_leads_batch` Celery task

---

### `lead_notes`

Free-text notes added to a lead record.

```sql
CREATE TABLE lead_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES users(id),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `suppression_list`

Per-workspace do-not-contact list. Checked before every outbound message send.

```sql
CREATE TABLE suppression_list (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  reason        TEXT NOT NULL,                     -- bounced|unsubscribed|manual|spam_complaint
  lead_id       UUID REFERENCES leads(id),         -- nullable — manual entries may not have a lead record
  added_by      UUID REFERENCES users(id),         -- null if system-added (e.g. bounce processor)
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);
```

---

### `consent_log`

SEA data privacy compliance (Vietnam PDPD, Thailand PDPA, Singapore PDPA). Records that explicit consent was obtained before processing a contact's personal data.

```sql
CREATE TABLE consent_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  consent_type    TEXT NOT NULL,                   -- outreach|data_processing|marketing
  consented       BOOLEAN NOT NULL,
  consent_source  TEXT NOT NULL,                   -- import_checkbox|web_form|manual|reply
  ip_address      INET,                            -- requester IP for audit trail
  user_agent      TEXT,
  consented_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Campaigns & Sequences

### `campaigns`

A campaign groups a sequence of outreach steps and the leads who receive them.

```sql
CREATE TABLE campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'draft',    -- draft|active|paused|completed
  industry       TEXT,                             -- vertical context for AI generation
  playbook_id    TEXT,                             -- reference to system playbook used (optional)
  created_by     UUID NOT NULL REFERENCES users(id),
  sequence_type  TEXT NOT NULL DEFAULT 'outreach', -- outreach|post_sale
  ai_prompt      TEXT,                             -- original natural language prompt used to generate
  settings       JSONB DEFAULT '{}',               -- {send_window_start, send_window_end, timezone, open_tracking, click_tracking, stop_on_reply, stop_on_meeting}
  launched_at    TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `sequences`

One sequence per campaign. Contains an ordered set of steps.

```sql
CREATE TABLE sequences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);
```

---

### `sequence_steps`

Individual steps within a sequence. Ordered by `position`.

```sql
CREATE TABLE sequence_steps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id      UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  position         INT NOT NULL,                   -- 1-based ordering
  type             TEXT NOT NULL,                  -- email|wait|condition|linkedin|facebook|zalo|whatsapp|task|nps_trigger

  -- Email step fields
  subject          TEXT,                           -- email subject line (supports {{variables}})
  body             TEXT,                           -- email body HTML/text (supports {{variables}})
  from_name        TEXT,                           -- override sender name
  channel          TEXT DEFAULT 'email',

  -- Wait step fields
  delay_unit       TEXT,                           -- hours|days
  delay_value      INT,                            -- e.g. 3 (days)

  -- Condition step fields
  condition_type   TEXT,                           -- replied|opened|clicked|bounced|meeting_booked
  true_branch_position  INT,                       -- go to step at this position if condition is TRUE
  false_branch_position INT,                       -- go to step at this position if condition is FALSE

  -- A/B testing
  ab_test_enabled  BOOLEAN DEFAULT FALSE,
  ab_winning_metric TEXT,                          -- open_rate|reply_rate|click_rate
  ab_min_sends_per_variant INT DEFAULT 50,         -- minimum sends before declaring winner
  ab_significance_threshold DECIMAL(4,3) DEFAULT 0.90,  -- chi-squared confidence level

  -- Task step fields (for post-sale sequences)
  task_title       TEXT,
  task_description TEXT,

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, position)
);
```

---

### `ab_test_variants`

A/B test variants for email sequence steps. Max 2 variants per step (label: `A` or `B`).

```sql
CREATE TABLE ab_test_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id       UUID NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,                     -- 'A' | 'B'
  subject       TEXT,
  body          TEXT NOT NULL,
  send_count    INT NOT NULL DEFAULT 0,
  open_count    INT NOT NULL DEFAULT 0,
  reply_count   INT NOT NULL DEFAULT 0,
  click_count   INT NOT NULL DEFAULT 0,
  is_winner     BOOLEAN DEFAULT FALSE,
  declared_at   TIMESTAMPTZ,                       -- when winner was declared
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(step_id, label)
);
```

---

### `campaign_leads`

Enrollment table: links a lead to a campaign and tracks their progress through the sequence.

```sql
CREATE TABLE campaign_leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id               UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  status                TEXT NOT NULL DEFAULT 'enrolled',  -- enrolled|completed|stopped|unsubscribed|bounced
  current_step_position INT NOT NULL DEFAULT 0,            -- last executed step position
  next_step_at          TIMESTAMPTZ,                       -- when the next step should run (used by scheduler)
  ab_variant_id         UUID REFERENCES ab_test_variants(id),  -- assigned A/B variant (null if no test active)

  -- Stop tracking
  stopped_reason        TEXT,                              -- replied|meeting_booked|unsubscribed|bounced|manual
  stopped_at            TIMESTAMPTZ,

  enrolled_at           TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,

  UNIQUE(campaign_id, lead_id)
);
```

---

## 4b. Content-Driven Inbound Engine

> Tables owned by `campaign-service`. Supports the Content-Driven Inbound pillar: operators publish social posts with keyword rules; RevLooper captures leads from comments and auto-sends DMs.

### `social_posts`

Tracks social media posts that are configured to trigger keyword-based lead capture.

```sql
CREATE TABLE social_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL,  -- soft FK to workspaces
  campaign_id      UUID,           -- soft FK to campaigns (optional association)
  platform         TEXT NOT NULL,  -- facebook | tiktok | instagram | linkedin
  external_post_id TEXT NOT NULL,  -- platform's post ID (e.g. Facebook post ID)
  post_url         TEXT,
  caption          TEXT,
  dm_template      TEXT,           -- Jinja2 template for the auto-DM message
  status           TEXT NOT NULL DEFAULT 'active',  -- active | paused | archived
  created_by       UUID NOT NULL,  -- soft FK to users
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, platform, external_post_id)
);
```

### `comment_keyword_rules`

Keyword rules that determine which comments on a social post should trigger lead capture and DM.

```sql
CREATE TABLE comment_keyword_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,          -- soft FK to workspaces
  post_id      UUID NOT NULL,          -- soft FK to social_posts
  keywords     TEXT[] NOT NULL,        -- array of trigger keywords (e.g. ['thông tin', 'báo giá'])
  match_mode   TEXT NOT NULL DEFAULT 'any',  -- any | all | exact
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `comment_captures`

Append-only log of every comment that triggered a capture event and the DM outcome.

```sql
CREATE TABLE comment_captures (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL,           -- soft FK to workspaces
  post_id          UUID NOT NULL,           -- soft FK to social_posts
  commenter_id     TEXT NOT NULL,           -- platform user ID (e.g. Facebook PSID)
  commenter_name   TEXT,
  comment_text     TEXT,
  matched_keyword  TEXT,
  lead_id          UUID,                    -- soft FK to leads (populated after lead creation)
  dm_sent          BOOLEAN NOT NULL DEFAULT FALSE,
  dm_sent_at       TIMESTAMPTZ,
  dm_error         TEXT,
  raw_payload      JSONB,                   -- full webhook payload for audit/replay
  captured_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, post_id, commenter_id)  -- prevent duplicate capture per commenter per post
);
```

**Index strategy:**
```sql
CREATE INDEX idx_comment_captures_post_id ON comment_captures(post_id, captured_at DESC);
CREATE INDEX idx_comment_captures_lead_id ON comment_captures(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_social_posts_workspace ON social_posts(workspace_id, status);
CREATE INDEX idx_keyword_rules_post ON comment_keyword_rules(post_id) WHERE is_active = TRUE;
```

---

## 5. Messaging & Inbox

### `messages`

All inbound and outbound messages across all channels. The single source of truth for communication history.

```sql
CREATE TABLE messages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id              UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id          UUID REFERENCES campaigns(id),
  step_id              UUID REFERENCES sequence_steps(id),
  sent_by              UUID REFERENCES users(id),          -- null for automated/inbound messages

  -- Routing
  direction            TEXT NOT NULL,                      -- outbound|inbound
  channel              TEXT NOT NULL,                      -- email|linkedin|facebook|zalo|whatsapp
  status               TEXT NOT NULL DEFAULT 'sent',       -- scheduled|sent|delivered|opened|clicked|bounced|failed|spam_complaint

  -- Content
  subject              TEXT,                               -- email only
  body                 TEXT NOT NULL,
  html_body            TEXT,                               -- email HTML version
  snippet              TEXT,                               -- first 200 chars for inbox preview

  -- Email threading
  thread_id            TEXT,                               -- Gmail threadId or Outlook conversationId
  in_reply_to          TEXT,                               -- RFC-2822 Message-ID header of parent
  message_id_header    TEXT,                               -- this message's RFC-2822 Message-ID
  reply_to_message_id  UUID REFERENCES messages(id),       -- internal FK to parent message

  -- External references
  external_id          TEXT,                               -- provider-native message ID (Gmail, Meta PSID, etc.)
  mailbox_id           UUID,                               -- FK to connected_mailboxes (nullable — set for email)

  -- Tracking (email)
  opened_at            TIMESTAMPTZ,
  clicked_at           TIMESTAMPTZ,
  bounced_at           TIMESTAMPTZ,
  bounce_type          TEXT,                               -- hard|soft
  bounce_code          TEXT,                               -- SMTP code or provider code

  -- Inbox state
  is_read              BOOLEAN DEFAULT TRUE,               -- false for inbound until user reads it
  assigned_to          UUID REFERENCES users(id),
  snoozed_until        TIMESTAMPTZ,                        -- resurface at this time
  marked_done_at       TIMESTAMPTZ,

  -- A/B variant reference
  ab_variant_id        UUID REFERENCES ab_test_variants(id),

  -- Flexible metadata
  metadata             JSONB DEFAULT '{}',                 -- provider-specific extras

  sent_at              TIMESTAMPTZ,
  scheduled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
```

**Design notes:**
- `thread_id` groups all messages of the same Gmail/Outlook thread for inbox threading
- `reply_to_message_id` allows rebuilding a full conversation tree in the inbox
- `is_read` is only meaningful for `direction = 'inbound'`
- AI Reply Assistant uses the full thread (via `thread_id`) as context

---

### `ai_reply_suggestions`

Stores the 3 AI-generated reply options for each inbound message. Consumed 2 credits.

```sql
CREATE TABLE ai_reply_suggestions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  message_id    UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  tone          TEXT NOT NULL,                     -- formal|neutral|casual
  body          TEXT NOT NULL,
  was_sent      BOOLEAN DEFAULT FALSE,
  sent_at       TIMESTAMPTZ,
  edited_before_send BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `inbox_threads` *(inbox-service)*

One thread per lead conversation (email, LinkedIn, Facebook, etc.). The unified inbox view is built from this table.

```sql
CREATE TABLE inbox_threads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL,
  lead_id          UUID NOT NULL,                       -- soft FK to leads.id
  subject          TEXT,
  channel          TEXT NOT NULL DEFAULT 'email',       -- email|linkedin|facebook|zalo|whatsapp
  status           TEXT NOT NULL DEFAULT 'open',        -- open|snoozed|archived
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  last_message_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inbox_threads_workspace ON inbox_threads (workspace_id, last_message_at DESC);
CREATE INDEX idx_inbox_threads_lead ON inbox_threads (workspace_id, lead_id);
```

---

### `inbox_messages` *(inbox-service)*

Individual messages within a thread. Populated by `email-inbound` Cloud Function via Pub/Sub.

```sql
CREATE TABLE inbox_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  thread_id     UUID NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  direction     TEXT NOT NULL,                          -- inbound|outbound
  body          TEXT NOT NULL,
  body_html     TEXT,
  intent_class  TEXT,                                   -- interested|not_interested|out_of_office|question|meeting_request
  ai_confidence NUMERIC(4,3),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inbox_messages_thread ON inbox_messages (thread_id, created_at);
```

---

### `ai_reply_drafts` *(inbox-service)*

AI-generated draft replies for a thread. Up to 3 drafts per thread, refreshed on demand. Consumes 2 credits.

```sql
CREATE TABLE ai_reply_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  thread_id     UUID NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  tone          TEXT NOT NULL,                          -- formal|neutral|casual
  body          TEXT NOT NULL,
  was_sent      BOOLEAN DEFAULT FALSE,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. CRM — Deals & Pipeline

### `deals`

Represents a sales opportunity linked to a lead in the Kanban pipeline.

```sql
CREATE TABLE deals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id   UUID REFERENCES campaigns(id),

  stage         TEXT NOT NULL DEFAULT 'contacted', -- contacted|replied|qualified|meeting|won|lost
  value         DECIMAL(15,2),                     -- expected/actual deal value
  currency      TEXT NOT NULL DEFAULT 'USD',
  probability   SMALLINT,                          -- 0-100 % (optional, for pipeline weighting)
  close_reason  TEXT,                              -- won/lost reason; free text
  close_date    DATE,

  assigned_to   UUID REFERENCES users(id),
  notes         TEXT,

  won_at        TIMESTAMPTZ,
  lost_at       TIMESTAMPTZ,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- Only one open deal per lead is recommended; the app does not enforce a hard constraint to allow re-opening after lost
- When `stage` moves to `won`, the backend automatically creates a `customers` record from the lead
- `stage` changes are logged in `events` for pipeline history / time-in-stage analytics

---

### `tasks`

Manual tasks assignable to team members, linked to a lead or deal.

```sql
CREATE TABLE tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES users(id),
  assigned_to    UUID REFERENCES users(id),

  lead_id        UUID REFERENCES leads(id),
  deal_id        UUID REFERENCES deals(id),
  customer_id    UUID REFERENCES customers(id),    -- forward ref; see §7

  title          TEXT NOT NULL,
  description    TEXT,
  due_at         TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  is_completed   BOOLEAN DEFAULT FALSE,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Customers — Post-Sale Lifecycle

### `customers`

A customer is a lead whose deal was won. Inherits the lead's contact history and has its own post-sale lifecycle.

```sql
CREATE TABLE customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id             UUID NOT NULL REFERENCES leads(id),    -- source lead — never deleted while customer exists
  deal_id             UUID REFERENCES deals(id),             -- originating won deal

  assigned_to         UUID REFERENCES users(id),
  customer_since      DATE NOT NULL,
  lifetime_value      DECIMAL(15,2) NOT NULL DEFAULT 0,      -- sum of all won deal values + renewals

  -- Health
  health_score        TEXT NOT NULL DEFAULT 'green',         -- green|yellow|red
  health_updated_at   TIMESTAMPTZ,
  health_reasons      JSONB DEFAULT '[]',                    -- [{factor, weight, value}] — for transparency

  -- Feedback snapshot
  nps_score           SMALLINT,                              -- latest NPS 0-10
  csat_score          SMALLINT,                              -- latest CSAT 1-5

  -- Activity recency
  last_contact_at     TIMESTAMPTZ,
  last_reply_at       TIMESTAMPTZ,
  last_meeting_at     TIMESTAMPTZ,

  -- Churn
  churned_at          TIMESTAMPTZ,                           -- null = active; set = churned
  churn_reason        TEXT,

  tags                TEXT[] DEFAULT '{}',
  notes               TEXT,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

**Health Score Computation (background worker):**

| Signal | Weight |
|---|---|
| Days since last contact | 40% |
| Latest NPS score | 25% |
| Email engagement (opens, replies) in last 60 days | 20% |
| Meeting frequency (last 90 days) | 15% |

- Green: composite ≥ 70
- Yellow: 40–69
- Red: < 40 or silent > 60 days

---

### `customer_feedback`

NPS (0–10) and CSAT (1–5) survey responses.

```sql
CREATE TABLE customer_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  type            TEXT NOT NULL,                   -- nps|csat
  score           SMALLINT,                        -- NPS: 0-10; CSAT: 1-5
  comment         TEXT,

  trigger_type    TEXT,                            -- scheduled|after_meeting|manual
  triggered_by    UUID REFERENCES users(id),       -- null for automated sends

  sent_at         TIMESTAMPTZ,
  responded_at    TIMESTAMPTZ,
  response_token  TEXT UNIQUE,                     -- secure one-use token in survey email link

  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `customer_notes`

Timestamped free-text notes on a customer record.

```sql
CREATE TABLE customer_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES users(id),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Meeting Booking

### `booking_links`

User-configured booking page settings. A user can have multiple booking links (Pro+).

```sql
CREATE TABLE booking_links (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name                   TEXT NOT NULL,             -- internal label, e.g. "30-min intro call"
  slug                   TEXT NOT NULL,             -- URL segment: /book/{workspace_slug}/{slug}
  title                  TEXT NOT NULL,             -- shown on booking page
  description            TEXT,

  duration_minutes       INT NOT NULL DEFAULT 30,   -- 15|30|45|60
  buffer_before_minutes  INT DEFAULT 10,
  buffer_after_minutes   INT DEFAULT 10,
  advance_notice_hours   INT DEFAULT 2,             -- min hours before meeting that can be booked
  max_bookings_per_day   INT,                       -- null = unlimited

  -- Availability schedule (serialised as weekly recurrence)
  availability           JSONB NOT NULL DEFAULT '{}',
  -- Structure: {mon: [{start: "09:00", end: "17:00"}], tue: [...], ...}
  -- All times stored in meeting owner's local timezone

  timezone               TEXT NOT NULL DEFAULT 'UTC',  -- owner's timezone for availability calculation

  -- Calendar integration
  calendar_integration_id UUID,  -- soft FK to integrations(id); no constraint — crosses service boundary (booking-service → integration-service)

  -- Meeting link (Zoom, Google Meet, etc.)
  meeting_link           TEXT,
  auto_create_meeting    BOOLEAN DEFAULT FALSE,     -- auto-create Google Meet / Zoom on booking

  is_active              BOOLEAN DEFAULT TRUE,

  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);
```

---

### `bookings`

Confirmed meetings booked through a booking link.

```sql
CREATE TABLE bookings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  booking_link_id         UUID NOT NULL REFERENCES booking_links(id),
  user_id                 UUID NOT NULL REFERENCES users(id),
  lead_id                 UUID REFERENCES leads(id),          -- null for external/unknown bookers

  -- Times (always stored in UTC)
  start_time              TIMESTAMPTZ NOT NULL,
  end_time                TIMESTAMPTZ NOT NULL,

  -- Prospect details
  prospect_email          TEXT NOT NULL,
  prospect_name           TEXT,
  prospect_phone          TEXT,
  prospect_timezone       TEXT,                               -- IANA timezone auto-detected from browser
  prospect_notes          TEXT,                               -- free-text field on booking form

  -- Owner details at booking time
  owner_timezone          TEXT NOT NULL,

  -- External calendar
  calendar_event_id       TEXT,                               -- Google Calendar / Outlook event ID
  meeting_link            TEXT,                               -- Zoom/Meet link for this booking

  status                  TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed|cancelled|rescheduled|completed

  -- Cancellation / reschedule
  cancelled_at            TIMESTAMPTZ,
  cancelled_by            TEXT,                               -- 'prospect' | 'owner'
  cancel_reason           TEXT,
  rescheduled_from_id     UUID REFERENCES bookings(id),       -- if this is a rescheduled booking

  -- AI meeting brief
  brief_generated         BOOLEAN DEFAULT FALSE,
  brief_content           TEXT,                               -- AI-generated pre-meeting brief
  brief_generated_at      TIMESTAMPTZ,

  -- Reminders
  reminder_24h_sent_at    TIMESTAMPTZ,
  reminder_1h_sent_at     TIMESTAMPTZ,

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Email Infrastructure

### `connected_mailboxes`

OAuth-connected Gmail / Outlook accounts, or custom SMTP, used for outreach email sending.

```sql
CREATE TABLE connected_mailboxes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  provider           TEXT NOT NULL,                -- gmail|outlook|smtp
  email              TEXT NOT NULL,
  display_name       TEXT,

  -- Encrypted OAuth tokens (AES-256 encrypted before storage)
  access_token_enc   TEXT,
  refresh_token_enc  TEXT,
  token_expires_at   TIMESTAMPTZ,

  -- SMTP (custom)
  smtp_host          TEXT,
  smtp_port          INT,
  smtp_user          TEXT,
  smtp_password_enc  TEXT,
  smtp_use_tls       BOOLEAN DEFAULT TRUE,

  -- Send limits & stats
  daily_send_limit   INT NOT NULL DEFAULT 200,     -- plan-based default
  sends_today        INT NOT NULL DEFAULT 0,
  sends_reset_at     DATE,

  -- Deliverability
  bounce_rate_7d     DECIMAL(5,2) DEFAULT 0,       -- % bounces over last 7 days
  is_paused          BOOLEAN DEFAULT FALSE,         -- auto-paused if bounce rate > 5%
  paused_reason      TEXT,

  -- DKIM / sending domain
  custom_tracking_domain TEXT,                     -- e.g. track.acme.com

  is_active          BOOLEAN DEFAULT TRUE,
  last_synced_at     TIMESTAMPTZ,

  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);
```

---

### `email_warmup`

Email warm-up state per connected mailbox (Mailreach integration, Pro+ plans).

```sql
CREATE TABLE email_warmup (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  mailbox_id              UUID NOT NULL REFERENCES connected_mailboxes(id) ON DELETE CASCADE,

  enabled                 BOOLEAN DEFAULT FALSE,
  mailreach_mailbox_id    TEXT,                    -- Mailreach API reference ID
  started_at              TIMESTAMPTZ,

  -- Progress
  days_running            INT DEFAULT 0,
  current_daily_volume    INT DEFAULT 0,           -- current warm-up emails/day
  target_daily_volume     INT DEFAULT 40,          -- max warm-up emails/day
  inbox_placement_score   DECIMAL(5,2),            -- % of warm-up emails landing in inbox (from Mailreach)

  last_synced_at          TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mailbox_id)
);
```

---

## 10. Workflow Automation

### `workflows`

If/then automation rules triggered by lead or pipeline events.

```sql
CREATE TABLE workflows (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  is_active      BOOLEAN DEFAULT TRUE,

  -- Trigger
  trigger_type   TEXT NOT NULL,                    -- lead_replied|lead_clicked_booking|deal_stage_changed|lead_scored_hot|tag_added|meeting_booked|customer_created|nps_responded
  trigger_config JSONB DEFAULT '{}',               -- {stage_from, stage_to, tag_value, nps_max_score, ...}

  -- Action
  action_type    TEXT NOT NULL,                    -- move_deal_stage|notify_user|assign_to|add_tag|send_email_template|create_task|enroll_in_campaign
  action_config  JSONB DEFAULT '{}',               -- {stage, user_id, tag, template_id, campaign_id, task_title, ...}

  run_count      INT DEFAULT 0,
  last_run_at    TIMESTAMPTZ,

  created_by     UUID NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `workflow_executions`

Audit log of every workflow run (per lead).

```sql
CREATE TABLE workflow_executions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id       UUID REFERENCES leads(id),
  deal_id       UUID REFERENCES deals(id),
  customer_id   UUID REFERENCES customers(id),

  status        TEXT NOT NULL,                     -- success|failed|skipped
  error_message TEXT,
  executed_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. Credits & Billing

### `credit_transactions`

Full ledger of all credit movements (top-ups, deductions, resets). Immutable — never updated.

```sql
CREATE TABLE credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  amount          INT NOT NULL,                    -- positive = credited; negative = deducted
  operation       TEXT NOT NULL,                   -- email_generation|reply_suggestion|enrichment|meeting_brief|campaign_generation|monthly_reset|top_up|refund
  reference_id    UUID,                            -- ID of the entity that consumed credits (message_id, lead_id, etc.)
  reference_type  TEXT,                            -- messages|leads|campaigns|bookings
  balance_after   INT NOT NULL,                    -- snapshot of balance after this transaction

  initiated_by    UUID REFERENCES users(id),       -- null for automated/system operations
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `subscriptions`

Active subscription state per workspace.

```sql
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  gateway                 TEXT NOT NULL,           -- stripe|paddle|momo|vnpay|payos
  gateway_subscription_id TEXT,                    -- provider-native subscription ID
  gateway_customer_id     TEXT,                    -- provider-native customer ID

  plan                    TEXT NOT NULL,            -- free|pro|business|agency
  billing_interval        TEXT NOT NULL DEFAULT 'monthly',  -- monthly|annual

  status                  TEXT NOT NULL,            -- active|past_due|cancelled|paused
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,

  trial_ends_at           TIMESTAMPTZ,             -- for future trial periods
  cancelled_at            TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE,    -- downgrade at end of current period

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `payment_transactions`

Individual payment records (one-time and subscription renewals).

```sql
CREATE TABLE payment_transactions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id        UUID REFERENCES subscriptions(id),

  gateway                TEXT NOT NULL,
  gateway_transaction_id TEXT,
  gateway_invoice_id     TEXT,

  type                   TEXT NOT NULL,            -- subscription|top_up|refund
  amount                 DECIMAL(15,2) NOT NULL,
  currency               TEXT NOT NULL DEFAULT 'USD',
  status                 TEXT NOT NULL,            -- pending|succeeded|failed|refunded

  -- VN e-invoice
  einvoice_id            TEXT,                     -- MISA/VNPT e-invoice code
  einvoice_url           TEXT,

  invoice_url            TEXT,
  metadata               JSONB DEFAULT '{}',

  created_at             TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `credit_top_up_packs`

Reference table for purchasable credit packs (read-only config data).

```sql
CREATE TABLE credit_top_up_packs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,                      -- 'Starter' | 'Growth' | 'Power'
  credits      INT NOT NULL,
  price_usd    DECIMAL(10,2) NOT NULL,
  price_vnd    DECIMAL(15,0),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO credit_top_up_packs (name, credits, price_usd) VALUES
  ('Starter', 500,   5.00),
  ('Growth',  2500,  20.00),
  ('Power',   10000, 60.00);
```

---

## 12. AI Brain — RAG System

### `knowledge_documents`

System-level knowledge base maintained by the RevLooper team. Shared across all workspaces. Contains vertical playbooks, objection libraries, email templates, and sales tactics.

```sql
CREATE TABLE knowledge_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL,                       -- playbook|objection|tactic|subject_line|cadence|template
  vertical    TEXT,                                -- recruitment|insurance|travel|marketing|saas|real_estate|universal
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  embedding   vector(1536),                        -- OpenAI text-embedding-3-small
  metadata    JSONB DEFAULT '{}',                  -- {tags, language, version}
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_embedding
  ON knowledge_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_vertical
  ON knowledge_documents(vertical);
CREATE INDEX idx_knowledge_category
  ON knowledge_documents(category);
```

---

### `workspace_knowledge`

Each workspace's private AI Brain. The parent document record (pre-chunking).

```sql
CREATE TABLE workspace_knowledge (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  title         TEXT NOT NULL,
  source_type   TEXT NOT NULL,                     -- file|url|text|email
  source_name   TEXT,                              -- original filename or URL
  doc_type      TEXT,                              -- product|pricing|persona|brand_voice|past_email|competitor|case_study|company|objection|custom

  content       TEXT NOT NULL,                     -- full extracted text
  file_size     INT,                               -- bytes
  embedding     vector(1536),                      -- embedding of full content (used for small docs; chunks take over for large)

  status        TEXT NOT NULL DEFAULT 'processing', -- processing|ready|error
  error_message TEXT,
  chunk_count   INT DEFAULT 0,

  metadata      JSONB DEFAULT '{}',                -- {page_count, word_count, language}

  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `workspace_knowledge_chunks`

Chunked segments of workspace documents with individual embeddings for semantic search.

```sql
CREATE TABLE workspace_knowledge_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES workspace_knowledge(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL,                     -- denormalized for query performance (avoids join)

  chunk_index   INT NOT NULL,                      -- 0-based position within document
  content       TEXT NOT NULL,                     -- ~512 token chunk text
  embedding     vector(1536) NOT NULL,             -- OpenAI text-embedding-3-small
  token_count   INT,
  metadata      JSONB DEFAULT '{}'                 -- {start_char, end_char, headings}
);

CREATE INDEX idx_workspace_chunks_embedding
  ON workspace_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_workspace_chunks_workspace
  ON workspace_knowledge_chunks(workspace_id);
CREATE INDEX idx_workspace_chunks_document
  ON workspace_knowledge_chunks(document_id);
```

---

### `ai_advisor_sessions`

AI Advisor chat sessions. Conversation history scoped to a session (Phase 3: persisted permanently).

```sql
CREATE TABLE ai_advisor_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages      JSONB NOT NULL DEFAULT '[]',       -- [{role: "user"|"assistant", content: "...", ts: "..."}]
  context       JSONB DEFAULT '{}',                -- {campaign_id, lead_id, page} — page context when session started
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 13. Analytics & Activity Events

### `events`

Append-only activity log. Every meaningful action (send, open, reply, stage change, booking, NPS, etc.) is recorded here. Used for:
- Lead activity timeline
- Campaign analytics
- Customer health score computation
- AI Advisor context

```sql
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Entity references (any/all may be null depending on event type)
  lead_id       UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  message_id    UUID REFERENCES messages(id) ON DELETE SET NULL,
  deal_id       UUID REFERENCES deals(id) ON DELETE SET NULL,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,   -- who performed the action (null = system)

  type          TEXT NOT NULL,                     -- see enum reference §1
  channel       TEXT,                              -- email|linkedin|facebook|zalo|whatsapp
  metadata      JSONB DEFAULT '{}',                -- event-specific details (stage_from/to, tag, bounce_code, etc.)
  trace_id      TEXT,                              -- Cloud Trace trace ID for distributed tracing correlation

  occurred_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- This table is insert-only; rows are never updated or deleted
- Partitioning by `occurred_at` (monthly) is recommended at scale (> 10M rows)
- For analytics queries, a materialized `campaign_stats` view aggregates counters daily

---

### `campaign_stats` (Materialized View)

Pre-aggregated per-campaign stats refreshed hourly by Celery beat.

```sql
CREATE MATERIALIZED VIEW campaign_stats AS
SELECT
  c.id                                            AS campaign_id,
  c.workspace_id,
  COUNT(DISTINCT cl.lead_id)                      AS enrolled_count,
  COUNT(DISTINCT m.id) FILTER (WHERE m.direction = 'outbound' AND m.status != 'failed')
                                                  AS emails_sent,
  COUNT(DISTINCT m.id) FILTER (WHERE m.opened_at IS NOT NULL)
                                                  AS emails_opened,
  COUNT(DISTINCT m.id) FILTER (WHERE m.clicked_at IS NOT NULL)
                                                  AS emails_clicked,
  COUNT(DISTINCT m.id) FILTER (WHERE m.direction = 'inbound')
                                                  AS replies,
  COUNT(DISTINCT b.id)                            AS meetings_booked,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'bounced')
                                                  AS bounces,
  COUNT(DISTINCT cl.lead_id) FILTER (WHERE cl.status = 'unsubscribed')
                                                  AS unsubscribes
FROM campaigns c
LEFT JOIN campaign_leads cl ON cl.campaign_id = c.id
LEFT JOIN messages m ON m.campaign_id = c.id
LEFT JOIN bookings b ON b.lead_id = cl.lead_id
  AND b.created_at > c.launched_at
GROUP BY c.id, c.workspace_id;

CREATE UNIQUE INDEX ON campaign_stats(campaign_id);
```

---

## 14. Notifications

### `notifications`

In-app notifications for users (powered by Novu's in-app channel, stored locally for the notification center).

```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type          TEXT NOT NULL,                     -- booking_confirmed|hot_lead_alert|advisor_recommendation|credits_low|credits_exhausted|bounce_rate_warning|campaign_completed|weekly_digest
  title         TEXT NOT NULL,
  body          TEXT,
  action_url    TEXT,                              -- deep link to relevant page in dashboard
  action_label  TEXT,                              -- CTA button label

  reference_id  UUID,                              -- ID of related entity (lead, campaign, booking...)
  reference_type TEXT,

  is_read       BOOLEAN DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  novu_message_id TEXT,                            -- Novu message ID for deduplication

  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 15. Integrations & Webhooks

### `integrations`

Connected third-party accounts per workspace (email providers, social channels, calendars).

```sql
CREATE TABLE integrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  channel           TEXT NOT NULL,                 -- gmail|outlook|linkedin|facebook|zalo|whatsapp|google_calendar|outlook_calendar|slack|notion
  display_name      TEXT,                          -- e.g. "Linh's Gmail", "Acme Facebook Page"

  -- Encrypted credentials (AES-256 before storage)
  access_token_enc  TEXT,
  refresh_token_enc TEXT,
  token_expires_at  TIMESTAMPTZ,

  -- Provider-specific identifiers
  external_id       TEXT,                          -- Gmail: email; Facebook: page_id; Zalo: oa_id; LinkedIn: profile_id
  external_metadata JSONB DEFAULT '{}',            -- provider-specific extras (page name, permissions, scopes, etc.)

  -- LinkedIn-specific
  linkedin_rate_limit_state JSONB DEFAULT '{}',    -- {connections_today, messages_today, profile_visits_today, reset_at}

  -- Zalo-specific
  zalo_oa_name      TEXT,
  zalo_webhook_secret TEXT,

  is_active         BOOLEAN DEFAULT TRUE,
  last_synced_at    TIMESTAMPTZ,
  sync_error        TEXT,                          -- last sync error message (if any)

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, channel, external_id)
);
```

---

### `webhook_endpoints`

User-configured outbound webhooks (receive RevLooper events at an external URL).

```sql
CREATE TABLE webhook_endpoints (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES users(id),

  url            TEXT NOT NULL,
  secret         TEXT NOT NULL,                    -- HMAC-SHA256 signing secret
  events         TEXT[] NOT NULL DEFAULT '{}',     -- subscribed event types
  is_active      BOOLEAN DEFAULT TRUE,

  -- Stats
  last_triggered_at    TIMESTAMPTZ,
  last_success_at      TIMESTAMPTZ,
  last_failure_at      TIMESTAMPTZ,
  consecutive_failures INT DEFAULT 0,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `webhook_deliveries`

Log of every outbound webhook attempt (for debugging and retry).

```sql
CREATE TABLE webhook_deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id   UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  status_code   INT,
  response_body TEXT,
  attempt       SMALLINT NOT NULL DEFAULT 1,       -- retry attempt number
  succeeded     BOOLEAN DEFAULT FALSE,

  sent_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `linkedin_job_queue`

Queue of pending LinkedIn automation actions (for Chrome Extension Phase 2 polling / Cloud Browser Phase 3).

```sql
CREATE TABLE linkedin_job_queue (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  lead_id        UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_lead_id UUID REFERENCES campaign_leads(id),

  action_type    TEXT NOT NULL,                    -- profile_visit|connection_request|message_send
  payload        JSONB NOT NULL,                   -- {profile_url, message_text, note}

  status         TEXT NOT NULL DEFAULT 'pending',  -- pending|approved|executing|completed|failed|cancelled
  scheduled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at    TIMESTAMPTZ,
  result         JSONB DEFAULT '{}',               -- {success, error_message, provider_id}

  attempt        SMALLINT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 16. Outbox Events (Transactional Outbox Pattern)

### `outbox_events`

Each service atomically writes a row here **in the same DB transaction** as the business data change. A background Cloud Run Job (`outbox-publisher`) polls this table and publishes pending rows to Cloud Pub/Sub, then marks them `published = true`.

This guarantees **at-least-once delivery** of events to downstream services — even if the publishing job crashes between the DB write and Pub/Sub publish, the event is not lost.

```sql
CREATE TABLE outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type  TEXT NOT NULL,        -- 'lead'|'campaign'|'deal'|'booking'|'message'|'customer'
  aggregate_id    UUID NOT NULL,        -- ID of the changed entity
  workspace_id    UUID,                 -- for observability / filtering; nullable (some events are system-level)
  event_type      TEXT NOT NULL,        -- Pub/Sub message type: 'lead.created'|'deal.won'|'booking.confirmed'|...
  payload         JSONB NOT NULL,       -- full event payload as published to Pub/Sub topic
  published       BOOLEAN DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbox_unpublished ON outbox_events(created_at) WHERE published = FALSE;
```

**Notes:**
- `outbox-publisher` runs every 5 seconds (Cloud Scheduler → Cloud Run Job)
- Rows older than 7 days with `published = true` are purged by the same job
- Each service has `INSERT` privilege on this table via its Postgres role; only `outbox-publisher` has `UPDATE`

---

## 17. Compliance & Privacy

*(See also `consent_log` §3 and `suppression_list` §3)*

### `data_erasure_jobs`

Tracks async GDPR/PDPD right-to-erasure requests.

```sql
CREATE TABLE data_erasure_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id),  -- intentionally no CASCADE — survives workspace deletion
  lead_id         UUID,                            -- null if full workspace deletion
  requested_by    UUID REFERENCES users(id),
  request_type    TEXT NOT NULL,                   -- lead_delete|workspace_delete
  status          TEXT NOT NULL DEFAULT 'pending', -- pending|processing|completed|failed
  scheduled_for   TIMESTAMPTZ NOT NULL,            -- 30-day grace period before irreversible wipe
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `audit_log`

Tamper-evident log of sensitive administrative actions.

```sql
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),

  action        TEXT NOT NULL,                     -- workspace_settings_changed|plan_changed|member_invited|member_removed|api_key_created|data_exported|data_deleted|suppression_added|suppression_removed
  resource_type TEXT,
  resource_id   UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,

  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 18. Key Indexes

```sql
-- ─── Leads ───────────────────────────────────────────────────
CREATE INDEX idx_leads_workspace          ON leads(workspace_id);
CREATE INDEX idx_leads_email              ON leads(workspace_id, email);
CREATE INDEX idx_leads_status             ON leads(workspace_id, status);
CREATE INDEX idx_leads_score              ON leads(workspace_id, score);
CREATE INDEX idx_leads_enrichment         ON leads(workspace_id, enrichment_status);
CREATE INDEX idx_leads_assigned           ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_leads_tags               ON leads USING GIN(tags);
CREATE INDEX idx_leads_custom_fields      ON leads USING GIN(custom_fields);
CREATE INDEX idx_leads_updated            ON leads(workspace_id, updated_at DESC);

-- ─── Campaigns ───────────────────────────────────────────────
CREATE INDEX idx_campaigns_workspace      ON campaigns(workspace_id, status);
CREATE INDEX idx_campaigns_created_by     ON campaigns(created_by);

-- ─── Campaign Leads ───────────────────────────────────────────
CREATE INDEX idx_campaign_leads_next_step ON campaign_leads(next_step_at)
  WHERE status = 'enrolled';
CREATE INDEX idx_campaign_leads_campaign  ON campaign_leads(campaign_id, status);
CREATE INDEX idx_campaign_leads_lead      ON campaign_leads(lead_id);

-- ─── Messages ─────────────────────────────────────────────────
CREATE INDEX idx_messages_lead            ON messages(lead_id, created_at DESC);
CREATE INDEX idx_messages_campaign        ON messages(campaign_id);
CREATE INDEX idx_messages_workspace       ON messages(workspace_id, direction, is_read);
CREATE INDEX idx_messages_thread          ON messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_messages_channel         ON messages(workspace_id, channel, direction);
CREATE INDEX idx_messages_scheduled       ON messages(scheduled_at) WHERE status = 'scheduled';

-- ─── Deals ────────────────────────────────────────────────────
CREATE INDEX idx_deals_workspace          ON deals(workspace_id, stage);
CREATE INDEX idx_deals_lead               ON deals(lead_id);
CREATE INDEX idx_deals_assigned           ON deals(assigned_to) WHERE assigned_to IS NOT NULL;

-- ─── Customers ────────────────────────────────────────────────
CREATE INDEX idx_customers_workspace      ON customers(workspace_id);
CREATE INDEX idx_customers_health         ON customers(workspace_id, health_score);
CREATE INDEX idx_customers_lead           ON customers(lead_id);
CREATE INDEX idx_customers_assigned       ON customers(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_customers_last_contact   ON customers(workspace_id, last_contact_at);
CREATE INDEX idx_customers_tags           ON customers USING GIN(tags);

-- ─── Bookings ─────────────────────────────────────────────────
CREATE INDEX idx_bookings_workspace       ON bookings(workspace_id, status);
CREATE INDEX idx_bookings_user            ON bookings(user_id, start_time);
CREATE INDEX idx_bookings_upcoming        ON bookings(start_time) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_lead            ON bookings(lead_id) WHERE lead_id IS NOT NULL;

-- ─── Events ───────────────────────────────────────────────────
CREATE INDEX idx_events_workspace_lead    ON events(workspace_id, lead_id, occurred_at DESC);
CREATE INDEX idx_events_campaign          ON events(campaign_id, type, occurred_at);
CREATE INDEX idx_events_workspace_type    ON events(workspace_id, type, occurred_at DESC);
CREATE INDEX idx_events_customer          ON events(customer_id, occurred_at DESC) WHERE customer_id IS NOT NULL;

-- ─── Suppression ──────────────────────────────────────────────
CREATE INDEX idx_suppression_workspace    ON suppression_list(workspace_id, email);

-- ─── Consent ──────────────────────────────────────────────────
CREATE INDEX idx_consent_lead             ON consent_log(workspace_id, lead_id);

-- ─── Workspace Knowledge ──────────────────────────────────────
CREATE INDEX idx_wk_workspace             ON workspace_knowledge(workspace_id, status);
CREATE INDEX idx_wk_chunks_workspace      ON workspace_knowledge_chunks(workspace_id);

-- ─── Notifications ────────────────────────────────────────────
CREATE INDEX idx_notifications_user       ON notifications(user_id, is_read, created_at DESC);

-- ─── LinkedIn Queue ───────────────────────────────────────────
CREATE INDEX idx_linkedin_queue_pending   ON linkedin_job_queue(workspace_id, status, scheduled_at)
  WHERE status = 'pending';

-- ─── Workflow ─────────────────────────────────────────────────
CREATE INDEX idx_workflows_workspace      ON workflows(workspace_id, is_active, trigger_type);

-- ─── Subscriptions ────────────────────────────────────────────
CREATE INDEX idx_subscriptions_workspace  ON subscriptions(workspace_id, status);

-- ─── Credit Transactions ──────────────────────────────────────
CREATE INDEX idx_credit_tx_workspace      ON credit_transactions(workspace_id, created_at DESC);

-- ─── Audit Log ────────────────────────────────────────────────
CREATE INDEX idx_audit_workspace          ON audit_log(workspace_id, created_at DESC);
```

---

## 19. AI Employee Platform (Spec 40)

**Owning service:** `ai-employee-service`. Tables use soft FKs (plain UUID, no FK constraint) for all cross-service references (`workspace_id`, `user_id`, `model_id`, `paddle_line_item_id`).

> `ai_models` and `paddle_line_items` are owned by **`billing-service`** (Spec 32 amendment). Listed here for reference because `ai-employee-service` references them by UUID.

```sql
-- 1. Catalog: system-owned agent definitions. workspace_id IS NULL. One row per agent type.
CREATE TABLE ai_employee_catalog (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                          TEXT NOT NULL UNIQUE,
  name                          TEXT NOT NULL,
  category                      TEXT NOT NULL CHECK (category IN ('marketing','growth','sales','support','ops')),
  description                   TEXT NOT NULL,
  graph_module                  TEXT NOT NULL,
  monthly_rental_price_usd      NUMERIC(10,2) NOT NULL,
  credits_per_run_estimate      INTEGER NOT NULL,
  default_daily_spend_cap_usd   NUMERIC(10,2) NOT NULL,
  default_monthly_spend_cap_usd NUMERIC(10,2) NOT NULL,
  required_oauth_scopes         TEXT[] NOT NULL DEFAULT '{}',
  default_dry_run_days          INTEGER NOT NULL DEFAULT 7,
  default_per_run_cost_ceiling_usd NUMERIC(10,2) NOT NULL DEFAULT 2.00,
  is_published                  BOOLEAN NOT NULL DEFAULT false,
  min_plan                      TEXT NOT NULL DEFAULT 'pro' CHECK (min_plan IN ('pro','business','agency')),
  version                       INTEGER NOT NULL DEFAULT 1,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Rentals: workspace's active instance of a catalog agent.
CREATE TABLE ai_employee_rentals (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id               UUID NOT NULL,
  catalog_id                 UUID NOT NULL,
  rented_by_user_id          UUID NOT NULL,
  model_id                   UUID NOT NULL,          -- soft FK to billing-service.ai_models
  status                     TEXT NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','paused','auto_paused','cancelling','cancelled')),
  pause_reason               TEXT,
  daily_spend_cap_usd        NUMERIC(10,2) NOT NULL,
  monthly_spend_cap_usd      NUMERIC(10,2) NOT NULL,
  per_run_credit_ceiling     INTEGER NOT NULL,
  dry_run_until              TIMESTAMPTZ,
  paddle_line_item_id        TEXT,
  paddle_period_end_at       TIMESTAMPTZ,
  cancellation_grace_ends_at TIMESTAMPTZ,
  config                     JSONB NOT NULL DEFAULT '{}',
  cancelled_at               TIMESTAMPTZ,
  cancelling_at              TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_one_active_rental_per_catalog
  ON ai_employee_rentals (workspace_id, catalog_id)
  WHERE status IN ('active','paused','auto_paused','cancelling');
CREATE INDEX idx_rentals_workspace ON ai_employee_rentals (workspace_id, status);

-- 3. SOPs: versioned markdown attached to a rental or workspace.
CREATE TABLE ai_employee_sops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  rental_id     UUID,                                -- NULL = workspace-global SOP
  title         TEXT NOT NULL,
  body_markdown TEXT NOT NULL CHECK (length(body_markdown) <= 20480),
  version       INTEGER NOT NULL DEFAULT 1,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sops_workspace_rental ON ai_employee_sops (workspace_id, rental_id, is_active);

-- 4. Tools: per-catalog tool manifests (system-owned).
CREATE TABLE ai_employee_tools (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id                  UUID NOT NULL,
  name                        TEXT NOT NULL,
  description                 TEXT NOT NULL,
  executor                    TEXT NOT NULL,         -- 'integration:google-ads:create_campaign'
  required_oauth_scopes       TEXT[] NOT NULL DEFAULT '{}',
  required_capabilities       TEXT[] NOT NULL DEFAULT '{}',
  side_effect_class           TEXT NOT NULL
                              CHECK (side_effect_class IN ('read','write','spend','publish_public')),
  requires_approval_above_usd NUMERIC(10,2),
  max_per_run                 INTEGER NOT NULL DEFAULT 5,
  UNIQUE (catalog_id, name)
);

-- 5. Runs: one row per agent invocation. Append-only.
CREATE TABLE ai_employee_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL,
  rental_id        UUID NOT NULL,
  triggered_by     TEXT NOT NULL CHECK (triggered_by IN ('manual','schedule','workflow','approval')),
  triggered_by_id  UUID,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','running','succeeded','failed','cancelled')),
  inputs           JSONB NOT NULL DEFAULT '{}',
  output           JSONB,
  error            TEXT,
  model_id         UUID NOT NULL,                    -- snapshot at dispatch time
  input_tokens     INTEGER NOT NULL DEFAULT 0,
  output_tokens    INTEGER NOT NULL DEFAULT 0,
  llm_cost_usd     NUMERIC(10,4) NOT NULL DEFAULT 0,
  tool_cost_usd    NUMERIC(10,4) NOT NULL DEFAULT 0,
  credits_reserved INTEGER NOT NULL DEFAULT 0,
  credits_settled  INTEGER NOT NULL DEFAULT 0,
  duration_ms      INTEGER,
  is_dry_run       BOOLEAN NOT NULL DEFAULT false,
  graph_trace_id   TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_runs_workspace_rental_created
  ON ai_employee_runs (workspace_id, rental_id, created_at DESC);

-- 6. Tool invocations: one row per tool call within a run. Append-only.
CREATE TABLE ai_employee_tool_invocations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL,
  run_id                UUID NOT NULL,
  rental_id             UUID NOT NULL,
  tool_id               UUID NOT NULL,
  outcome               TEXT NOT NULL CHECK (outcome IN ('success','failure','simulated','skipped_cap')),
  cost_usd              NUMERIC(10,4) NOT NULL DEFAULT 0,
  side_effects_json     JSONB NOT NULL DEFAULT '{}',
  external_reference_id TEXT,
  request_payload       JSONB NOT NULL DEFAULT '{}',
  response_payload      JSONB,
  error                 TEXT,
  duration_ms           INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Approval requests: fail-closed proposal-and-approve.
CREATE TABLE ai_employee_approval_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL,
  rental_id               UUID NOT NULL,
  run_id                  UUID NOT NULL,
  tool_id                 UUID NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected','expired')),
  proposed_action         JSONB NOT NULL,
  reasoning               TEXT NOT NULL,
  expected_outcome        TEXT NOT NULL,
  rollback_plan           TEXT,
  risk_score              INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  estimated_cost_usd      NUMERIC(10,2) NOT NULL,
  expires_at              TIMESTAMPTZ NOT NULL,
  decided_by              UUID,
  decided_at              TIMESTAMPTZ,
  resulting_invocation_id UUID,
  idempotency_key         TEXT NOT NULL UNIQUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approvals_workspace_status
  ON ai_employee_approval_requests (workspace_id, status, expires_at)
  WHERE status = 'pending';

-- 8. Memory: per-rental key-value JSONB working memory.
CREATE TABLE ai_employee_memory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  rental_id    UUID NOT NULL,
  key          TEXT NOT NULL,
  value        JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, rental_id, key)
);

-- 9. Run feedback: per-run rating feeds nightly eval suite.
CREATE TABLE ai_employee_run_feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  rental_id    UUID NOT NULL,
  run_id       UUID NOT NULL,
  user_id      UUID NOT NULL,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, user_id)
);

-- 10. Workspace settings: AI-disclosure template, one row per workspace.
CREATE TABLE ai_employee_workspace_settings (
  workspace_id           UUID PRIMARY KEY,
  ai_disclosure_template TEXT NOT NULL DEFAULT '[Posted by AI on behalf of {workspace_name}]'
                         CHECK (length(ai_disclosure_template) BETWEEN 1 AND 280),
  updated_by             UUID,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- billing-service: ai_models reference table (Spec 32 amendment)
-- Listed here for reference; migration lives in billing-service.
CREATE TABLE ai_models (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT NOT NULL UNIQUE,       -- 'openai/gpt-4o-mini', 'anthropic/claude-3-5-sonnet'
  provider             TEXT NOT NULL,
  display_name         TEXT NOT NULL,
  input_rate_per_1k    NUMERIC(10,6) NOT NULL,     -- USD per 1K input tokens
  output_rate_per_1k   NUMERIC(10,6) NOT NULL,     -- USD per 1K output tokens
  capability_flags     TEXT[] NOT NULL DEFAULT '{}',
  is_active            BOOLEAN NOT NULL DEFAULT true,
  rate_changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- billing-service: paddle_line_items (Spec 32 amendment)
CREATE TABLE paddle_line_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL,
  paddle_subscription_id TEXT NOT NULL,
  paddle_price_id      TEXT NOT NULL,
  reference_type       TEXT NOT NULL,              -- 'ai_employee_rental'
  reference_id         UUID NOT NULL,              -- rental id
  status               TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key indexes (ai-employee-service):**
```sql
CREATE INDEX idx_employee_runs_workspace_status ON ai_employee_runs (workspace_id, status)
  WHERE status IN ('pending','running');
CREATE INDEX idx_tool_invocations_workspace_rental
  ON ai_employee_tool_invocations (workspace_id, rental_id, created_at DESC);
CREATE INDEX idx_feedback_workspace_rental_created
  ON ai_employee_run_feedback (workspace_id, rental_id, created_at DESC);
```

**Phase 2 additions (Spec 40 Phase 2 — Authoring Platform):**
Five additional tables (`agent_versions`, `agent_authoring_drafts`, `agent_version_upgrade_elections`, `agent_rbac_assignments`, `agent_authoring_audit`) are added additively by the Phase 2 migration. They are fully documented in `docs/specs/40_AI_EMPLOYEE_PLATFORM/DESIGN.md §Phase 2`.

---

## 20. Entity-Relationship Summary

```
workspaces ─────────────────────────────────────────────────────────────┐
  │                                                                      │
  ├── users (many per workspace via workspace_memberships)               │
  │     └── booking_links (1:many)                                       │
  │           └── bookings (1:many)                                      │
  │                                                                      │
  ├── workspace_groups (agency: 1 group → many workspaces)               │
  │                                                                      │
  ├── leads (1:many) ──────────────────────────────────────────┐         │
  │     ├── consent_log (1:many)                               │         │
  │     ├── lead_notes (1:many)                                │         │
  │     ├── campaign_leads (M:N via campaigns)                 │         │
  │     ├── messages (1:many)                                  │         │
  │     │     └── ai_reply_suggestions (1:many)                │         │
  │     ├── deals (1:many) ─────────────────────────────────┐  │         │
  │     │     └── [on won] → customers (1:1)                │  │         │
  │     │                         ├── customer_feedback      │  │         │
  │     │                         ├── customer_notes         │  │         │
  │     │                         └── tasks (1:many)         │  │         │
  │     └── events (1:many)                                  │  │         │
  │                                                          │  │         │
  ├── campaigns (1:many)                                     │  │         │
  │     ├── sequences (1:1)                                   │  │         │
  │     │     └── sequence_steps (1:many)                     │  │         │
  │     │           └── ab_test_variants (1:many)             │  │         │
  │     └── campaign_leads (1:many) ──────────────────────────┘  │         │
  │                                                               │         │
  ├── suppression_list (1:many)                                   │         │
  │                                                               │         │
  ├── connected_mailboxes (1:many)                                │         │
  │     └── email_warmup (1:1)                                    │         │
  │                                                               │         │
  ├── integrations (1:many)                                       │         │
  │     └── linkedin_job_queue (1:many)                          │         │
  │                                                               │         │
  ├── workflows (1:many)                                          │         │
  │     └── workflow_executions (1:many)                          │         │
  │                                                               │         │
  ├── workspace_knowledge (1:many)                                │         │
  │     └── workspace_knowledge_chunks (1:many)                  │         │
  │                                                               │         │
  ├── subscriptions (1:many)                                      │         │
  ├── payment_transactions (1:many)                               │         │
  ├── credit_transactions (1:many)                                │         │
  ├── events (1:many) ────────────────────────────────────────────┘         │
  ├── notifications (1:many)                                                │
  ├── webhook_endpoints (1:many)                                            │
  │     └── webhook_deliveries (1:many)                                     │
  ├── audit_log (1:many)                                                    │
  └── data_erasure_jobs (1:many)                                            │
                                                                            │
knowledge_documents (global — not workspace-scoped) ────────────────────────┘
```

---

## Appendix A — JSONB Field Schemas

### `workspaces.settings`
```json
{
  "bounce_pause_threshold": 0.05,
  "send_window_start": "09:00",
  "send_window_end": "17:00",
  "send_days": ["mon","tue","wed","thu","fri"],
  "nps_interval_days": 90,
  "nps_first_send_days_after_close": 30,
  "csat_after_meeting": true,
  "unsubscribe_footer_required": true,
  "white_label": false,
  "saml_enabled": false,
  "saml_idp_metadata_url": null,
  "default_timezone": "Asia/Ho_Chi_Minh",
  "default_currency": "USD"
}
```

### `sequence_steps.config` (by type)

**Email step:**
```json
{
  "subject": "Quick question, {{first_name}}",
  "body": "Hi {{first_name}}, ...",
  "from_name": "Linh from Acme",
  "mailbox_id": "uuid"
}
```

**Wait step:**
```json
{
  "delay_value": 3,
  "delay_unit": "days"
}
```

**Condition step:**
```json
{
  "condition_type": "replied",
  "true_branch_position": 4,
  "false_branch_position": 3
}
```

**NPS trigger step:**
```json
{
  "nps_message": "How would you rate your experience so far?",
  "send_delay_hours": 0
}
```

### `events.metadata` (by type)

| Event Type | Metadata Keys |
|---|---|
| `email_sent` | `{subject, mailbox_id, ab_variant_id}` |
| `email_opened` | `{subject, opened_count}` |
| `stage_changed` | `{stage_from, stage_to, deal_id}` |
| `tag_added` | `{tag}` |
| `health_changed` | `{health_from, health_to, reasons}` |
| `bounced` | `{bounce_type, bounce_code, smtp_error}` |
| `nps_responded` | `{score, comment}` |
| `workflow_triggered` | `{workflow_id, trigger_type}` |

---

## Appendix B — Row-Level Security Policies (Supabase RLS)

All tables with `workspace_id` have a RLS policy enforcing tenant isolation at the database engine level, independent of application code.

```sql
-- Enable RLS on all workspace-scoped tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ... (repeat for every table with workspace_id)

-- Policy: workspace isolation
-- app.workspace_id is set in the session by the backend on each request
CREATE POLICY workspace_isolation ON leads
  USING (workspace_id = current_setting('app.workspace_id')::uuid);

CREATE POLICY workspace_isolation ON campaigns
  USING (workspace_id = current_setting('app.workspace_id')::uuid);

-- knowledge_documents is global (no RLS — read-only by all, write by service role only)
```

---

## Appendix C — Migration Strategy

All schema changes are managed with **Alembic** (Python).

```
alembic/
  versions/
    0001_initial_schema.py
    0002_add_customers_table.py
    0003_add_workflow_automation.py
    0004_add_rag_tables.py
    0005_add_agency_workspace_groups.py
    ...
```

**Rules:**
1. Never rename a column — add new column, migrate data, drop old in a later migration
2. JSONB fields can be extended without a migration — document schema changes in this file
3. Every migration is reversible (`upgrade` + `downgrade` functions)
4. Run `alembic upgrade head` on deploy; rollback with `alembic downgrade -1`
