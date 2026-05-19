# 34 — Campaign Content Studio

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (prompt injection, SSTI, XSS via email template HTML editor, R2 access control, credit bypass)
**Priority:** P1
**Phase:** Phase 2 (Revenue Management)
**Parallel Track:** B (AI / Intelligence features)
**Depends on:** 02 (AI Brain — RAG context), 05 (AI Campaign Builder — campaign context), 23 (Feature Flags), 32 (Billing & Credits — credit deduction), 33 (Freemium Feature Gates — plan limits)
**Blocks:** 06 (Sequence Builder — `{{brochure_url}}` variable, Phase 3 only), 10 (Multichannel — Zalo broadcast content)
**Owning services:** `campaign-service` (asset CRUD), `ai-service` (text generation), `image-gen-service` (new — HTML-to-image + Ideogram)

## One-line summary
Campaign-context-aware content generation for **10 asset types** (text + images + email templates + brochures) with workspace asset library, **14 power functions**, and a first-run Starter Pack — all grounded in the workspace AI Brain and gated by plan limits.

## Why it matters
- No competitor offers campaign-aware multi-format generation with SEA channel support (Zalo, Vietnamese/Thai text in images)
- HTML-to-image pipeline with Playwright solves the multilingual text rendering problem that breaks diffusion models (DALL-E, FLUX) for VI/TH text
- Workspace asset library creates switching-cost stickiness — brand assets + content history are workspace-locked
- Starter Pack "wow" moment drives immediate perceived value on campaign creation
- Ideogram 2.0 at 20 credits positions RevLooper as the premium AI image tool for SEA marketers

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, 9 content types, 12 power functions, plan limits, acceptance criteria |
| [DESIGN.md](DESIGN.md) | Architecture, data model, API endpoints, events, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Threat model — prompt injection, SSRF, R2 access, credit bypass |
| [TESTS.md](TESTS.md) | Unit / integration / E2E / EDD test strategy |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Service map, rollout phases, file map |
| [TASKS.md](TASKS.md) | TDD task list (RED-first, ≤15 tasks) |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Debate Summary
Two-round CPO↔CTO debate converged at **8/10 confidence**.

**Round 1 — Key tensions raised:**
- CTO blocked Playwright in Cloud Functions (binary size, cold start) → resolved: dedicated `image-gen-service` Cloud Run, min-instances=1
- Ideogram cost model: 5 credits = negative margin → escalated to Round 2

**Round 2 — Resolutions:**
- AI Image price raised to 20 credits ($0.10 user cost vs $0.08 actual = +$0.02 margin)
- Batch Starter Pack uses single 8-credit atomic deduction (not 5 × 1)
- Text generation = synchronous SSE; Image generation = async Cloud Tasks + Supabase Realtime

## Architecture Decision Record
| Decision | Rationale |
|---|---|
| Dedicated `image-gen-service` (Cloud Run) | Playwright headless Chrome exceeds Cloud Functions size limit; Cloud Run always-warm avoids cold starts |
| Ideogram 2.0 for free-form images | Best-in-class text rendering for SEA languages; 20 credits = positive margin |
| HTML-to-image via Playwright for banners/infographics | Pixel-perfect multilingual text (Noto Sans VI/TH); brand consistency; no diffusion artifacts |
| Nullable `campaign_id` on `content_assets` | Supports workspace library (NULL) and campaign-scoped assets (UUID) with single table |
| Async Cloud Tasks for image generation | 5-30s generation time; cannot block HTTP request; polling + Supabase Realtime for status |
| Single atomic credit deduction for Starter Pack | Prevents partial deduction if one generation fails; billing-service handles all-or-nothing |

## Pointers
- Related specs: 02 (AI Brain RAG), 05 (Campaign Builder), 32 (Billing), 33 (Feature Gates)
- New service: `image-gen-service` (new Cloud Run service, not in current service list)
- Skills used: `spec-driven-development`, `tdd-workflow`
- All 14 power functions defined in PRD §6 must be implemented
- Brochure/PDF (Phase 2, Business+ gate) and Email Template editor (Phase 2, Pro+ gate) are both in scope for this spec
