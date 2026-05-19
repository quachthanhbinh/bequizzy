# BeQuizzy — Database Schema

**Version:** 0.1 draft  
**Last Updated:** 2026-05-19

---

## Status
This file defines the initial BeQuizzy schema direction.

BeQuizzy is still early, so this document defines the **v1 domain model direction** rather than a locked production schema. It is designed around the current product wedge:
- Sales / Business Development candidates
- repeated multimodal assessments
- explainable AI scorecards
- verified evidence profiles
- employer shortlist workflows

## Core schema principles
1. **Candidate evidence first** — the schema should preserve attempts, responses, scores, and improvement over time.
2. **Assessment modules are reusable** — roleplay, situational judgment, presentation, and communication scoring should be modeled as modular building blocks.
3. **Explainability is mandatory** — every score that matters should be traceable to rubric dimensions and evidence snippets.
4. **Role-family expansion should be additive** — new verticals should add playbooks, competencies, and modules, not fork the whole schema.
5. **Employer views are downstream of candidate evidence** — shortlist and comparison data should derive from assessment output, not a separate scoring universe.

## Expected platform stack assumptions
- **Database:** PostgreSQL
- **Auth:** Supabase Auth
- **Backend services:** Go + Gin
- **Frontend app:** Next.js 14
- **Async / cache support:** Redis

## Recommended extensions
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

## Entity map
The v1 data model should be organized into these bounded areas:
1. identity and accounts
2. role playbooks and rubrics
3. assessment delivery
4. scoring and feedback
5. evidence profiles
6. employer hiring workflow
7. analytics and auditability

---

## 1. Identity and Accounts

### `users`
Supabase-authenticated user record.

Suggested fields:
- `id UUID PRIMARY KEY`
- `email TEXT NOT NULL UNIQUE`
- `full_name TEXT`
- `avatar_url TEXT`
- `user_type TEXT NOT NULL` — `candidate` | `employer` | `admin`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

### `candidate_profiles`
Candidate-specific profile and goals.

Suggested fields:
- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL UNIQUE`
- `target_role_family TEXT NOT NULL` — starts with `sales_bd`
- `target_role_title TEXT`
- `seniority_target TEXT`
- `english_level TEXT`
- `headline TEXT`
- `bio TEXT`
- `location_country TEXT`
- `goal_text TEXT`
- `profile_visibility TEXT NOT NULL DEFAULT 'private'`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

### `employer_organizations`
Company account for hiring teams.

Suggested fields:
- `id UUID PRIMARY KEY`
- `owner_user_id UUID NOT NULL`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE`
- `company_size TEXT`
- `industry TEXT`
- `country TEXT`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

### `employer_memberships`
Many-to-many link between users and employer organizations.

Suggested fields:
- `id UUID PRIMARY KEY`
- `organization_id UUID NOT NULL`
- `user_id UUID NOT NULL`
- `role TEXT NOT NULL` — `owner` | `admin` | `reviewer`
- `created_at TIMESTAMPTZ NOT NULL`
- unique `(organization_id, user_id)`

---

## 2. Role Playbooks and Rubrics

### `role_playbooks`
Defines a role family BeQuizzy can assess.

Suggested fields:
- `id UUID PRIMARY KEY`
- `slug TEXT NOT NULL UNIQUE` — e.g. `sales-bd`
- `name TEXT NOT NULL`
- `status TEXT NOT NULL` — `draft` | `active` | `archived`
- `description TEXT`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

### `competencies`
Observable capability areas within a playbook.

Suggested fields:
- `id UUID PRIMARY KEY`
- `playbook_id UUID NOT NULL`
- `slug TEXT NOT NULL`
- `name TEXT NOT NULL`
- `description TEXT`
- `display_order INT NOT NULL`
- `is_active BOOLEAN NOT NULL DEFAULT TRUE`
- unique `(playbook_id, slug)`

For the initial Sales/BD playbook, examples include:
- communication_clarity
- persuasion_value_framing
- objection_handling
- situational_judgment
- presentation_ability
- coachability_growth_velocity

