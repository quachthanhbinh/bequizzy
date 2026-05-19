# BeQuizzy — Kiro Code Context

## Project Overview

BeQuizzy is a <TODO: add one-sentence project description>.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod |
| Frontend Deploy | Cloudflare Pages + Cloudflare Workers (edge middleware) |
| Backend | **Go 1.23+, Gin Framework, GORM, golang-migrate** |
| Backend Deploy | GCP Cloud Run (HTTP services), GKE Autopilot (workers), Cloud Functions 2nd gen (event-driven) |
| Database | Supabase Cloud PostgreSQL 15+ (pgvector, RLS enabled) |
| Auth | Supabase Auth — JWT, Google/Facebook OAuth, SAML SSO |
| Cache | GCP Memorystore (Redis) |
| Event Bus | GCP Cloud Pub/Sub |
| Job Scheduling | GCP Cloud Tasks + Cloud Scheduler |
| AI Router | LiteLLM → OpenAI GPT-4o-mini (fast), Kiro 3.5 Sonnet (quality), Gemini Flash (fallback) |
| Notifications | Novu → Resend (email), Twilio (SMS global), ESMS.vn (SMS Vietnam) |
| Payments | Paddle (global MoR) + payOS / MoMo / VNPay (Vietnam) |
| Storage | Cloudflare R2 (zero-egress) |
| Secrets | GCP Secret Manager |
| CI/CD | GitHub Actions + Cloud Build + Artifact Registry |

## Repository Structure

```
bequizzy/
  KIRO.md                  # ← you are here
  .kiro/
    agents/                  # Specialized sub-agents (planner, advisors, role experts)
    skills/                  # Reusable workflow skills (SDD, TDD, debugging, EDD, etc.)
    commands/                # Custom slash commands
    hooks/                   # Automation triggers
    config.json
  .agents/
    copilot-instructions.md  # GitHub Copilot context (separate)
  docs/
    ARCHITECTURE.md          # System architecture
    DATABASE_SCHEMA.md       # Schema reference
    PRD.md                   # Product requirements
    CODE_CONVENTIONS.md      # Coding standards
    specs/                   # Feature specs (SDD)
      _TEMPLATE/             # Canonical 8-file spec template
  design-system/
    globals.css              # Tokens, oklch palette (pink pastel), Tailwind v4 @theme bridge
    components.css           # 12 reusable component classes
  apps/                      # Next.js 14 frontend apps
    page/                    # Public landing page
    portal/                  # Main application portal
    api-proxy/               # Cloudflare Workers edge proxy
  services/                  # Go/Gin microservices (GCP Cloud Run)
    api-gateway/
    workspace-service/
    lead-service/
    campaign-service/
    billing-service/
    ai-service/
    notification-service/
    integration-service/
  migrations/                # golang-migrate SQL migrations
  infra/                     # Terraform (GCP resources)
  k8s/                       # Kubernetes manifests
  docker-compose.yml         # Local dev: all services + Redis + PostgreSQL
```

## Essential Commands

```bash
# Local development
docker-compose up -d                     # Start all services locally
cd apps/portal && npm run dev            # Next.js dev server

# Backend (per service)
cd services/{service-name}
air                                      # Hot reload with Air
go run main.go                           # Direct run

# Database migrations
migrate -path migrations -database "postgresql://user:pass@localhost:5432/bequizzy?sslmode=disable" up
migrate create -ext sql -dir migrations -seq create_table_name

# Tests
cd services/{service-name} && go test ./...
cd apps/portal && npm run test

# Type checks
cd apps/portal && npx tsc --noEmit

# Build & deploy (staging)
gcloud builds submit --config cloudbuild.yaml
gcloud run deploy {service} --region asia-southeast1 --project bequizzy-staging
```

## Architecture Principles (CRITICAL — read before any coding)

1. **Bounded context** — each microservice owns its own tables. Never query another service's tables directly. Use REST or Pub/Sub.
2. **Workspace scoping** — every DB query MUST include `workspace_id`. Never query without it.
3. **Transactional outbox** — write domain events to `outbox_events` atomically with business data. Never publish to Pub/Sub directly.
4. **Soft FKs across service boundaries** — use plain UUID columns (no FK constraint) when referencing tables owned by another service.
5. **Credits before AI** — every AI operation must call `billing-service` to deduct credits BEFORE executing. Never skip.
6. **Suppression check** — always verify `suppression_list` before dispatching outbound messages.
7. **No shared libraries** — services communicate via OpenAPI contracts. No shared Go packages between services.

