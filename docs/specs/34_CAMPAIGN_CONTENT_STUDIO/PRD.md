# 34 — Campaign Content Studio — PRD

**Status:** 📝 Draft
**Last updated:** 2026-05-05

## 1. Problem Statement

RevLooper users create campaigns but have no in-platform way to produce the content that goes into those campaigns. They leave to Canva, ChatGPT, or Jasper — losing campaign context, brand tone, and AI Brain knowledge in the process. The result: misaligned content, wasted time, and no learning loop between what the AI knows about a workspace and what gets published.

**The gap no competitor fills:** Campaign-context-aware generation + multi-format (text + images) + SEA channel optimization (Zalo, Vietnamese/Thai text in images) + AI Brain grounding — in one place.

## 2. Goals

1. Let users generate all campaign content (copy, social posts, banners, images) without leaving RevLooper
2. Ground every generation in the workspace AI Brain (RAG) for brand consistency
3. Support SEA channels natively: Zalo broadcast format, VI/TH language in generated images
4. Create workspace-level stickiness via a shared asset library
5. Deliver a "wow" first-run Starter Pack that immediately demonstrates value on new campaigns

## 3. Non-Goals (this spec)
- Publishing directly to social media accounts (Phase 3)
- Video generation
- Custom font upload (use Google Fonts Noto Sans for VI/TH)
- Multi-user collaborative editing within a single asset
- Full drag-and-drop email design builder (Mailchimp-style) — AI generates the HTML; user edits raw HTML or named fields

## 4. Content Types

| # | Type | Format | Channel | Generation Method |
|---|---|---|---|---|
| 1 | Ad Copy | Plain text (headline + body + CTA) | Facebook, Google, Zalo | LLM |
| 2 | Social Post | Text + hashtags (≤2200 chars) | Facebook, LinkedIn, Zalo, TikTok | LLM |
| 3 | Broadcast Message | ≤1000 chars | Zalo, WhatsApp | LLM |
| 4 | Email Newsletter | Rich text / HTML | Email | LLM |
| 5 | SMS Template | ≤160 chars | SMS | LLM |
| 6 | Banner / Social Card | PNG image (1080×1080, 1200×628, 1080×1920) | Facebook, LinkedIn, Display | HTML template → Playwright → R2 |
| 7 | Infographic | PNG image with text layout | Email, Social | HTML template → Playwright → R2 |
| 8 | AI-generated Image | Free-form PNG | Any | Ideogram 2.0 API |
| 9 | Email Template | Reusable HTML email layout (header/logo/footer/brand shell) | Email | LLM (HTML gen) + inline HTML editor |
| 10 | Brochure / Flyer | PDF (A4) — multi-section promotional document | Email attachment, download link | HTML → WeasyPrint PDF → R2 |

## 5. First-Run Starter Pack

### Trigger
Shown automatically when a campaign has 0 content assets. Re-runnable from the Content Studio toolbar ("Re-run Starter Pack").

### AI Input
The AI analyzes:
- Campaign name, industry, description
- First 2 sequence email bodies (if exist)
- Top 3 AI Brain RAG chunks for this workspace

### Output: 5 Preview Cards
| # | Card | Credits to save |
|---|---|---|
| 1 | Ad Headline × 3 | 1 credit |
| 2 | Ad Headline × 3 (variation) | 1 credit |
| 3 | Ad Headline × 3 (variation) | 1 credit |
| 4 | Facebook / Zalo Social Post | 1 credit |
| 5 | Email Newsletter Intro | 2 credits |

Total for "Generate all & save": **8 credits** (single atomic deduction).

### UX Rules (Q4 — Previews only, never auto-save)
- Each card shows a content snippet with "Create this" (saves as draft, deducts 1–2 credits) and "Tweak" (regenerate with instruction, deducts 1 credit)
- "Generate all & save" button saves all 5 as drafts with a single 8-credit deduction
- Starter Pack is NEVER auto-triggered on every visit — only on first visit (0 assets state) and when user explicitly clicks "Re-run Starter Pack"

## 6. 12 Power Functions

