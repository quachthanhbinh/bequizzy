# AI Campaign Builder — Design Spec

**Date:** 2026-05-18  
**Status:** Approved  
**Priority:** P0 — Core Feature  
**Scope:** Spec 05 — Campaign Service + AI Service

---

## Problem Statement

Solo founders and small teams lack time to strategize outreach. They know their product but struggle to translate it into a structured campaign with audience targeting, goals, and sequenced steps. AI should do the heavy lifting — generating a campaign plan the user can tweak in minutes.

**Current state:** No campaign creation flow exists. Users cannot create campaigns manually or via AI.

**Target state:** Users can describe their goal in plain language and get a full campaign draft (name, description, target audience, goals, sequence outline) within 10 seconds, or create campaigns manually without AI.

---

## Architecture

### Service Boundary

The AI Campaign Builder spans two services:

1. **campaign-service** — owns campaign persistence, CRUD operations, status transitions, and orchestrates the AI draft pipeline
2. **ai-service** — generates campaign drafts using RAG (Brain chunks) + LLM

```
Frontend (Campaign wizard)
    │
    ▼
api-gateway  (injects workspace_id header)
    │
    ▼
campaign-service (FastAPI, Cloud Run)
    ├── POST /campaigns/ai-draft
    │     ├─ 1. Validate prompt
    │     ├─ 2. Check idempotency_key (return cached if exists)
    │     ├─ 3. billing-service.reserve_credits(5)   ← BEFORE LLM
    │     ├─ 4. ai-service.generate_campaign_draft(prompt, chunks)
    │     ├─ 5. billing-service.consume_credits()    ← on success
    │     │  OR billing-service.release_credits()    ← on failure
    │     └─ 6. Return draft + save to campaign_ai_drafts
    │
    ├── POST /campaigns              (manual create)
    ├── GET  /campaigns              (list, paginated)
    ├── GET  /campaigns/{id}
    ├── PATCH /campaigns/{id}
    ├── POST /campaigns/{id}/duplicate
    └── DELETE /campaigns/{id}       (archive-only guard)

ai-service (FastAPI, Cloud Run)
    └── POST /ai/campaign-draft
          ├─ Retrieve top-10 Brain chunks (pgvector cosine similarity)
          ├─ Build XML-delimited prompt (brain context + user goal)
          └─ LiteLLM → GPT-4o-mini (fast) or Claude 3.5 Sonnet (quality)
```

### Design Convergence

**CPO + CTO joint decision:**

The final design uses: (1) credit reserve model for AI operations, (2) parallel Brain chunk pre-fetch during credit reserve, (3) idempotency key per draft request, (4) conversation history stored as append-only JSONB array in `campaign_ai_drafts`. Campaign entity stays slim — AI draft is a separate table linked by `campaign_id`.

**Final Confidence: 8/10**

**Why not 10:** Credit reserve atomicity across two services (campaign-service → billing-service) uses HTTP, not a distributed transaction. Acceptable risk given eventual consistency model, but a billing-service bug could leave orphaned reserves.

---

## Data Model

### Table: `campaigns`

```sql
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,                          -- always scoped
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',          -- draft/active/paused/archived
  ai_generated    BOOLEAN NOT NULL DEFAULT FALSE,
  target_audience JSONB,                                  -- {industry, company_size, region, job_titles[]}
  goals           JSONB,                                  -- [{type, target_value}]
  sequence_outline JSONB,                                 -- [{step_number, type, summary}] AI-generated plan
  settings        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID NOT NULL,                          -- soft FK → workspace_members.user_id
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at     TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_workspace ON campaigns (workspace_id);
CREATE INDEX idx_campaigns_status    ON campaigns (workspace_id, status);
```

### Table: `campaign_ai_drafts`