## Code Conventions

### Backend (Go / Gin)

- Use Go 1.23+ with generics where appropriate
- Gin for HTTP routing and middleware
- GORM for database ORM with PostgreSQL driver
- All routes read `X-Workspace-ID` header (set by api-gateway) via middleware
- Service layer owns business logic; handlers only call service functions
- Use custom error types for all domain errors
- AI calls always go through `ai-service` — never call LLM SDKs directly
- Notifications always go through `notification-service` / Novu
- Log structured JSON with `workspace_id`, `service`, `trace_id` fields
- Use `context.Context` for request-scoped values and cancellation
- Follow standard Go project layout: `internal/`, `pkg/`, `cmd/`

### Frontend (Next.js / TypeScript)

- TypeScript strict mode — no `any`, no `@ts-ignore`
- All API calls through `lib/api/` typed client pointing to `api.bequizzy.com`
- API response envelope: `{ data, error, meta }`
- TanStack Query for server state; Zustand for client UI state only
- shadcn/ui components — never install duplicate UI libraries
- Tailwind CSS only — no CSS-in-JS, no inline styles
- **Pink pastel color scheme** — modern flat design with pink as primary accent
- All components must work at 375px min viewport; touch targets ≥ 44×44px
- Supabase JS client for auth token management and Realtime only

### Database

- TEXT columns for all status/type fields (no native ENUMs — easier migrations)
- JSONB for flexible config
- Append-only `events` table — never update or delete rows
- pgvector 1536-dim for RAG embeddings (text-embedding-3-small)
- All migrations via golang-migrate — never mutate schema directly

## Security Guidelines

- Never hardcode secrets; all secrets via GCP Secret Manager
- All Cloud Run services except `api-gateway` use `--ingress=internal`
- Service-to-service auth via GCP Workload Identity + OIDC tokens
- Validate `workspace_id` on every request — prevents cross-tenant data leaks
- Rate limiting via Memorystore sliding window in `api-gateway`
- Input sanitization for all user-supplied content before DB write

## AI Workflow / Agents

BeQuizzy uses a **Spec-Driven Development (SDD)** workflow with specialized agents and reusable skills. Read `.kiro/agents/` and `.kiro/skills/` for full details.

### The SDD Pipeline

```
BRAINSTORM → SPEC → REVIEW → PLAN → IMPLEMENT (TDD) → VERIFY
```

**HARD-GATE:** No implementation code is written until a spec has been reviewed and approved by the user. The Planner agent enforces this.

### Quick-Start Slash Commands

| Command | Purpose |
|---|---|
| `/new-feature <description>` | Full SDD pipeline via Planner agent |
| `/tdd <target>` | Strict Red-Green-Refactor cycle |
| `/fix-bug <report>` | Reproducer-test-first bug fix |
| `/code-review <target>` | Spec-traceable code review |
| `/security-audit <target>` | OWASP + BeQuizzy-specific audit |

### Core Principles

- **Find, don't invent** — before proposing any pattern, find an existing example in the codebase. If none, flag it explicitly.
- **Scale Hard Gate** — every design must hold at 100 workspaces × 100k users × 1M requests/month from day one.
- **Real subagent debate** — CPO and CTO are real Task calls, not internal simulations.
- **Confidence-based gating** — auto-approve only at 9–10; ask user otherwise.
- **Mandatory Verify-RED** — every test must be observed failing before you write the implementation.
- **Reproducer-first bug fixes** — never fix without a failing test that captures the bug.

## Design System

BeQuizzy uses a **modern flat pink pastel color scheme** as the primary brand identity:

- Primary: Pink pastel (`oklch(0.650 0.150 350)`)
- Accent: Pink-50 to Pink-950 scale
- Supporting colors: Green (success), Amber (warning), Red (danger), Sky (info)
- Typography: Manrope (sans), JetBrains Mono (mono)
- All design tokens in `design-system/globals.css`
