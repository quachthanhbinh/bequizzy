# 34 — Campaign Content Studio — DESIGN

**Status:** 📝 Draft
**Last updated:** 2026-05-05

## CPO ↔ CTO Debate

### Round 1 — Opening Positions

**CPO (confidence: 8/10):**
Content Studio is the highest-differentiation Phase 2 feature. No competitor (AdCreative.ai, Predis.ai, Canva Magic Studio, Jasper) provides campaign-context-aware generation grounded in the workspace's own AI Brain. Workspace asset library (Q3=B) is a deliberate switching-cost play — once users accumulate branded content in RevLooper, migration to any competitor means rebuilding from scratch.

On async image generation: 5-15s wait is acceptable with a skeleton/progress UX. Users already wait for AI campaign generation (Spec 05). The Starter Pack "wow" moment is critical — first-run experiences with 5 tailored previews drive immediate perceived value.

One concern I'm raising: the Ideogram 2.0 pricing at 5 credits ($0.025) vs $0.08 actual cost is negative margin. We need to fix this in this spec.

**CTO (confidence: 6/10):**
The text generation architecture is sound — LiteLLM router in `ai-service` handles all 5 text types, no new infra needed. Two hard blockers:

**Blocker 1 — Playwright in Cloud Functions.** The user request says "Playwright runs in ai-service Cloud Function" but this is infeasible:
- Playwright + Chromium binary = ~350MB uncompressed. Cloud Functions 2nd gen allows 512MB source ZIP but after decompression the footprint with dependencies can reach 1.5-2GB
- Cold start with headless Chrome = 10-20s additional latency on top of generation time
- Memory: Cloud Functions max 16GB but Chrome is memory-intensive; at concurrent image requests this gets expensive fast

**Resolution:** Playwright must run in a dedicated `image-gen-service` on Cloud Run:
- Cloud Run supports up to 8GB RAM per instance, can set min-instances=1 (always warm)
- Chrome binary bundled in Docker image at build time (no cold-start download)
- Single-purpose service: only handles HTML-to-image and Ideogram proxy calls
- Triggered by Cloud Tasks (async job queue already in RevLooper stack)

**Blocker 2 — Ideogram cost model.** 5 credits = $0.025 (at $5/100 credits pro-rate) vs $0.08 Ideogram 2.0 actual cost = **negative $0.055 margin per image**. At 1,000 AI images/month across workspaces this is a -$55/month loss just on Ideogram. Must be resolved before spec is approved.

**CTO confidence: 6 (scale concern on Playwright architecture; cost concern on Ideogram)**

**Gap: CPO 8 / CTO 6 = gap 2, CTO < 7. → Continue to Round 2.**

---

### Round 2 — Resolution

**CPO responding to CTO:**
- `image-gen-service` as dedicated Cloud Run: agreed. This is the right call. Isolated service, always warm, Chrome bundled in image. Supports independent scaling — burst image generation doesn't affect ai-service text throughput.
- Ideogram pricing: I recommend **20 credits** for AI Image ($0.10 at standard $5/100 credit rate vs $0.08 actual = +$0.02 margin). Ideogram 2.0's text rendering quality is genuinely differentiated for SEA languages — this is the premium tier. Power users who need AI images will pay 20 credits; casual users stick to template-based banners (5 credits). The higher price actually signals quality, which is on-brand.

**CTO responding to CPO:**
- 20 credits for AI Image: accepted. +$0.02/image is thin but positive, and can be reviewed when Ideogram pricing changes.
- Confirming async pattern fits RevLooper's Cloud Tasks usage: ✅ `outreach-service` already uses Cloud Tasks for sequence step dispatch. Same pattern applies here — `image-gen-service` exposes `POST /internal/render` (Cloud Tasks handler), `campaign-service` enqueues the task after writing `generation_status='pending'` to `content_assets`.
- Workspace library (nullable `campaign_id`): schema is clean. Index `(workspace_id, campaign_id, status)` covers both the campaign gallery query (`WHERE workspace_id=X AND campaign_id=Y`) and the library query (`WHERE workspace_id=X AND campaign_id IS NULL`). PostgreSQL NULLS are indexed by default in btree — null-first queries work.
- Starter Pack batch credit deduction: single `POST /billing/deduct { amount: 8 }` call before ANY generation starts. If deduction fails (insufficient credits), no generation happens. Write `outbox_events` row atomically with the 5 `content_assets` rows (all in one transaction).
- Sync text generation: confirmed SSE streaming response from `ai-service`. Client streams tokens as they arrive, no polling needed.
- Image generation status polling: `GET /campaigns/{id}/assets/{asset_id}` returns `generation_status`. Frontend polls every 3s. Alternatively, `campaign-service` writes a Supabase Realtime-compatible update — frontend can subscribe to `content_assets` table changes filtered by `workspace_id`.

