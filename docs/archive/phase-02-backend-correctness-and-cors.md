# Phase 02 Checklist - Backend Correctness and CORS

## Implementation intent (coupling target)

This checklist is intentionally constrained to the original Phase 02 intent:

1. Fix `topicDELETE` descendant-deletion logic in `src/lib/MongodbService.ts`.
2. Fix `topicListGET` auth validation in `src/lib/MongodbService.ts`.
3. Align referer normalization/matching contract between:
   - `example.env`
   - `src/lib/backend-utilities.ts`
   - `src/lib/MongodbService.ts` topic creation flow
4. Fix `/topic` CORS declared methods/headers in `src/functions/topic.ts`.

Coupling note:
- No governance/process-only items are included in this checklist.
- Test execution steps are handled in implementation/validation flow per `docs/norms/implementation.md`.

## Checklist QC Decisions (2026-03-02)

1. Issue: C07 mixed two independent behaviors (allow-headers contract and preflight/non-preflight consistency), violating atomic checklist rules.
   Decision: Split into separate C07 and C08 items.

2. Issue: C03 incorrectly depended on C01 even though topic-list auth validation does not require topic-delete changes.
   Decision: Remove the dependency so C03 can be executed independently.

3. Issue: C04 did not explicitly define how configured patterns are normalized before match, which weakened checkability and parity with referer normalization.
   Decision: Require both request referer and each configured allow-origin pattern to be normalized via the same helper path before picomatch comparison.

## Checklist

- [x] C01 `[backend]` In `src/lib/MongodbService.ts`, update `topicDELETE` topic existence check to resolve a document (`findOne`/`next`) rather than relying on cursor truthiness.
- [x] C02 `[backend]` In `src/lib/MongodbService.ts`, update `topicDELETE` descendant deletion to collect IDs from graph results as `topic.id` plus `replies[].id` before deletion. Depends on: C01.
- [x] C03 `[backend]` In `src/lib/MongodbService.ts`, fix `topicListGET` auth lookup to resolve a user document before policy checks.
- [x] C04 `[backend]` In `src/lib/backend-utilities.ts` and `src/lib/MongodbService.ts`, enforce one referer-matching contract by normalizing both request referer and each configured allow-origin pattern before picomatch comparison.
- [x] C05 `[docs]` Update `example.env` comments/examples so `ALLOW_ORIGIN` documentation matches the implemented referer-matching contract. Depends on: C04.
- [x] C06 `[backend]` In `src/functions/topic.ts`, align `Access-Control-Allow-Methods` with implemented handlers (`GET,POST,PUT,DELETE,OPTIONS`).
- [x] C07 `[backend]` In `src/functions/topic.ts`, align `/topic` `Access-Control-Allow-Headers` with headers actually consumed for auth/topic creation flows.
- [x] C08 `[backend]` In `src/functions/topic.ts`, keep CORS header behavior consistent across preflight and non-preflight responses by using the same header construction path for all responses. Depends on: C06, C07.

## Behavior Slices

- Goal: Correct topic deletion and topic list authorization behavior in backend service paths.
  Items: C01, C02, C03
  Type: behavior

- Goal: Make topic referer authorization behavior internally consistent across code and user-facing configuration docs.
  Items: C04, C05
  Type: behavior

- Goal: Align `/topic` CORS declarations with implemented route behavior.
  Items: C06, C07, C08
  Type: behavior

## Checklist integration pass (2026-03-02)

- Verified each checklist item remains directly mapped to the four implementation intents above (no added scope).
- Verified dependency graph is coherent after QC decisions:
  - C02 depends on C01.
  - C05 depends on C04.
  - C08 depends on C06 and C07.
- Verified every checklist item belongs to exactly one behavior slice.

## Checklist sanity pass (2026-03-02)

- No remaining blockers in checklist design.
- Items are atomic, imperative, checkable, and scoped per `docs/norms/checklist.md`.
- Proceeding to implementation under `docs/norms/implementation.md`.