```sql
CREATE TABLE campaign_ai_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  campaign_id     UUID,                                   -- NULL until user saves draft as campaign
  idempotency_key TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending',        -- pending/completed/failed
  credit_reserve_id UUID,                                 -- soft FK → billing-service
  user_prompt     TEXT NOT NULL,
  brain_chunks    JSONB,                                  -- snapshot of chunks used
  llm_response    JSONB,                                  -- full LLM output
  generated_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_ai_drafts_workspace ON campaign_ai_drafts (workspace_id);
CREATE UNIQUE INDEX idx_campaign_ai_drafts_idempotency ON campaign_ai_drafts (idempotency_key);
```

### Outbox Events

Events emitted by campaign-service:

- `campaign.created` — `{campaign_id, workspace_id, ai_generated, status}`
- `campaign.status_changed` — `{campaign_id, workspace_id, old_status, new_status}`
- `campaign.ai_draft_completed` — `{draft_id, campaign_id, workspace_id}`
- `campaign.ai_draft_failed` — `{draft_id, workspace_id, error}`

---

## API Surface

### Campaign CRUD Endpoints

**POST /campaigns** — Manual campaign creation
- Request: `{name, description, target_audience?, goals?, settings?}`
- Response: `CampaignResponse`
- Credits: 0 (manual creation is free)
- Sets `ai_generated = false`

**GET /campaigns** — List campaigns (paginated)
- Query params: `status?, page?, limit?`
- Response: `{data: CampaignResponse[], meta: {total, page, limit}}`
- Filters by `workspace_id` automatically

**GET /campaigns/{id}** — Get single campaign
- Response: `CampaignResponse`
- 404 if not found or wrong workspace

**PATCH /campaigns/{id}** — Update campaign
- Request: `{name?, description?, target_audience?, goals?, settings?, status?}`
- Response: `CampaignResponse`
- Status transitions validated (see Status Transition Matrix)

**POST /campaigns/{id}/duplicate** — Duplicate campaign
- Response: `CampaignResponse`
- Creates new campaign with `status = draft`, `ai_generated = false`, name prefixed "Copy of …"

**DELETE /campaigns/{id}** — Archive campaign
- Response: `{ok: true}`
- Only allows deletion if `status = draft` or `status = archived`
- Active campaigns must be archived first (prevents accidental deletion of live campaigns)

### AI Draft Endpoints

**POST /campaigns/ai-draft** — Generate AI campaign draft
- Request: `{user_prompt: string, idempotency_key: string}`
- Response: `AIDraftResponse` with generated campaign fields
- Credits: 5 (reserved before LLM call, consumed on success, released on failure)
- Latency target: p95 < 10s, p99 < 15s
- Returns 402 if insufficient credits (< 5)
- Returns cached draft if idempotency_key already exists with status = completed

---

## Core Flows

### 1. AI Campaign Draft Generation

```python
# campaign-service/app/services/ai_campaign.py

async def generate_ai_campaign_draft(
    workspace_id: str,
    user_prompt: str,
    idempotency_key: str,
    db: AsyncSession,
    billing_client: BillingClient,
    ai_client: AIClient,
) -> CampaignAIDraft:
    # 1. Check idempotency
    existing = await get_draft_by_idempotency(db, idempotency_key)
    if existing and existing.status == "completed":
        return existing

    # 2. Reserve 5 credits BEFORE LLM call
    reserve_id = await billing_client.reserve_credits(
        workspace_id, credits=5, reason="ai_campaign_draft"
    )

    draft = CampaignAIDraft(
        workspace_id=workspace_id,
        idempotency_key=idempotency_key,
        status="pending",
        credit_reserve_id=reserve_id,
        user_prompt=user_prompt,
    )
    db.add(draft)
    await db.flush()

    try:
        # 3. Call ai-service (may raise on timeout/error)
        result = await ai_client.generate_campaign_draft(workspace_id, user_prompt)
        draft.llm_response = result
        draft.status = "completed"
        draft.generated_at = datetime.utcnow()

        # 4. Consume reserved credits
        await billing_client.consume_credits(reserve_id)

    except Exception as e:
        draft.status = "failed"
        draft.error_message = str(e)
        # Release reserve on failure
        await billing_client.release_credits(reserve_id)
        raise AppError("AI_DRAFT_FAILED", str(e), 502)

    await db.commit()
    return draft
```

