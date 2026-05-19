# 40 — AI Employee Platform — RESULT

**Status:** ✅ Approved 2026-05-18. Pending implementation. Fill in outcomes after Phase 1 ships.

## Launch Date
TBD (post Phase 0 + 1 completion)

## Platform-Readiness Metrics (v1 — no vertical agents)

v1 does not ship any vertical agents, so business-outcome metrics (conversion, retention, etc.) are deferred to the first child spec (Spec 41). v1 measures platform readiness:

| Metric (target) | Actual | Notes |
|---|---|---|
| Migration round-trip green | — | — |
| All 18 Phase 1 tasks merged | — | — |
| Coverage gate per TESTS.md met | — | — |
| Internal dogfood: rent → model-switch → SOP → run (reserve/settle) → approval → cancel → grace finaliser run end-to-end ≥ 1× | — | Validates the full happy path with the internal dev-only agent |
| `ai_models` seeded with ≥ 4 active models with current rates | — | — |
| Marketplace empty-state E2E green (Coming Soon UX) | — | — |
| Zero `publish_public` runs in v1 | — | No such tools exist yet; assertion via metric |
| Per-run settlement matches actual LLM cost within ±1 credit | — | Tested in test_billing_split |

## Open Questions Resolution Log (2026-05-18)

All 8 PRD open questions were resolved by the user in a single decision pass on 2026-05-18.

| # | Question (summary) | User Answer (verbatim, lightly normalised) | Spec interpretation |
|---|---|---|---|
| Q1 | Build platform-only first, or platform + 1 vertical (Content Writer) together? | "yes follow your recommend" + Q3 clarification | Platform-only in v1. Defer ALL vertical agents (Ads + Content Writer + Competitor Monitor + everything else) to follow-up specs 41+. Catalog API returns empty list with `meta.coming_soon=true`. |
| Q2 | How is rental fee billed: bundled with credits, or split out as a separate Paddle SKU? | "I think separate, for leased the model by subscription monthly, will pay first then use, if cancel will cancel next month and this y only the AI, not include the token fee, if user choose to use the GPT 5 for specific AI then code separately, allow user can choose AI model for each AI agents and we count the cost of token spend" | Two-stream billing: (1) flat prepaid monthly Paddle subscription per rental for the agent license (no refund on cancel; access until `paddle_period_end_at`); (2) per-token LLM cost billed from workspace credits via reserve-then-settle, charged at the per-model rate × 1.30 margin. User picks the LLM model per rental from `catalog.allowed_model_ids[]`. New `ai_models` reference table in billing-service. |
| Q3 | Should Ads agent be deferred behind Content Writer (lower blast radius first)? | "I think need to focus to build foundation for multi agents work together first, for each AI agent can build later" | Stronger than asked: defer ALL vertical agents, not just Ads. Platform foundation ships alone in v1. |
| Q4 | Eval threshold for auto-pause? | (not directly answered; deferred) | Deferred to first child spec (Spec 41) — no agents in v1 means no eval gate to tune. |
| Q5 | Should `publish_public` tools ALWAYS require approval, even after the dry-run period? | "yes" | AC-7a: `publish_public` tools always require approval during dry-run + first 30 days of rental. Non-overridable in v1. (Whether to allow override after 30 days is deferred to the first `publish_public` child spec.) |
| Q6 | What disclosure text should agents post on public content? Workspace-configurable or hardcoded? | "I think should have a textbox to config this message" | Workspace-configurable per AC-14b. New `ai_employee_workspace_settings` table; `ai_disclosure_template` TEXT NOT NULL DEFAULT `[Posted by AI on behalf of {workspace_name}]`; 1–280 chars; supports `{workspace_name}` and `{agent_name}` interpolation. Rent of a `publish_public` agent rejected if template is blank (422 `DISCLOSURE_TEMPLATE_REQUIRED`). |
| Q7 | Per-agent caps default values? | (not directly answered; deferred) | Defaults proposed in DESIGN; tunable by user; revisited per child spec. |
| Q8 | Cancellation behaviour: immediate stop, pro-rated refund, or end-of-period? | "7-day grace, but all the current job is stop/pause, not run anymore" | Lifecycle: `active → cancelling → cancelled` with grace period = `min(paddle_period_end_at, now() + 7 days)`. On `POST /cancel`: queued runs paused immediately; in-flight runs allowed to finish current graph step then stop; pending approvals remain valid during grace and auto-reject at finaliser. Hourly sweeper transitions to `cancelled` at grace end. No prorated refund. |

## What we learned
TBD (fill in after Phase 1 dogfood)

