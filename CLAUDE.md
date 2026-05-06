# BeQuizzy — Claude Code Context

## Project Overview

BeQuizzy is a <TODO: add one-sentence project description>.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | <e.g. Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui> |
| Backend | <e.g. Python 3.12+, FastAPI (async), Pydantic v2, SQLAlchemy 2.0, Alembic> |
| Database | <e.g. PostgreSQL (Supabase)> |
| Auth | <e.g. Supabase Auth — JWT, OAuth> |
| Hosting | <e.g. Vercel (frontend) + Railway (backend)> |

## Repository Structure

```
bequizzy/
  CLAUDE.md                  # ← you are here
  .claude/
    agents/                  # Specialized sub-agents (planner, advisors, role experts)
    skills/                  # Reusable workflow skills (SDD, TDD, debugging, EDD, etc.)
    commands/                # Custom slash commands
    hooks/                   # Automation triggers
    config.json
  .agents/
    copilot-instructions.md  # GitHub Copilot context (separate)
  docs/
    ARCHITECTURE.md          # TODO: System architecture
    DATABASE_SCHEMA.md       # TODO: Schema reference
    PRD.md                   # TODO: Product requirements
    CODE_CONVENTIONS.md      # TODO: Coding standards
    specs/                   # Feature specs (SDD)
      _TEMPLATE/             # Canonical 8-file spec template
```

## Essential Commands

```bash
# TODO: add your dev commands
# e.g.
# npm run dev        # start frontend
# uvicorn app.main:app --reload  # start backend
```

## Code Conventions

<!-- TODO: fill in when you define your conventions -->

## AI Workflow

This project uses **Spec-Driven Development (SDD)**. Every non-trivial feature goes through:

```
BRAINSTORM → SPEC → REVIEW → PLAN → IMPLEMENT (TDD) → VERIFY
```

**Entry point:** use `/new-feature` command (invokes the `planner` agent).

Key workflow files:
- `.claude/agents/` — role agents (planner, cpo-advisor, cto-advisor, tdd-agent, etc.)
- `.claude/commands/` — slash commands (/new-feature, /tdd, /fix-bug, /code-review, etc.)
- `.claude/skills/` — reusable workflow skills
- `.claude/hooks/` — pre/post tool-call guards
- `docs/specs/_TEMPLATE/` — 8-file spec template
