# Priority 3 Checklist 02B — `userGET` Runtime Alignment

Status: completed

Source plan: `docs/plans/Priority3TestSuiteSignalQualityPlan.md`

Handoff source: `docs/checklists/Priority3TestSuiteSignalQualityChecklist02A.md`, `docs/checklists/Priority3TestSuiteSignalQualityChecklist02AValidation.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)
- In scope anchor: "Update survey/checklist traceability as implementation decisions are made so future reviewers can understand why a test was kept, replaced, or removed." (In Scope)
- Acceptance anchor: "Every implemented remove/replace/defer decision in this phase is traceable to `docs/Priority3TestSurvey.md`." (Acceptance Criteria)
- Acceptance anchor: "Broad regression validation passes after implementation, or any blocker is documented explicitly in validation notes." (Acceptance Criteria)
- Constraint anchor: "If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement." (Constraints)
- Validation anchor: "Replacement and retained tests for the touched helpers/workflows pass in their local suites." (Validation Strategy)
- Validation anchor: "The full Jest suites remain green after each accepted slice." (Validation Strategy)

## Execution Model For This Checklist

- This checklist is the runtime-alignment follow-on for the completed fail-first test-authoring pass in `docs/checklists/Priority3TestSuiteSignalQualityChecklist02A.md`.
- The two `userGET` tests added in Checklist 02A are treated as fixed contract targets for this pass and must not be rewritten here.
- Runtime changes are limited to `src/lib/MongodbService.ts` behavior needed to make those tests green.
- If implementation reveals that either new test expresses an unworkable or undesired contract, stop and return to checklist/plan discussion instead of rewriting the tests silently.

## Atomic Checklist Items

- [x] C01 `[backend]` Update `userGET` in `src/lib/MongodbService.ts` so a nonexistent `targetUserId` with a valid non-moderator `authUserId` returns the generic `error404UserUnknown` contract rather than a `404` body for an unknown authenticating user.
  - Depends on: none.
  - Validation: T01, T02.
  - Trace:
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)
    - "Replacement and retained tests for the touched helpers/workflows pass in their local suites." (Validation Strategy)

- [x] C02 `[backend]` Update `userGET` in `src/lib/MongodbService.ts` so a nonexistent `authUserId` does not fall through to a normal `200` safe-user response and instead returns the `404` contract expected by the new missing-authenticating-user test.
  - Depends on: C01.
  - Validation: T01, T02.
  - Trace:
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)
    - "If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement." (Constraints)

- [x] C03 `[docs]` Update `docs/Priority3TestSurvey.md` and this checklist’s validation notes so the two split `userGET` investigate rows record the accepted runtime-aligned outcome rather than an unresolved mismatch.
  - Depends on: C02.
  - Validation: T02, T03.
  - Trace:
    - "Update survey/checklist traceability as implementation decisions are made so future reviewers can understand why a test was kept, replaced, or removed." (In Scope)
    - "Every implemented remove/replace/defer decision in this phase is traceable to `docs/Priority3TestSurvey.md`." (Acceptance Criteria)

## Validation Items

- [x] T01 `[validation]` Targeted contract validation: run `yarn test:backend --runTestsByPath src/tests/backend/MongodbService.test.ts` and confirm the two `userGET` rows added in Checklist 02A now pass without test modification.
  - Trace:
    - "Replacement and retained tests for the touched helpers/workflows pass in their local suites." (Validation Strategy)
    - "Pass: changed test files assert the intended behavior clearly and pass without relying on accidental order or timing." (Validation Strategy)

- [x] T02 `[validation]` Contract-parity review: compare `src/lib/MongodbService.ts`, `src/tests/backend/MongodbService.test.ts`, and `docs/Priority3TestSurvey.md` and confirm that missing target user and missing authenticating user are now distinct, implemented, and described consistently.
  - Trace:
    - "Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about." (Validation Strategy)
    - "Survey-driven decisions remain traceable through the implementation checklist and validation notes." (Validation Strategy)

- [x] T03 `[validation]` Broad regression validation: run `yarn test:backend`, `yarn test:frontend`, and `yarn test`, and confirm the slice no longer requires the Checklist 02A execution exception.
  - Trace:
    - "The full Jest suites remain green after each accepted slice." (Validation Strategy)
    - "Broad regression validation passes after implementation, or any blocker is documented explicitly in validation notes." (Acceptance Criteria)

## Behavior Slices

### Slice S1
- Goal: align `userGET` runtime behavior to the two explicit contracts introduced by Checklist 02A without rewriting those tests.
- Items: C01, C02, C03, T01, T02, T03.
- Type: behavior.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None.

- Atomicity fixes needed:
  - None.

- Validation mapping gaps:
  - None.

- Pass/Fail: checklist achieves plan goals
  - Pass for completed follow-on runtime implementation.
