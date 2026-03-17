# Phase 06 Discovery Checklist - Svelte 4 Compatibility Discovery and Scope Lock

Status: Completed and archived

Source plan: `docs/archive/phase-06-frontend-upgrade.md`

## Execution Locks

- This checklist is limited to Phase 06 Stage 1 discovery work: dependency-path confirmation, baseline validation capture, trial upgrade evidence, and concrete finding collection.
- The completed Phase 06.1 baseline recorded in `docs/archive/phase-06-1-checklist.md` and `docs/archive/phase-06-1-validation-notes.md` is the pre-upgrade comparison point for this checklist.
- Do not modify any tests while executing this checklist.
- Before stopping on a blocking failed item, record the exact failure and its dependency impact in `docs/archive/phase-06-discovery-notes.md`.
- If an item cannot be made green and it is a dependency for later approved checklist behavior, stop and discuss with user.
- If an item cannot be made green and it is not a dependency for later approved checklist behavior, record the failure and continue.
- Output from this checklist is discovery evidence only. It does not authorize Phase 06 implementation work beyond this checklist.

## Checklist

- [x] T01 `[governance]` Confirm Phase 06 discovery scope, stop conditions, archived Phase 06.1 baseline references, and no-test-change execution rule are locked for this checklist.
  - Depends on: none.
  - Trace:
    - "The next required artifact for this phase is the Stage 1 discovery checklist" (Execution Staging)
    - "Compatibility discovery and scope lock." (Execution Staging)
    - "Do not modify any tests during upgrade implementation." (Constraints)
    - "If a checklist item cannot be made to run green: stop if the failing item is a dependency for later behavior" (Constraints)

- [x] C01 `[docs]` Create `docs/archive/phase-06-discovery-notes.md` to record baseline references, trial dependency targets, command results, breakage findings, blocker classification, and implementation-checklist readiness.
  - Depends on: T01.
  - Validation: T07.
  - Trace:
    - "Record phase-close evidence and any explicitly deferred follow-up work discovered during the upgrade." (In Scope)
    - "Treat the output of this checklist as implementation-planning evidence" (Execution Staging)
    - "The phase records approved compatibility-discovery findings and uses them to author any follow-on implementation checklist." (Acceptance Criteria)

- [x] C02 `[frontend]` Record the current Svelte-adjacent frontend dependency graph and the proposed Svelte 4 trial target path in `docs/archive/phase-06-discovery-notes.md`.
  - Depends on: T01, C01.
  - Validation: T07.
  - Trace:
    - "Audit the current frontend dependency graph and select a supported Svelte upgrade path for this phase." (In Scope)
    - "The phase records an approved Svelte 3 to Svelte 4 upgrade target/path in plain language before dependency edits begin" (Acceptance Criteria)
    - "Upgrade `svelte` from the current Svelte 3 line to the latest supported Svelte 4 release selected during implementation." (Upgrade Path Details)
    - "Upgrade `@sveltejs/vite-plugin-svelte` from the current 2.x line to a 3.x release line compatible with Vite 5 and Svelte 4." (Upgrade Path Details)

- [x] C03 `[frontend]` Apply only the trial dependency changes needed to attempt the selected Svelte 4 upgrade path, limited to Svelte/runtime/tooling packages required by the plan.
  - Depends on: C02.
  - Validation: T02, T03, T04, T05, T06.
  - Trace:
    - "Upgrade frontend framework/runtime dependencies required for the selected path." (In Scope)
    - "Upgrade or adjust any remaining Svelte-adjacent tooling only as required to restore a supported and testable Svelte 4 frontend stack." (Upgrade Path Details)
    - "The following paths are explicitly not the default for this phase: ... An `xstate` 4 to `xstate` 5 migration is out of scope" (Upgrade Path Details)

- [x] C04 `[frontend]` Record the resulting compile, runtime, unit, browser, and parity breakage set from the trial upgrade in `docs/archive/phase-06-discovery-notes.md`, including affected files/surfaces and dependency relationships between failures.
  - Depends on: C03.
  - Validation: T07.
  - Trace:
    - "Include explicit stop conditions when discovery shows the Svelte 3 to Svelte 4 path would require out-of-scope work" (Execution Staging)
    - "This staging is required because the exact breakage set is not fully knowable before the dependency change is attempted" (Execution Staging)
    - "If implementation uncovers a hard compatibility blocker for the Svelte 3 to Svelte 4 path, the blocker must be documented with concrete package/version evidence" (Upgrade Path Details)

