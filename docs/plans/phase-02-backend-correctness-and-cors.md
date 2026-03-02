# Phase 02 - Backend Correctness and CORS

Status: Planned

## Goal

Fix confirmed runtime defects in topic handling, authorization checks, and CORS declarations.

## Scope

- Fix `topicDELETE` descendant-deletion logic in `src/lib/MongodbService.ts`.
- Fix `topicListGET` auth validation in `src/lib/MongodbService.ts`.
- Align referer normalization/matching contract between:
  - `example.env`
  - `src/lib/backend-utilities.ts`
  - `src/lib/MongodbService.ts` topic creation flow
- Fix `/topic` CORS declared methods/headers in `src/functions/topic.ts`.

## Inputs and evidence

- `topicDELETE` defects:
  - Cursor truthiness check at `src/lib/MongodbService.ts:1451`.
  - Incomplete ID extraction at `src/lib/MongodbService.ts:1469`.
- `topicListGET` cursor misuse at `src/lib/MongodbService.ts:1327`.
- Referer mismatch:
  - Protocol-including config in `example.env:17`.
  - Protocol-stripping normalization in `src/lib/backend-utilities.ts:227`.
  - Matching call in `src/lib/backend-utilities.ts:246` and use in `src/lib/MongodbService.ts:1048`.
- `/topic` CORS mismatch in `src/functions/topic.ts:44` vs implemented methods at `:79`, `:93`, `:101`.

## Implementation steps

1. Fix topic descendant deletion:
   - Check existence via `await cursor.hasNext()`/`findOne`.
   - Collect all descendant IDs (topic + replies) correctly.
2. Fix topic list auth query:
   - Resolve user doc (`findOne` or `next`) before checks.
3. Decide referer contract and enforce consistently:
   - Normalize configured origins before matching or normalize neither side.
   - Update docs/examples to match runtime behavior.
4. Correct `/topic` CORS method/header declarations.
5. Add/expand backend tests for each bug path.

## Risk and mitigation

- Risk: referer policy change can alter who may create topics.
- Mitigation:
  - Add explicit tests for allowed and denied referers.
  - Document final pattern format and examples.

## Acceptance criteria

- Confirmed defects reproduced before change and fixed after.
- New tests cover bug scenarios and pass.
- No regression in existing topic/comment API tests.

## Rollback

- Revert phase PR.
- If partial rollback needed, keep non-behavioral CORS header fixes separate from policy logic changes.
