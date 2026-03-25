# Priority 4 Checklist 02 — High-Confidence Residual File Cleanup

Status: proposed

Source plan: `docs/plans/Priority4DependencyModernizationPlan.md`

Evidence input: `docs/archive/Priority4DependencyModernizationChecklist01Validation.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Use `package.json`, `yarn outdated`, and `yarn knip` as the current planning baseline for dependency modernization." (In Scope)
- In scope anchor: "Define the first implementation slice as actual low-risk dependency modernization work, not a generic research-only pass." (In Scope)
- Constraint anchor: "Treat tool output as evidence, not authority." (Constraints)
- Constraint anchor: "Treat each upgrade step as the smallest logical reviewable unit; some steps may be paired package updates when versions are obviously coupled." (Constraints)
- Constraint anchor: "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)
- Acceptance anchor: "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)
- Acceptance anchor: "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)
- Slice anchor: "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)
- Slice anchor: "stop when the fallout exceeds the approved local step scope." (Planned Slices)

## Additional Scope Control

- This checklist handles only the highest-confidence residual file-cleanup candidates deferred from `docs/archive/Priority4KnipReliabilityChecklist01Validation.md`.
- This checklist intentionally limits itself to:
  - removing `scripts/createTestEnv.mjs`
  - removing `scripts/mockComment.mjs` and updating stale comments in `src/tests/mockComment.ts`
  - removing `src/components/low-level/IconToggle.svelte`
  - removing `src/lib/NoOpNotificationService.ts`
- This checklist intentionally excludes:
  - ambiguous dependency removals such as `mongodb-memory-server`, `@netlify/functions`, `@xstate/cli`, `@xstate/test`, `ts-node`, `webpack-bundle-analyzer`, `webpack-license-plugin`, and `yarn`
  - `knip.json` tuning beyond what is strictly required to validate this file-cleanup slice
  - unused export/type cleanup outside the exact file removals listed above
  - any major Svelte, MongoDB, Jest, lint/tooling, or runtime/platform migration work

## Atomic Checklist Items

- [x] C01 `[docs]` Create `docs/checklists/Priority4DependencyModernizationChecklist02Validation.md` with sections for baseline residual file findings, per-step file changes, command evidence, before/after Knip comparison, and deferred follow-up notes.
  - Depends on: none.
  - Validation: T01, T03.
  - Trace:
    - "Use `package.json`, `yarn outdated`, and `yarn knip` as the current planning baseline for dependency modernization." (In Scope)
    - "Triage evidence: Pass: every candidate in the first checklist has recorded ecosystem grouping, risk class, and rationale for `refresh`, `replace`, `remove`, `defer`, or `plan separately`." (Validation Strategy)

- [x] C02 `[cleanup]` Remove `scripts/createTestEnv.mjs` after verifying no live repo workflows or current execution paths still depend on it.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "createTestEnv" .`, `yarn knip`).
  - Trace:
    - "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)
    - "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)

- [x] C03 `[cleanup]` Remove `scripts/mockComment.mjs` and update stale generated-script usage notes in `src/tests/mockComment.ts` so the live test helper source no longer points at a deleted artifact.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "mockComment\\.mjs|scripts/mockComment" .`, `yarn knip`).
  - Trace:
    - "Treat tool output as evidence, not authority." (Constraints)
    - "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)

- [ ] C04 `[cleanup]` Remove `src/components/low-level/IconToggle.svelte` after verifying it has no live import path and the frontend build still succeeds without it.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "IconToggle" .`, `yarn knip`, `yarn build:frontend`).
  - Trace:
    - "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)
    - "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)

- [ ] C05 `[cleanup]` Remove `src/lib/NoOpNotificationService.ts` after verifying it has no live import path and the TypeScript project still passes typecheck without it.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "NoOpNotificationService" .`, `yarn knip`, `yarn typecheck`).
  - Trace:
    - "Treat each upgrade step as the smallest logical reviewable unit; some steps may be paired package updates when versions are obviously coupled." (Constraints)
    - "stop when the fallout exceeds the approved local step scope." (Planned Slices)

- [ ] C06 `[docs]` Finalize `docs/checklists/Priority4DependencyModernizationChecklist02Validation.md` with before/after Knip evidence, step-level validation outcomes, and the narrowed residual queue for later Priority 4 work.
  - Depends on: C02, C03, C04, C05.
  - Validation: T01, T03.
  - Trace:
    - "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)
    - "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)

## Validation Items

- [ ] T01 `[validation]` Residual-signal validation: run `yarn knip` after C02-C05 and confirm the calibrated report no longer lists the removed files while preserving intentionally deferred dependency and export/type follow-up work.
  - Trace:
    - "Step-level smoke/process evidence: Pass: every accepted upgrade step records the validation commands run immediately after that step, and the loop stops when a failure exceeds the step's approved local scope." (Validation Strategy)
    - "Treat tool output as evidence, not authority." (Constraints)

- [ ] T02 `[validation]` Step-level smoke validation: after each file-removal item, run the exact local validation commands for that step and record the outcomes in the validation notes:
  - C02: `rg -n "createTestEnv" .`, `yarn knip`
  - C03: `rg -n "mockComment\\.mjs|scripts/mockComment" .`, `yarn knip`
  - C04: `rg -n "IconToggle" .`, `yarn knip`, `yarn build:frontend`
  - C05: `rg -n "NoOpNotificationService" .`, `yarn knip`, `yarn typecheck`
  - Trace:
    - "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)
    - "Step-level smoke/process evidence: Pass: every accepted upgrade step records the validation commands run immediately after that step, and the loop stops when a failure exceeds the step's approved local scope." (Validation Strategy)

- [ ] T03 `[validation]` Scope/process validation: confirm this checklist stayed within low-risk file cleanup, did not expand into ambiguous dependency removals or major migration work, and stopped if any candidate proved to have live coupling beyond the approved local step.
  - Trace:
    - "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)
    - "stop when the fallout exceeds the approved local step scope." (Planned Slices)

## Behavior Slices

### Slice S1
- Goal: Establish traceable validation notes and remove the two script-level residual files with the least runtime/build coupling.
- Items: C01, C02, C03, T02.
- Type: behavior.

### Slice S2
- Goal: Remove two source-level residual files after explicit build/typecheck confirmation and record the narrowed Knip queue.
- Items: C04, C05, C06, T01, T03.
- Type: behavior.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None; the checklist narrows the approved low-risk implementation loop to the highest-confidence residual file removals already deferred from Checklist 01.

- Atomicity fixes needed:
  - None identified; each implementation item is scoped to one file-removal decision plus any inseparable local fallout in the same surface.

- Validation mapping gaps:
  - None identified; each cleanup item has an explicit step-level validation path and the checklist preserves the plan's stop-rule model.

- Pass/Fail: checklist achieves plan goals
  - Pass.
