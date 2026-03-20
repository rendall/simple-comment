# Priority 3 Checklist 01 — Test Suite Signal Quality

Status: active

Source plan: `docs/plans/Priority3TestSuiteSignalQualityPlan.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Remove tests already identified by the survey as clear placeholders or redundant duplicates." (In Scope)
- In scope anchor: "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
- In scope anchor: "Preserve performance-oriented test intent where the survey identified valuable non-functional coverage, but replace wall-clock-sensitive assertions with more deterministic checks when feasible." (In Scope)
- In scope anchor: "Update survey/checklist traceability as implementation decisions are made so future reviewers can understand why a test was kept, replaced, or removed." (In Scope)
- Out-of-scope anchor: "Runtime or API behavior changes whose purpose is not test-signal cleanup." (Out of Scope)
- Out-of-scope anchor: "CI gate expansion, CI policy changes, or redefining the authoritative validation set." (Out of Scope)
- Acceptance anchor: "Tests marked `Remove` in the approved checklist are removed only when they are placeholder or redundant and no meaningful protection is lost." (Acceptance Criteria)
- Acceptance anchor: "Tests marked `Replace` in the approved checklist are rewritten so the resulting assertion is more behavior-oriented, more deterministic, or more accurately named than the baseline." (Acceptance Criteria)
- Acceptance anchor: "The current survey `Investigate` items are not mixed into the first implementation checklist; they are tracked as a follow-on slice with written rationale." (Acceptance Criteria)
- Acceptance anchor: "Broad regression validation passes after implementation, or any blocker is documented explicitly in validation notes." (Acceptance Criteria)

## Atomic Checklist Items

- [x] C00 `[docs]` Create `docs/checklists/Priority3TestSuiteSignalQualityChecklist01Validation.md` with sections for removed rows, replaced rows, deterministic-performance substitutions, regression command results, and blockers so every later checklist item has a live traceability destination.
  - Depends on: none.
  - Validation: T10, T11.
  - Trace:
    - "Update survey/checklist traceability as implementation decisions are made so future reviewers can understand why a test was kept, replaced, or removed." (In Scope)
    - "Survey-driven decisions remain traceable through the implementation checklist and validation notes." (Validation Strategy)

- [x] C01 `[frontend]` Remove the placeholder arithmetic test file `src/tests/frontend/hello-world.test.ts` without introducing replacement coverage.
  - Depends on: none.
  - Validation: T01, T02, T11.
  - Trace:
    - "Remove tests already identified by the survey as clear placeholders or redundant duplicates." (In Scope)
    - "Tests marked `Remove` in the approved checklist are removed only when they are placeholder or redundant and no meaningful protection is lost." (Acceptance Criteria)

- [x] C02 `[backend]` Remove the duplicate `validateUserId` rows and the indirect `normalizeUrl` rows from `src/tests/backend/utilities.test.ts` while preserving the file's remaining unique helper coverage.
  - Depends on: none.
  - Validation: T01, T02, T11.
  - Trace:
    - "Remove tests already identified by the survey as clear placeholders or redundant duplicates." (In Scope)
    - "Do not silently weaken protection when removing tests; any removed test must either be genuinely redundant/placeholder or be paired with replacement coverage when the survey calls for `Replace`." (Constraints)

- [x] C03 `[backend]` Remove the low-signal negative-property row from `src/tests/backend/api.test.ts` that only proves a random missing `AbstractDbService` property is undefined.
  - Depends on: none.
  - Validation: T01, T02, T11.
  - Trace:
    - "Remove tests already identified by the survey as clear placeholders or redundant duplicates." (In Scope)
    - "The dominant current quality issues are: ... generated/per-entry test patterns that create maintenance noise without proportional confidence." (Current Baseline)

- [x] C04 `[backend]` Remove the duplicate admin success-path `GET /user/{userId}` row from `src/tests/backend/MongodbService.test.ts`.
  - Depends on: none.
  - Validation: T01, T02, T11.
  - Trace:
    - "Remove tests already identified by the survey as clear placeholders or redundant duplicates." (In Scope)
    - "Tests marked `Remove` in the approved checklist are removed only when they are placeholder or redundant and no meaningful protection is lost." (Acceptance Criteria)

- [x] C05 `[backend]` Rewrite `src/tests/backend/crypt.test.ts` so the `getExpirationTime` and auth-token rows use deterministic contract assertions instead of wall-clock or calendar-coupled checks.
  - Depends on: none.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "Prefer deterministic assertions over wall-clock, timing-threshold, or environment-speed-sensitive assertions." (In Scope)

- [x] C06 `[backend]` Replace the lossy property-existence checks in `src/tests/backend/api.test.ts` with explicit OpenAPI route-and-method to `AbstractDbService` mapping assertions.
  - Depends on: C03.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "For affected seams such as auth token creation, env bootstrap, OpenAPI/service parity... replacement tests still protect the same intended contract in clearer terms." (Validation Strategy)

- [x] C07 `[backend]` Rewrite the undefined-contact row in `src/tests/backend/SendGridNotificationService.test.ts` so it actually exercises missing moderator-contact input instead of duplicating the empty-array case.
  - Depends on: none.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about." (Validation Strategy)

- [x] C08 `[backend]` Rewrite the send-failure row in `src/tests/backend/SendGridNotificationService.test.ts` so it deterministically asserts the failure contract instead of under-specifying the mocked send outcome.
  - Depends on: none.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about." (Validation Strategy)

- [x] C09 `[backend]` Rewrite the multi-recipient happy-path row in `src/tests/backend/SendGridNotificationService.test.ts` so it asserts the outbound payload contract for each moderator recipient.
  - Depends on: none.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about." (Validation Strategy)

- [x] C10 `[backend]` Rewrite `src/tests/backend/policyEnforcement.test.ts` so the guest-comment policy rows use behavior-specific names that clearly describe the `Action.postComment` contract they assert.
  - Depends on: none.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Improve test naming where current copy does not match the asserted behavior." (In Scope)
    - "Tests marked `Replace` in the approved checklist are rewritten so the resulting assertion is more behavior-oriented, more deterministic, or more accurately named than the baseline." (Acceptance Criteria)

- [ ] C11 `[backend]` Replace the final row in `src/tests/backend/setup-env.contract.test.ts` with a bootstrap-level assertion that actually proves `setup-env.ts` uses the shared sensitive-key classifier during env initialization.
  - Depends on: none.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)
    - "Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about." (Validation Strategy)

- [ ] C12 `[backend]` Replace the random-input email rows in `src/tests/backend/utilities.test.ts` with fixed representative email assertions that preserve helper coverage without test-data noise.
  - Depends on: C02.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "The dominant current quality issues are: ... generated/per-entry test patterns that create maintenance noise without proportional confidence." (Current Baseline)

- [ ] C13 `[backend]` In `src/tests/backend/MongodbService.test.ts`, replace the brittle auth-token rows with self-contained decoded-claim assertions instead of time-sensitive token-prefix comparisons.
  - Depends on: C04.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "The dominant current quality issues are: ... hidden order dependence across larger integration suites." (Current Baseline)

- [ ] C14 `[backend]` In `src/tests/backend/MongodbService.test.ts`, replace the order-dependent duplicate-user, duplicate-comment, and descendant-delete rows with self-contained behavior checks.
  - Depends on: C04.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "The dominant current quality issues are: ... hidden order dependence across larger integration suites." (Current Baseline)

- [ ] C15 `[backend]` In `src/tests/backend/MongodbService.test.ts`, replace the stale or overclaimed topic/comment rows so the test names and assertions match the actual contract being checked.
  - Depends on: C13, C14.
  - Validation: T03, T04, T05, T11.
  - Trace:
    - "Improve test naming where current copy does not match the asserted behavior." (In Scope)
    - "Tests marked `Replace` in the approved checklist are rewritten so the resulting assertion is more behavior-oriented, more deterministic, or more accurately named than the baseline." (Acceptance Criteria)

- [ ] C16 `[frontend]` Replace the numbered repetition rows in `src/tests/frontend/blockies.test.ts` with concise fixed-sequence assertions that keep the same deterministic seeded-output contract.
  - Depends on: none.
  - Validation: T06, T07, T08, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)

- [ ] C17 `[frontend]` Replace the `definition.states...on` structure checks in `src/tests/frontend/discussion.xstate.test.ts` with workflow-behavior assertions that stay tied to the discussion state machine contract.
  - Depends on: none.
  - Validation: T06, T07, T08, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "Prefer behavior-level assertions over test assertions tied to internal implementation shape when both are feasible." (Constraints)

- [ ] C18 `[frontend]` Replace the `definition.states...on` structure checks in `src/tests/frontend/login.xstate.test.ts` with workflow-behavior assertions that stay tied to the login state machine contract.
  - Depends on: none.
  - Validation: T06, T07, T08, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "Prefer behavior-level assertions over test assertions tied to internal implementation shape when both are feasible." (Constraints)

- [ ] C19 `[frontend]` Replace the wall-clock and real-timer rows in `src/tests/frontend/frontend-utilities.test.ts` with deterministic timing/performance assertions that keep the performance intent without depending on machine-speed thresholds.
  - Depends on: none.
  - Validation: T06, T07, T08, T11.
  - Trace:
    - "Preserve performance-oriented test intent where the survey identified valuable non-functional coverage, but replace wall-clock-sensitive assertions with more deterministic checks when feasible." (In Scope)
    - "Pass: retained performance-oriented coverage no longer depends on brittle wall-clock assertions when a deterministic alternative exists." (Validation Strategy)

- [ ] C20 `[backend]` Consolidate the row-per-key and row-per-sensitive-key coverage in `src/tests/backend/secrets.test.ts` into clearer aggregated bootstrap parity assertions.
  - Depends on: C11.
  - Validation: T09, T10, T11.
  - Trace:
    - "Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy." (In Scope)
    - "The dominant current quality issues are: ... generated/per-entry test patterns that create maintenance noise without proportional confidence." (Current Baseline)

- [ ] C21 `[docs]` Update `docs/Priority3TestSurvey.md` so every row touched by this checklist reflects the completed first-slice outcome while leaving the deferred `Investigate` rows untouched.
  - Depends on: C00, C01, C02, C03, C04, C05, C06, C07, C08, C09, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20.
  - Validation: T10, T11.
  - Trace:
    - "The current survey `Investigate` items are not mixed into the first implementation checklist; they are tracked as a follow-on slice with written rationale." (Acceptance Criteria)
    - "Update survey/checklist traceability as implementation decisions are made so future reviewers can understand why a test was kept, replaced, or removed." (In Scope)

## Validation Items

- [ ] T01 `[validation]` Removal-slice validation: run `yarn test:frontend`, `yarn test:backend --runTestsByPath src/tests/backend/utilities.test.ts`, `yarn test:backend --runTestsByPath src/tests/backend/api.test.ts`, and `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts`, and confirm each removal leaves no failing or missing replacement expectation behind.
  - Trace:
    - "Replacement and retained tests for the touched helpers/workflows pass in their local suites." (Validation Strategy)
    - "Pass: changed test files assert the intended behavior clearly and pass without relying on accidental order or timing." (Validation Strategy)

- [ ] T02 `[validation]` Removal-contract validation: in `docs/checklists/Priority3TestSuiteSignalQualityChecklist01Validation.md`, document why each removed row was placeholder or redundant and identify the surviving coverage that still protects the contract.
  - Trace:
    - "Tests marked `Remove` in the approved checklist are removed only when they are placeholder or redundant and no meaningful protection is lost." (Acceptance Criteria)
    - "Survey-driven decisions remain traceable through the implementation checklist and validation notes." (Validation Strategy)

- [ ] T03 `[validation]` Backend focused-suite validation: run `yarn test:backend --runTestsByPath src/tests/backend/crypt.test.ts src/tests/backend/api.test.ts src/tests/backend/SendGridNotificationService.test.ts src/tests/backend/policyEnforcement.test.ts src/tests/backend/setup-env.contract.test.ts src/tests/backend/utilities.test.ts src/tests/backend/MongodbService.test.ts` and confirm the rewritten rows pass with self-contained setup and deterministic assertions.
  - Trace:
    - "Replacement and retained tests for the touched helpers/workflows pass in their local suites." (Validation Strategy)
    - "Pass: changed test files assert the intended behavior clearly and pass without relying on accidental order or timing." (Validation Strategy)

- [ ] T04 `[validation]` Backend contract/parity validation: confirm the rewrites in `crypt.test.ts`, `api.test.ts`, `SendGridNotificationService.test.ts`, `policyEnforcement.test.ts`, `setup-env.contract.test.ts`, `utilities.test.ts`, and `MongodbService.test.ts` still map directly to concrete auth, OpenAPI/service, env-bootstrap, email, policy, and API-contract behavior.
  - Trace:
    - "For affected seams such as auth token creation, env bootstrap, OpenAPI/service parity... replacement tests still protect the same intended contract in clearer terms." (Validation Strategy)
    - "Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about." (Validation Strategy)

- [ ] T05 `[validation]` Backend smoke-and-scope validation: run `yarn test:backend`, confirm the full backend Jest suite remains green, and verify the slice did not require runtime/API behavior changes, dependency changes, or CI-policy changes.
  - Trace:
    - "The full Jest suites remain green after each accepted slice." (Validation Strategy)
    - "No approved change in this phase requires changing runtime/API behavior, dependency scope, or CI policy beyond the plan’s stated scope." (Acceptance Criteria)

- [ ] T06 `[validation]` Frontend focused-suite validation: run `yarn test:frontend --runTestsByPath src/tests/frontend/blockies.test.ts src/tests/frontend/discussion.xstate.test.ts src/tests/frontend/login.xstate.test.ts src/tests/frontend/frontend-utilities.test.ts` and confirm the rewritten rows pass with deterministic assertions.
  - Trace:
    - "Replacement and retained tests for the touched helpers/workflows pass in their local suites." (Validation Strategy)
    - "Pass: changed test files assert the intended behavior clearly and pass without relying on accidental order or timing." (Validation Strategy)

- [ ] T07 `[validation]` Frontend contract-and-non-functional validation: confirm the blockies, XState, and frontend-utilities rewrites still protect deterministic seeded output, workflow behavior, and retained performance intent without relying on brittle wall-clock thresholds.
  - Trace:
    - "Timing or performance-oriented tests remain real tests when they still protect meaningful behavior, but they should be made deterministic or anchored to stable proxies instead of unexplained wall-clock thresholds where feasible." (Validation Strategy)
    - "Pass: retained performance-oriented coverage no longer depends on brittle wall-clock assertions when a deterministic alternative exists." (Validation Strategy)

- [ ] T08 `[validation]` Frontend smoke-and-scope validation: run `yarn test:frontend`, confirm the full frontend Jest suite remains green, and verify the slice did not introduce frontend runtime behavior changes, dependency churn, or CI-policy changes.
  - Trace:
    - "The full Jest suites remain green after each accepted slice." (Validation Strategy)
    - "This phase should improve test trust, not expand into dependency modernization, runtime feature changes, CI gate redesign, or broad frontend/backend architecture work." (Intent)

- [ ] T09 `[validation]` Secrets/bootstrap validation: run `yarn test:backend --runTestsByPath src/tests/backend/secrets.test.ts src/tests/backend/setup-env.contract.test.ts` and confirm the aggregated assertions still protect `example.env` parity and deterministic sensitive-value replacement.
  - Trace:
    - "backend env bootstrap and parser contract coverage" (Current Baseline)
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)

- [ ] T10 `[validation]` Documentation-and-traceability validation: confirm `docs/Priority3TestSurvey.md`, this checklist, and `docs/checklists/Priority3TestSuiteSignalQualityChecklist01Validation.md` all agree on the completed first-slice remove/replace outcomes and still leave the `Investigate` rows for the follow-on checklist.
  - Trace:
    - "The current survey `Investigate` items are not mixed into the first implementation checklist; they are tracked as a follow-on slice with written rationale." (Acceptance Criteria)
    - "Survey-driven decisions remain traceable through the implementation checklist and validation notes." (Validation Strategy)

- [ ] T11 `[validation]` Final regression validation: run `yarn test:backend`, `yarn test:frontend`, and `yarn test`, and record pass/fail status plus any blockers in `docs/checklists/Priority3TestSuiteSignalQualityChecklist01Validation.md`.
  - Trace:
    - "Pass: `yarn test:backend` and `yarn test:frontend` pass after the slice, and `yarn test` remains consistent." (Validation Strategy)
    - "Broad regression validation passes after implementation, or any blocker is documented explicitly in validation notes." (Acceptance Criteria)

## Behavior Slices

### Slice S1
- Goal: Remove obvious placeholder and duplicate rows without weakening real test protection.
- Items: C00, C01, C02, C03, C04, T01.
- Type: mechanical.

### Slice S2
- Goal: Replace brittle backend assertions and stale backend test copy with deterministic contract-focused coverage.
- Items: C05, C06, C07, C08, C09, C10, C11, C12, C13, C14, C15, T03, T04, T05.
- Type: behavior.

### Slice S3
- Goal: Replace structure-coupled and wall-clock-sensitive frontend rows while preserving workflow and performance intent.
- Items: C16, C17, C18, C19, T06, T07, T08.
- Type: behavior.

### Slice S4
- Goal: Consolidate noisy generated backend coverage and finalize first-slice traceability without pulling in the deferred `Investigate` work.
- Items: C20, C21, T02, T09, T10, T11.
- Type: mechanical.

## Conformance QC

- Missing from plan:
  - None.
- Extra beyond plan:
  - None.
- Atomicity fixes needed:
  - None identified. The previously oversized SendGrid and `MongodbService` items were split so file-specific rewrites can land as separate commits.
- Validation mapping gaps:
  - None identified. The validation-notes artifact is created up front, every `Cxx` item cites one or more `Txx` items, and the focused validation steps now name exact commands.
- Pass/Fail: checklist achieves plan goals:
  - Pass.
