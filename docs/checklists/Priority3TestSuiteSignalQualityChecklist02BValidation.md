# Priority 3 Checklist 02B Validation Notes

Status: active

## Validation Rules

- Use focused `-t` runs for atomic item commits in this checklist.
- Treat the earlier overlapping full-file `MongodbService.test.ts` run as a Jest Mongo harness artifact, not as product evidence.
- Run full-file and broad-suite validation sequentially only after the behavior slice is complete.

## Item Notes

- C01:
  - Updated `userGET` so a nonexistent `targetUserId` with valid non-moderator credentials returns the generic `error404UserUnknown` contract.
  - Preserved the hardcoded moderator creation path when `targetUserId === authUserId === SIMPLE_COMMENT_MODERATOR_ID`.
  - Focused validation: `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts -t "unknown target user"` passed.

- C02:
  - Updated `userGET` so a nonexistent `authUserId` no longer falls through to a normal `200` safe-user response.
  - Preserved the hardcoded moderator special case while aligning unknown-auth behavior.
  - Focused validation: `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts -t "unknown authenticating user"` passed.

- C03:
  - Updated `docs/Priority3TestSurvey.md` so the two split `userGET` rows are no longer unresolved `Investigate` items.
  - The survey now records both rows as accepted `Keep` coverage with Checklist 02A/02B traceability.