## Follow-ups created
- Child specs 41–46 (vertical agents) — drafted in dedicated planner sessions AFTER this platform is in production ≥ 14 days
- Spec 32 amendments (new `ai_models` table, `paddle_line_items`, reserve/settle endpoints, rate snapshot in reservation, statement view extension) — co-owned with billing-service maintainer
- Spec 37 amendments (graph registry + internal run endpoint)

## Incidents / corrections
TBD


---

# Phase 2 — Open Questions Resolution Log (merged from Spec 47 on 2026-05-18)

All 5 Phase 2 open questions resolved by the user on 2026-05-18 during the Spec 40 ↔ Spec 47 merge decision. The merge itself was a user-initiated reversal of the prior planner recommendation to keep authoring as a separate spec; the user reasoned: *"Platform (runtime + authoring) belongs in one spec because both are foundational infrastructure for the AI Employee system. Each vertical agent will be its own follow-up spec."*

| # | Question (summary) | User Answer | Notes vs Planner Lean | Spec interpretation |
|---|---|---|---|---|
| Phase 2 Q1 | Admin app location: `apps/admin/` vs `apps/portal/app/(admin)/` | **`apps/admin/` (separate Next.js app, separate Cloudflare Pages deploy, separate auth flow)** | **Reversed** from planner lean (which was "route group inside portal for v1") | Captured in AC-ADMIN-APP-1..4. Justification recorded in DESIGN.md §Phase 2 Architecture (origin isolation, CSP strictness, mandatory MFA, deploy cadence outweigh +1 deploy target overhead). Auth flow uses **staff role claim on existing Supabase Auth** (`is_internal_staff=true` JWT claim issued after MFA + corporate-email-domain verification on a staff IdP path in Spec 01) rather than a second Supabase project — chosen because the operational cost of running two IdP projects exceeds the marginal security benefit, and the origin-isolation + MFA + IP allowlist + server-side role check already provide defence-in-depth. |
| Phase 2 Q2 | Default auto-upgrade policy: `manual` / `patch_only` / `minor_and_patch` / `all` | **`minor_and_patch`** | Matches planner lean | Captured in AC-P-1 (`DEFAULT 'minor_and_patch'` on `ai_employee_rentals.auto_upgrade_policy`). |
| Phase 2 Q3 | Multi-tenant agent authoring scope: system-owner only in v1? | **Yes — system-owner only in v1** | Matches planner lean | Captured in AC-R-1 (no per-workspace authoring surface). Schema designed so `created_by_workspace_id NULL` can be added additively for a future agency-tier authoring spec without rewrite. Per-workspace custom agents explicitly listed in Out of Scope. |
| Phase 2 Q4 | Pricing change on upgrade: grandfather until cancel/upgrade? | **Yes — grandfather old price for non-upgrading rentals; upgrade also opts into new price; 14d pre-notice** | Matches planner lean | Captured in AC-P-4, AC-U-2, AC-P-5. Tested by `test_grandfathered_price.py`. Spec 32 amendment (P2-0.2) explicitly includes Paddle subscription price update + grandfather logic. |
| Phase 2 Q5 | Two-person rule: strict for all? Or relax for `patch`? | **Strict for `minor`/`major`; same-person allowed for `patch` with `self_published_reason` logged** | Matches planner lean | Captured in AC-V-1, AC-R-3. Patch-label anti-abuse (server-side bump-type auto-detection rejecting any "patch" with diff exceeding threshold) prevents the obvious circumvention. Tested by `test_publish_two_person_rule.py` and `test_patch_label_anti_abuse.py`. |

## Phase 2 Merge Note (2026-05-18)

Phase 2 was originally drafted as a standalone Spec 47 (`docs/specs/47_AI_EMPLOYEE_AUTHORING_PLATFORM/`). The user reversed that decision on 2026-05-18, instructing that runtime + authoring belong in a single platform spec while each vertical agent (41–46) remains its own spec. The merge was performed in-place by:

1. Consolidating Spec 47's PRD / DESIGN / SECURITY / TESTS / IMPLEMENTATION / TASKS content into Phase 2 sections of the corresponding Spec 40 files (above).
2. Applying the 5 Q1–Q5 answers from the user during merge (notably reversing Q1 from the planner's prior lean).
3. Removing all forward-link references to Spec 47 from Spec 40's README, PRD, IMPLEMENTATION.
4. Deleting the `docs/specs/47_AI_EMPLOYEE_AUTHORING_PLATFORM/` folder entirely.
5. Updating `docs/specs/README.md` index: removing the row for Spec 47 (spec number 47 is freed for future use) and updating the row for Spec 40 to reflect unified runtime + authoring scope.

Unified confidence after merge: **7/10** (unchanged from pre-merge Phase 1 score; Phase 2 risks balance the Phase 1 risk-reduction from question resolution). Approved.
