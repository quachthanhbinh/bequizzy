---
description: "Compress a long debate / spec transcript into a concise convergence summary for handoff to the next phase"
argument-hint: "Path to spec or debate transcript to compress (default: most recent in docs/specs/)"
---

Compress a long Spec-Driven Development artifact (debate transcript, research dump, multi-round spec draft) down to its essential signal so the next agent invocation reads ~1k tokens instead of ~20k.

**Target:** $ARGUMENTS

## What to Keep (signal)
- Final decision / converged design
- Top 3 trade-offs that mattered
- Confidence score and the reason for it
- Open questions still unresolved
- Any explicit user instruction
- Dissenting concerns that capped confidence (e.g., CTO scale concern)

## What to Drop (noise)
- Round 1 reasoning that was superseded by later rounds
- Restated context (assume reader has CLAUDE.md + spec template loaded)
- Repeated boilerplate from agent personas
- Code examples already canonical in skills

## Output Format

Write to `<original-path>.compact.md`:

```markdown
# [Feature] — Compact Summary

**Source:** <original path>
**Compressed:** YYYY-MM-DD
**Original length:** N tokens / lines
**Compact length:** M tokens / lines

## Decision
<2–3 sentences>

## Confidence: X/10
**Why not 10:** <one-liner>

## Top Trade-offs Considered
1. **<option A> vs <option B>** — chose A because <reason>
2. ...
3. ...

## Architecture
<text-flow diagram, services involved>

## RevLooper Non-Negotiables Addressed
- workspace_id scope: <how>
- Outbox events: <which>
- Credits/suppression/consent: <how if applicable>

## Open Questions
- ...

## User Instructions Captured
- ...

## Pointers
- Full spec: <path>
- Plan: <path>
- Related code: <paths>
```

## Rules
- Never compress an APPROVED spec — only debates, drafts, transcripts
- Preserve every BLOCKER raised in security/code review
- If unsure whether to drop something, keep it
- Cite the original path so reviewers can drill in
