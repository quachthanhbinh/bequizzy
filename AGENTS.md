# AGENTS.md — BeQuizzy

> **Map, not encyclopedia.** ~100 lines. Details live in `docs/` and `.claude/`.
> Read those before acting — never infer from this file alone.

---

## 1. Project Identity

**BeQuizzy** — AI-native career growth & hiring platform. Turns soft-skill-heavy sales/BD talent into structured, trusted hiring evidence.

Stack: Next.js 14 + Tailwind + shadcn/ui (FE) · **Polyglot BE** — Go/Gin · Python/FastAPI · Java/Spring Boot · Node.js/NestJS (per service needs) · PostgreSQL 16 + Redis · Supabase Auth · Cloudflare / Vercel.

> **Language choice per service** (decided at spec time, documented in DESIGN.md):
> Go/Gin → gateway, real-time · Python/FastAPI → AI scoring/ML · Java/Spring Boot → complex business logic · Node.js/NestJS → BFF/webhooks

Paths: `apps/portal/` (FE) · `services/*/` (Go microservices) · `services/migrations/` (golang-migrate SQL files)

Deeper context → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) · [docs/PRD.md](docs/PRD.md)

---

## 2. Workflow

```
BRAINSTORM → SPEC → REVIEW → PLAN → IMPLEMENT (TDD) → VERIFY → E2E → BUILD → DELIVER
```

Hard gate: no production code until user approves `docs/specs/{NN}/SPEC.md`.
Full pipeline → `.claude/skills/spec-driven-development/SKILL.md`

| Phase | Entry point |
|---|---|
| Any non-trivial work | `/new-feature <desc>` → `planner` agent |
| Implement | `/tdd <target>` → `tdd-agent` + `tdd-workflow` + `implement-note` skills |
| Verify | `verifier` agent (auto after tdd) |
| E2E | `/run-e2e <feature>` → `qa-engineer` agent |
| Bug fix | `/fix-bug <report>` (Micro Plan if single-file, SDD otherwise) |

---

## 3. Architecture Non-Negotiables — BLOCKERS

Violation = stop + flag.

1. **Tenant scoping** — every DB query MUST filter on `workspace_id` or `org_id`.
2. **Bounded context** — services communicate via HTTP API only; never share DB models across service boundaries.
3. **Auth at gateway** — only `api-gateway` validates JWT; downstream services trust injected headers.
4. **AI cost gate** — deduct or record AI usage BEFORE calling any LLM/scoring API.
5. **Assessment integrity** — never expose answer keys or scoring rubrics in client-facing responses.
6. **PII handling** — candidate data (voice/video/text responses) must be encrypted at rest; access logged.
7. **No raw SQL strings** — use GORM query builder or parameterized `db.Raw()`; no `fmt.Sprintf` in queries.
8. **Migration-first schema** — all schema changes via `golang-migrate` SQL files; no `AutoMigrate` in production code.
9. **Idempotent job processing** — all background workers must be safe to re-run (use idempotency keys).
10. **Internal services only** — assessment-engine, scoring-service not exposed to public internet.

Full rationale → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 4. Rules Index

| When editing… | Read this |
|---|---|
| Anything | [docs/CODE_CONVENTIONS.md](docs/CODE_CONVENTIONS.md) |
| Go / Gin services | `.claude/skills/tdd-workflow/SKILL.md` (Go patterns) |
| Python / FastAPI services | `.claude/skills/tdd-workflow/SKILL.md` (Python patterns) |
| Java / Spring Boot services | `.claude/skills/tdd-workflow/SKILL.md` (Java patterns) |
| Node.js / NestJS services | `.claude/skills/tdd-workflow/SKILL.md` (TS patterns) |
| DB schema / migrations | [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) |
| Frontend | Next.js App Router conventions (see `apps/portal/README.md`) |
| Tests | `.claude/skills/tdd-workflow/SKILL.md` |
| Agent workflow + SDD | `.claude/skills/spec-driven-development/SKILL.md` |
| Security | [docs/specs/_TEMPLATE/SECURITY.md](docs/specs/_TEMPLATE/SECURITY.md) |

---

## 5. Agents & Skills

Agents → `.claude/agents/` · Skills → `.claude/skills/`

Key agents: `planner` · `tdd-agent` · `explore` · `frontend-developer` · `backend-developer` · `database-architect` · `devops-engineer` · `security-auditor` · `code-reviewer` · `qa-engineer` · `doc-gardener`

Key skills: `spec-driven-development` · `writing-plans` · `tdd-workflow` · `implement-note` · `verification-loop` · `systematic-debugging` · `edd-workflow` · `observability-access`

---

## 6. Slash Commands

`/new-feature` · `/tdd` · `/fix-bug` · `/code-review` · `/security-audit` · `/run-e2e` · `/generate-migration` · `/doc-garden` · `/wrap-session`

Full command docs → `.claude/commands/`

---

## 7. Dev Cheatsheet

```bash
# Local stack
docker-compose up -d postgres redis
supabase start

# Backend (Go — per service)
cd services/api-gateway && air          # hot reload via air
cd services/workspace-service && air

# Frontend
cd apps/portal && npm install && npm run dev   # :3000

# DB migrations
migrate -path services/migrations -database "$DATABASE_URL" up
migrate -path services/migrations -database "$DATABASE_URL" down 1

# Tests
cd services/api-gateway && go test ./... -v -race
cd apps/portal && npm run test
cd apps/portal && npm run test:e2e      # Playwright

# Lint
golangci-lint run ./...                 # Go
cd apps/portal && npx tsc --noEmit && npm run lint

# Architecture checks
pre-commit run --all-files
python scripts/lint/run_all.py          # custom linters (when added)
```

Full commands → [docs/DEV_COMMANDS.md](docs/DEV_COMMANDS.md)

---

## 8. Key Artifacts

- `docs/specs/{NN}_{FEATURE}/IMPLEMENT-NOTE.md` — reasoning fingerprint; **read before modifying any feature**
- `/memories/repo/` — verified repo facts (not in git; access via memory tool)