- [x] C05 `[governance]` Classify each discovery finding in `docs/archive/phase-06-discovery-notes.md` as in-scope, out-of-scope, blocking, or non-blocking, and record whether Phase 06 can proceed to implementation checklist authoring unchanged or must return to plan refinement.
  - Depends on: C04.
  - Validation: T07.
  - Trace:
    - "Treat the output of this checklist as implementation-planning evidence, not implicit approval for follow-on code changes beyond that checklist." (Execution Staging)
    - "Author a second checklist only after the discovery findings are reviewed and approved." (Execution Staging)
    - "If the upgrade requires changing the public embed bootstrap contract, emitted artifact paths, or API usage semantics, implementation must stop and return to plan/checklist refinement." (Preserved Embed/Client Behavior)

- [x] T02 `[validation]` Run `yarn install` after the trial dependency edits and record the exact outcome in `docs/archive/phase-06-discovery-notes.md`.
  - Depends on: C03.
  - Trace:
    - "Upgrade frontend framework/runtime dependencies required for the selected path." (In Scope)
    - "prefer the lowest-risk supported target, and pin or defer incompatible packages explicitly." (Risks and Mitigations)

- [x] T03 `[validation]` Run `yarn run build:frontend` on the trial Svelte 4 dependency set and record pass/fail evidence in `docs/archive/phase-06-discovery-notes.md`.
  - Depends on: C03.
  - Trace:
    - "Frontend compiles and runs on the upgraded framework/runtime dependencies for the selected path." (Acceptance Criteria)
    - "Integration/smoke evidence: the embed/client frontend can build and run" (Validation Strategy)

- [x] T04 `[validation]` Run `yarn test:frontend` on the trial Svelte 4 dependency set and record pass/fail evidence in `docs/archive/phase-06-discovery-notes.md`.
  - Depends on: C03.
  - Trace:
    - "`yarn test:frontend` passes on the upgraded stack." (Acceptance Criteria)
    - "Unit evidence: `yarn test:frontend` passes on the upgraded stack." (Validation Strategy)

- [x] T05 `[validation]` Run the approved unchanged Phase 06.1 Cypress baseline command on the trial Svelte 4 dependency set and record pass/fail evidence in `docs/archive/phase-06-discovery-notes.md`.
  - Depends on: C03.
  - Trace:
    - "Consume the approved pre-upgrade Cypress/embed baseline recorded in Phase 06.1 Checklist and Phase 06.1 Validation Notes, and keep those flows passing on the upgraded stack." (In Scope)
    - "Integration/browser evidence: the approved Phase 06.1 Cypress baseline flows pass on the upgraded stack without modifying those tests." (Validation Strategy)
    - "The approved Phase 06.1 baseline Cypress generic/embed flows pass on the selected upgrade target" (Acceptance Criteria)

- [x] T06 `[validation]` Run `yarn run ci:local` on the trial Svelte 4 dependency set, or record the exact blocker and failure evidence in `docs/archive/phase-06-discovery-notes.md`.
  - Depends on: C03.
  - Trace:
    - "Build/parity evidence: the local parity command for the repository passes (`yarn run ci:local`), or any blocker outside this phase is documented with concrete failure evidence and explicit deferment." (Validation Strategy)
    - "`yarn run ci:local` passes, or any non-phase blocker is documented with explicit failure evidence and deferment." (Acceptance Criteria)

- [x] T07 `[validation]` Verify that `docs/archive/phase-06-discovery-notes.md` contains the exact trial target path, baseline references, command outcomes, blocker classification, stop-condition decisions, and explicit recommendation for either implementation-checklist authoring or plan refinement.
  - Depends on: C01, C02, C04, C05, T02, T03, T04, T05, T06.
  - Trace:
    - "The phase records approved compatibility-discovery findings and uses them to author any follow-on implementation checklist." (Acceptance Criteria)
    - "Author a second checklist only after the discovery findings are reviewed and approved." (Execution Staging)
    - "This staging is required because the exact breakage set is not fully knowable before the dependency change is attempted" (Execution Staging)

## Behavior Slices

- Goal: Lock discovery-only execution rules and create the findings artifact that will carry Phase 06 Stage 1 evidence.
  Items: T01, C01
  Type: mechanical

- Goal: Confirm the exact Svelte 4 trial path before attempting the upgrade.
  Items: C02
  Type: mechanical

- Goal: Attempt the trial Svelte 4 dependency path and capture objective build/test/browser/parity evidence without changing tests.
  Items: C03, T02, T03, T04, T05, T06
  Type: behavior

- Goal: Turn trial-upgrade results into explicit findings, blocker classification, and a go/no-go recommendation for implementation checklist authoring.
  Items: C04, C05, T07
  Type: mechanical
