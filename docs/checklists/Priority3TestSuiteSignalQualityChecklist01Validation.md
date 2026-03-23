# Priority 3 Checklist 01 Validation Notes

Status: completed

Source checklist: `docs/checklists/Priority3TestSuiteSignalQualityChecklist01.md`

## Removed Rows

- `C01` / `src/tests/frontend/hello-world.test.ts` / `adds 1 + 2 to equal 3`
  - Rationale: pure placeholder coverage; the test defines `sum` inline and does not assert any repo behavior.
  - Surviving coverage: no replacement required because this row did not protect product, helper, or infrastructure behavior.
- `C02` / `src/tests/backend/utilities.test.ts` / duplicated `validateUserId` rows plus indirect `normalizeUrl` rows
  - Rationale: duplicate coverage; canonical `validateUserId` assertions already live in `src/tests/frontend/shared-utilities.test.ts`, and `normalizeUrl` has its own dedicated backend suite.
  - Surviving coverage: `src/tests/frontend/shared-utilities.test.ts` remains the validation source of truth for `validateUserId`, and `src/tests/backend/normalizeUrl.test.ts` remains the focused normalization suite.
- `C03` / `src/tests/backend/api.test.ts` / `non existent method on AbstractDbService should fail`
  - Rationale: low-signal negative check; proving a random missing property is undefined does not protect the OpenAPI-to-service contract.
  - Surviving coverage: the remaining parity rows still cover the intended positive contract surface until the later route-mapping replacement work lands.
- `C04` / `src/tests/backend/MongodbService.test.ts` / `GET get to /user/{userId} should return user`
  - Rationale: duplicate success-path coverage; the earlier admin `GET /user/{userId}` row already covers the same core contract.
  - Surviving coverage: `GET to /user/{userId} should return User and 200` remains the primary admin success-path check, and `GET to /user/{userId} with public user` still covers the public-user variant.

## Replaced Rows

- `C05` / `src/tests/backend/crypt.test.ts` / `Get Expiration time`
  - Change: replaced the wall-clock tolerance check with a fixed-clock assertion that verifies the 10-second rounding behavior exactly.
- `C05` / `src/tests/backend/crypt.test.ts` / `Test auth token`
  - Change: replaced the calendar-year assertion with a fixed-`exp` token assertion that verifies the decoded JWT claim contract directly.
- `C06` / `src/tests/backend/api.test.ts` / generated `...should be defined in AbstractDbService` rows
  - Change: replaced the lossy route-normalization logic with an explicit OpenAPI route-and-method mapping table plus a parity assertion that the mapping still matches the current spec paths.
- `C07` / `src/tests/backend/SendGridNotificationService.test.ts` / `should throw given undefined moderator contact emails`
  - Change: replaced the duplicated empty-array case with a real missing-env / undefined-input assertion.
- `C08` / `src/tests/backend/SendGridNotificationService.test.ts` / `should handle email sending failure`
  - Change: replaced the under-specified single-response mock with a deterministic failure contract assertion that checks both the outbound payload and the returned error body.
- `C09` / `src/tests/backend/SendGridNotificationService.test.ts` / `should send notification to moderators`
  - Change: replaced the count-only happy-path assertion with exact outbound payload checks for each moderator recipient.
- `C10` / `src/tests/backend/policyEnforcement.test.ts` / guest comment policy rows
  - Change: replaced the vague titles with policy-specific names and made the disabled-guest case assert the returned policy error string directly.
- `C11` / `src/tests/backend/setup-env.contract.test.ts` / `uses the shared sensitive-key classifier during bootstrap`
  - Change: replaced the helper-only assertion with a bootstrap-level check that proves secret and non-secret keys are classified differently during env initialization.
- `C12` / `src/tests/backend/utilities.test.ts` / `bad email should fail` and `good email should pass`
  - Change: replaced random email generation with fixed representative addresses so the validation intent stays stable and readable.
- `C13` / `src/tests/backend/MongodbService.test.ts` / auth-token rows
  - Change: replaced JWT prefix comparisons with fixed-clock decoded-claim assertions for `user` and `exp`.
- `C14` / `src/tests/backend/MongodbService.test.ts` / duplicate-user, duplicate-comment, and descendant-delete rows
  - Change: replaced order-dependent rows with self-contained setup so each test now creates the duplicate or descendant data it needs before asserting the contract.
- `C15` / `src/tests/backend/MongodbService.test.ts` / stale or overclaimed topic/comment rows
  - Change: aligned the affected test titles with the narrower contracts they actually assert.
- `C16` / `src/tests/frontend/blockies.test.ts` / numbered generator repetition rows
  - Change: replaced the numbered rows with sequence-based deterministic assertions for same-seed and different-seed generators.
- `C17` / `src/tests/frontend/discussion.xstate.test.ts` / structure-coupled definition rows
  - Change: removed definition-shape assertions and corrected the stale initial-state title so the file focuses on workflow transitions.
