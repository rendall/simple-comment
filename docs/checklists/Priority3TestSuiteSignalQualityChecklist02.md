# Priority 3 Checklist 02 — `userGET` Investigate Resolution

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

- This checklist is the broader investigate-resolution track for the ambiguous `userGET` contract.
- It exists to keep the full resolution path separate from the test-only fail-first pass in `docs/checklists/Priority3TestSuiteSignalQualityChecklist02A.md`.
- It may later be refined into executable implementation items after the test-authoring pass is reviewed.
- No code or test changes should be executed from this draft until its items are explicitly approved.

## Atomic Checklist Items

- [ ] C01 `[decision]` Resolve and record the intended `userGET` contract when the requested `targetUserId` does not exist, including the expected HTTP status and response body semantics.
  - Depends on: none.
  - Validation: T01, T02.
  - Trace:
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)
    - "If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement." (Constraints)

- [ ] C02 `[decision]` Resolve and record the intended `userGET` contract when the authenticating `authUserId` does not exist but the requested `targetUserId` does, including the expected HTTP status and response body semantics.
  - Depends on: C01.
  - Validation: T01, T02.
  - Trace:
    - "Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable." (In Scope)
    - "If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement." (Constraints)

- [ ] C03 `[planning]` Decide whether the resolved contracts can be expressed as a test-only clarification pass first, or whether runtime alignment must be paired with test changes in the same future implementation slice.
  - Depends on: C02.
  - Validation: T02, T03.
  - Trace:
    - "The current survey `Investigate` items are not mixed into the first implementation checklist; they are tracked as a follow-on slice with written rationale." (Acceptance Criteria)
    - "If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement." (Constraints)

- [ ] C04 `[docs]` Update `docs/Priority3TestSurvey.md` and this checklist’s decision notes so the original mixed `userGET` investigate row is represented as two distinct contract questions with written rationale.
  - Depends on: C03.
  - Validation: T02.
  - Trace:
    - "Update survey/checklist traceability as implementation decisions are made so future reviewers can understand why a test was kept, replaced, or removed." (In Scope)
    - "Every implemented remove/replace/defer decision in this phase is traceable to `docs/Priority3TestSurvey.md`." (Acceptance Criteria)

## Validation Items

- [ ] T01 `[validation]` Contract review validation: compare the current `userGET` logic in `src/lib/MongodbService.ts`, the existing `userGET` coverage in `src/tests/backend/MongodbService.test.ts`, and the survey wording in `docs/Priority3TestSurvey.md`, and confirm the exact ambiguity being resolved is documented accurately.
  - Trace:
    - "Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about." (Validation Strategy)
    - "Survey-driven decisions remain traceable through the implementation checklist and validation notes." (Validation Strategy)

- [ ] T02 `[validation]` Decision-trace validation: confirm the draft now distinguishes missing target user from missing authenticating user and records whether a later implementation pass should be test-first, runtime-first, or paired.
  - Trace:
    - "Survey-driven decisions remain traceable through the implementation checklist and validation notes." (Validation Strategy)
    - "The resulting suite is easier to explain in plain language: contributors can point to what the changed tests protect rather than relying on “green means probably fine.”" (Acceptance Criteria)

- [ ] T03 `[validation]` Handoff validation: confirm the draft produces a clear next-step decision between:
  - a separate fail-first test-authoring checklist
  - a paired test-and-runtime checklist
  - a return-to-plan decision if the contract itself is still not ready
  - Trace:
    - "If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement." (Constraints)
    - "The current survey `Investigate` items are not mixed into the first implementation checklist; they are tracked as a follow-on slice with written rationale." (Acceptance Criteria)

## Behavior Slices

### Slice S1
- Goal: turn one ambiguous `userGET` investigate row into two explicit contract questions and decide the right implementation shape for follow-on work.
- Items: C01, C02, C03, C04, T01, T02, T03.
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
  - Pass for discussion and follow-on checklist refinement.
