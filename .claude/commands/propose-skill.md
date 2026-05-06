---
description: "Auto-propose a new skill or convention update after a non-trivial feature ships, capturing the pattern that emerged"
agent: planner
argument-hint: "Optional: feature name or path to spec just completed"
---

Close the learning loop. After a meaningful piece of work finishes, ask: **"What pattern emerged here that future features should reuse?"** If the answer is non-trivial, draft a new skill (or update an existing convention) for human review.

**Source:** $ARGUMENTS

## Trigger Conditions (run automatically OR on demand)

Propose a skill if ANY apply to the just-completed work:
- Solved a non-obvious problem that required >1 round of CPO↔CTO debate
- Introduced a pattern used in ≥2 places already (or likely to be repeated)
- Required workarounds for an external dependency / SDK quirk
- Code-reviewer caught the same BLOCKER twice in this PR
- Established a new conventions decision (e.g., always use X for Y)

If NONE apply: report "No skill-worthy pattern detected." and stop. Do NOT spam proposals.

## Workflow

### Step 1: Identify the Pattern
Read the spec, plan, and final diff. State in one sentence:
> "Future features doing X should follow pattern Y because Z."

### Step 2: Check for Duplication
- Read every existing file in `.claude/skills/` and `docs/CODE_CONVENTIONS.md`
- If the pattern is already covered: STOP. Optionally suggest a small edit to the existing skill.
- "Find, don't invent" applies here too.

### Step 3: Draft

If the pattern fits within an existing skill: propose a `str_replace` patch to that file.

If it warrants a new skill: draft to `.claude/skills/proposed/<skill-name>/SKILL.md` (note: `proposed/` not `.claude/skills/` — human approves before promotion).

Use the standard skill frontmatter:
```yaml
---
name: <skill-name>
description: "Use when <trigger>. <one-line summary>"
---
```

Body must include:
- **When to use** (trigger conditions)
- **Source** (which spec / PR / incident inspired this)
- **The pattern** (concrete code or process steps)
- **What it prevents** (the failure mode this avoids)
- **Anti-patterns** (what NOT to do)
- **Done definition**

### Step 4: Surface to User

Report:
```
📚 Skill proposal drafted.

Pattern: <one-liner>
Source: <spec / PR>
Draft: .claude/skills/proposed/<name>/SKILL.md

Action needed: review and either
  (a) accept → I'll promote to .claude/skills/<name>/ and register in config.json + CLAUDE.md
  (b) reject → I'll delete the proposal and add a note in /memories/repo/ explaining why
  (c) edit → tell me what to change
```

## Rules
- One proposal per command run
- Never auto-promote a proposal — always require user approval
- Reject your own proposal if it's just restating CLAUDE.md
- Skill descriptions must be specific — "use when X" not "use sometimes"
