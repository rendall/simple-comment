# Priority 4 — Runtime / Platform Checklist 01

Status: proposed

Source plan: `docs/plans/Priority4DependencyModernizationPlan.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Identify which packages belong in the first real implementation slice versus later follow-on plans." (In Scope)
- In scope anchor: "Sequence candidates by coupling and blast radius rather than by package age alone." (In Scope)
- In scope anchor: "Name the follow-on major-version slices explicitly: ... runtime/platform major-upgrade modernization." (In Scope)
- Constraint anchor: "Treat each upgrade step as the smallest logical reviewable unit; some steps may be paired package updates when versions are obviously coupled." (Constraints)
- Constraint anchor: "Run agreed validation after each upgrade step, not only after the entire sequence." (Constraints)
- Constraint anchor: "Treat tool output as evidence, not authority." (Constraints)
- Constraint anchor: "If a candidate upgrade would require changing runtime behavior, public contracts, test semantics, or repository process rules, stop and move that candidate into a separate follow-on plan/checklist." (Constraints)
- Acceptance anchor: "Every candidate dependency or dependency ecosystem can be placed into one of these buckets: ... runtime/platform follow-on, ... or intentional deferment." (Acceptance Criteria)
- Acceptance anchor: "The implementation model requires validation after each upgrade step and includes a stop rule when failures are broader than the just-applied step." (Acceptance Criteria)
- Slice anchor: "Runtime/platform modernization plan/checklist" (Planned Slices)
- Slice anchor: "future major MongoDB ecosystem work plus other backend/runtime-adjacent high-blast-radius upgrades such as `@netlify/functions`." (Planned Slices)

## Additional Scope Control

- This checklist is limited to the first Priority 4 runtime/platform slice.
- This checklist intentionally covers only:
  - repo-aware triage of direct dependency `@netlify/functions`
  - investigation and disposition of the current retained backend build warning pair
  - low-risk warning remediation only if the selected fix stays inside webpack/runtime-platform scope
- This checklist intentionally excludes:
  - lint / tooling modernization
  - frontend / build modernization outside the backend webpack warning path
  - major MongoDB or Netlify ecosystem upgrades
  - API, runtime, or data-contract behavior changes

## Atomic Checklist Items

- [x] C01 `[docs]` Create `docs/checklists/Priority4RuntimePlatformChecklist01Validation.md` with sections for baseline runtime/platform evidence, `@netlify/functions` triage, backend warning investigation, per-item command evidence, validation outcomes, and final dispositions.
  - Depends on: none.
  - Validation: T03.
  - Trace:
    - "Triage evidence" requires recorded ecosystem grouping, risk class, and rationale. (Validation Strategy)
    - "The implementation model requires validation after each upgrade step..." (Acceptance Criteria)

- [ ] C02 `[inventory]` Capture the current runtime/platform baseline in the validation notes by inventorying direct `@netlify/functions` usage evidence plus the current backend warning signatures from `yarn build`, and classify each concern as `remove now`, `tolerate`, `fix now`, or `defer`.
  - Depends on: C01.
  - Validation: T01, T02, T03.
  - Trace:
    - "Treat tool output as evidence, not authority." (Constraints)
    - "Every candidate dependency or dependency ecosystem can be placed into one of these buckets..." (Acceptance Criteria)

- [ ] C03 `[deps]` Remove direct `@netlify/functions` from `package.json` and `yarn.lock` if repo-aware verification still shows no live source/runtime need for it, or document an explicit runtime/platform defer rationale in the validation notes if that evidence changes.
  - Depends on: C02.
  - Validation: T01, T02.
  - Trace:
    - "Sequence candidates by coupling and blast radius rather than by package age alone." (In Scope)
    - "If a candidate upgrade would require changing runtime behavior... stop and move that candidate into a separate follow-on plan/checklist." (Constraints)

- [ ] C04 `[backend]` Investigate the `mongodb/lib/deps.js` `@aws-sdk/credential-providers` build warning and either implement the lowest-risk backend bundler-side remediation that preserves current behavior or record an explicit in-scope tolerance/defer decision with rationale in the validation notes.
  - Depends on: C02.
  - Validation: T02.
  - Trace:
    - "Contract/parity evidence" requires that build/test/tooling changes do not silently change current contracts or parity expectations. (Validation Strategy)
    - "Non-functional evidence" requires meaningful warning deltas to be recorded clearly. (Validation Strategy)

- [ ] C05 `[backend]` Investigate the `mongodb/lib/utils.js` critical dependency warning and either implement the lowest-risk backend bundler-side remediation that preserves current behavior or record an explicit in-scope tolerance/defer decision with rationale in the validation notes.
  - Depends on: C02.
  - Validation: T02.
  - Trace:
    - "Contract/parity evidence" requires that build/test/tooling changes do not silently change current contracts or parity expectations. (Validation Strategy)
    - "Non-functional evidence" requires meaningful warning deltas to be recorded clearly. (Validation Strategy)

- [ ] C06 `[docs]` Finalize `docs/checklists/Priority4RuntimePlatformChecklist01Validation.md` with the measured before/after warning state, `@netlify/functions` disposition, command evidence, and any explicit residual-warning acceptance or defer rationale.
  - Depends on: C02, C03, C04, C05.
  - Validation: T03.
  - Trace:
    - "Triage evidence" requires recorded ecosystem grouping, risk class, and rationale. (Validation Strategy)
    - "Non-functional evidence" requires warning outcome to be measurable and attributable. (Validation Strategy)

## Validation Items

- [ ] T01 `[validation]` Dependency/runtime validation: run `yarn knip` plus repo search after the `@netlify/functions` decision and confirm the package is either gone with no new runtime/tooling breakage or explicitly documented as deferred with rationale.
  - Trace:
    - "Triage evidence" requires written rationale for `refresh`, `replace`, `remove`, `defer`, or `plan separately`. (Validation Strategy)

- [ ] T02 `[validation]` Backend smoke/warning validation: run `yarn build` after each accepted runtime/platform change and record warning count/signature outcome, then run `yarn test:backend` after any accepted behavior-affecting runtime/platform change.
  - Trace:
    - "Step-level smoke/process evidence" requires validation after each accepted upgrade step. (Validation Strategy)
    - "Non-functional evidence" requires warning deltas to be recorded clearly. (Validation Strategy)

- [ ] T03 `[validation]` Documentation/process validation: confirm the validation notes, checklist state, and any warning/defer decisions are internally consistent and sufficient to hand the remaining runtime/platform work forward without ambiguity.
  - Trace:
    - "Documentation/process evidence" requires current and internally consistent disposition artifacts. (Validation Strategy)

## Behavior Slices

### Slice S1
- Goal: Establish the runtime/platform evidence ledger and classify the current dependency and warning concerns.
- Items: C01, C02.
- Type: mechanical.

### Slice S2
- Goal: Resolve or explicitly disposition the direct `@netlify/functions` dependency.
- Items: C03, T01.
- Type: behavior.

### Slice S3
- Goal: Resolve or explicitly disposition the retained backend build warning pair without changing current contracts.
- Items: C04, C05, T02, C06, T03.
- Type: behavior.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None; the checklist stays inside the named runtime/platform follow-on lane and treats warning remediation as runtime/build-adjacent evidence work.

- Atomicity fixes needed:
  - None identified; dependency triage and each warning decision are separated into their own reviewable items.

- Validation mapping gaps:
  - None identified; dependency disposition, backend warning state, and documentation consistency each have an explicit validation path.

- Pass/Fail: checklist achieves plan goals
  - Pass.