**Round 2 conclusion: CPO 8 / CTO 8. Gap = 0. Both ≥ 7. CONVERGED.**

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  Content Studio page  →  useContentStudio hook              │
│  Asset Gallery  →  asset card grid  →  version history panel│
└───────────────────┬──────────────────────────────┬──────────┘
                    │ REST                          │ Supabase Realtime
                    ▼                               ▼
┌─────────────────────────┐          ┌───────────────────────────┐
│     api-gateway          │          │  content_assets table      │
│  X-Workspace-ID header   │          │  generation_status updates │
└──────────┬──────────────┘          └───────────────────────────┘
           │
    ┌──────┴────────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
┌─────────────────────────┐          ┌─────────────────────────────┐
│   campaign-service       │          │        ai-service            │
│  • content_assets CRUD   │          │  • Text generation (LiteLLM) │
│  • version history       │          │  • RAG context retrieval     │
│  • Starter Pack trigger  │          │  • SSE streaming response    │
│  • Cloud Tasks enqueue   │          └─────────────────────────────┘
└──────────┬───────────────┘
           │ Cloud Tasks (async)
           ▼
┌─────────────────────────────────────────────────────┐
│              image-gen-service (NEW)                 │
│  • Playwright headless Chrome (bundled in image)     │
│  • Jinja2 HTML template rendering                    │
│  • WeasyPrint PDF renderer (brochure generation)     │
│  • Ideogram 2.0 API proxy                            │
│  • PNG → Cloudflare R2 upload                        │
│  • Updates content_assets.generation_status via      │
│    campaign-service internal API                     │
│  min-instances=1 (always warm), Cloud Run            │
└──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Cloudflare R2      │    │   billing-service    │
│  /{workspace_id}/    │    │  Credit deduction    │
│  content/{asset_id}  │    │  (BEFORE generation) │
└─────────────────────┘    └─────────────────────┘
```

## Data Model

```sql
-- Owned by: campaign-service
CREATE TABLE content_assets (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID    NOT NULL,
  campaign_id       UUID,                           -- NULL = workspace library asset
  name              TEXT    NOT NULL,
  asset_type        TEXT    NOT NULL,               -- ad_copy | social_post | broadcast | newsletter | sms | banner | infographic | ai_image | email_template | brochure
  channel           TEXT,                           -- facebook | zalo | whatsapp | linkedin | tiktok | email | general
  language          TEXT    NOT NULL DEFAULT 'en',  -- en | vi | th
  status            TEXT    NOT NULL DEFAULT 'draft', -- draft | ready | archived
  generation_status TEXT    NOT NULL DEFAULT 'ready',  -- ready | pending | processing | failed (only for image types)
  content_text      TEXT,                           -- for text asset types
  file_url          TEXT,                           -- R2 presigned URL (rotated) or permanent path
  file_type         TEXT,                           -- image/png | image/jpeg | application/pdf
  template_id       TEXT,                           -- e.g. 'recruitment-card'
  image_size        TEXT,                           -- '1080x1080' | '1200x628' | '1080x1920'
  generation_prompt TEXT,                           -- user-provided prompt (for AI image)
  generation_model  TEXT,                           -- model used: gpt-4o-mini | claude-3-5-sonnet | ideogram-2.0 | weasypaint
  rag_context_ids   TEXT[],                         -- AI Brain chunk IDs used in generation
  metadata          JSONB   DEFAULT '{}',           -- template vars, Ideogram params, brochure sections, email template regions, etc.
  -- email_template-specific (stored in metadata.regions): brand_color, logo_url, header_text, footer_text
  -- brochure-specific (stored in metadata.sections): cover_headline, cover_subheadline, intro_text, benefits[], pricing_text, cta_text, contact_info
  version           INT     NOT NULL DEFAULT 1,
  created_by        UUID    NOT NULL,               -- user ID (soft FK to auth users)
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Compound indexes for gallery queries
CREATE INDEX idx_content_assets_campaign
  ON content_assets (workspace_id, campaign_id, status);

CREATE INDEX idx_content_assets_library
  ON content_assets (workspace_id, status)
  WHERE campaign_id IS NULL;

CREATE INDEX idx_content_assets_pending_generation
  ON content_assets (workspace_id, generation_status)
  WHERE generation_status IN ('pending', 'processing');

-- Owned by: campaign-service
CREATE TABLE content_asset_versions (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID    NOT NULL,                   -- soft FK → content_assets.id
  workspace_id  UUID    NOT NULL,
  version       INT     NOT NULL,
  content_text  TEXT,
  file_url      TEXT,
  metadata      JSONB   DEFAULT '{}',
  created_by    UUID    NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_asset_versions_asset
  ON content_asset_versions (asset_id, version DESC);

-- campaigns table additions (owned by campaign-service)
-- ALTER TABLE campaigns
--   ADD COLUMN default_email_template_id UUID,     -- soft FK → content_assets.id (email_template type)
--   ADD COLUMN starter_pack_status TEXT DEFAULT 'none'; -- none | generating | completed | failed
```

## Outbox Events

All events written to `outbox_events` atomically with the data write in `campaign-service`.

| Event | Trigger | Payload |
|---|---|---|
| `content_asset.created` | Asset saved (draft or ready) | `{ workspace_id, campaign_id, asset_id, asset_type, generation_method }` |
| `content_asset.generation_completed` | Image gen job finished | `{ workspace_id, asset_id, file_url, generation_model }` |
| `content_asset.generation_failed` | Image gen job failed | `{ workspace_id, asset_id, error_code, credits_refunded: true }` |
| `content_starter_pack.completed` | All 5 Starter Pack assets saved | `{ workspace_id, campaign_id, asset_ids[], credits_deducted: 8 }` |
| `content_asset.brochure_generated` | Brochure PDF ready | `{ workspace_id, asset_id, pdf_url, file_size_bytes }` |
| `content_asset.email_template_set_default` | Campaign default email template changed | `{ workspace_id, campaign_id, asset_id }` |

## API Endpoints

### campaign-service

```
# Asset CRUD
GET    /campaigns/{campaign_id}/assets          # list campaign assets (paginated, cursor)
GET    /campaigns/{campaign_id}/assets/{id}     # get single asset + generation_status
POST   /campaigns/{campaign_id}/assets          # save asset (manual or AI-generated)
PUT    /campaigns/{campaign_id}/assets/{id}     # update content / name / status
DELETE /campaigns/{campaign_id}/assets/{id}     # soft delete (status=archived)

# Workspace library
GET    /workspaces/{workspace_id}/content-library  # all library assets (campaign_id IS NULL), paginated
PUT    /campaigns/{campaign_id}/assets/{id}/promote-to-library  # set campaign_id=NULL

# Versions
GET    /campaigns/{campaign_id}/assets/{id}/versions   # version history
POST   /campaigns/{campaign_id}/assets/{id}/restore/{version}  # restore version

# Starter Pack
POST   /campaigns/{campaign_id}/starter-pack    # trigger Starter Pack generation
GET    /campaigns/{campaign_id}/starter-pack/status  # poll Starter Pack progress

# Email templates
GET    /campaigns/{campaign_id}/email-templates         # list email_template assets for campaign
PUT    /campaigns/{campaign_id}/email-template/default  # set default_email_template_id on campaign

# Brochure
GET    /campaigns/{campaign_id}/assets/{id}/brochure-url  # get public R2 PDF URL
```

### ai-service

```
# Text generation (synchronous, SSE streaming)
POST   /ai/content/generate          # generate text asset
  Body: { workspace_id, campaign_id, asset_type, channel, language, prompt, rag_enabled }
  Response: SSE stream (tokens) + final { asset_type, content_text, model, rag_context_ids }

# Image generation (async — enqueues Cloud Task via campaign-service)
POST   /ai/content/generate-image
  Body: { workspace_id, asset_id, template_id?, image_size, language, template_vars?, generation_prompt? }
  Response: 202 Accepted { job_id, asset_id }
  → campaign-service enqueues Cloud Task for image-gen-service
```

### image-gen-service (internal, Cloud Tasks handler)

```
# HTML-to-image (Playwright)
POST   /internal/render-template
  Body: { asset_id, template_id, image_size, language, template_vars: { headline, subheadline, cta_text, brand_color, ... } }
  Called by: Cloud Tasks (signed OIDC token)

# AI image (Ideogram 2.0 proxy)
POST   /internal/generate-ai-image
  Body: { asset_id, prompt, aspect_ratio, style_type? }
  Called by: Cloud Tasks (signed OIDC token)

# Brochure PDF (WeasyPrint)
POST   /internal/render-brochure
  Body: { asset_id, workspace_id, sections: { cover_headline, cover_subheadline, intro_text, benefits[], pricing_text, cta_text, contact_info }, language }
  Called by: Cloud Tasks (signed OIDC token)
  Output: PDF bytes → R2 upload at /{workspace_id}/content/{asset_id}.pdf (public bucket path)
```

All three internal endpoints follow this pattern:
1. Execute generation (Playwright screenshot, WeasyPrint PDF, or Ideogram API call)
2. Upload result to R2:
   - PNG images: `/{workspace_id}/content/{asset_id}.png` (private presigned URL, 1-hour expiry)
   - PDF brochures: `/{workspace_id}/content/{asset_id}.pdf` (public bucket path — intentionally shareable)
3. PATCH `campaign-service /internal/assets/{asset_id}/generation-complete` with `{ file_url, model, generation_status: 'ready' }`
4. On failure: PATCH with `{ generation_status: 'failed', error_code }` — campaign-service triggers credit refund via billing-service

## Text Generation Prompt Pattern

```python
SYSTEM = """
You are RevLooper's campaign content writer.
Workspace context (AI Brain):
<rag_context>
{rag_chunks}
</rag_context>
Campaign context:
<campaign>
Name: {campaign_name}
Industry: {industry}
Goal: {campaign_goal}
</campaign>
Rules:
- Write in {language} ({language_name})
- Format for {channel} channel
- Maximum length: {max_length} characters
- Tone: {tone}
</s>
"""

USER = """
{user_instruction}
{existing_content_for_rewrite}
"""
```

The `<rag_context>` XML delimiter prevents prompt injection from user content embedded in RAG chunks.

## Frontend Page Structure

```
/campaigns/{id}/content-studio
├── Toolbar: [New Asset ▼] [Re-run Starter Pack] [Filter: type/channel/lang]
├── StarterPackPanel (shown when assets.length === 0 OR user re-runs)
│   └── 5 PreviewCards × { snippet, "Create this", "Tweak" }
└── AssetGallery (grid)
    └── AssetCard × { thumbnail/text preview, type badge, channel badge, status, actions }
        └── AssetDetailDrawer
            ├── ContentEditor (text/HTML) or ImageViewer (image) or PDFViewer (brochure)
            ├── EmailTemplateEditor (Monaco HTML editor + sandboxed iframe preview, only for email_template type)
            ├── BrochureSectionsForm (only for brochure type: named section fields + "Generate PDF" button)
            ├── VersionHistoryPanel
            └── PowerFunctionPicker (14 functions)
```

## Image Generation Async UX

1. User clicks "Generate Banner" → frontend calls `POST /ai/content/generate-image` → 202 Accepted
2. Asset card shows skeleton with spinner and "Generating..." label
3. Frontend subscribes to Supabase Realtime `content_assets` channel, filter `id=asset_id`
4. When `generation_status` changes to `ready`, card updates with thumbnail
5. On `failed`: card shows error with "Retry" button; credits are refunded

## Starter Pack — Credit Transaction Pattern

```python
# campaign-service: starter_pack_service.py
async def run_starter_pack(campaign_id, workspace_id, session):
    # 1. Deduct credits FIRST (atomic, billing-service)
    await billing_service.deduct_credits(workspace_id, amount=8, reason="starter_pack")
    try:
        # 2. Generate 5 assets via ai-service (text only, synchronous)
        assets = await ai_service.generate_starter_pack_assets(campaign_id, workspace_id)
        # 3. Write all 5 assets + outbox event in ONE transaction
        async with session.begin():
            for asset in assets:
                session.add(ContentAsset(**asset))
            session.add(OutboxEvent(
                event_type="content_starter_pack.completed",
                payload={"workspace_id": workspace_id, "campaign_id": campaign_id,
                         "asset_ids": [a["id"] for a in assets], "credits_deducted": 8}
            ))
    except Exception as e:
        # 4. On failure: refund 8 credits
        await billing_service.refund_credits(workspace_id, amount=8, reason="starter_pack_failed")
        raise
```

## Dependency Interfaces

| Dependency | Interface used |
|---|---|
| AI Brain (Spec 02) | `GET /ai/rag/query { workspace_id, query, top_k: 3 }` → `{ chunks: [{ id, text }] }` |
| Billing/Credits (Spec 32) | `POST /billing/deduct { workspace_id, amount, reason }` → `{ success, remaining_credits }` |
| Feature Gates (Spec 33) | `GET /billing/features/content_studio_assets` → `{ allowed, required_plan? }` |
| Campaign context (Spec 05) | `GET /campaigns/{id}` → `{ name, industry, description, sequence_email_bodies[] }` |
| Sequence Builder (Spec 06) | Downstream: `{{brochure_url}}` variable available from this spec (Phase 2). Sequence builder email step body interpolates the variable at send time via `campaign-service GET /campaigns/{id}/assets/{id}/brochure-url`. |
| Multichannel (Spec 10) | Downstream: Zalo broadcast content sourced from Content Studio asset |
