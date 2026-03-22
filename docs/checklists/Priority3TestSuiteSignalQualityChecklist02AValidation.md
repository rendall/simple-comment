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
