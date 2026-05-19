# Spec 05 — AI Campaign Builder: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO (product lens):**
> The core UX must be a single prompt box: "What's your goal?" → AI generates a full campaign card the user can edit inline. The iterate-via-chat pattern is critical for SEA users who prefer conversational UX. We should store the conversation history so users can return and refine. Confidence: 6 — I need the AI to be fast AND contextual.

**CTO (technical lens):**
> Storing full conversation history per campaign draft is fine — it's append-only JSONB. The critical constraint is credits-before-LLM: `billing-service` deduct must happen in the same DB transaction as recording the draft intent, before the LLM call. If `ai-service` times out, we've consumed credits but have no draft — we need a retry mechanism with idempotency key. Also: 10s p95 is aggressive for RAG + LLM. Confidence: 5 — scale and latency both concern me.

**Gap: 1. Concerns:** CTO flags credits-on-LLM-timeout edge case; latency target vs RAG overhead.

### Round 2

**CPO:**
> On timeout: show the user "Draft failed, credits not consumed" with a retry button. We can refund 5 credits if the LLM call never completed — use a deferred credit release model (reserve → consume on success, release on failure). SEA users have spotty connections; partial failure recovery is a key UX feature. Confidence: 7.

**CTO:**
> Credit reserve/release is cleaner than refund. Model: `billing-service.reserve(5)` → on LLM success `billing-service.consume()` → on LLM failure `billing-service.release()`. This avoids negative balance edge cases. For latency: pre-fetch Brain chunks in parallel with credit reserve, then LLM call uses cached chunks. Adds ~100ms overhead only. Confidence: 7.

**Gap: 0. Both ≥ 7. Converging.**

### Round 3 (Convergence)

**CPO + CTO joint:**
> Final design: (1) credit reserve model for AI operations, (2) parallel Brain chunk pre-fetch during credit reserve, (3) idempotency key per draft request, (4) conversation history stored as append-only JSONB array in `campaign_ai_drafts`. Campaign entity stays slim — AI draft is a separate table linked by `campaign_id`.

**Final Confidence: 8 / 10**
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

### Table: `outbox_events` (append to existing)

```sql
-- Events emitted by campaign-service:
-- campaign.created     {campaign_id, workspace_id, ai_generated}
-- campaign.status_changed {campaign_id, workspace_id, old_status, new_status}
-- campaign.ai_draft_completed {campaign_id, workspace_id, draft_id}
```

---

## Service Architecture

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

---

## Credit Reserve Model

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
    reserve_id = await billing_client.reserve_credits(workspace_id, credits=5, reason="ai_campaign_draft")

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

---

## Status Transition Matrix

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

---

## Outbox Events

| Event Name | Trigger | Payload |
|---|---|---|
| `campaign.created` | New campaign saved | `{campaign_id, workspace_id, ai_generated, status}` |
| `campaign.status_changed` | Status update | `{campaign_id, workspace_id, old_status, new_status}` |
| `campaign.ai_draft_completed` | AI draft success | `{draft_id, campaign_id, workspace_id}` |
| `campaign.ai_draft_failed` | AI draft failure | `{draft_id, workspace_id, error}` |
