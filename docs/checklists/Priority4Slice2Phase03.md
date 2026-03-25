# Priority 4, Slice 2, Phase 03 — Residual Dependency Triage Loop

Status: proposed

Source plan: `docs/plans/Priority4DependencyModernizationPlan.md`

Evidence input: `docs/archive/Priority4DependencyModernizationChecklist02Validation.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Define the first implementation slice as actual low-risk dependency modernization work, not a generic research-only pass." (In Scope)
- In scope anchor: "Define the first implementation loop as a sequence of atomic upgrade steps that each run validation before the next step begins." (In Scope)
- In scope anchor: "Use repo-aware triage rules so config-loaded, preset-loaded, and optional-tool packages are not removed solely because a tool flagged them." (In Scope)
- Constraint anchor: "Treat each upgrade step as the smallest logical reviewable unit; some steps may be paired package updates when versions are obviously coupled." (Constraints)
- Constraint anchor: "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)
- Constraint anchor: "Treat tool output as evidence, not authority." (Constraints)
- Constraint anchor: "If a candidate upgrade would require changing runtime behavior, public contracts, test semantics, or repository process rules, stop and move that candidate into a separate follow-on plan/checklist." (Constraints)
- Constraint anchor: "Do not use the current Mongo/Jest compatibility pain as a reason to force an unscoped test-stack migration." (Constraints)
- Acceptance anchor: "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)
- Acceptance anchor: "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)
- Slice anchor: "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)
- Slice anchor: "stop when the fallout exceeds the approved local step scope." (Planned Slices)

## Additional Scope Control

- This checklist exhausts the current Slice 2 residual queue from `yarn knip` by requiring every current issue category to end this run as one of:
  - removed/fixed in-place, or
  - explicitly deferred with written rationale and next-slice destination.
- This checklist intentionally includes:
  - triage and decision items for all eight residual unused dependencies currently reported by `yarn knip`
  - disposition of the current Knip configuration hint in `knip.json`
  - disposition of the remaining unused exports and unused exported types report as a Slice 2 follow-up decision
- This checklist intentionally excludes:
  - major Svelte ecosystem upgrades
  - major MongoDB ecosystem upgrades
  - test-stack migration work
  - lint/tooling major-version upgrades
  - broad export/type cleanup beyond documenting whether it stays in Slice 2 or moves to a later slice

## Atomic Checklist Items

- [x] C01 `[docs]` Create `docs/checklists/Priority4Slice2Phase03Validation.md` with sections for the starting residual queue, per-item triage decisions, command evidence, before/after Knip comparison, and remaining Priority 4 handoff notes.
  - Depends on: none.
  - Validation: T01, T03.
  - Trace:
    - "Define the first implementation loop as a sequence of atomic upgrade steps that each run validation before the next step begins." (In Scope)
    - "Triage evidence: Pass: every candidate in the first checklist has recorded ecosystem grouping, risk class, and rationale for `refresh`, `replace`, `remove`, `defer`, or `plan separately`." (Validation Strategy)

- [ ] C02 `[triage]` Assess `@netlify/functions` and either remove it if repo-aware verification shows a low-risk unused direct dependency, or document a defer-to-runtime/platform rationale in the validation notes.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "@netlify/functions|functions:" .`, `yarn knip`, and if removed `yarn build:backend`).
  - Trace:
    - "Use repo-aware triage rules so config-loaded, preset-loaded, and optional-tool packages are not removed solely because a tool flagged them." (In Scope)
    - "If a candidate upgrade would require changing runtime behavior, public contracts, test semantics, or repository process rules, stop and move that candidate into a separate follow-on plan/checklist." (Constraints)

