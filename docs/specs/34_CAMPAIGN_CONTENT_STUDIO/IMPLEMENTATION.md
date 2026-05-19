# 34 — Campaign Content Studio — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-05

## New Service: image-gen-service

This spec introduces the **`image-gen-service`** — a new Cloud Run service not in the existing service list. It is the only service allowed to:
- Run Playwright headless Chrome
- Call the Ideogram 2.0 API
- Write to the `/{workspace_id}/content/` R2 prefix

All other image generation requests route through Cloud Tasks to this service.

## Phase Breakdown

### Phase 1 — Content CRUD + Text Generation (Sprint 1–2)
Foundation layer: schema, CRUD, plan limits, text generation.

**campaign-service:**
- Alembic migration: `content_assets` + `content_asset_versions` tables + indexes
- `ContentAsset` SQLAlchemy model + Pydantic schemas
- CRUD routes: `GET/POST/PUT/DELETE /campaigns/{id}/assets`
- Workspace library route: `GET /workspaces/{id}/content-library`
- Version routes: `GET .../versions`, `POST .../restore/{version}`
- Plan limit enforcement via `billing-service` feature gate on every `POST`
- `promote-to-library` endpoint

**ai-service:**
- `POST /ai/content/generate` — text generation with SSE streaming
- Prompt builder with XML delimiter injection protection
- RAG context fetcher (top 3 chunks from AI Brain)
- Credit deduction before generation
- EDD eval dataset skeleton

**Frontend:**
- `ContentStudioPage` (`/campaigns/[id]/content-studio`)
- `useContentStudio` hook (TanStack Query — asset list, create, update)
- `AssetGallery` component + `AssetCard`
- `AssetDetailDrawer` (content editor + version history panel)
- `PowerFunctionPicker` (14 functions — text functions only in Phase 1)
- `FeatureGate` integration: `content_studio_assets` gate on Free plan 6th asset

### Phase 2 — Image Generation (Sprint 3–4)
New service + async pipeline.

**image-gen-service (new Cloud Run service):**
- Dockerfile with Playwright + Chromium + Noto Sans fonts bundled
- `POST /internal/render-template` — Playwright HTML-to-image
- `POST /internal/generate-ai-image` — Ideogram 2.0 proxy
- OIDC token verification middleware
- R2 upload on completion
- `campaign-service` internal PATCH callback on success/failure
- 5 Jinja2 HTML templates (recruitment-card, insurance-promo, travel-deal, generic-announcement, event-invite)
- SandboxedEnvironment for all template rendering

**campaign-service additions:**
- `POST /campaigns/{id}/assets/generate-image` — enqueues Cloud Task
- Internal `PATCH /internal/assets/{id}/generation-complete` endpoint
- Credit refund trigger on `generation_status='failed'`
- Outbox events: `content_asset.generation_completed`, `content_asset.generation_failed`

**ai-service additions:**
- `POST /ai/content/generate-image` — validates, deducts 5 or 20 credits, enqueues via campaign-service

**Frontend additions:**
- Async image generation UX: skeleton → Supabase Realtime subscribe → thumbnail on ready
- `ImageGenerationPanel` (template picker + size selector + template var form)
- `AIImagePanel` (prompt input + Ideogram generation)
- `FeatureGate` integration: `content_studio_images` gate for Free plan

### Phase 3 — Starter Pack (Sprint 5)
First-run experience.

**campaign-service:**
- `POST /campaigns/{id}/starter-pack` with idempotency key
- `GET /campaigns/{id}/starter-pack/status`
- Starter pack status field on campaigns table (`starter_pack_status`)
- Atomic credit deduction (8 credits) + 5-asset transaction

**ai-service:**
- `POST /ai/content/starter-pack-generate` — generates 5 preview snippets from campaign context
- Starter Pack context assembly (campaign + sequence emails + RAG chunks)

**Frontend:**
- `StarterPackPanel` component
- First-visit detection (assets.length === 0 on first render)
- "Re-run Starter Pack" toolbar button (always available, never auto-triggers)
- Per-card "Create this" and "Tweak" interactions

### Phase 4 — Email Template Editor + Brochure PDF (Sprint 6–7)
High-value async content formats.

**ai-service:**
- `POST /ai/content/generate` extended: new `asset_type=email_template` path (3 credits, RAG-grounded, HTML output)
- `email_template_builder.py` — assembles brand context (brand_color, logo, tone) from AI Brain; generates full HTML shell; runs `sanitize_email_template_html()` before return