### `assessment_modules`
Reusable assessment types within a playbook.

Suggested fields:
- `id UUID PRIMARY KEY`
- `playbook_id UUID NOT NULL`
- `slug TEXT NOT NULL`
- `name TEXT NOT NULL`
- `module_type TEXT NOT NULL` — `roleplay` | `situational` | `presentation` | `communication_layer`
- `delivery_mode TEXT NOT NULL` — `voice` | `video` | `text` | `mixed`
- `instructions_markdown TEXT NOT NULL`
- `time_limit_seconds INT`
- `is_active BOOLEAN NOT NULL DEFAULT TRUE`
- `display_order INT NOT NULL`
- unique `(playbook_id, slug)`

### `module_scenarios`
Concrete prompts/scenarios for a module.

Suggested fields:
- `id UUID PRIMARY KEY`
- `module_id UUID NOT NULL`
- `title TEXT NOT NULL`
- `prompt_text TEXT NOT NULL`
- `scenario_type TEXT`
- `difficulty_level TEXT`
- `source_language TEXT DEFAULT 'en'`
- `metadata JSONB NOT NULL DEFAULT '{}'`
- `is_active BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at TIMESTAMPTZ NOT NULL`

### `scoring_rubrics`
Versioned rubric for how a module is scored.

Suggested fields:
- `id UUID PRIMARY KEY`
- `module_id UUID NOT NULL`
- `version INT NOT NULL`
- `status TEXT NOT NULL` — `draft` | `active` | `retired`
- `created_at TIMESTAMPTZ NOT NULL`
- unique `(module_id, version)`

### `rubric_dimensions`
Dimension-level scoring rules inside a rubric.

Suggested fields:
- `id UUID PRIMARY KEY`
- `rubric_id UUID NOT NULL`
- `competency_id UUID NOT NULL`
- `name TEXT NOT NULL`
- `weight NUMERIC(5,2) NOT NULL`
- `description TEXT`
- `scoring_notes TEXT`
- `display_order INT NOT NULL`

---

## 3. Assessment Delivery

### `assessment_sessions`
One candidate attempt at one module/scenario.

Suggested fields:
- `id UUID PRIMARY KEY`
- `candidate_profile_id UUID NOT NULL`
- `playbook_id UUID NOT NULL`
- `module_id UUID NOT NULL`
- `scenario_id UUID`
- `rubric_id UUID`
- `status TEXT NOT NULL` — `queued` | `in_progress` | `submitted` | `scored` | `failed` | `cancelled`
- `started_at TIMESTAMPTZ`
- `submitted_at TIMESTAMPTZ`
- `completed_at TIMESTAMPTZ`
- `attempt_number INT NOT NULL DEFAULT 1`
- `language_code TEXT`
- `metadata JSONB NOT NULL DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL`

### `session_prompts`
Prompt blocks delivered during a session.

