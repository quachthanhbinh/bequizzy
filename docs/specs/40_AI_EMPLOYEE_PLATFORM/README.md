# 40 — AI Employee Platform (Runtime + Authoring, unified)

**Status:** ✅ Approved (2026-05-18 — Phase 1 questions Q1, Q2, Q3, Q5, Q6, Q8 resolved 2026-05-18; Phase 2 questions Q1–Q5 resolved 2026-05-18 via Spec 47 merge. See RESULT.md §Open Questions Resolution Log.)
**Confidence:** 7/10 (unchanged from the pre-merge Phase 1 score — the merge consolidates already-approved Phase 1 content plus the Phase 2 design the user has now resolved; remaining 3-point gap reflects (i) Spec 37 + Spec 32 amendments are still hard prereqs, (ii) shipping a marketplace with no agents to demo carries product-narrative risk, (iii) Phase 2 admin surface is a new code path with insider-abuse risk mitigated by two-person rule + audit but not yet field-tested.)
**Security flag:** 🔴 HIGH (Phase 1: autonomous agents executing on user behalf; OAuth-scoped spend; cross-workspace catalog isolation; prompt-injection-driven action; public content posting. Phase 2: admin privilege escalation, persisted prompts inserted into runtime supervisor prompt, tool permission grants, audit-trail tampering.)
**Priority:** P2 (Wave 4 — depends on Wave 1–3 foundation)
**Parallel Track:** B (AI / Intelligence) + E (Billing / Integrations) + F (Platform Operations for Phase 2 admin tooling)
**Depends on:** 01 (Auth/Workspace; staff IdP for Phase 2), 02 (AI Brain), 13 (Workflow Automation), 15 (Integrations + OAuth), 21 (Analytics Event Taxonomy; Phase 2 audit events), 23 (Feature Flags; Phase 2 admin gating), 31 (AI Advisor), 32 (Billing & Credits; Phase 2 internal-billing extension), 35 (Solo Operator Mode — approval queue pattern), 37 (LangGraph Orchestration)
**Blocks:** child specs 41–46 (each defines one catalog agent; all deferred until Phase 1 is shipped and validated)
**Owning service:** `ai-employee-service` (new Cloud Run service; Phase 2 extends it with `/v1/admin/*` namespace — no second microservice)
**Owning frontends:** `apps/portal/` (Phase 1 — workspace-owner UX) + `apps/admin/` (Phase 2 — internal-staff-only Next.js app, separate Cloudflare Pages deploy, separate auth flow)

## One-line summary
Unified platform for **renting, configuring, supervising, and billing** system-owned AI employees (Phase 1) plus **authoring, versioning, publishing, deprecating, and upgrading** those agents without code deploys (Phase 2). Phase 1 ships first and is shippable independently; agents are seeded via Alembic until Phase 2 lands. Phase 2 introduces a separate admin app and the version-lifecycle data model that lets the system owner ship new agents on demand.

## Two-Phase Delivery

This spec is delivered in two strictly-ordered phases. Phase 1 must be shippable independently and Phase 2 must not require any breaking change to Phase 1 (all schema additions are additive).

### Phase 1 — Runtime (was original Spec 40 scope)
The multi-agent platform foundation: catalog, rentals, runs, orchestration, billing (rental fee + per-token credits), approvals, SOPs, eval infrastructure, marketplace UI with empty/seeded catalog. **v1 of Phase 1 ships the platform only — zero vertical agents in the catalog.** The first real agent ships in Spec 41 (Ads Intelligence) once platform telemetry is validated.

Phase 1 ships agents via Alembic seed migrations (the existing `ai_employee_catalog` table holds one row per publishable agent with a single implicit version). Phase 2 is **not** a prerequisite for Phase 1: a usable, billable platform exists at end of Phase 1 with agents shipped by code deploy.

### Phase 2 — Authoring Platform (was Spec 47, merged in here 2026-05-18)
System-owner-facing admin platform to **author, version, publish, deprecate, and upgrade** catalog agents without code deploys: agent CRUD, version lifecycle state machine, per-rental version pinning + auto-upgrade policy, breaking-change opt-in flow, rollback, internal RBAC (author / reviewer / publisher), full audit trail, and eval dry-run before publish. Decouples agent authoring cadence from microservice deploy cadence.