- `C18` / `src/tests/frontend/login.xstate.test.ts` / structure-coupled definition rows
  - Change: removed definition-shape assertions so the file focuses on state transitions that matter to the login workflow.
- `C19` / `src/tests/frontend/frontend-utilities.test.ts` / wall-clock and real-timer rows
  - Change: replaced the elapsed-time thresholds with deterministic reply-group/sibling-sort proxies for `threadComments` and fake-timer scheduling assertions for `debounceFunc`.
- `C20` / `src/tests/backend/secrets.test.ts` / row-per-key and row-per-sensitive-key coverage
  - Change: consolidated the generated per-key assertions into aggregated bootstrap parity checks for all env keys and all sensitive defaults.

## Deterministic Performance Substitutions

- `C19` / `src/tests/frontend/frontend-utilities.test.ts` / `threadComments`
  - Replacement: the mock discussion and large flat-array rows now assert stable sort-work proxies instead of elapsed milliseconds by checking that sibling sorting happens once per reachable reply group, and only once for 2000 flat replies.
- `C19` / `src/tests/frontend/frontend-utilities.test.ts` / `debounce`
  - Replacement: the real-time debounce rows now use Jest fake timers to assert scheduling boundaries without depending on wall-clock elapsed time.

## Regression Command Results

- `T01` / removal-slice validation command set
  - Result: pass
  - Notes: `yarn test:frontend`, `yarn test:backend --runTestsByPath src/tests/backend/utilities.test.ts`, `yarn test:backend --runTestsByPath src/tests/backend/api.test.ts`, and `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts` all passed; the removal items left no missing expectation behind in the touched suites.

- `C01` / `yarn test:frontend`
  - Result: pass
  - Notes: 6 frontend suites passed, 158 tests passed after removing `src/tests/frontend/hello-world.test.ts`.
- `C02` / `yarn test:backend --runTestsByPath src/tests/backend/utilities.test.ts`
  - Result: pass
  - Notes: `utilities.test.ts` passed with 48 tests after removing the duplicate `validateUserId` rows and indirect normalization rows.
- `C03` / `yarn test:backend --runTestsByPath src/tests/backend/api.test.ts`
  - Result: pass
  - Notes: `api.test.ts` passed with 19 tests after removing the low-signal negative-property row.
- `C04` / `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts`
  - Result: pass
  - Notes: `MongodbService.test.ts` passed with 66 tests after removing the duplicate admin success-path `GET /user/{userId}` row.
- `C05` / `yarn test:backend --runTestsByPath src/tests/backend/crypt.test.ts`
  - Result: pass
  - Notes: `crypt.test.ts` passed with 2 tests after replacing the wall-clock and calendar-coupled assertions with fixed-input contract checks.
- `C06` / `yarn test:backend --runTestsByPath src/tests/backend/api.test.ts`
  - Result: pass
  - Notes: `api.test.ts` passed with 20 tests after replacing the lossy route normalization with an explicit route-to-service mapping table.
- `C07` / `yarn test:backend --runTestsByPath src/tests/backend/SendGridNotificationService.test.ts`
  - Result: pass
  - Notes: `SendGridNotificationService.test.ts` passed with 9 tests after converting the duplicated undefined-contact row into a real missing-env assertion.
- `C08` / `yarn test:backend --runTestsByPath src/tests/backend/SendGridNotificationService.test.ts`
  - Result: pass
  - Notes: `SendGridNotificationService.test.ts` stayed green after tightening the send-failure row to assert the returned error body and first outbound payload explicitly.
- `C09` / `yarn test:backend --runTestsByPath src/tests/backend/SendGridNotificationService.test.ts`
  - Result: pass
  - Notes: `SendGridNotificationService.test.ts` stayed green after replacing the count-only happy-path check with exact payload assertions for both configured moderator recipients.
- `C10` / `yarn test:backend --runTestsByPath src/tests/backend/policyEnforcement.test.ts`
  - Result: pass
  - Notes: `policyEnforcement.test.ts` passed with 2 tests after renaming the guest-comment rows and making the disabled-guest case assert the policy error string directly.
- `C11` / `yarn test:backend --runTestsByPath src/tests/backend/setup-env.contract.test.ts`
  - Result: pass
  - Notes: `setup-env.contract.test.ts` passed with 5 tests after replacing the helper-only assertion with a bootstrap-level classification check.
- `C12` / `yarn test:backend --runTestsByPath src/tests/backend/utilities.test.ts`
  - Result: pass
  - Notes: `utilities.test.ts` passed with 48 tests after replacing the random email cases with fixed representative addresses.
- `C13` / `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts`
  - Result: pass
  - Notes: `MongodbService.test.ts` passed with 66 tests after replacing the auth-token prefix comparisons with decoded-claim assertions bounded by the exact `exp` rounding window.
