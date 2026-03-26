# Priority 3 Plan — Test Suite Signal Quality

Status: archived

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 3: Test Suite Signal Quality`)

Source survey: `docs/Priority3TestSurvey.md`

Classification: formal plan artifact under `docs/norms/plan.md`

## Close-out

- Implemented via `docs/checklists/Priority3TestSuiteSignalQualityChecklist01.md`, `docs/checklists/Priority3TestSuiteSignalQualityChecklist02A.md`, and `docs/checklists/Priority3TestSuiteSignalQualityChecklist02B.md`, plus the final two resolved investigate follow-ons recorded in `docs/Priority3TestSurvey.md`.
- Final broad validation passed on 2026-03-23 with `yarn test`.

## Goal

Improve the signal quality of the existing test suite so contributors can trust what a green test run actually means without turning this phase into a broad test-stack rewrite, CI-policy rewrite, or product-behavior change.

## Intent

This Priority 3 phase should use the completed survey as the source of truth for where the suite is strong, where it is noisy, and where it is misleading.

For this phase, success means:

- clearly low-value placeholder and duplicate tests are removed,
- brittle or stale tests are replaced with behavior-oriented checks that match what the code is really supposed to protect,
- the first implementation checklist stays focused on survey-backed remove/replace work, while the small number of unresolved `Investigate` cases are handled in a follow-on slice with written rationale,
- and the resulting suite is easier to explain in plain language than “it passes.”

This phase should improve test trust, not expand into dependency modernization, runtime feature changes, CI gate redesign, or broad frontend/backend architecture work.

## Current Baseline

The baseline for this phase is the completed survey in `docs/Priority3TestSurvey.md`.

At the time this plan was drafted, the survey recorded:

- `Keep`: 150
- `Replace`: 82
- `Remove`: 10
- `Investigate`: 3
- `TBD`: 0

The dominant current quality issues are:

- placeholder or obviously low-signal tests,
- stale or misleading test copy,
- tests coupled too tightly to structure instead of behavior,
- timing-sensitive or wall-clock-sensitive assertions,
- hidden order dependence across larger integration suites,
- repeated coverage of the same helper behavior in multiple files,
- and generated/per-entry test patterns that create maintenance noise without proportional confidence.

The dominant current strengths that should be preserved are:

- backend API-contract and authorization coverage in `src/tests/backend/MongodbService.test.ts`,
- backend env bootstrap and parser contract coverage,
- focused normalization and helper contract coverage,
- deterministic frontend seeded-output coverage,
- and the canonical `shared-utilities` validation coverage.

## In Scope

- Use `docs/Priority3TestSurvey.md` as the planning baseline for test-value cleanup.
- Remove tests already identified by the survey as clear placeholders or redundant duplicates.
- Replace tests already identified by the survey as stale, brittle, misleading, overly structure-coupled, order-coupled, or noisy.
- Preserve performance-oriented test intent where the survey identified valuable non-functional coverage, but replace wall-clock-sensitive assertions with more deterministic checks when feasible.
- Improve test naming where current copy does not match the asserted behavior.
- Prefer deterministic assertions over wall-clock, timing-threshold, or environment-speed-sensitive assertions.
- Preserve and, where necessary, strengthen unique contract, infrastructure, and workflow coverage that the survey marked as valuable.
- Update survey/checklist traceability as implementation decisions are made so future reviewers can understand why a test was kept, replaced, or removed.

## Out of Scope

- Runtime or API behavior changes whose purpose is not test-signal cleanup.
- Broad test-stack modernization, framework migration, or dependency upgrades.
- CI gate expansion, CI policy changes, or redefining the authoritative validation set.
- Coverage threshold enforcement or coverage-policy changes as a merge gate.
- Broad suite reorganization for aesthetics alone.
- Frontend or backend architecture refactors that are not required to complete an approved test-signal slice.
- Adding large new coverage areas unrelated to survey-identified replace/remove/investigate work.

## Constraints

- Treat merged runtime behavior, tests, OpenAPI/schema files, and current documented contracts as the source of truth.
- Do not silently weaken protection when removing tests; any removed test must either be genuinely redundant/placeholder or be paired with replacement coverage when the survey calls for `Replace`.
- Prefer behavior-level assertions over test assertions tied to internal implementation shape when both are feasible.
- Prefer deterministic/fake-timer assertions over real-time delays when timing behavior must be tested.
- Keep implementation slices small enough to be reviewable and reversible.
- If a proposed replacement would require changing runtime behavior, public contract interpretation, or broader repo policy, stop and return to plan/checklist refinement.
- Treat coverage-threshold policy as a separate decision unless later approved explicitly; this plan does not assume threshold enforcement.

## Risks and Mitigations

- Risk: removing weak tests accidentally removes the only protection for a real contract.
  - Mitigation: require survey traceability for every remove/replace action and preserve unique contract/infrastructure tests marked `Keep`.

- Risk: replacing brittle tests turns into broad behavior changes or feature work.
  - Mitigation: keep runtime behavior changes out of scope and stop when replacement work would require changing source-of-truth behavior.

- Risk: timing-sensitive and order-sensitive tests are “fixed” only cosmetically, leaving flakiness in place.
  - Mitigation: prefer deterministic assertions, fake timers, and self-contained setup over looser thresholds or renamed brittle tests.

- Risk: the phase expands into CI policy or coverage-bar debates before test inventory cleanup is complete.
  - Mitigation: defer CI gate and coverage-threshold decisions to separate approved follow-on planning unless a checklist update explicitly brings them into scope.

- Risk: larger mixed test files blur which assertions are valuable versus duplicated.
  - Mitigation: use the survey’s keep/replace/remove/investigate decisions as the execution baseline and do not re-open settled areas without new evidence.

## Acceptance Criteria

1. Every implemented remove/replace/defer decision in this phase is traceable to `docs/Priority3TestSurvey.md`.
2. Tests marked `Remove` in the approved checklist are removed only when they are placeholder or redundant and no meaningful protection is lost.
3. Tests marked `Replace` in the approved checklist are rewritten so the resulting assertion is more behavior-oriented, more deterministic, or more accurately named than the baseline.
4. The current survey `Investigate` items are not mixed into the first implementation checklist; they are tracked as a follow-on slice with written rationale.
5. No approved change in this phase requires changing runtime/API behavior, dependency scope, or CI policy beyond the plan’s stated scope.
6. The resulting suite is easier to explain in plain language: contributors can point to what the changed tests protect rather than relying on “green means probably fine.”
7. Broad regression validation passes after implementation, or any blocker is documented explicitly in validation notes.

## Validation Strategy

This phase changes test behavior and test outputs, so explicit evidence is required.

Required evidence types for Priority 3:

- **Unit evidence**
  - Replacement and retained tests for the touched helpers/workflows pass in their local suites.
  - Pass: changed test files assert the intended behavior clearly and pass without relying on accidental order or timing.
  - Fail: rewritten tests still depend on broad suite order, machine-speed thresholds, or stale copy to make sense.

- **Integration/smoke evidence**
  - The full Jest suites remain green after each accepted slice.
  - Pass: `yarn test:backend` and `yarn test:frontend` pass after the slice, and `yarn test` remains consistent.
  - Fail: a cleanup slice passes only in isolation or introduces regressions elsewhere in the backend/frontend suites.

- **Contract/parity evidence**
  - For affected seams such as auth token creation, env bootstrap, OpenAPI/service parity, XState workflow machines, seeded frontend output, or backend normalization rules, replacement tests still protect the same intended contract in clearer terms.
  - Pass: reviewers can map each rewritten test back to a concrete behavior or contract the repo still cares about.
  - Fail: a rewrite removes contract protection or leaves only a weaker structural/proxy assertion.

- **Non-functional evidence**
  - Timing or performance-oriented tests remain real tests when they still protect meaningful behavior, but they should be made deterministic or anchored to stable proxies instead of unexplained wall-clock thresholds where feasible.
  - Pass: retained performance-oriented coverage no longer depends on brittle wall-clock assertions when a deterministic alternative exists.
  - Fail: flaky timing/performance checks remain in place without justification or the implementation silently drops meaningful performance coverage.

- **Documentation/process evidence**
  - Survey-driven decisions remain traceable through the implementation checklist and validation notes.
  - Pass: checklist items cite survey-backed intent and any deviations are recorded.
  - Fail: test changes appear without traceability to the approved survey/plan rationale.

## Planned Slices

The survey suggests the following execution slices for checklist authoring:

1. Placeholder and duplicate removal
   - remove obvious placeholders and redundant duplicates already identified by the survey.

2. Brittle assertion replacement
   - replace stale names, wall-clock assertions, and order-dependent tests with deterministic behavior checks.

3. Structure-coupled workflow test cleanup
   - replace XState and parity tests that currently overfit internal structure instead of workflow behavior.

4. Noisy generated/per-entry test consolidation
   - consolidate row-per-key or repeated-numbered patterns where one clearer assertion can preserve the same contract.

5. Follow-on `Investigate` slice
   - handle the remaining `Investigate` items in a separate checklist after the first implementation checklist lands or is otherwise completed.

## Open Questions / Assumptions

- Assumption: the completed survey is sufficient to drive the first implementation checklist without another repo-wide discovery pass.
- Assumption: coverage-threshold policy should remain out of scope for this first Priority 3 implementation phase.
- Assumption: most accepted changes can remain test-only or docs-only, with runtime code treated as out of scope unless a survey-backed replacement exposes an already-authoritative contract gap.
- Decision: the current survey `Investigate` items are split into a follow-on slice rather than being mixed into the first implementation checklist.
- Decision: performance-oriented tests remain in scope as tests when they protect meaningful non-functional behavior, but wall-clock-sensitive assertions should be replaced with more deterministic approaches where feasible.