**campaign-service:**
- `PUT /campaigns/{id}/email-template/default` — sets `default_email_template_id` on campaigns table
- `GET /campaigns/{id}/assets/{id}/brochure-url` — returns public R2 PDF URL
- Alembic migration: `campaigns.default_email_template_id` + `campaigns.starter_pack_status`
- Cloud Tasks enqueue for brochure generation (same pattern as banner generation)

**image-gen-service:**
- `POST /internal/render-brochure` — WeasyPrint PDF rendering
- `weasypaint_renderer.py` + `brochure_a4.html.j2` template
- R2 upload to public bucket path `/{workspace_id}/content/{asset_id}.pdf`

**Frontend:**
- `EmailTemplateEditor.tsx` — Monaco HTML editor + sandboxed `<iframe>` preview
- `BrochureSectionsForm.tsx` — named section fields + "Generate PDF" + "Download PDF" buttons
- `PDFViewer.tsx` — embed PDF via `<iframe>` or `<embed>` pointing to public R2 URL
- `FeatureGate` integrations: `content_studio_email_templates` (Pro+), `content_studio_brochure` (Business+)

## File Map

```
services/
  campaign-service/
    app/
      models/
        content_asset.py          # SQLAlchemy model
        content_asset_version.py
      schemas/
        content_asset.py          # Pydantic request/response schemas
      routers/
        content_assets.py         # GET/POST/PUT/DELETE /campaigns/{id}/assets
        content_library.py        # GET /workspaces/{id}/content-library
        starter_pack.py           # POST/GET /campaigns/{id}/starter-pack
      services/
        content_asset_service.py  # Business logic: create, update, promote, version
        starter_pack_service.py   # Starter Pack trigger, credit deduction, rollback
        image_gen_tasks.py        # Cloud Tasks enqueueing for image generation
    alembic/versions/
      XXXX_add_content_assets.py  # Migration

  ai-service/
    app/
      routers/
        content_generation.py     # POST /ai/content/generate (SSE)
        image_generation.py       # POST /ai/content/generate-image
        starter_pack.py           # POST /ai/content/starter-pack-generate
      services/
        content_gen_service.py    # LiteLLM call, prompt builder, RAG fetch
        prompt_builder.py         # XML delimiter injection protection
        rag_fetcher.py            # AI Brain RAG context retrieval
        email_template_builder.py # AI Brain-grounded HTML email template gen + bleach sanitiser
      evals/
        content_generation/
          golden/                 # 20+ golden examples per content type
          test_content_quality.py # EDD eval runner

  image-gen-service/              # NEW Cloud Run service
    Dockerfile                    # Playwright + Chromium + Noto Sans fonts
    app/
      main.py                     # FastAPI app
      routers/
        render_template.py        # POST /internal/render-template
        ai_image.py               # POST /internal/generate-ai-image
        render_brochure.py        # POST /internal/render-brochure (WeasyPrint)
      services/
        playwright_renderer.py    # Playwright HTML-to-image
        weasypaint_renderer.py    # WeasyPrint HTML-to-PDF renderer
        ideogram_client.py        # Ideogram 2.0 API client
        r2_uploader.py            # Cloudflare R2 upload
        callback_client.py        # PATCH campaign-service on completion
      templates/
        recruitment-card/
          template.html.j2
          assets/                 # bundled images, fonts
        insurance-promo/
          template.html.j2
          assets/
        travel-deal/
          template.html.j2
          assets/
        generic-announcement/
          template.html.j2
          assets/
        event-invite/
          template.html.j2
          assets/
        brochure/
          brochure_a4.html.j2     # WeasyPrint A4 brochure template
          assets/                 # bundled images, fonts (Noto Sans for VI/TH)
      middleware/
        oidc_auth.py              # Verify Cloud Tasks OIDC token

frontend/
  app/
    (dashboard)/
      campaigns/
        [id]/
          content-studio/
            page.tsx              # ContentStudioPage
            layout.tsx
  components/
    content-studio/
      AssetGallery.tsx
      AssetCard.tsx
      AssetDetailDrawer.tsx
      ImageViewer.tsx
      PDFViewer.tsx              # <iframe>/<embed> wrapper for brochure public URL
      ContentEditor.tsx          # Rich text editor for text assets
      EmailTemplateEditor.tsx    # Monaco HTML editor + sandboxed iframe preview
      BrochureSectionsForm.tsx   # Named section fields + Generate PDF + Download buttons
      VersionHistoryPanel.tsx
      PowerFunctionPicker.tsx
      ImageGenerationPanel.tsx
      AIImagePanel.tsx
      StarterPackPanel.tsx
      PreviewCard.tsx             # Individual Starter Pack preview card
  hooks/
    useContentStudio.ts           # TanStack Query: assets, create, update, generate
    useAssetGeneration.ts         # Polling + Supabase Realtime for image status
    useStarterPack.ts             # Starter Pack trigger + status
  lib/
    api/
      contentAssets.ts            # Typed API client for campaign-service content endpoints
      contentGeneration.ts        # Typed API client for ai-service generation endpoints
```