| # | Function | Description | Credits |
|---|---|---|---|
| 1 | Write Ad Copy | 3 variants (attention, benefit, urgency angles) | 1 |
| 2 | Social Post | Platform-aware format + hashtag suggestions | 1 |
| 3 | Broadcast Message | Zalo / WhatsApp optimized, ≤1000 chars | 1 |
| 4 | Email Newsletter | Full newsletter with sections (intro, body, CTA) | 2 |
| 5 | Adapt for Channel | Reformat existing text asset for a different channel | 1 |
| 6 | Translate | EN ↔ VI ↔ TH (auto-detect source) | 1 |
| 7 | A/B Variants | 2 distinct angle rewrites of existing content | 1 |
| 8 | Generate Banner | HTML template → Playwright PNG (5 templates) | 5 |
| 9 | Create Infographic | HTML template → Playwright PNG | 5 |
| 10 | AI-generated Image | Ideogram 2.0 free-form image | 20 |
| 11 | Improve This | Rewrite existing asset (tone/clarity/length) | 1 |
| 12 | ICP Personalize | Generate segment-specific version for a lead segment | 1 |
| 13 | Build Brochure | AI fills all sections → rendered as PDF | 8 |
| 14 | Create Email Template | AI generates full HTML email shell (header, brand colors, content placeholder, footer, unsubscribe) | 3 |

## 7. HTML Image Templates (Q5 — 5 minimal in-house)

| # | Template ID | Use Case | Sizes |
|---|---|---|---|
| 1 | `recruitment-card` | Hiring announcement | 1080×1080 |
| 2 | `insurance-promo` | Insurance / financial product | 1080×1080, 1200×628 |
| 3 | `travel-deal` | Travel promotion | 1080×1080, 1080×1920 |
| 4 | `generic-announcement` | Any product launch / announcement | 1080×1080, 1200×628 |
| 5 | `event-invite` | Webinar / event invitation | 1080×1080, 1200×628 |

Templates use:
- Jinja2 for variable interpolation (`{{ headline }}`, `{{ subheadline }}`, `{{ cta_text }}`, `{{ brand_color }}`)
- Google Fonts Noto Sans for VI/TH/EN multilingual text
- Tailwind CSS or inline styles (no external CDN in rendering — bundled assets only)

## 8. Workspace Asset Library (Q3 — Workspace-scoped)

- Assets with `campaign_id = NULL` belong to the workspace library (accessible to any campaign)
- Assets with `campaign_id = UUID` are scoped to that campaign but also appear in the workspace library with a campaign label
- Library gallery: filterable by `asset_type`, `channel`, `language`, `status`
- Assets can be "promoted to library" from a campaign (sets `campaign_id = NULL`)

## 9. Plan Limits

| Plan | Max assets | Text gen | Email Template | Banner / Infographic | AI Image (Ideogram) | Brochure PDF |
|---|---|---|---|---|---|---|
| Free | 5 | ✅ (5 total) | ❌ | ❌ | ❌ | ❌ |
| Pro | 50 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Business | 500 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agency | Unlimited | ✅ | ✅ | ✅ | ✅ | ✅ |

Gates enforced via `billing-service` feature gate API (Spec 33). Server-side enforcement + client-side GateWall component.

## 10. Acceptance Criteria

### AC-01 — Text generation
- [ ] All 5 text content types generate via `POST /ai/content/generate`
- [ ] Each call deducts the correct credit amount BEFORE generation
- [ ] Generation is grounded in top 3 RAG chunks from AI Brain (if workspace has AI Brain data)
- [ ] Language parameter respected: `en`, `vi`, `th` produce content in the correct language

### AC-02 — Banner / Infographic generation
- [ ] All 5 HTML templates render correctly for all supported sizes
- [ ] Generated PNG stored in R2 with path `/{workspace_id}/content/{asset_id}.png`
- [ ] Presigned R2 URL returned to frontend (1-hour expiry)
- [ ] Generation is async: `content_assets.generation_status` transitions `pending → processing → ready`
- [ ] Vietnamese and Thai text renders correctly (Noto Sans bundled in template)

### AC-03 — Ideogram AI Image generation
- [ ] `POST /ai/content/generate-image` calls Ideogram 2.0 API
- [ ] 20 credits deducted atomically before API call
- [ ] Image stored in R2, URL returned
- [ ] On Ideogram API error, credits are NOT deducted (deduction is pre-flight, rollback on failure)

