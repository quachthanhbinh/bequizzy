# BeQuizzy — Code Conventions

**Version:** 0.1  
**Last Updated:** 2026-05-19

---

## Status
This file defines the current BeQuizzy coding conventions.

These conventions are intentionally lightweight for the current BeQuizzy stage. They should keep the codebase consistent without pretending the architecture is more finalized than it is.

## 1. General rules
- Write code, comments, commit messages, and docs in **English**.
- Prefer the smallest change that solves the problem.
- Match existing style in nearby code before introducing a new pattern.
- Do not add abstractions for one-off usage.
- Do not add speculative config, feature flags, or fallback layers unless the requirement is real.

## 2. Naming
- Files and folders: `kebab-case`
- Go packages: short, lowercase, no underscores
- Go exported identifiers: `PascalCase`
- Go unexported identifiers: `camelCase`
- TypeScript components: `PascalCase`
- TypeScript variables/functions/hooks: `camelCase`
- Database columns: `snake_case`
- Environment variables: `SCREAMING_SNAKE_CASE`
- Boolean names should read clearly: `isReady`, `hasAccess`, `canRetry`, `shouldPublish`

## 3. Backend conventions (Go + Gin)
- Keep handlers thin.
- Put business logic in service-level code, not directly in HTTP handlers.
- Keep validation at the boundary: request parsing, auth, external input.
- Prefer explicit structs over `map[string]any` for stable contracts.
- Return structured JSON responses.
- Use `context.Context` consistently through request flows.
- Avoid package cycles; if two packages want each other, the boundary is wrong.

## 4. Frontend conventions (Next.js + TypeScript)
- Use TypeScript everywhere; avoid `any`.
- Keep presentational components simple and composable.
- Keep data-fetching and transformation out of deeply nested UI components.
- Prefer server components or dedicated client hooks based on the real interaction need, not habit.
- Keep forms explicit and typed.
- Do not bury product logic inside Tailwind class decisions.

## 5. Database conventions
- Primary keys should be UUIDs unless there is a strong reason otherwise.
- Timestamps should be UTC and use clear names like `created_at`, `updated_at`, `submitted_at`, `scored_at`.
- Use additive migrations.
- Prefer explicit join tables over overloaded JSON when the relationship matters to querying.
- Use JSONB only for genuinely flexible metadata, not to avoid modeling core entities.

## 6. AI and scoring conventions
- Scoring must be explainable.
- Any user-facing score should be traceable to dimensions, rationale, and evidence.
- Prompt or model-specific logic should be isolated from core domain entities where possible.
- Store enough audit data to explain how a scorecard was produced.
- Do not hardcode role assumptions outside the playbook/rubric layer.

## 7. Testing expectations
- Test behavior, not implementation trivia.
- New business rules should ship with tests.
- Bug fixes should add a regression test when practical.
- For frontend work, verify the real UI flow when the change affects behavior, not just types.
- Keep fixtures small and readable.

## 8. API conventions
- Use resource-oriented paths.
- Keep request and response shapes explicit.
- Use consistent error shapes.
- Do not silently change response contracts once frontend code depends on them.
- Version the API when breaking changes become necessary.

## 9. Security basics
- Validate all external input.
- Never log secrets, tokens, or sensitive candidate data unnecessarily.
- Keep authorization checks close to protected actions.
- Sanitize uploaded or generated content before rendering where relevant.
- Treat candidate recordings, transcripts, and score evidence as sensitive data.

## 10. Product-specific guardrails
- Build around one role family at a time.
- Favor observable behavior over vague personality labeling.
- Prefer role-specific rubrics over generic scoring systems.
- Preserve score auditability even if it slows implementation slightly.
- Candidate evidence is a core asset; avoid schema or API shortcuts that would make progress history unreliable.

## 11. When unsure
Choose the more boring option if it is:
- easier to read
- easier to test
- easier to explain
- easier to extend for the next BeQuizzy feature without a rewrite