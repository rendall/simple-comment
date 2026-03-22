# Priority 3 Checklist 02A — `userGET` Fail-First Test Authoring Pass

Status: draft

Source plan: `docs/plans/Priority3TestSuiteSignalQualityPlan.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Improve test naming where current copy does not match the asserted behavior." (In Scope)
- In scope anchor: "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)
- Acceptance anchor: "The current survey `Investigate` items are not mixed into the first implementation checklist; they are tracked as a follow-on slice with written rationale." (Acceptance Criteria)
- Acceptance anchor: "Every implemented remove/replace/defer decision in this phase is traceable to `docs/Priority3TestSurvey.md`." (Acceptance Criteria)
- Constraint anchor: "If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement." (Constraints)
- Out-of-scope anchor: "Runtime or API behavior changes whose purpose is not test-signal cleanup." (Out of Scope)

## Execution Model For This Checklist

- This checklist is intentionally test-first and may leave the suite red.
- The goal of this pass is to replace ambiguity with explicit tests, not to make them pass.
- Runtime or service implementation changes are out of scope for this checklist.
- If the newly authored tests fail, that is an expected and acceptable outcome for this pass.
- A separate follow-on implementation checklist should make the new tests green without modifying them.
- If, during the later implementation pass, the new tests prove incoherent or unimplementable, stop and return to discussion rather than rewriting them silently.

## Atomic Checklist Items

- [x] C01 `[backend]` Replace the ambiguous `GET to /user/{userId} where userId does not exist should return 404` row in `src/tests/backend/MongodbService.test.ts` with a clearly named missing-target-user row whose setup uses a known-valid existing admin `authUserId`, a nonexistent `targetUserId`, and assertions limited to the missing-target-user contract only.
  - Depends on: none.
  - Validation: T01, T02.
  - Trace:
    - "Improve test naming where current copy does not match the asserted behavior." (In Scope)
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)

- [x] C02 `[backend]` Add a separate clearly named missing-authenticating-user row to `src/tests/backend/MongodbService.test.ts` whose setup uses a known-existing `targetUserId`, a nonexistent `authUserId`, and assertions limited to the missing-authenticating-user contract only.
  - Depends on: C01.
  - Validation: T01, T02.
  - Trace:
    - "The current survey `Investigate` items are not mixed into the first implementation checklist; they are tracked as a follow-on slice with written rationale." (Acceptance Criteria)
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)

- [x] C03 `[backend]` Normalize the surrounding `userGET` test copy in `src/tests/backend/MongodbService.test.ts` only as needed so the file no longer contains one row that ambiguously stands in for both missing-target-user and missing-authenticating-user behavior.
  - Depends on: C02.
  - Validation: T01, T02.
  - Trace:
    - "Improve test naming where current copy does not match the asserted behavior." (In Scope)
    - "The resulting suite is easier to explain in plain language: contributors can point to what the changed tests protect rather than relying on “green means probably fine.”" (Acceptance Criteria)

- [x] C04 `[docs]` Update the affected `Investigate` row in `docs/Priority3TestSurvey.md` so it no longer describes one mixed `userGET` ambiguity and instead records the split test intent plus any unresolved runtime mismatch discovered by this fail-first pass.
  - Depends on: C03.
  - Validation: T02, T03.
  - Trace:
    - "Update survey/checklist traceability as implementation decisions are made so future reviewers can understand why a test was kept, replaced, or removed." (In Scope)
    - "Every implemented remove/replace/defer decision in this phase is traceable to `docs/Priority3TestSurvey.md`." (Acceptance Criteria)

## Validation Items

- [ ] T01 `[validation]` Fail-first targeted validation: run `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts` and record which of the new `userGET` clarification rows fail or pass.
  - Required outcome:
    - the suite behavior is now informative rather than ambiguous
    - if a row fails, the failure must point to a concrete runtime mismatch
    - if both rows pass unexpectedly, record that clearly and confirm the ambiguity is still resolved
  - Trace:
    - "Pass: changed test files assert the intended behavior clearly and pass without relying on accidental order or timing." (Validation Strategy)
    - "Fail: a rewrite removes contract protection or leaves only a weaker structural/proxy assertion." (Validation Strategy)

- [ ] T02 `[validation]` Contract-clarity review: compare the new `userGET` tests in `src/tests/backend/MongodbService.test.ts`, the current runtime behavior in `src/lib/MongodbService.ts`, and the updated `docs/Priority3TestSurvey.md`, and confirm the result clearly distinguishes missing target user from missing authenticating user without leaving a stale mixed contract behind.
  - Trace:
    - "Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about." (Validation Strategy)
    - "Survey-driven decisions remain traceable through the implementation checklist and validation notes." (Validation Strategy)

- [ ] T03 `[validation]` Blocker handoff validation: if either new test fails, record the exact failing expectation as the handoff input for the follow-on implementation checklist, with enough detail that implementation can proceed without rewriting the tests.
  - Trace:
    - "If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement." (Constraints)
    - "Broad regression validation passes after implementation, or any blocker is documented explicitly in validation notes." (Acceptance Criteria)

## Behavior Slices

### Slice S1
- Goal: replace one ambiguous `userGET` investigate row with two explicit contracts and produce a fail-first handoff for implementation.
- Items: C01, C02, C03, C04, T01, T02, T03.
- Type: behavior.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None, as long as this checklist remains test-only and does not change runtime behavior.

- Atomicity fixes needed:
  - None.

- Validation mapping gaps:
  - None.

- Pass/Fail: checklist achieves plan goals
  - Pass for a deliberate fail-first test-authoring pass.
