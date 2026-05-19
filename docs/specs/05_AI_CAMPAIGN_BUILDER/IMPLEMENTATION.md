# Spec 05 — AI Campaign Builder: IMPLEMENTATION

## Phases

### Phase 1 — Campaign CRUD Foundation (backend)
- Alembic migration: `campaigns`, `campaign_ai_drafts`, outbox entries
- SQLAlchemy models for both tables
- Campaign CRUD endpoints (manual create/read/list/patch/delete with archive guard)
- Status transition state machine
- `campaign.created` + `campaign.status_changed` outbox events

### Phase 2 — AI Draft Pipeline
- `billing-service` HTTP client with `reserve / consume / release` methods
- `ai-service` HTTP client for `generate_campaign_draft`
- Credit reserve model implementation (see DESIGN.md code stub)
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

## Integration Points

| From | To | Method | Auth |
|---|---|---|---|
| campaign-service | billing-service | HTTP POST `/billing/credits/reserve` | Workload Identity OIDC |
| campaign-service | billing-service | HTTP POST `/billing/credits/consume` | Workload Identity OIDC |
| campaign-service | billing-service | HTTP POST `/billing/credits/release` | Workload Identity OIDC |
| campaign-service | ai-service | HTTP POST `/ai/campaign-draft` | Workload Identity OIDC |
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
