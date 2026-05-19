# 00 — Implementation Plan — IMPLEMENTATION

**Status:** ✅ Approved
**Last updated:** 2026-05-04

## Goal
Operationalize the wave model from [DESIGN.md](DESIGN.md) so the team can execute it day-to-day without needing the eng lead to make every coordination decision.

## Governance Cadence

| Cadence | Meeting | Outputs |
|---|---|---|
| Daily | Async standup (Slack thread) | Each engineer posts: shipped yesterday / shipping today / blockers |
| Weekly | Architecture review (60 min) | ADRs reviewed + signed; cross-spec contract changes approved |
| Bi-weekly | Product acceptance (45 min) | Spec PRDs accepted; demo of shipped wave items |
| Bi-weekly | Release train | Production release every 2 weeks; rollback playbook reviewed |
| End of wave | Wave retro (90 min) | Update RESULT.md; capture lessons; revise plan if needed |
| Quarterly | Roadmap ↔ plan reconciliation | Resolve drift between ROADMAP.md and this plan |

## Release Train

- **Cadence:** every 2 weeks (Tuesday production deploy)
- **Cut:** Friday before; full regression Monday; deploy Tuesday morning
- **Hotfix policy:** allowed any day, must be behind a feature flag if changing user-visible behaviour
- **Rollback policy:** any risky integration MUST ship behind a feature flag (spec 23); rollback = flag flip + hotfix if needed

## Per-Wave Workflow

Every wave follows this sequence:

```
1. Plan kickoff (60 min)
   - Confirm specs in scope vs DESIGN.md wave assignment
   - Confirm Track F items that gate this wave
   - Assign owners to each spec
   - Assign cross-cutting reviewers (security-auditor, code-reviewer)

2. Spec execution (parallel)
   - Each spec follows SDD: Brainstorm → Spec → Plan → TDD Implement → Verify
   - Owner runs /new-feature workflow if spec needs new design surface
   - Code-reviewer runs /code-review at PR time
   - Security-auditor runs /security-audit before merging anything 🟡 or 🔴

3. Wave exit gate (TESTS.md)
   - Run all wave-level integration tests
   - Verify all 10 cross-cutting requirements
   - Sign-off from PM (acceptance) + Eng Lead (technical) + Security

4. Wave retro
   - Update RESULT.md with shipped vs planned
   - Surface lessons; propose new skills via /propose-skill
   - Adjust next wave if needed
```

## Cross-Cutting Enforcement

| Requirement | How enforced | Owner |
|---|---|---|
| Workspace scope | grep CI rule + code-reviewer agent | code-reviewer |
| Outbox pattern | code-reviewer agent | code-reviewer |
| Credits before AI | code-reviewer agent + integration tests | ai-service owner |
| Suppression check | integration tests | outreach-service owner |
| Structured logs | CI lint rule | devops |
| Security review | security-auditor agent on every 🟡/🔴 spec | security-auditor |
| 90% coverage | CI gate | per-service owner |
| Accessibility | axe-core in CI + manual 375px audit | frontend lead |
| Migration roundtrip | CI gate | per-service owner |
| Feature flag | code-reviewer agent | code-reviewer |

## Definition of Done (per spec)

- [ ] Spec folder has all 8 files
- [ ] PRD reviewed by PM
- [ ] DESIGN reviewed by Eng Lead
- [ ] SECURITY reviewed by security-auditor (BLOCKER count = 0)
- [ ] Implementation merged + tests at coverage target
- [ ] Migration roundtrip passes
- [ ] Cross-cutting requirements satisfied
- [ ] Phase 4 launched (or current phase per IMPLEMENTATION.md)
- [ ] RESULT.md populated within 30 days post-launch

## Definition of Done (per wave)

- [ ] All in-scope specs at DoD
- [ ] Wave exit gate tests pass (TESTS.md)
- [ ] Track F items gating this wave at DoD
- [ ] PM + Eng Lead + Security sign-off
- [ ] RESULT.md updated
- [ ] Wave retro held

## Risks & Mitigations
See [DESIGN.md § Risk Register](DESIGN.md). Reviewed at every wave kickoff.

## Tools
- **Spec authoring:** `/new-feature` slash command + `spec-driven-development` skill
- **Implementation:** `/tdd` + `tdd-agent` + `tdd-workflow` skill
- **Bug fixing:** `/fix-bug` + `systematic-debugging` skill
- **Reviews:** `/code-review`, `/security-audit`
- **Memory:** `/insights` to summarize cross-session lessons; `/propose-skill` to capture patterns
- **Project tracking:** GitHub Projects (one column per wave)

## Done Criteria for THIS spec
- [ ] All 28 specs have explicit wave + dependency assignments
- [ ] Each wave has documented entry + exit gates
- [ ] RESULT.md template in place; updated weekly
- [ ] First wave kicked off with this plan as the input doc
