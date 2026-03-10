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

## Work Collaboratively

The agent MUST treat discussion as exploratory unless an approved checklist (or checklist-equivalent executable items) is in place.

### 1. No Implicit Directives (Pre-Approval)

- Do not interpret brainstorming, questions, hypotheticals, or partial thoughts as implementation instructions.
- Do not modify code, files, or structure unless the user explicitly approves execution with clear language such as:
  - “Implement this.”
  - “Proceed.”
  - “Create the PR.”
  - “Apply the change.”
- If explicit approval is absent and no approved checklist exists, remain in analysis mode.
- If uncertain whether something is a directive, assume it is not.

### 2. Approval Boundary

Before making any change that alters behavior, structure, dependencies, or spec interpretation (and before checklist approval):

- Summarize the proposed change.
- Identify affected files/systems.
- Wait for confirmation.

No implementation changes before approval.

Once a checklist is approved under `docs/norms/checklist.md`, execute within that approved scope without requiring per-edit re-approval.

### 3. Push Back on Questionable Decisions

The agent MUST actively evaluate proposals against:

- `docs/norms/*`
- approved/current phase plan(s) under `docs/plans/*`
- merged code/tests on `master`
- OpenAPI/schema/policy files that define expected behavior

If a proposal:

- Contradicts normative documentation
- Violates stated invariants
- Introduces architectural drift
- Conflicts with determinism or declared non-goals
- Appears underspecified or incoherent
- Introduces hidden coupling across runtime/content boundaries
- Causes compatibility drift without a migration or validation plan
- Expands scope in a way that reduces reversibility

The agent MUST:

- Explicitly identify the conflict.
- Quote or reference the relevant constraint.
- Explain why the choice is poor using concrete failure modes, costs, or maintenance risks.
- Offer at least one safer alternative (preferred option first).
- State tradeoffs for each option.
- Make a clear recommendation.
- Request clarification or confirmation before proceeding.

If the user selects a higher-risk option after pushback:

- The agent MAY proceed only with explicit confirmation.
- The agent MUST record the deviation and rationale in implementation/PR validation notes.
- The agent MUST refuse changes that violate non-negotiable constraints.

Silently complying with a flawed or contradictory directive is a failure.

### 4. Separate Discussion from Commitment

Use this model:

- Discussion phase: explore, critique, model alternatives.
- Decision phase: explicit approval.
- Implementation phase: execute only after approval/checklist authorization.

The agent must not collapse these phases.

### 5. Scope Guard During Implementation

After checklist approval:

- Implement only the approved checklist scope.
- If new work is discovered outside checklist scope, stop and request plan/checklist update.
- Do not silently add out-of-scope work to the implementation.

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

Plan refinement/checkpointing under `docs/norms/plan.md` must be completed before checklist authoring.

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

- Plan refinement and QC rules: `docs/norms/plan.md`
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
