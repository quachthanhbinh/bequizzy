---
description: "Summarize what we've shipped recently across docs/specs/, docs/plans/, and git log to give planner cross-session memory"
argument-hint: "Optional: --days N (default 14) or a specific service name"
---

Generate a "what we've built recently" summary so the planner can avoid re-designing solved problems and the team can spot patterns.

**Scope:** $ARGUMENTS

## Inputs to Scan

1. **`docs/specs/`** — all spec files modified within the window. Extract: feature name, service(s), confidence score, security flag, status.
2. **`docs/plans/`** — all plan files within window. Extract: completed task count, blocked tasks, deferred work.
3. **`git log --since="N days ago"`** — commits grouped by service. Extract: feat/fix/refactor counts, files churned most.
4. **`docs/CHANGELOG.md`** if present — shipped features.
5. **Recent code-reviewer findings** if logged — recurring BLOCKER patterns.

## Output Format

Write to `docs/insights/YYYY-MM-DD-insights.md`:

```markdown
# RevLooper Insights — Last N Days

**Generated:** YYYY-MM-DD
**Window:** YYYY-MM-DD to YYYY-MM-DD

## Shipped Features (specs marked Approved + plans completed)
- **<feature>** [services: a, b] — confidence X/10, security 🟢/🟡/🔴
  - Key pattern: <one-liner>
- ...

## In-Flight (specs Draft or In Review)
- ...

## Blocked / Deferred
- ...

## Hot Services (most-churned this window)
| Service | Commits | Files | Primary work |
|---|---|---|---|
| ... |

## Recurring Patterns Worth Codifying
- Pattern X appeared in N specs → consider extracting to a shared skill / convention
- Anti-pattern Y caught in M reviews → consider adding to pre-tool-call hook

## Open Loops (problems specs left unsolved)
- ...

## Pointers for Next Planner Run
> When user asks for feature touching <area>, first read:
> - <relevant prior spec>
> - <relevant skill>
> - <reference implementation in services/...>
```

## Rules
- Use ONLY existing repo data. No invented metrics.
- If a recurring pattern appears in ≥3 specs, suggest creating a skill via `/propose-skill`.
- If a security finding appears in ≥2 reviews, suggest tightening the pre-tool-call hook.
- Keep the report short — a planner should be able to scan it in 60 seconds.