Phase 2 lands additively on Phase 1: 5 new tables, 5 added columns, ~20 new admin endpoints under `/v1/admin/*`, new `apps/admin/` Next.js app (separate Cloudflare Pages deploy + separate auth flow).

## ⚠️ Phase 1 v1 Scope: Platform-Only — No Agents in Catalog

Following the user's product decision (Phase 1 Q3 resolved 2026-05-18), v1 of Phase 1 ships **the multi-agent platform foundation and nothing else.** The catalog table will exist but be empty; the marketplace UI will display a "Coming soon — first agent ships in Spec 41" state. This decision was driven by:

- **Liability:** an unproven platform with autonomous-spend agents is too risky to ship simultaneously. Validate the chassis first.
- **EDD discipline:** each agent needs its own golden dataset + per-vertical guardrails. Pretending to bundle them with the platform release inflates scope and pushes both ship dates.
- **Cost telemetry:** real per-run cost behavior (input/output tokens × model rate) is unknown until at least one agent runs against real workspaces. Ship the metering infrastructure first, then add agents that exercise it.

The upside: a smaller, sharper v1 with no agent-quality eval risk, and a stronger gate before Spec 41 reaches users.

## Why it matters
- The AI Brain (Spec 02) gives the AI sales rep workspace knowledge; today no other agent can use it. This spec lets the system owner rent specialist AI workers that share the same brain.
- A second revenue stream beyond subscription plans, with a **clean separation between the agent "license" and its usage cost**:
  - **Rental fee** = flat monthly Paddle subscription per agent rented (prepaid; agent-license only, does NOT include LLM tokens).
  - **Token cost** = metered per run (input + output tokens × per-model rate) → converted to credits with 30% margin → reserved BEFORE the run, settled after.
  - **Per-agent model selection** = workspace owner picks the LLM model for each rented agent instance (GPT-4o-mini default, may upgrade to GPT-5, Claude Sonnet, etc.) — pricing is fully transparent because the model rate is published.
  - Ad-management fee deferred with Ads agent to Spec 41.
- SEA SMB owners cited in user research: "I need a marketing team but can't afford one and can't navigate hiring law" — the platform sells them a marketing team that boots in minutes.
- Differentiator vs 11x.ai (single SDR persona) and HubSpot (no autonomous specialists). RevLooper becomes the multi-agent OS for the one-person company.
- Phase 2 unlocks GTM velocity: new agent ideas (or fixes to existing ones) ship in hours instead of sprints, and per-rental version pinning protects workspace owners from silent prompt changes — addressing the user requirement: *"I will create more specialized AI agents depending on the needs of the client. Therefore, I need a good platform to create additional AI agents or modify and upgrade existing ones, as the AI agents may have multiple versions."*

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Phase 1 + Phase 2 product requirements, acceptance criteria, success metrics, gate moments |
| [DESIGN.md](DESIGN.md) | Architecture, data model (15 tables: 10 Phase 1 + 5 Phase 2), API contract (Phase 1 workspace-owner + Phase 2 admin + workspace-owner upgrade UX), orchestration model, debate transcript |
| [SECURITY.md](SECURITY.md) | Threat model — Phase 1: autonomous-action OWASP walkthrough, spend guardrails, OAuth scope minimisation. Phase 2: insider-abuse, RBAC bypass, audit-trail tampering, admin-app origin-isolation |
| [TESTS.md](TESTS.md) | Unit / integration / E2E / EDD strategy + adversarial catalog for both phases |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Two-phase rollout, follow-up spec roadmap (41–46), feature flags, monitoring |
| [TASKS.md](TASKS.md) | TDD plan: 18 Phase 1 tasks + ~20 Phase 2 tasks (writing-plans phase will split into two plan documents — one per phase — because combined count exceeds the 25-task plan-document limit) |
| [RESULT.md](RESULT.md) | (Empty until shipped) actual metrics + post-mortem + Open Questions Resolution Log (Phase 1 Q1–Q8 + Phase 2 Q1–Q5) |

## Scope of THIS spec

