# Phase 06 Implementation Checklist - Svelte 4 Frontend Upgrade

Status: Approved

Source plan: `docs/plans/phase-06-frontend-upgrade.md`

## Execution Locks

- This checklist is limited to Phase 06 Stage 2 implementation work supported by the approved discovery findings in `docs/plans/phase-06-discovery-notes.md`.
- Discovery established that the Svelte 4 trial dependency set installs and builds, the unchanged Phase 06.1 browser baseline passes, and the first in-phase implementation blockers are `D03` and `D04`; this checklist resumes from those findings and carries forward the remaining required phase validation work.
- Do not modify any tests while executing this checklist.
- If a checklist item cannot be made green and it is a dependency for later approved checklist behavior, stop and discuss with user.
- If a checklist item cannot be made green and it is not a dependency for later approved checklist behavior, record the failure and continue.
- If implementation work reveals a need to change the public embed bootstrap contract, emitted artifact paths, API usage semantics, or frontend dependency scope beyond the approved Svelte 4 path, stop and return to plan/checklist refinement.

## Checklist

- [x] T01 `[governance]` Confirm that this checklist is limited to the approved Stage 2 implementation scope, the recorded discovery findings in `docs/plans/phase-06-discovery-notes.md` with `D03` and `D04` as the first in-phase blocking work items, `D05` as the already-green browser baseline evidence, the archived Phase 06.1 baseline artifacts, and the no-test-change execution rule.
  - Depends on: none.
  - Trace:
    - "Implementation against approved findings." (Execution Staging)
    - "Limit implementation items to work directly supported by the approved discovery outputs and the existing phase scope." (Execution Staging)
    - "Do not modify any tests during upgrade implementation." (Constraints)

- [ ] C00 `[docs]` Create `docs/plans/phase-06-validation-notes.md` as the Stage 2 implementation evidence artifact for final dependency-path confirmation, validation command outcomes, known warnings, and any explicitly approved deferments.
  - Depends on: T01.
  - Validation: T06.
  - Trace:
    - "Record phase-close evidence and any explicitly deferred follow-up work discovered during the upgrade." (In Scope)
    - "Contributor documentation reflects the upgraded frontend stack, workflow, and any approved follow-up constraints." (Acceptance Criteria)

- [ ] C01 `[frontend]` Restore frontend Jest compatibility with Svelte 4's ESM runtime imports by updating the frontend Jest config/transform path and any directly required supporting config files so `src/tests/frontend/svelte-stores.test.ts` can execute without changing tests.
  - Depends on: T01, C00.
  - Validation: T02.
  - Trace:
    - "Make only the frontend code changes required to restore compile-time and runtime compatibility and satisfy the approved Phase 06.1 validation evidence." (In Scope)
    - "Frontend compiles and runs on the upgraded framework/runtime dependencies for the selected path." (Acceptance Criteria)
    - "`yarn test:frontend` passes on the upgraded stack." (Acceptance Criteria)

- [ ] C02 `[frontend]` Update `threadComments` in [src/frontend-utilities.ts](/mnt/c/workspace/projects/simple-comment/src/frontend-utilities.ts) so removing stale child state preserves the existing optional `replies` shape instead of materializing empty `replies: []` arrays on leaf nodes.
  - Depends on: T01, C00.
  - Validation: T02.
  - Trace:
    - "Make only the frontend code changes required to restore compile-time and runtime compatibility and satisfy the approved Phase 06.1 validation evidence." (In Scope)
    - "Preserve existing embed/client behavior and API usage semantics while upgrading." (In Scope)
    - "Embed/client behavior remains compatible with existing API usage patterns and current backend contracts." (Acceptance Criteria)

- [ ] T02 `[validation]` Run `yarn test:frontend` on the Svelte 4 implementation state and record pass/fail evidence in `docs/plans/phase-06-validation-notes.md`.
  - Depends on: C01, C02.
  - Trace:
    - "Unit evidence: `yarn test:frontend` passes on the upgraded stack." (Validation Strategy)
    - "`yarn test:frontend` passes on the upgraded stack." (Acceptance Criteria)