- [ ] C03 `[triage]` Assess `@xstate/cli` and either remove it if no live repo usage remains, or document a defer-to-frontend/build rationale in the validation notes.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "@xstate/cli|xstate-cli" .`, `yarn knip`, and if removed `yarn build:frontend`).
  - Trace:
    - "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)
    - "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)

- [ ] C04 `[triage]` Assess `@xstate/test` and either remove it if no live repo usage remains, or document a defer-to-frontend/build rationale in the validation notes.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "@xstate/test|xstate/test" .`, `yarn knip`, and if removed `yarn test:frontend`).
  - Trace:
    - "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)
    - "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)

- [ ] C05 `[triage]` Assess `mongodb-memory-server` and either remove it if repo-aware verification proves that the direct dependency is safely redundant, or document a defer-to-test-stack rationale in the validation notes.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "mongodb-memory-server|jest-mongodb|MONGOMS" .`, `yarn knip`).
  - Trace:
    - "Do not use the current Mongo/Jest compatibility pain as a reason to force an unscoped test-stack migration." (Constraints)
    - "If a candidate upgrade would require changing runtime behavior, public contracts, test semantics, or repository process rules, stop and move that candidate into a separate follow-on plan/checklist." (Constraints)

- [ ] C06 `[triage]` Assess `ts-node` and either remove it if no live repo usage remains, or document a low-risk-loop defer rationale in the validation notes.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "ts-node|ts-node/register|ts-node-esm" .`, `yarn knip`, and if removed `yarn typecheck`).
  - Trace:
    - "Treat tool output as evidence, not authority." (Constraints)
    - "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)

- [ ] C07 `[triage]` Assess `webpack-bundle-analyzer` and either remove it if no live repo usage remains, or document a low-risk-loop defer rationale in the validation notes.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "webpack-bundle-analyzer|BundleAnalyzerPlugin|bundle-analyzer" .`, `yarn knip`, and if removed `yarn build:backend`).
  - Trace:
    - "Treat each upgrade step as the smallest logical reviewable unit; some steps may be paired package updates when versions are obviously coupled." (Constraints)
    - "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)

- [ ] C08 `[triage]` Assess `webpack-license-plugin` and either remove it if no live repo usage remains, or document a low-risk-loop defer rationale in the validation notes.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "webpack-license-plugin|LicenseWebpackPlugin|license-plugin" .`, `yarn knip`, and if removed `yarn build:backend`).
  - Trace:
    - "Treat tool output as evidence, not authority." (Constraints)
    - "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)

- [ ] C09 `[triage]` Assess the direct `yarn` package dependency and either remove it if no repo-managed module usage remains, or document a low-risk-loop defer rationale in the validation notes.
  - Depends on: C01.
  - Validation: T01, T02 (`rg -n "require\\(['\\\"]yarn|from ['\\\"]yarn|\\byarn\\b" .`, `yarn knip`, and if removed `yarn build`).
  - Trace:
    - "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)
    - "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)

- [ ] C10 `[knip]` Resolve the current Knip configuration hint by either removing the redundant `src/entry/index.ts` entry pattern from `knip.json` or documenting why it must remain.
  - Depends on: C01.
  - Validation: T01, T02 (`yarn knip`).
  - Trace:
    - "Treat tool output as evidence, not authority." (Constraints)
    - "patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value." (Planned Slices)

- [ ] C11 `[docs]` Document the disposition of the remaining unused exports and unused exported types report by classifying it as either in-slice cleanup work or a later Priority 4 follow-on, with rationale.
  - Depends on: C01.
  - Validation: T01, T03.
  - Trace:
    - "Classify each candidate using both upgrade risk and dependency-noise rationale." (In Scope)
    - "Every candidate dependency or dependency ecosystem can be placed into one of these buckets: low-risk refresh now, test-stack follow-on, lint/format/tooling follow-on, frontend/build follow-on, runtime/platform follow-on, or intentional deferment." (Acceptance Criteria)