- `C14` / `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts`
  - Result: pass
  - Notes: `MongodbService.test.ts` passed with 66 tests after making the duplicate-user, duplicate-comment, and descendant-delete rows self-contained.
- `C15` / `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts`
  - Result: pass
  - Notes: `MongodbService.test.ts` passed with 66 tests after aligning the stale or overclaimed topic/comment titles with the contracts actually asserted.
- `C16` / `yarn test:frontend --runTestsByPath src/tests/frontend/blockies.test.ts`
  - Result: pass
  - Notes: `blockies.test.ts` passed with 9 tests after replacing the numbered generator repetition rows with sequence-based assertions.
- `C17` / `yarn test:frontend --runTestsByPath src/tests/frontend/discussion.xstate.test.ts`
  - Result: pass
  - Notes: `discussion.xstate.test.ts` passed with 9 tests after removing the structure-coupled definition checks and keeping the workflow transitions.
- `C18` / `yarn test:frontend --runTestsByPath src/tests/frontend/login.xstate.test.ts`
  - Result: pass
  - Notes: `login.xstate.test.ts` passed with 8 tests after removing the structure-coupled definition checks and keeping the workflow transitions.
- `C19` / `yarn test:frontend --runTestsByPath src/tests/frontend/blockies.test.ts src/tests/frontend/discussion.xstate.test.ts src/tests/frontend/login.xstate.test.ts src/tests/frontend/frontend-utilities.test.ts`
  - Result: pass
  - Notes: the focused frontend slice passed with 126 tests after replacing the `frontend-utilities` wall-clock thresholds with sort-work proxies and fake-timer debounce assertions.
- `C20` / `yarn test:backend --runTestsByPath src/tests/backend/secrets.test.ts src/tests/backend/setup-env.contract.test.ts`
  - Result: pass
  - Notes: the secrets/bootstrap pair passed with 9 total tests after consolidating the generated per-key assertions into aggregated bootstrap parity checks.
- `T03` / backend focused-suite validation command
  - Result: pass
  - Notes: `yarn test:backend --runTestsByPath src/tests/backend/crypt.test.ts src/tests/backend/api.test.ts src/tests/backend/SendGridNotificationService.test.ts src/tests/backend/policyEnforcement.test.ts src/tests/backend/setup-env.contract.test.ts src/tests/backend/utilities.test.ts src/tests/backend/MongodbService.test.ts` passed with 152 tests; the rewritten backend rows stayed green with deterministic and self-contained assertions.
- `T04` / backend contract review
  - Result: pass
  - Notes: the rewritten backend rows still map cleanly to auth token creation, OpenAPI-to-service parity, SendGrid payload/error handling, guest-comment policy enforcement, env bootstrap wiring, deterministic validation inputs, and API-level order-independent contracts.
- `T05` / `yarn test:backend`
  - Result: pass
  - Notes: the full backend Jest suite passed with 178 tests across 11 suites. The slice stayed within test-signal cleanup scope and did not require runtime/API behavior changes, dependency changes, or CI-policy changes.
- `T06` / frontend focused-suite validation command
  - Result: pass
  - Notes: the exact focused frontend command from `C19` already passed with 126 tests across `blockies.test.ts`, `discussion.xstate.test.ts`, `login.xstate.test.ts`, and `frontend-utilities.test.ts`, so the deterministic frontend rewrites remained green in their local slice.
- `T07` / frontend contract review
  - Result: pass
  - Notes: the frontend rewrites still cover seeded blockies determinism, observable XState workflow transitions, and retained `threadComments`/`debounceFunc` non-functional intent without depending on wall-clock thresholds.
- `T08` / `yarn test:frontend`
  - Result: pass
  - Notes: the full frontend Jest suite from `T01` passed with 140 tests across 6 suites. The slice stayed within test-signal cleanup scope and did not introduce frontend runtime behavior changes, dependency churn, or CI-policy changes.
- `T09` / secrets/bootstrap focused command
  - Result: pass
  - Notes: the exact `C20` command (`yarn test:backend --runTestsByPath src/tests/backend/secrets.test.ts src/tests/backend/setup-env.contract.test.ts`) already passed with the aggregated `example.env` parity and deterministic sensitive-value replacement assertions in place.
- `T10` / documentation and traceability review
  - Result: pass
  - Notes: `docs/Priority3TestSurvey.md`, `docs/checklists/Priority3TestSuiteSignalQualityChecklist01.md`, and this validation file agree on the completed first-slice remove/replace outcomes, and the three `Investigate` survey rows remain untouched for the follow-on slice.
- `T11` / final regression command set
  - Result: pass
  - Notes: `yarn test:backend` passed with 178 tests across 11 suites, `yarn test:frontend` passed with 140 tests across 6 suites, and `yarn test` passed end to end with the same green backend/frontend totals and no blockers.

## Blockers

- None.
