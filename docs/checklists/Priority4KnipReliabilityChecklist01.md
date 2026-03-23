# Priority 4 Checklist 01 — Knip Reliability Calibration

Status: proposed

Source plan: `docs/plans/Priority4KnipReliabilityMiniPlan.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Review and tune `knip.json` so it better matches the installed Knip major version and the repository's actual structure." (In Scope)
- In scope anchor: "Configure Knip for the repo's non-default config surfaces where official plugin configuration supports that." (In Scope)
- In scope anchor: "Define targeted `entry` and `project` adjustments where custom entry points are causing false unused-file or unused-export reports." (In Scope)
- In scope anchor: "Document the recommended Knip configuration strategy so future Priority 4 work can use Knip output consistently." (In Scope)
- Constraint anchor: "Follow Knip's own guidance: prefer `entry`/`project` and plugin configuration over broad `ignore` usage." (Constraints)
- Constraint anchor: "Do not use this mini-plan to justify dependency removals without separate manual verification." (Constraints)
- Acceptance anchor: "The proposed changes prioritize plugin/config overrides and `entry`/`project` tuning before broad ignore-based suppression." (Acceptance Criteria)
- Acceptance anchor: "The mini-plan defines which Knip options are recommended for this repo and which should be used only as a last resort." (Acceptance Criteria)

## Atomic Checklist Items

- [x] C01 `[docs]` Create `docs/checklists/Priority4KnipReliabilityChecklist01Validation.md` with sections for baseline findings, configuration changes, before/after Knip comparison, residual noise, and rationale so the rest of the checklist has one traceability destination.
  - Depends on: none.
  - Validation: T01, T02.
  - Trace:
    - "Document the recommended Knip configuration strategy so future Priority 4 work can use Knip output consistently." (In Scope)
    - "future contributors can understand why Knip is configured the way it is and how to interpret its output." (Validation Strategy)

- [x] C02 `[config]` Update `knip.json` so its schema/version assumptions match the installed Knip 6 major version and validate or remove the current suspicious `tags` entry instead of carrying it forward blindly.
  - Depends on: none.
  - Validation: T01, T03.
  - Trace:
    - "Review and tune `knip.json` so it better matches the installed Knip major version and the repository's actual structure." (In Scope)
    - "Align the schema to the installed major version." (Proposed Configuration Direction)
    - "Correct or remove the current tag configuration." (Proposed Configuration Direction)

- [x] C03 `[config]` Teach Knip about this repo's non-default config surfaces in `knip.json`, including the repo-owned ESLint, Jest, webpack, and Cypress config locations when official plugin configuration supports those overrides.
  - Depends on: C02.
  - Validation: T01, T02.
  - Trace:
    - "Configure Knip for the repo's non-default config surfaces where official plugin configuration supports that." (In Scope)
    - "Add plugin/config overrides for non-default file locations." (Proposed Configuration Direction)
    - "prefer `entry`/`project` and plugin configuration over broad `ignore` usage." (Constraints)

- [x] C04 `[config]` Add targeted `entry` and/or `project` tuning in `knip.json` for repo-specific frontend/build entry points only where that modeling is needed to reduce known false unused-file or unused-export reports.
  - Depends on: C02.
  - Validation: T02, T03.
  - Trace:
    - "Define targeted `entry` and `project` adjustments where custom entry points are causing false unused-file or unused-export reports." (In Scope)
    - "Add targeted repo entry/project patterns only where needed." (Proposed Configuration Direction)
    - "use configuration to model these files before suppressing them" (Proposed Configuration Direction)

- [x] C05 `[validation]` Run `yarn knip` after C02-C04 and record a before/after comparison in `docs/checklists/Priority4KnipReliabilityChecklist01Validation.md`, with explicit focus on the known problem areas from the source plan.
  - Depends on: C01, C02, C03, C04.
  - Validation: T02.
  - Trace:
    - "Before/after analysis evidence" (Validation Strategy)
    - "a follow-up `yarn knip` run shows fewer obviously false-positive findings in the known problem areas." (Validation Strategy)

- [x] C06 `[control]` Only if residual noise remains after C02-C05, apply narrowly scoped suppressions in `knip.json` using `ignoreFiles`, `ignoreIssues`, or `ignoreBinaries` with written rationale in the validation notes; do not use `ignoreDependencies` unless a dependency is clearly unmodelable in the repo's current structure and that rationale is recorded explicitly.
  - Depends on: C05.
  - Validation: T03.
  - Trace:
    - "targeted suppressions are allowed only after configuration and entry/project tuning still leave clearly explainable residual noise." (Open Questions / Assumptions)
    - "Prefer targeted suppressions over broad ignore rules." (Proposed Configuration Direction)
    - "avoid `ignoreDependencies` as a first move unless a dependency is truly unmodelable in the repo's current structure" (Proposed Configuration Direction)

- [ ] C07 `[docs]` Finalize `docs/checklists/Priority4KnipReliabilityChecklist01Validation.md` so it explains which current findings appear resolved, which remain verification-required, and how future Priority 4 work should interpret Knip output after this calibration pass.
  - Depends on: C05, C06.
  - Validation: T03.
  - Trace:
    - "Document the recommended Knip configuration strategy so future Priority 4 work can use Knip output consistently." (In Scope)
    - "future contributors can understand why Knip is configured the way it is and how to interpret its output." (Validation Strategy)

## Validation Items

- [x] T01 `[validation]` Configuration evidence validation: verify the resulting `knip.json` matches the installed Knip major version and explicitly models the repo's non-default config surfaces that are in scope for this checklist.
  - Trace:
    - "Pass: the configured Knip options match the installed major version and explicitly model the repo's non-default config surfaces." (Validation Strategy)
    - "Fail: the config remains version-misaligned or continues to omit known custom repo surfaces." (Validation Strategy)

- [x] T02 `[validation]` Before/after analysis validation: compare the baseline `yarn knip` findings recorded from the source plan against the post-change `yarn knip` run and confirm whether the known false-positive areas materially improved.
  - Trace:
    - "Pass: a follow-up `yarn knip` run shows fewer obviously false-positive findings in the known problem areas." (Validation Strategy)
    - "Fail: the same known false positives remain unchanged, or broad suppressions hide too much signal." (Validation Strategy)

- [x] T03 `[validation]` Process validation: confirm the checklist used plugin/config and `entry`/`project` tuning before any suppressions, that any suppressions are targeted and justified, and that no dependency-removal decision was made from Knip output alone.
  - Trace:
    - "The proposed changes prioritize plugin/config overrides and `entry`/`project` tuning before broad ignore-based suppression." (Acceptance Criteria)
    - "Do not use this mini-plan to justify dependency removals without separate manual verification." (Constraints)

## Behavior Slices

### Slice S1
- Goal: Align Knip configuration with the installed version and the repo's non-default config surfaces.
- Items: C01, C02, C03, T01.
- Type: behavior.

### Slice S2
- Goal: Improve Knip's understanding of repo-specific entry boundaries and measure whether known false positives improve.
- Items: C04, C05, T02.
- Type: behavior.

### Slice S3
- Goal: Apply only narrowly justified residual suppressions if needed and finalize the repo's Knip interpretation guidance.
- Items: C06, C07, T03.
- Type: mechanical.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None.

- Atomicity fixes needed:
  - None identified; each item is scoped to one configuration or documentation outcome.

- Validation mapping gaps:
  - None identified; each checklist item has an explicit validation path and the validation items map directly to the source plan's evidence requirements.

- Pass/Fail: checklist achieves plan goals
  - Pass.