### Phase 1 — Runtime (in scope)
1. New `ai-employee-service` microservice (Cloud Run) + DB schema
2. Catalog model (system-owned `ai_employee_catalog` table; one row per publishable agent type — **empty in v1**)
3. Model catalog (`ai_models` reference table — per-model input/output rate in credits, capability flags) — owned by `billing-service`
4. Rental lifecycle (`ai_employee_rentals` — workspace rents an agent, picks a model, pays monthly rental fee prepaid via Paddle, agent becomes runtime-active)
5. Cancellation lifecycle with 7-day grace for pending approvals (status: `active → cancelling → cancelled`; in-flight runs finish current step then stop; new runs paused immediately)
6. Agent runs (`ai_employee_runs` — every invocation logged with inputs/outputs/model_used/input_tokens/output_tokens/credits_charged/tool calls)
7. Tools framework (`ai_employee_tools` manifest + `ai_employee_tool_invocations` audit)
8. SOP management (`ai_employee_sops` versioned; attached to rental)
9. CEO Approval Inbox (`ai_employee_approval_requests` — proposal → approve → auto-deploy → audit). `publish_public` always requires approval during dry-run + first 30 days of any rental.
10. Spending limits + safety guardrails (per-agent cap, per-tool side-effect cap, dry-run default, per-run credit ceiling)
11. Multi-agent orchestration model using **Spec 37 LangGraph** (supervisor + worker pattern; no direct agent-to-agent calls)
12. Per-rental memory store (`ai_employee_memory` — key-value JSONB; episodic pgvector deferred)
13. Self-training feedback loop (`ai_employee_run_feedback` + nightly eval CronJob; auto-pause on regression)
14. Revenue infrastructure: flat-monthly rental SKU in Paddle (prepaid) + per-token credit metering with per-model rates (extends Spec 32)
15. SEA AI-disclosure: workspace-configurable disclosure template (default `[Posted by AI on behalf of {workspace_name}]`); required non-empty when any `publish_public` agent is rented
16. Frontend marketplace skeleton (empty catalog "coming soon" state in v1), per-rental settings (model selector, caps, SOPs), approval inbox, run timeline