**Key guarantees:**
- Credits reserved before LLM call (no free AI on timeout)
- Credits released on LLM failure (no charge for failed drafts)
- Idempotency prevents duplicate charges on retry
- Full prompt/response stored for audit

### 2. Manual Campaign Creation

1. User fills in name + description (optional: target_audience, goals)
2. Frontend calls `POST /campaigns` with manual fields
3. campaign-service creates campaign with `ai_generated = false`, `status = draft`
4. No credits consumed
5. Emits `campaign.created` outbox event

### 3. Campaign Status Transitions

**Valid transitions:**

```
draft   → active    ✅ (requires ≥1 sequence linked)
draft   → archived  ✅
active  → paused    ✅
active  → archived  ✅ (soft archive, not delete)
paused  → active    ✅
paused  → archived  ✅
archived → *        ❌ (terminal state — must duplicate to reactivate)
active  → draft     ❌ (not allowed — would break live enrollments)
```

**Enforcement:** Status transition validation in `campaign_service.py` before DB update.

### 4. Campaign Duplication

1. User clicks "Duplicate" on any campaign (any status)
2. Frontend calls `POST /campaigns/{id}/duplicate`
3. campaign-service copies all fields except:
   - `id` (new UUID)
   - `status` (→ `draft`)
   - `ai_generated` (→ `false` — copy is human-edited state)
   - `name` (→ `"Copy of {original_name}"`)
   - `created_at` / `updated_at` (→ now)
4. Returns new campaign

---

## AI Prompt Template

```xml
<system>
You are an expert B2B outreach strategist for Southeast Asian markets.
Generate a campaign plan in JSON format based on the user's goal and their company context below.
</system>

<brain_context>
{brain_profile_document}
</brain_context>

<relevant_chunks>
{top_5_rag_chunks}
</relevant_chunks>

<user_goal>
{user_prompt}
</user_goal>

<output_format>
Return valid JSON with keys:
  name (string), description (string),
  target_audience ({industry, company_size, region, job_titles[]}),
  goals ([{type, description}]),
  sequence_outline ([{step_number, type (email|wait|linkedin), summary, timing}])
</output_format>
```

**Brain Context Injection:**
- Retrieves Business Profile doc from AI Brain (Spec 02)
- Retrieves top-5 relevant chunks via pgvector cosine similarity
- Ensures generated audience matches ICP from Brain

---

## Credit Reserve Model

### Why Reserve/Consume/Release?

**Problem:** If we deduct credits before the LLM call and the LLM times out, we've charged the user but delivered nothing.

**Solution:** Three-phase credit model:
1. **Reserve** — lock credits before LLM call (prevents negative balance)
2. **Consume** — finalize deduction on LLM success
3. **Release** — unlock credits on LLM failure (no charge for failed drafts)

### Billing Service Integration

campaign-service calls billing-service via HTTP:

- `POST /v1/billing/credits/reserve` — returns `reserve_id`
- `POST /v1/billing/credits/consume` — finalizes deduction using `reserve_id`
- `POST /v1/billing/credits/release` — unlocks reserve using `reserve_id`

**Auth:** Workload Identity OIDC tokens (service-to-service)

### Error Handling

- **Insufficient credits (< 5):** Return 402 before reserve attempt
- **Reserve fails:** Return 502, no draft created
- **LLM times out:** Release reserve, return 502 with retry button
- **LLM succeeds:** Consume reserve, return draft

---

## Security Considerations

### Workspace Isolation

All campaign queries MUST include `workspace_id` filter. Never query without it.

**Enforcement:**
- `get_workspace_id()` dependency extracts `X-Workspace-ID` header (set by api-gateway)
- All DB queries use `WHERE workspace_id = :workspace_id`

### Credit Gate

Before any AI operation:
1. Check workspace has sufficient credits (≥ 5)
2. Return 402 if insufficient (before any LLM call)
3. Reserve credits atomically before LLM call

**No free AI:** Credits reserved before LLM call, not after.

### Input Validation

- `user_prompt` length: 10–2000 chars
- `idempotency_key` required (prevents duplicate charges on retry)
- Status transitions validated against state machine