- [ ] T03 `[validation]` Run `yarn run build:frontend` on the Svelte 4 implementation state and record pass/fail evidence in `docs/plans/phase-06-validation-notes.md`.
  - Depends on: C01, C02.
  - Trace:
    - "Frontend compiles and runs on the upgraded framework/runtime dependencies for the selected path." (Acceptance Criteria)
    - "Integration/smoke evidence: the embed/client frontend can build and run" (Validation Strategy)

- [ ] T04 `[validation]` Run the approved unchanged Phase 06.1 Cypress baseline command on the Svelte 4 implementation state and record pass/fail evidence in `docs/plans/phase-06-validation-notes.md`.
  - Depends on: T02, T03.
  - Trace:
    - "Consume the approved pre-upgrade Cypress/embed baseline recorded in [Phase 06.1 Checklist](../archive/phase-06-1-checklist.md) and [Phase 06.1 Validation Notes](../archive/phase-06-1-validation-notes.md), and keep those flows passing on the upgraded stack." (In Scope)
    - "Integration/browser evidence: the approved Phase 06.1 Cypress baseline flows pass on the upgraded stack without modifying those tests." (Validation Strategy)
    - "The approved Phase 06.1 baseline Cypress generic/embed flows pass on the selected upgrade target" (Acceptance Criteria)

- [ ] T05 `[validation]` Run `yarn run ci:local` on the Svelte 4 implementation state, or record the exact non-phase blocker and deferment evidence in `docs/plans/phase-06-validation-notes.md` if it cannot be made green within this phase.
  - Depends on: T02, T03.
  - Trace:
    - "Build/parity evidence: the local parity command for the repository passes (`yarn run ci:local`), or any blocker outside this phase is documented with concrete failure evidence and explicit deferment." (Validation Strategy)
    - "`yarn run ci:local` passes, or any non-phase blocker is documented with explicit failure evidence and deferment." (Acceptance Criteria)

- [ ] C03 `[docs]` Update contributor-facing frontend documentation and `docs/plans/phase-06-validation-notes.md` to reflect the final approved Svelte 4 stack, execution constraints, validation outcomes, and any explicitly deferred non-phase blockers discovered during implementation.
  - Depends on: T02, T03, T04, T05.
  - Validation: T06.
  - Trace:
    - "Update contributor-facing frontend documentation to reflect the upgraded stack, commands, and known constraints." (In Scope)
    - "Record phase-close evidence and any explicitly deferred follow-up work discovered during the upgrade." (In Scope)
    - "Contributor documentation reflects the upgraded frontend stack, workflow, and any approved follow-up constraints." (Acceptance Criteria)

- [ ] T06 `[validation]` Verify that [phase-06-validation-notes.md](/mnt/c/workspace/projects/simple-comment/docs/plans/phase-06-validation-notes.md) records the final Svelte 4 dependency path, passing unit/build/browser evidence, `ci:local` outcome, carried-forward discovery warnings, and any explicitly approved deferments needed for phase close.
  - Depends on: C03.
  - Trace:
    - "Record phase-close evidence and any explicitly deferred follow-up work discovered during the upgrade." (In Scope)
    - "Contributor documentation reflects the upgraded frontend stack, workflow, and any approved follow-up constraints." (Acceptance Criteria)

## Behavior Slices

- Goal: Lock the implementation stage to approved discovery outputs and no-test-change execution.
  Items: T01, C00
  Type: mechanical

- Goal: Restore the two known unit-level blockers on the Svelte 4 stack without expanding phase scope.
  Items: C01, C02, T02
  Type: behavior

- Goal: Reconfirm build, browser-baseline, and parity evidence on the repaired Svelte 4 implementation state.
  Items: T03, T04, T05
  Type: behavior

- Goal: Record the final Svelte 4 implementation outcome and phase-close constraints for contributors.
  Items: C03, T06
  Type: mechanical
