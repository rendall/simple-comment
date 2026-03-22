# Priority 3 Checklist 02A Validation Notes

Status: active

## Execution Exception

- Approved deviation from `docs/norms/implementation.md`: this checklist is a tests-only fail-first pass for Priority 3 investigate work, so targeted backend validation may remain red after an item if the failure exposes the intended runtime mismatch.
- Runtime code must remain untouched during Checklist 02A execution.

## Baseline

- Before Checklist 02A changes, `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts` passed with 66 tests green.

## Item Notes

- C01:
  - Replaced the ambiguous `userGET` missing-user row with an explicit missing-target-user contract test.
  - `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts` failed with exactly one failing row: `GET to /user/{userId} with an unknown target user should return 404 unknown user`.
  - Observed runtime mismatch: `userGET` returned `{ statusCode: 404, body: "Authenticating user is unknown" }` instead of the generic `error404UserUnknown` contract `{ statusCode: 404, body: "Unknown user" }`.

- C02:
  - Added a separate explicit missing-authenticating-user `userGET` test using an existing target user and a nonexistent `authUserId`.
  - `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts` now fails on exactly two rows, both in the split `userGET` contract area.
  - Observed runtime mismatch for the new auth-user case: `userGET` returned a normal `200` safe-user response instead of `{ statusCode: 404, body: "Authenticating user is unknown" }`.

- C03:
  - Renamed the nearby successful admin read row to `GET to /user/{userId} with admin credentials should return user and 200` so the surrounding `userGET` read-path copy is no longer generic or ambiguous.
  - Re-ran `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts`; the suite still fails only on the two intentional contract rows from C01 and C02.

## Validation Items

- T01:
  - Completed with `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts`.
  - Result: 65 tests passed and 2 tests failed.
  - The only failing rows are the two explicit split `userGET` investigate tests, so the suite behavior is now informative rather than ambiguous.

- T02:
  - Reviewed the new `userGET` tests in `src/tests/backend/MongodbService.test.ts` against the current runtime path in `src/lib/MongodbService.ts` and the updated survey rows in `docs/Priority3TestSurvey.md`.
  - The ambiguity is now split cleanly:
    - missing target user: test expects `error404UserUnknown`, runtime currently returns a 404 with body `"Authenticating user is unknown"`
    - missing authenticating user: test expects a 404 with body `"Authenticating user is unknown"`, runtime currently returns `200` with a safe-user body
  - No stale mixed contract row remains in the survey or the test file.