### Rate Limiting

AI draft endpoint rate-limited via api-gateway:
- 10 AI drafts per hour per workspace (configurable via `AI_DRAFT_RATE_LIMIT_PER_HOUR`)
- Prevents credit exhaustion attacks

---

## Error Handling

### AI Draft Failures

**Insufficient credits:**
- HTTP 402 `INSUFFICIENT_CREDITS`
- No credits consumed
- Frontend shows upgrade prompt

**LLM timeout (> 15s):**
- HTTP 502 `AI_DRAFT_FAILED`
- Credits released (no charge)
- Frontend shows retry button

**LLM error (invalid response, rate limit):**
- HTTP 502 `AI_DRAFT_FAILED`
- Credits released (no charge)
- Error message stored in `campaign_ai_drafts.error_message`

### Campaign CRUD Failures

**Invalid status transition:**
- HTTP 400 `INVALID_STATUS_TRANSITION`
- Returns allowed transitions for current status

**Delete active campaign:**
- HTTP 400 `CANNOT_DELETE_ACTIVE_CAMPAIGN`
- Returns message: "Archive campaign before deleting"

**Campaign not found or wrong workspace:**
- HTTP 404 `CAMPAIGN_NOT_FOUND`

---

## Testing Strategy

### Unit Tests

**campaign_service.py:**
- Status transition validation (all valid/invalid transitions)
- Campaign duplication (field copying logic)
- Workspace isolation (queries always include workspace_id)

**ai_campaign.py:**
- Idempotency check (return cached draft if exists)
- Credit reserve/consume/release flow
- Error handling (LLM timeout, insufficient credits)

### Integration Tests

**AI draft flow:**
- Valid prompt → draft created, credits consumed
- Duplicate idempotency_key → cached draft returned, no double charge
- Insufficient credits → 402, no draft created
- LLM timeout → credits released, draft status = failed

**Campaign CRUD:**
- Create manual campaign → ai_generated = false, 0 credits
- Update campaign status → valid transitions succeed, invalid fail
- Delete active campaign → 400 error
- Duplicate campaign → new draft created with copied fields

### EDD Tests (ai-service)

**Golden dataset:**
- 10 sample prompts with expected campaign structure
- Validate generated JSON schema (name, description, target_audience, goals, sequence_outline)
- Validate Brain context injection (ICP fields match Brain profile)

**LLM-as-judge:**
- Relevance: Does generated campaign match user goal?
- Completeness: Are all required fields populated?
- SEA market fit: Does target_audience reflect SEA context?

---

## Integration Points

| From | To | Method | Auth |
|---|---|---|---|
| campaign-service | billing-service | `POST /billing/credits/reserve` | Workload Identity OIDC |
| campaign-service | billing-service | `POST /billing/credits/consume` | Workload Identity OIDC |
| campaign-service | billing-service | `POST /billing/credits/release` | Workload Identity OIDC |
| campaign-service | ai-service | `POST /ai/campaign-draft` | Workload Identity OIDC |
| ai-service | Supabase (pgvector) | AsyncSession | Service account |
| api-gateway | campaign-service | HTTP (internal) | Workload Identity |

---

## Environment Variables

```env
# campaign-service
BILLING_SERVICE_URL=http://billing-service.internal
AI_SERVICE_URL=http://ai-service.internal
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
AI_DRAFT_RATE_LIMIT_PER_HOUR=10
AI_DRAFT_CREDITS_COST=5
AI_DRAFT_MAX_PROMPT_LENGTH=2000
```

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| AI draft latency | p95 < 10s, p99 < 15s |
| Manual create latency | p95 < 300ms |
| Credit deduction atomicity | Deducted before LLM call, no refund on LLM error (budget-based) |
| Draft storage | All AI prompts/responses stored for audit |
| Scale | 100 workspaces × 1000 campaigns/workspace |

---

## Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| AI campaign adoption rate | ≥ 60% of campaigns use AI draft |
| AI draft → publish rate | ≥ 40% |
| AI latency p95 | < 10s |
| Credit error rate | < 0.1% |
| User edits per AI draft | ≤ 3 fields changed (product quality signal) |

