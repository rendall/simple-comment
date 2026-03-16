# Phase 06.1 Checklist - Cypress Embed Baseline and Contract Alignment

Status: Completed

Source plan: `docs/plans/phase-06-1-cypress-embed-baseline.md`

## Execution Locks

- Phase 06.1 evidence levels are locked to plan `Validation Strategy`: `Browser/integration`, `Smoke/contract`, and `Documentation/traceability`.
- `#simple-comment` is the embed host-element contract for this phase.
- Frontend dependency upgrades and broad Cypress expansion remain out of scope.

## Checklist

- [x] T01 `[governance]` Confirm Phase 06.1 scope, embed contract, and validation evidence levels are locked for execution.
  - Depends on: none.
  - Trace:
    - "Establish a pre-upgrade Cypress/embed validation baseline for the current frontend and align documentation and test assumptions to the `#simple-comment` embed contract" (Goal)
    - "Treat `#simple-comment` as the embed host-element contract for this phase" (Constraints)
    - "the evidence must show both current-browser behavior and documentation/test alignment" (Validation Strategy)

- [x] C01 `[docs]` Align embed contract references in `README.md` and `docs/CYPRESS.md` to the `#simple-comment` host-element contract and current Cypress layout/config conventions.
  - Depends on: T01.
  - Validation: T04.
  - Trace:
    - "Align repository documentation and Cypress assumptions that still refer to `#simple-comment-display` so they match the `#simple-comment` contract." (In Scope)
    - "Repository documentation and Cypress assumptions are aligned to the `#simple-comment` embed contract." (Acceptance Criteria)

- [x] C02 `[cypress]` Audit the current generic Cypress spec inventory in `cypress/e2e/generic` against the five approved baseline flows and record file ownership, known gaps, and setup constraints in `docs/archive/phase-06-1-validation-notes.md`.
  - Depends on: T01.
  - Validation: T04.
  - Trace:
    - "Audit existing Cypress frontend coverage and select the minimum generic/embed validation flows needed as the pre-upgrade baseline." (In Scope)
    - "Record any explicitly deferred flows, known gaps, or setup constraints discovered during this baseline work." (In Scope)
    - "The phase records an approved minimal Cypress/embed baseline flow set for pre-upgrade validation." (Acceptance Criteria)

- [x] C03 `[cypress]` Restore Cypress 12 baseline execution by adding a supported `cypress/support/e2e` file or equivalent config in `cypress.config.ts`, and record the chosen approach in `docs/archive/phase-06-1-validation-notes.md`.
  - Depends on: C01, C02.
  - Validation: T03.
  - Trace:
    - "Implement, refresh, or repair the selected Cypress flows against the current frontend behavior." (In Scope)
    - "Current Cypress 12 execution fails before running specs unless the repository provides a supported `cypress/support/e2e` file or explicitly disables the support file in config." (Inputs and Evidence)

- [x] C04 `[cypress]` Implement or repair the auto-init mount and discussion-load baseline flow in `cypress/e2e/generic/basic.cy.js`.
  - Depends on: C01, C02, C03.
  - Validation: T03.
  - Trace:
    - "Implement, refresh, or repair the selected Cypress flows against the current frontend behavior." (In Scope)
    - "Auto-init mount and discussion load." (Detailed Planning Notes)

- [x] C05 `[cypress]` Implement or repair the configured discussion bootstrap baseline flow in `cypress/e2e/generic/basic.cy.js`.
  - Depends on: C01, C02, C03.
  - Validation: T03.
  - Trace:
    - "Implement, refresh, or repair the selected Cypress flows against the current frontend behavior." (In Scope)
    - "Configured discussion bootstrap flow." (Detailed Planning Notes)

- [x] C06 `[cypress]` Implement or repair the comment submission baseline flow in `cypress/e2e/generic/public-comment.cy.js`.
  - Depends on: C01, C02, C03.
  - Validation: T03.
  - Trace:
    - "Implement, refresh, or repair the selected Cypress flows against the current frontend behavior." (In Scope)
    - "Comment submission flow." (Detailed Planning Notes)

- [x] C07 `[cypress]` Implement or repair the reply submission baseline flow in `cypress/e2e/generic/reply.cy.js`.
  - Depends on: C01, C02, C03.
  - Validation: T03.
  - Trace:
    - "Implement, refresh, or repair the selected Cypress flows against the current frontend behavior." (In Scope)
    - "Reply submission flow." (Detailed Planning Notes)

- [x] C08 `[cypress]` Implement or repair the authenticated login/verify baseline flow in `cypress/e2e/generic/login.cy.js`.
  - Depends on: C01, C02, C03.
  - Validation: T03.
  - Trace:
    - "Implement, refresh, or repair the selected Cypress flows against the current frontend behavior." (In Scope)
    - "Authenticated login/verify flow." (Detailed Planning Notes)
    - "any excluded or optional flow is documented with a concrete reason and explicit deferment." (Acceptance Criteria)

- [x] T02 `[validation]` Run the existing frontend artifact and embed smoke checks on the current frontend after documentation and Cypress baseline alignment work, and record results in `docs/archive/phase-06-1-validation-notes.md`.
  - Depends on: C01, C04, C05, C06, C07, C08.
  - Trace:
    - "existing frontend artifact and embed smoke checks continue to pass on the current frontend after any test/documentation alignment work." (Validation Strategy)
    - "Existing frontend artifact and smoke tooling already validate required built outputs and embed wiring outside Cypress." (Inputs and Evidence)

- [x] T03 `[validation]` Run the approved baseline Cypress/embed flows on the current pre-upgrade frontend and record pass/fail evidence, setup constraints, and any explicit deferments in `docs/archive/phase-06-1-validation-notes.md`.
  - Depends on: C03, C04, C05, C06, C07, C08.
  - Trace:
    - "the approved baseline Cypress/embed flows pass on the current pre-upgrade frontend." (Validation Strategy)
    - "The approved required baseline flows pass against the current frontend, and any excluded or optional flow is documented with a concrete reason and explicit deferment." (Acceptance Criteria)
    - "Capture baseline validation evidence that Phase 06 will use when verifying the Svelte 3 to Svelte 4 upgrade." (In Scope)

- [x] T04 `[validation]` Verify documentation and Cypress assumptions consistently describe the `#simple-comment` embed contract and that the approved baseline flow ownership is recorded for Phase 06 handoff.
  - Depends on: C01, C02.
  - Trace:
    - "Documentation/traceability evidence: repository documentation and Cypress assumptions that describe the embed host element align to the `#simple-comment` contract." (Validation Strategy)
    - "Baseline validation evidence is recorded in a form that Phase 06 can quote and reuse." (Acceptance Criteria)

## Behavior Slices

- Goal: Lock Phase 06.1 scope, embed contract, and baseline-flow ownership before changing docs or tests.
  Items: T01, C02
  Type: mechanical

- Goal: Align repository documentation to the current `#simple-comment` embed contract.
  Items: C01, T04
  Type: mechanical

- Goal: Establish the approved browser baseline for core embed, bootstrap, comment, reply, and login/verify behavior.
  Items: C03, C04, C05, C06, C07, C08, T03
  Type: behavior

- Goal: Preserve existing non-Cypress artifact and embed smoke evidence alongside the new browser baseline.
  Items: T02
  Type: behavior