Suggested fields:
- `id UUID PRIMARY KEY`
- `session_id UUID NOT NULL`
- `prompt_index INT NOT NULL`
- `speaker_role TEXT NOT NULL` — `system` | `interviewer` | `candidate_instruction`
- `content TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

### `session_responses`
Candidate responses captured during the session.

Suggested fields:
- `id UUID PRIMARY KEY`
- `session_id UUID NOT NULL`
- `response_index INT NOT NULL`
- `response_type TEXT NOT NULL` — `text` | `audio` | `video`
- `text_content TEXT`
- `media_asset_id UUID`
- `duration_seconds INT`
- `captured_at TIMESTAMPTZ NOT NULL`
- `metadata JSONB NOT NULL DEFAULT '{}'`

### `media_assets`
Stored media and derived artifacts.

Suggested fields:
- `id UUID PRIMARY KEY`
- `owner_type TEXT NOT NULL` — `session_response` | `evidence_snippet` | `profile_asset`
- `storage_provider TEXT NOT NULL`
- `storage_path TEXT NOT NULL`
- `mime_type TEXT NOT NULL`
- `file_size_bytes BIGINT`
- `duration_seconds INT`
- `transcript_text TEXT`
- `created_at TIMESTAMPTZ NOT NULL`

---

## 4. Scoring and Feedback

### `scorecards`
Top-level outcome for an assessment session.

Suggested fields:
- `id UUID PRIMARY KEY`
- `session_id UUID NOT NULL UNIQUE`
- `candidate_profile_id UUID NOT NULL`
- `overall_score NUMERIC(5,2)`
- `readiness_level TEXT` — `not_ready` | `developing` | `interview_ready`
- `growth_velocity TEXT` — `low` | `medium` | `high`
- `summary_text TEXT`
- `strengths_text TEXT`
- `weaknesses_text TEXT`
- `next_drill_recommendation TEXT`
- `scored_at TIMESTAMPTZ NOT NULL`
- `model_version TEXT`
- `created_at TIMESTAMPTZ NOT NULL`

### `scorecard_dimensions`
Dimension-level score breakdown.

Suggested fields:
- `id UUID PRIMARY KEY`
- `scorecard_id UUID NOT NULL`
- `competency_id UUID NOT NULL`
- `rubric_dimension_id UUID`
- `score NUMERIC(5,2) NOT NULL`
- `max_score NUMERIC(5,2)`
- `rationale TEXT`
- `evidence_summary TEXT`
- unique `(scorecard_id, competency_id, rubric_dimension_id)`

### `score_evidence_snippets`
Traceable proof attached to a dimension score.

Suggested fields:
- `id UUID PRIMARY KEY`
- `scorecard_dimension_id UUID NOT NULL`
- `session_response_id UUID`
- `media_asset_id UUID`
- `snippet_text TEXT`
- `start_second INT`
- `end_second INT`
- `reason TEXT`
- `created_at TIMESTAMPTZ NOT NULL`

### `improvement_recommendations`
Structured coaching outputs.

Suggested fields:
- `id UUID PRIMARY KEY`
- `scorecard_id UUID NOT NULL`
- `competency_id UUID`
- `priority_rank INT NOT NULL`
- `recommendation_text TEXT NOT NULL`
- `drill_type TEXT`
- `created_at TIMESTAMPTZ NOT NULL`

---

## 5. Evidence Profiles

### `evidence_profiles`
Public/private evidence layer built from repeated assessment history.

Suggested fields:
- `id UUID PRIMARY KEY`
- `candidate_profile_id UUID NOT NULL UNIQUE`
- `headline TEXT`
- `summary_text TEXT`
- `current_readiness_level TEXT`
- `visibility_status TEXT NOT NULL` — `private` | `shareable` | `employer_visible`
- `share_token TEXT UNIQUE`
- `last_refreshed_at TIMESTAMPTZ`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

### `evidence_profile_metrics`
Latest aggregate view by competency.

Suggested fields:
- `id UUID PRIMARY KEY`
- `evidence_profile_id UUID NOT NULL`
- `competency_id UUID NOT NULL`
- `current_score NUMERIC(5,2) NOT NULL`
- `trend_delta NUMERIC(5,2)`
- `sample_size INT NOT NULL DEFAULT 0`
- `updated_at TIMESTAMPTZ NOT NULL`
- unique `(evidence_profile_id, competency_id)`

### `evidence_profile_highlights`
Selected proof blocks shown to employers.

Suggested fields:
- `id UUID PRIMARY KEY`
- `evidence_profile_id UUID NOT NULL`
- `source_scorecard_id UUID`
- `source_snippet_id UUID`
- `highlight_type TEXT NOT NULL` — `strength` | `progress` | `artifact`
- `title TEXT NOT NULL`
- `body_text TEXT`
- `display_order INT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

---

## 6. Employer Hiring Workflow

### `job_requirements`
Employer-created target role definitions.