### Phase 2 — Authoring Platform (in scope, lands after Phase 1 is stable)
1. **Separate admin app** in new `apps/admin/` (Next.js 14, separate Cloudflare Pages deploy, separate `wrangler.toml`, separate auth flow with staff-only Supabase Auth using `is_internal_staff=true` claim on the same Supabase project)
2. **Admin API namespace** on the existing `ai-employee-service` under `/v1/admin/*` (not a separate microservice — authoring and runtime share the bounded context of catalog management; soft-FK and join-locality forbid splitting)
3. **Agent CRUD** — create/edit draft versions (identity, slug, category, description, system prompt, allowed_model_ids[], default_model_id, default caps, default dry-run days, default per-run ceiling, min_plan, marketplace metadata)
4. **Tool registry** as a first-class system-owned table (`tool_registry`) — separate from agent definitions. Tools are code (deploys required); agents reference tools by `tool_registry_id`. Authoring an agent does NOT require deploying tool code.
5. **Version lifecycle**: `draft → in_review → published → deprecated → archived`. Versions are immutable once published. Semantic versioning (`MAJOR.MINOR.PATCH`) with breaking-change marker.
6. **Per-rental pinning** — `ai_employee_rentals.pinned_version_id` (set at rent time to the catalog's then-current `published` version). `ai_employee_runs.agent_version_id` snapshot (runs pin at dispatch; never migrate mid-run).
7. **Auto-upgrade policy per rental** — `manual` | `patch_only` | **`minor_and_patch` (default, per Q2)** | `all`. Breaking-change versions always require explicit opt-in regardless of policy.
8. **Upgrade UX (workspace owner)** — Novu notification "Agent X v2.0 is available [view changes] [upgrade now] [stay on v1.x]"; review-changes page shows version diff (system prompt, tools, caps, pricing); upgrade is atomic.
9. **Rollback** — workspace owner can pin back to the previous version within 30 days of upgrade if the new version misbehaves (`ai_employee_rental_version_history` retains the prior `pinned_version_id`).
10. **Deprecation timeline** — when a version is `deprecated`, rentals on it receive notification every 7 days; after 90 days, they are force-upgraded to the latest non-deprecated minor on the same major (or, if that doesn't exist, the rental is paused with `pause_reason='version_lifecycle_expired'`).
11. **Pricing change on version upgrade (per Q4)** — if new version's `monthly_rental_price_usd` > old, existing rentals are **grandfathered at the old price until cancel/upgrade**; opting into the new version (manual or via auto-upgrade policy) ALSO opts into the new price (with 14-day pre-notice). Per-token rates are not version-pinned (they follow `ai_models`, which is its own system table).
12. **Internal RBAC** — three roles within the internal staff org: `author` (can create/edit drafts), `reviewer` (can move draft → in_review and approve), `publisher` (can publish + deprecate). **Two-person rule for publish on `minor` and `major`; same-person allowed for `patch` with logged `self_published_reason` (per Q5)**.
13. **Audit trail** — every authoring action writes to `events` (Spec 21 taxonomy: `ai_employee.author.*`) with actor, timestamp, version_id, and JSON diff. Immutable.
14. **Eval dry-run in authoring UI** — author can run the draft version against a golden dataset (per-agent, defined in child specs 41+) before publish; results displayed inline with diff vs previous version's pass rate. Publish blocked if pass rate drops > 15% unless reviewer overrides with reason.
15. **System-owner-only authoring in v1 (per Q3)** — per-workspace custom agents and agency-tier white-label authoring are explicitly deferred to a future spec. Schema designed with `created_by_workspace_id NULL` so future per-workspace agents are additive without rewrite.
16. **Out-of-band agent seeding (interim)** — until Phase 2 ships, agents continue to be inserted via Alembic seed. Phase 2's first migration migrates existing seeded rows to `version=1.0.0, status=published`.

### Out of scope (deferred)
- **All vertical agents** — Ads Intelligence (41), Social Writer (42), Blog Writer (43), Competitor Monitor (44), Customer Support Triage (45), Agency-scoped sharing (46). Each is its own spec with its own EDD golden dataset, ships only after Phase 1 is validated in production.
- Ad-spend pass-through accounting (deferred to Spec 41 because no Ads agent exists in v1 to need it)
- Cross-agent goal planning (e.g. "grow MRR 10%") — Phase 5 or later
- Episodic vector memory per agent (v2)
- Agent-to-agent direct messaging (we use the shared AI Brain + structured task records instead)
- **Per-workspace custom agents** (workspace-owner-authored agents) — system-owner-authored only in Phase 2. Per-workspace custom agents → future spec (likely tied to Agency tier, Spec 46+).
- **White-label agent rebranding** — Spec 46 (agency) territory.
- **Marketplace for third-party agent authors** — far future.
- **Custom tool authoring in admin UI** — tools remain code-deployed. (Phase 2 supplies the `tool_registry` so tool metadata is data-driven, but the actual executor code still ships with `integration-service`.)
- **A/B testing of agent versions** — deferred to a follow-up spec once we have ≥ 3 active versions per agent.
- **Auto-rollback on production regression** — manual rollback only in Phase 2.
- **Agent forking** (copy an existing agent as starting point for a new one) — deferred.

## Architecture non-negotiables addressed

| Non-negotiable | Phase 1 | Phase 2 |
|---|---|---|
| Workspace scope on every query | `workspace_id` mandatory on all rental / run / approval / SOP tables; catalog table has `workspace_id IS NULL` with RLS rule allowing only SELECT | Authoring tables (`agent_versions`, `tool_registry`, `internal_staff_roles`) are system-owned (`workspace_id IS NULL`); `ai_employee_rental_version_history` workspace-scoped. Catalog/version tables use `workspace_id IS NULL` + RLS allowing SELECT only |
| Transactional outbox | `ai.employee.rented`, `ai.employee.run.completed`, `ai.employee.approval.requested`, `ai.employee.approval.approved`, `ai.employee.auto_paused` events | `ai_employee.author.version.created`, `…published`, `…deprecated`, `ai_employee.rental.version.upgraded`, `…rolled_back`, `…force_upgraded` events |
| Credits before AI | Every run calls `billing-service POST /credits/deduct` BEFORE invoking ai-service; refund on failure | Eval dry-run consumes credits from an internal "authoring" billing account (Spec 32 amendment — new `internal_billing_accounts` table), NOT from any workspace |
| Suppression list | Any agent whose tool dispatches outbound (Ads → no; Email outreach via agent → yes) routes through outreach-service which enforces existing suppression check | N/A (no outbound messages from authoring) |
| SEA consent | Agents that publish public content (Social Writer) must record a workspace-level publishing consent in `consent_log` once at rental time | N/A (no end-user PII processed by authoring) |
| ai-service-only LLM | All LLM calls go through `ai-service` (re-uses Spec 37 LangGraph runtime); `ai-employee-service` never calls LiteLLM directly | Eval dry-run invokes `ai-service` REST same as runtime; no direct LiteLLM call |
| Service boundary | `ai-employee-service` owns its tables; soft FKs to workspace, user, ai_brain_chunks | Same service owns all Phase 2 tables. Admin frontend (`apps/admin/`) calls `/v1/admin/*` routes guarded by internal-staff JWT claim + corporate VPN IP allowlist at api-gateway |
| Notifications via Novu | Approval requests, auto-pause alerts, run failures → notification-service | Upgrade-available + deprecation-countdown + force-upgrade-imminent notifications via Novu workflow `ai_employee_version_lifecycle` |
| Internal-only ingress (Phase 2 admin) | N/A | `/v1/admin/*` routes restricted by JWT claim `is_internal_staff=true` (issued by Spec 01 staff IdP); api-gateway also enforces source-IP allowlist (corporate VPN); admin Cloudflare Pages deploy enforces stricter CSP, no third-party scripts, mandatory MFA for staff |

## Debate Summary (truncated — full transcript in DESIGN.md §Debate)

**Phase 1 debate:** 3-round CPO ↔ CTO debate ended at CPO 7 / CTO 6 = **6/10** (scale-gate cap on unbounded LLM cost + vertical-agent-feasibility unknown). User answers on 2026-05-18 narrowed scope to platform-only and replaced ad-hoc per-run cost estimation with **per-token + per-model rate metering** → both blocking CTO concerns removed → revised confidence **7/10**.

| Round | Outcome |
|---|---|
| R1 | Major gap (CPO 8 / CTO 4). CTO blocked on autonomous-spend liability and lack of an existing agent-execution runtime. CPO blocked on "everything is deferred." |
| R2 | Narrowed to CPO 7 / CTO 5 after splitting umbrella vs child specs, hard spending caps + dry-run default, and committing to reuse Spec 37 LangGraph for orchestration. |
| R3 | CPO 7 / CTO 6. Remaining CTO concerns: vertical agent feasibility unknown; aggregate LLM cost at scale potentially unbounded. |
| User decision (2026-05-18) | (a) defer ALL vertical agents to follow-up specs → CTO concern #1 dissolved; (b) per-token billing with per-model rates + reserve-then-settle on credits → CTO concern #2 dissolved (cost is now bounded per run AND fully passed to the workspace via credits, not absorbed by platform). New confidence: **7/10**. |

**Phase 2 debate (post-merge addendum):** Phase 2 (originally Spec 47) was drafted at confidence 6/10 with 5 open questions. The user answered all five on 2026-05-18; the answers (separate admin app, `minor_and_patch` default, system-owner-only authoring v1, grandfather pricing, strict two-person for minor/major with patch exception) dissolve the open product questions. Remaining technical risks (insider abuse, RBAC bypass, audit-trail tampering) are mitigated by the security controls in SECURITY.md but are new code paths that are not yet field-tested. Phase 2 contributes a small additional risk to the unified confidence score, balanced by the user's explicit `separate admin app` choice which **reduces** XSS/CSRF blast radius vs the originally-recommended route group inside the portal.

**Net unified confidence:** **7/10** (unchanged from pre-merge Phase 1). Phase 2 risks balance the Phase 1 risk-reduction from question resolution. Approved.

## Pointers
- Related specs: 02 (shared AI Brain), 13 (workflow triggers may dispatch agents), 21 (audit event taxonomy), 23 (feature flags for both phases), 31 (Advisor surfaces approval requests), 32 (billing model extension + internal billing accounts for Phase 2), 35 (approval queue pattern precedent), 37 (LangGraph runtime reuse), 15 (OAuth pattern for Google/Facebook Ads)
- Skills used: `spec-driven-development`, `tdd-workflow`, `edd-workflow` (mandatory for each catalog agent in child specs + Phase 2 eval dry-run grading reuse), `verification-loop`
- Runbook (post-ship): `docs/runbooks/ai-employee-platform.md`