- [ ] C12 `[docs]` Finalize `docs/checklists/Priority4Slice2Phase03Validation.md` with the full triage ledger, before/after Knip evidence, implemented removals, defer rationales, and the post-Slice-2 handoff queue.
  - Depends on: C02, C03, C04, C05, C06, C07, C08, C09, C10, C11.
  - Validation: T01, T03.
  - Trace:
    - "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)
    - "Step-level smoke/process evidence: Pass: every accepted upgrade step records the validation commands run immediately after that step, and the loop stops when a failure exceeds the step's approved local scope." (Validation Strategy)

## Validation Items

- [ ] T01 `[validation]` Residual-queue validation: run `yarn knip` at the end of the loop and confirm that every issue category present at the start of this phase is now either removed/fixed from the report or explicitly documented as deferred with rationale and destination.
  - Trace:
    - "Triage evidence: Pass: every candidate in the first checklist has recorded ecosystem grouping, risk class, and rationale for `refresh`, `replace`, `remove`, `defer`, or `plan separately`." (Validation Strategy)
    - "Treat tool output as evidence, not authority." (Constraints)

- [ ] T02 `[validation]` Step-level smoke validation: after each triage item, run the exact local validation commands for that item and record the outcomes in the validation notes.
  - C02: `rg -n "@netlify/functions|functions:" .`, `yarn knip`, and if removed `yarn build:backend`
  - C03: `rg -n "@xstate/cli|xstate-cli" .`, `yarn knip`, and if removed `yarn build:frontend`
  - C04: `rg -n "@xstate/test|xstate/test" .`, `yarn knip`, and if removed `yarn test:frontend`
  - C05: `rg -n "mongodb-memory-server|jest-mongodb|MONGOMS" .`, `yarn knip`
  - C06: `rg -n "ts-node|ts-node/register|ts-node-esm" .`, `yarn knip`, and if removed `yarn typecheck`
  - C07: `rg -n "webpack-bundle-analyzer|BundleAnalyzerPlugin|bundle-analyzer" .`, `yarn knip`, and if removed `yarn build:backend`
  - C08: `rg -n "webpack-license-plugin|LicenseWebpackPlugin|license-plugin" .`, `yarn knip`, and if removed `yarn build:backend`
  - C09: `rg -n "require\\(['\\\"]yarn|from ['\\\"]yarn|\\byarn\\b" .`, `yarn knip`, and if removed `yarn build`
  - C10: `yarn knip`
  - Trace:
    - "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)
    - "Step-level smoke/process evidence: Pass: every accepted upgrade step records the validation commands run immediately after that step, and the loop stops when a failure exceeds the step's approved local scope." (Validation Strategy)

- [ ] T03 `[validation]` Scope/process validation: confirm this phase exhausted the current Slice 2 residual queue without crossing into major-migration scope, and that every unresolved item was explicitly deferred with rationale instead of being left implicit.
  - Trace:
    - "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)
    - "stop when the fallout exceeds the approved local step scope." (Planned Slices)

## Behavior Slices

### Slice S1
- Goal: Establish the 4-2-03 triage ledger and resolve the clearly low-risk standalone dependency candidates.
- Items: C01, C06, C07, C08, C09, C10, T02.
- Type: behavior.

### Slice S2
- Goal: Triage the ecosystem-coupled dependency candidates and explicitly decide remove-now versus defer-later for each.
- Items: C02, C03, C04, C05.
- Type: behavior.

### Slice S3
- Goal: Close the loop by documenting export/type disposition, final residual outcomes, and the post-Slice-2 handoff queue.
- Items: C11, C12, T01, T03.
- Type: behavior.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None; the checklist operationalizes the approved Slice 2 loop by forcing a recorded disposition for every current residual Knip issue category.

- Atomicity fixes needed:
  - None identified; each package/config decision is isolated to one candidate and can be completed in one commit as either remove/fix or defer-with-rationale.

- Validation mapping gaps:
  - None identified; each triage item has an explicit repo-search and smoke-validation path.

- Pass/Fail: checklist achieves plan goals
  - Pass.
