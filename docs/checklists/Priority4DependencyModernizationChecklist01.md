# Priority 4 Checklist 01 — Residual Dependency Declaration Fixes

Status: proposed

Source plan: `docs/plans/Priority4DependencyModernizationPlan.md`

Evidence input: `docs/checklists/Priority4KnipReliabilityChecklist01Validation.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Use `package.json`, `yarn outdated`, and `yarn knip` as the current planning baseline for dependency modernization." (In Scope)
- In scope anchor: "Define the first implementation slice as actual low-risk dependency modernization work, not a generic research-only pass." (In Scope)
- In scope anchor: "Use repo-aware triage rules so config-loaded, preset-loaded, and optional-tool packages are not removed solely because a tool flagged them." (In Scope)
- Constraint anchor: "Treat each upgrade step as the smallest logical reviewable unit; some steps may be paired package updates when versions are obviously coupled." (Constraints)
- Constraint anchor: "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)
- Constraint anchor: "Treat tool output as evidence, not authority." (Constraints)
- Acceptance anchor: "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)
- Acceptance anchor: "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)

## Additional Scope Control

- This checklist intentionally handles only the highest-confidence residual dependency findings from the calibrated Knip run:
  - explicit dependency declaration for `svelte-eslint-parser`
  - explicit dependency declaration for `jsdom`
  - removal of `@babel/preset-typescript` after local config verification
- This checklist intentionally excludes:
  - file removals from the residual Knip queue
  - ambiguous dependency removals such as `mongodb-memory-server`, `@netlify/functions`, `@xstate/cli`, `@xstate/test`, `ts-node`, `webpack-bundle-analyzer`, `webpack-license-plugin`, and `yarn`
  - any major Svelte, MongoDB, Jest, lint/tooling, or runtime/platform migration work

## Atomic Checklist Items

- [x] C01 `[docs]` Create `docs/checklists/Priority4DependencyModernizationChecklist01Validation.md` with sections for baseline residual findings, per-step dependency changes, command evidence, before/after Knip comparison, and deferred residual queue notes.
  - Depends on: none.
  - Validation: T01, T03.
  - Trace:
    - "Use `package.json`, `yarn outdated`, and `yarn knip` as the current planning baseline for dependency modernization." (In Scope)
    - "The plan defines a current dependency inventory method based on `package.json`, `yarn outdated`, and `yarn knip`." (Acceptance Criteria)

- [ ] C02 `[deps]` Add `svelte-eslint-parser` to `package.json` and `yarn.lock` so the parser named directly in `src/.eslintrc.json` is an explicit repo dependency instead of an unresolved Knip/import gap.
  - Depends on: C01.
  - Validation: T01, T02 (`yarn knip`, `yarn lint`).
  - Trace:
    - "Use repo-aware triage rules so config-loaded, preset-loaded, and optional-tool packages are not removed solely because a tool flagged them." (In Scope)
    - "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)

- [ ] C03 `[deps]` Add `jsdom` to `package.json` and `yarn.lock` so the frontend Jest environment usage reported from `src/tests/frontend/frontend-utilities.test.ts` is explicitly declared rather than left as an unlisted dependency signal.
  - Depends on: C01.
  - Validation: T01, T02 (`yarn knip`, `yarn test:frontend`).
  - Trace:
    - "Define the first implementation slice as actual low-risk dependency modernization work, not a generic research-only pass." (In Scope)
    - "Treat tool output as evidence, not authority." (Constraints)

- [ ] C04 `[deps]` Remove `@babel/preset-typescript` from `package.json` and `yarn.lock` after verifying `babel.config.cjs` does not reference it and the change stays within this checklist's low-risk dependency scope.
  - Depends on: C01.
  - Validation: T01, T02 (`yarn knip`, `yarn test:frontend`, `yarn build`).
  - Trace:
    - "Define the first implementation slice as actual low-risk dependency modernization work, not a generic research-only pass." (In Scope)
    - "`knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision." (Acceptance Criteria)

- [ ] C05 `[docs]` Finalize `docs/checklists/Priority4DependencyModernizationChecklist01Validation.md` with before/after Knip evidence, relevant command outcomes, and a clearly deferred residual queue for later Priority 4 checklists.
  - Depends on: C02, C03, C04.
  - Validation: T01, T03.
  - Trace:
    - "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)
    - "Triage evidence: Pass: every candidate in the first checklist has recorded ecosystem grouping, risk class, and rationale for `refresh`, `replace`, `remove`, `defer`, or `plan separately`." (Validation Strategy)

## Validation Items

- [ ] T01 `[validation]` Residual-signal validation: run `yarn knip` after C02-C04 and confirm the calibrated report no longer includes unresolved `svelte-eslint-parser`, unlisted `jsdom`, or unused `@babel/preset-typescript`, while preserving the intentionally deferred residual queue.
  - Trace:
    - "Triage evidence: Pass: every candidate in the first checklist has recorded ecosystem grouping, risk class, and rationale for `refresh`, `replace`, `remove`, `defer`, or `plan separately`." (Validation Strategy)
    - "Treat tool output as evidence, not authority." (Constraints)

- [ ] T02 `[validation]` Step-level smoke validation: after each dependency change item, run the exact local validation commands for that step and record the outcomes in the validation notes:
  - C02: `yarn knip`, `yarn lint`
  - C03: `yarn knip`, `yarn test:frontend`
  - C04: `yarn knip`, `yarn test:frontend`, `yarn build`
  - Trace:
    - "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)
    - "Step-level smoke/process evidence: Pass: every accepted upgrade step records the validation commands run immediately after that step, and the loop stops when a failure exceeds the step's approved local scope." (Validation Strategy)

- [ ] T03 `[validation]` Scope/process validation: confirm this checklist stayed within low-risk dependency declaration/removal work, did not cross into major migration scope, and did not remove any additional Knip-flagged items without separate manual verification.
  - Trace:
    - "The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations." (Acceptance Criteria)
    - "Do not allow the first implementation loop to cross the approved deferment boundary for major Svelte or MongoDB work." (Constraints)

## Behavior Slices

### Slice S1
- Goal: Establish traceable validation notes and fix the two most credible missing dependency declarations from the calibrated Knip queue.
- Items: C01, C02, C03, T01, T02.
- Type: behavior.

### Slice S2
- Goal: Remove one high-confidence unused dependency after local config verification and record the resulting Knip delta.
- Items: C04, C05, T03.
- Type: behavior.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None; the checklist narrows the approved low-risk slice to the highest-confidence residual dependency items surfaced by calibrated `knip`.

- Atomicity fixes needed:
  - None identified; each item is scoped to one dependency declaration/removal or one documentation outcome.

- Validation mapping gaps:
  - None identified; each implementation item maps to explicit checklist validation and the plan's required step-level evidence model.

- Pass/Fail: checklist achieves plan goals
  - Pass.