### AC-04 — Starter Pack
- [ ] Starter Pack shown on first visit to Content Studio with 0 assets
- [ ] 5 preview cards shown — NOT auto-saved
- [ ] "Create this" saves 1 asset as draft (charges per-item credits)
- [ ] "Generate all & save" deducts exactly 8 credits in one billing-service call, saves 5 drafts
- [ ] Starter Pack NOT re-shown automatically on subsequent visits

### AC-05 — Workspace asset library
- [ ] Assets with `campaign_id = NULL` appear in workspace library
- [ ] Library gallery loads within 1s for up to 500 assets (indexed query)
- [ ] "Promote to library" sets `campaign_id = NULL` and writes a version record
- [ ] Cross-campaign reuse: user can attach library asset to any campaign in the same workspace

### AC-06 — Plan limits
- [ ] Free plan: 6th asset creation blocked with GateWall (feature key: `content_studio_assets`)
- [ ] Free plan: Banner / Infographic / AI Image blocked with GateWall (feature key: `content_studio_images`)
- [ ] Server-side enforcement: API returns 403 with gate metadata for plan-exceeded requests

### AC-07 — Asset versioning
- [ ] Every edit to an asset (re-generation or manual edit) creates a new row in `content_asset_versions`
- [ ] Frontend version history panel shows all versions with timestamps
- [ ] User can restore any previous version

### AC-08 — Multilingual text in images
- [ ] Banner generated with `language=vi` renders Vietnamese text without mojibake
- [ ] Banner generated with `language=th` renders Thai script correctly
- [ ] Noto Sans font is bundled in the image-gen-service container (not fetched at render time)

### AC-09 — Email Template Editor
- [ ] New asset type `email_template` selectable in the Content Studio
- [ ] Template structure: named regions — `brand_color` (hex), `logo_url`, `header_text`, `body_placeholder` (where email body copy is injected), `footer_text`, `unsubscribe_url` (auto-injected at send time)
- [ ] AI generation: user describes their brand (or AI Brain is used) → AI produces full HTML email template respecting the named regions above; costs 3 credits
- [ ] Inline HTML editor: raw HTML editable in a `<textarea>` with syntax highlighting (Monaco editor, read-only when `status=ready`; toggle to edit mode)
- [ ] Preview mode: live-renders the HTML in a sandboxed `<iframe>` (sandbox attribute: `allow-same-origin`; no scripts)
- [ ] Variable substitution preview: user can fill in `{{ headline }}`, `{{ cta_text }}`, `{{ cta_url }}` test values and see rendered result
- [ ] Template can be set as the **default email layout** for a campaign (stored as `campaign.default_email_template_id`)
- [ ] When a template is set as default, the sequence builder's email step editor wraps the step body in the template shell
- [ ] Template is reusable across campaigns via the workspace library (promote-to-library works for `email_template` type)
- [ ] Plan gate: Free plan cannot create email templates (feature key: `content_studio_email_templates`) — GateWall shown
- [ ] Max 1 default email template per campaign (overwriting the previous default is allowed)

### AC-10 — Brochure PDF Generation
- [ ] New asset type `brochure` selectable in the Content Studio
- [ ] Brochure has named sections stored in `metadata.sections` JSONB: `cover_headline`, `cover_subheadline`, `intro_text`, `benefits` (array of 3 strings), `pricing_text`, `cta_text`, `contact_info`
- [ ] AI generation (power function "Build Brochure"): AI fills all sections from campaign context + AI Brain; user reviews + edits each section before generating; costs 8 credits
- [ ] Manual creation: user fills sections directly without AI; no credit charge
- [ ] Rendering: `image-gen-service` receives filled section data → Jinja2 HTML template → WeasyPrint → PDF bytes → R2 upload
- [ ] R2 path: `/{workspace_id}/content/{asset_id}.pdf`
- [ ] Public shareable URL generated (R2 public bucket path, no auth required — brochures are intended to be shared)
- [ ] Variable `{{brochure_url}}` is available in sequence builder email step body (auto-resolves to the public R2 URL)
- [ ] Brochure generation is async (same Cloud Tasks pattern as image generation)
- [ ] Regenerate: if user edits sections, they can re-generate the PDF; new version stored; old URL remains valid until explicitly deleted
- [ ] Plan gate: Business+ only (feature key: `content_studio_brochure`) — GateWall shown to Free and Pro users
