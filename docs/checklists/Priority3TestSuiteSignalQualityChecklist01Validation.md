# Priority 3 Checklist 01 Validation Notes

Status: active

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

## Deterministic Performance Substitutions

- None yet.

## Regression Command Results

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

## Blockers

- None.
