# BeQuizzy — GitHub Copilot Instructions

## Project Overview
BeQuizzy is a <TODO: add one-sentence project description>.

## Tech Stack
<!-- TODO: fill in your actual tech stack -->
- **Frontend:** <framework, e.g. Next.js 14+, TypeScript, Tailwind CSS>
- **Backend:** <framework, e.g. Python FastAPI / Node.js Express>
- **Database:** <e.g. PostgreSQL via SQLAlchemy + Alembic>
- **Auth:** <e.g. Supabase Auth / NextAuth>
- **Hosting:** <e.g. Vercel / Railway>

## Code Conventions
<!-- TODO: fill in your project conventions -->
- Use TypeScript strict mode; no `any` types
- All API responses follow `{ data, error, meta }` envelope
- Error handling: use custom `AppError` class with `code`, `message`, `status_code`

## Domain Concepts
<!-- TODO: define key domain terms for your project -->
- **<Entity>:** <definition>

## Folder Structure
<!-- TODO: document your actual folder structure -->
```
<project>/
  frontend/   # Next.js app
  backend/    # API server
  docs/       # Architecture, specs, plans
```

## What to Avoid
<!-- TODO: list anti-patterns specific to this project -->
- Do not add features outside the core product scope

## AI Workflow
This project uses Spec-Driven Development (SDD). See `.claude/` for:
- Agents: planner, cpo-advisor, cto-advisor, tdd-agent, code-reviewer, security-auditor, etc.
- Skills: spec-driven-development, tdd-workflow, verification-loop, writing-plans, etc.
- Commands: /new-feature, /tdd, /fix-bug, /code-review, /security-audit, etc.