Suggested fields:
- `id UUID PRIMARY KEY`
- `organization_id UUID NOT NULL`
- `playbook_id UUID NOT NULL`
- `title TEXT NOT NULL`
- `description TEXT`
- `status TEXT NOT NULL` — `draft` | `active` | `closed`
- `target_seniority TEXT`
- `metadata JSONB NOT NULL DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

### `job_requirement_competencies`
Weighting of competencies for a role.

Suggested fields:
- `id UUID PRIMARY KEY`
- `job_requirement_id UUID NOT NULL`
- `competency_id UUID NOT NULL`
- `target_weight NUMERIC(5,2) NOT NULL`
- `minimum_score NUMERIC(5,2)`
- unique `(job_requirement_id, competency_id)`

### `candidate_applications`
Link between a candidate evidence profile and an employer role.

Suggested fields:
- `id UUID PRIMARY KEY`
- `job_requirement_id UUID NOT NULL`
- `candidate_profile_id UUID NOT NULL`
- `source TEXT NOT NULL` — `invite` | `direct_apply` | `shortlisted_from_marketplace`
- `status TEXT NOT NULL` — `new` | `reviewing` | `shortlisted` | `interviewing` | `rejected` | `hired`
- `fit_score NUMERIC(5,2)`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- unique `(job_requirement_id, candidate_profile_id)`

### `shortlists`
Saved comparison sets.

Suggested fields:
- `id UUID PRIMARY KEY`
- `organization_id UUID NOT NULL`
- `job_requirement_id UUID`
- `name TEXT NOT NULL`
- `created_by_user_id UUID NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

### `shortlist_candidates`
Candidates included in a shortlist.

Suggested fields:
- `id UUID PRIMARY KEY`
- `shortlist_id UUID NOT NULL`
- `candidate_profile_id UUID NOT NULL`
- `rank_order INT`
- `notes TEXT`
- unique `(shortlist_id, candidate_profile_id)`

---

## 7. Analytics and Auditability

### `candidate_activity_events`
Append-only event log for candidate product usage.

Suggested fields:
- `id UUID PRIMARY KEY`
- `candidate_profile_id UUID`
- `session_id UUID`
- `event_type TEXT NOT NULL`
- `event_payload JSONB NOT NULL DEFAULT '{}'`
- `occurred_at TIMESTAMPTZ NOT NULL`

### `employer_activity_events`
Append-only event log for employer workflow usage.

Suggested fields:
- `id UUID PRIMARY KEY`
- `organization_id UUID`
- `job_requirement_id UUID`
- `event_type TEXT NOT NULL`
- `event_payload JSONB NOT NULL DEFAULT '{}'`
- `occurred_at TIMESTAMPTZ NOT NULL`

### `scoring_audit_logs`
Critical trace of how scorecards were generated.

Suggested fields:
- `id UUID PRIMARY KEY`
- `session_id UUID NOT NULL`
- `scorecard_id UUID`
- `rubric_id UUID`
- `model_version TEXT`
- `input_snapshot JSONB NOT NULL`
- `output_snapshot JSONB NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

This table matters because BeQuizzy's trust model depends on explainable and reviewable AI output.

---

## Near-term v1 table priority
If BeQuizzy starts implementation soon, the first schema wave should prioritize:
1. `users`
2. `candidate_profiles`
3. `role_playbooks`
4. `competencies`
5. `assessment_modules`
6. `module_scenarios`
7. `scoring_rubrics`
8. `rubric_dimensions`
9. `assessment_sessions`
10. `session_responses`
11. `media_assets`
12. `scorecards`
13. `scorecard_dimensions`
14. `score_evidence_snippets`
15. `evidence_profiles`
16. `evidence_profile_metrics`
17. `employer_organizations`
18. `job_requirements`
19. `candidate_applications`
20. `scoring_audit_logs`

## Open schema decisions to lock before implementation
The next schema draft should finalize:
- whether candidate and employer identities share one `users` table only, or need separate auth/profile flows
- whether a roleplay session stores every turn as `session_prompts` + `session_responses`, or as a unified transcript event stream
- whether transcripts live inline in Postgres or partly in object storage
- whether score aggregation for evidence profiles is synchronous or background-generated
- how employer-visible sharing permissions work for evidence snippets and media clips

## Recommended rule for the next draft
Do not expand the schema broadly for multiple role families yet. Lock the schema against the Sales/BD wedge first, then generalize only where real repetition proves the abstraction.