---

## Out of Scope

The following are explicitly **not** included in this implementation:

1. **Sequence step execution** — Spec 06 (separate implementation)
2. **Email sending / deliverability** — Spec 07 (separate implementation)
3. **Multichannel steps (LinkedIn, SMS)** — Spec 10 (separate implementation)
4. **Campaign analytics** — Spec 09 (separate implementation)
5. **Campaign templates marketplace** — Future feature
6. **Conversation history / iterate-via-chat** — Deferred to P1 (US-05-06)

---

## Implementation Phases

### Phase 1 — Campaign CRUD Foundation (backend)
- Alembic migration: `campaigns`, `campaign_ai_drafts`, outbox entries
- SQLAlchemy models for both tables
- Campaign CRUD endpoints (manual create/read/list/patch/delete with archive guard)
- Status transition state machine
- `campaign.created` + `campaign.status_changed` outbox events

### Phase 2 — AI Draft Pipeline
- `billing-service` HTTP client with `reserve / consume / release` methods
- `ai-service` HTTP client for `generate_campaign_draft`
- Credit reserve model implementation
- Idempotency check before reserve
- Rate limiting integration (Redis sliding window via api-gateway)
- EDD test suite wired up

### Phase 3 — Campaign Duplication
- `POST /campaigns/{id}/duplicate` endpoint
- Copy all fields except: id, status (→ draft), ai_generated (→ false), name (→ "Copy of …"), created_at/updated_at

### Phase 4 — Frontend
- Campaign list page (`/campaigns`)
- Campaign create wizard (manual + AI tabs)
- AI draft UI: prompt box → loading skeleton (10s budget) → editable draft card
- Credit cost display before AI confirm
- Status badge + transition menu
- Campaign detail / edit page

---

## File Map

```
services/campaign-service/
  app/
    models/
      campaign.py           # Campaign + CampaignAIDraft SQLAlchemy models
    schemas/
      campaign.py           # CampaignCreate, CampaignUpdate, CampaignResponse Pydantic v2
      ai_draft.py           # AIDraftRequest, AIDraftResponse schemas
    routers/
      campaigns.py          # All campaign endpoints
    services/
      campaign_service.py   # CRUD + status transition logic
      ai_campaign.py        # AI draft pipeline (credit reserve model)
    clients/
      billing_client.py     # HTTP client for billing-service
      ai_client.py          # HTTP client for ai-service
    dependencies.py         # get_workspace_id, require_role
  alembic/versions/
    0005_campaigns.py       # campaigns + campaign_ai_drafts migration

services/ai-service/
  app/
    routers/
      campaign_draft.py     # POST /ai/campaign-draft
    services/
      campaign_draft_service.py  # Brain chunk retrieval + LiteLLM call
    prompts/
      campaign_draft.xml    # Prompt template

frontend/
  app/
    (dashboard)/
      campaigns/
        page.tsx            # Campaign list
        new/
          page.tsx          # Create wizard
        [id]/
          page.tsx          # Campaign detail
  components/
    campaigns/
      CampaignCard.tsx
      AIDraftWizard.tsx
      StatusBadge.tsx
      TargetAudienceEditor.tsx
  lib/
    api/
      campaigns.ts          # Typed API client for campaign endpoints
```

---

## Definition of Done

This AI Campaign Builder implementation is complete when:

1. Campaign CRUD endpoints exist and enforce workspace isolation
2. Status transition state machine validates all transitions
3. AI draft endpoint reserves credits before LLM call, consumes on success, releases on failure
4. Idempotency prevents duplicate charges on retry
5. Brain context (profile + top-5 chunks) injected into AI prompt
6. Campaign duplication creates new draft with copied fields
7. All tests pass with 100% coverage of credit reserve flow and status transitions
8. Frontend wizard supports both manual and AI creation paths
9. AI draft latency p95 < 10s in staging
10. No credit leaks (orphaned reserves) observed in 24-hour staging test
