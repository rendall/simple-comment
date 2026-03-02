# AGENTS.md

Status: active

Scope: entire repository

This file defines contributor and agent governance for this project.

## Project Deliverable

The deliverable is **Simple Comment**, a web comment platform with:

- Netlify Functions backend
- Svelte frontend embed/client
- MongoDB persistence
- OpenAPI-described HTTP API contracts

## Execution Model

This repository follows a phase workflow:

1. Plan
2. Implement
3. PR
4. Merge
5. Re-plan next phase

Reference: `docs/plans/README.md`

## Approval and Entry Conditions

Discussion does not imply implementation.

Implementation may begin only when there is an approved checklist (or checklist-equivalent section) authored under `docs/norms/checklist.md` conventions, for example:

- an approved phase plan in `docs/plans/` that includes executable checklist items
- an approved checklist document
- explicit maintainer instruction in issue/PR/thread that includes executable checklist items

If no approved checklist exists, stop and request one.

`docs/norms/implementation.md` is invoked only after checklist approval.

## Change Controls

### No silent behavior changes

Before making changes that alter behavior, architecture, public contracts, dependencies, or determinism:

- summarize the intended change
- identify affected files/surfaces
- confirm scope alignment with the approved checklist/phase

### Call out conflicts

If a request conflicts with merged code behavior, documented contracts, or approved phase scope:

- state the conflict
- explain impact/risk
- ask for direction before proceeding

### Keep phases isolated

- One phase per PR.
- No unrelated refactors in phase PRs.
- Track implementation and validation evidence in the phase/PR narrative.
- New work branches must use the intent pattern `<verb>-<optionalAdj>-<noun>` in lowercase kebab-case.

## Norms Integration

- Checklist authoring rules: `docs/norms/checklist.md`
- Implementation loop and testing expectations: `docs/norms/implementation.md`
- Program-level phase constraints: `docs/plans/README.md`

If these documents conflict, escalate and request clarification before implementation.

## Source of Truth

- Merged code and tests on `master` are authoritative.
- OpenAPI/schema and policy files define expected API-level behavior.
- Planning docs define approved scope and sequencing; they do not override merged runtime behavior without an explicit implementation phase.

## Implementation Style (Repository-Aligned)

- Prefer TypeScript for new code.
- Default style inside modules: functional-first, arrow functions over function declarations, and array methods over imperative loops when readability is equal or better.
- Preserve existing architecture boundaries. In this repo, class-based service abstractions (for extensibility/injection, e.g. DB service interfaces) are intentional and should not be refactored unless explicitly in scope.
- Preserve existing module/tooling conventions where required (for example, existing CommonJS build configs).
- Keep code and commits scoped and reviewable.