## GCP Infrastructure

```yaml
# image-gen-service Cloud Run config
service: image-gen-service
region: asia-southeast1
min-instances: 1        # always warm (Playwright cold start = 10-20s)
max-instances: 10
memory: 4Gi             # Playwright + Chrome
cpu: 2
ingress: internal       # Cloud Tasks only, no public access
service-account: image-gen-service-sa@...
```

## Cloud Tasks Queue

```yaml
queue: content-image-generation
location: asia-southeast1
rate-limits:
  max-dispatches-per-second: 20   # Playwright concurrency limit
  max-concurrent-dispatches: 10
retry-config:
  max-attempts: 3
  min-backoff: 10s
  max-backoff: 120s
```

## Secrets (GCP Secret Manager)

| Secret | Used by |
|---|---|
| `ideogram-api-key` | image-gen-service |
| `r2-access-key-id` | image-gen-service, campaign-service |
| `r2-secret-access-key` | image-gen-service, campaign-service |
| `r2-bucket-name` | image-gen-service, campaign-service |
| `internal-service-key` | image-gen-service (PATCH callback auth) |

## Feature Flags

| Flag | Service | Purpose |
|---|---|---|
| `content_studio_enabled` | campaign-service, frontend | Kill switch for entire feature |
| `starter_pack_enabled` | campaign-service, frontend | Kill switch for Starter Pack only |
| `ideogram_enabled` | image-gen-service | Toggle Ideogram (e.g. for cost control) |
| `content_studio_images` | billing-service | Plan gate: Pro+ for banner/infographic/AI image |
| `content_studio_assets` | billing-service | Plan gate: asset count limits |
| `content_studio_email_templates` | billing-service | Plan gate: Pro+ for email template creation |
| `content_studio_brochure` | billing-service | Plan gate: Business+ for PDF brochure generation |

## Rollout Plan

| Stage | What | When |
|---|---|---|
| 1 | Schema migration (no UI) + CRUD API behind flag | Sprint 1 |
| 2 | Text generation + basic gallery UI | Sprint 2 |
| 3 | image-gen-service deployed (internal only) + banner generation | Sprint 3–4 |
| 4 | Ideogram AI Image (gated behind flag, Pro+ only) | Sprint 4 |
| 5 | Starter Pack first-run experience | Sprint 5 |
| 6 | 10% of new campaigns see Starter Pack | Sprint 5 (A/B) |
| 7 | Full rollout | Sprint 6 |

## Risks

| Risk | Mitigation |
|---|---|
| Playwright memory leak under concurrent requests | Set max-concurrent-dispatches=10 on Cloud Tasks queue; restart image-gen-service after 1000 renders (Cloud Run --max-requests-per-instance) |
| Ideogram API rate limits (100 req/min free tier) | Track usage in Memorystore; queue requests; show "generation queued" UX if rate-limited |
| R2 storage costs at scale | Set R2 lifecycle rule: archive assets where `status=archived` AND `updated_at < 90 days ago` |
| HTML templates become stale as brand requirements change | Template versioning in container: `TEMPLATE_VERSION` env var; new templates deployed as new container release |
| Noto Sans font coverage for VI/TH edge cases | Test with edge-case Vietnamese characters (ắ, ề, ổ, ự) and Thai script in CI render tests |
| WeasyPrint system library dependencies | WeasyPrint requires `pango`, `cairo`, `fontconfig`, `libffi` — all must be installed in the `image-gen-service` Dockerfile via `apt-get install weasyprint` system deps. Test PDF generation in Docker CI (not just local dev). |
