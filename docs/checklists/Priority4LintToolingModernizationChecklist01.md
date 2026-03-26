# Priority 4 — Lint / Tooling Checklist 01

Status: proposed

Source plan: `docs/plans/Priority4LintToolingModernizationPlan.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Re-evaluate the current ESLint / `@typescript-eslint` / Prettier / TypeScript tooling surface as a dedicated Priority 4 slice." (In Scope)
- In scope anchor: "Inventory the active lint/format/typecheck packages and config surfaces that belong to this lane." (In Scope)
- In scope anchor: "Define the exact validation path for accepted lint/tooling changes." (In Scope)
- In scope anchor: "Record any compatibility boundary that must be handed forward into later frontend/build or test/tooling slices instead of being absorbed here." (In Scope)
- Constraint anchor: "Prefer the smallest reviewable modernization steps that preserve the current contributor entry points: `yarn lint`, `yarn run prettier --list-different .`, `yarn typecheck`" (Constraints)
- Constraint anchor: "If a tooling upgrade requires broader build/test/package changes than this slice can justify, stop and record the handoff instead of compensating with unrelated migrations." (Constraints)
- Risk anchor: "format/lint upgrades create a repo-wide output churn that is hard to review." (Risks and Mitigations)
- Mitigation anchor: "require the checklist to separate dependency/config modernization from any broad formatting rewrites" (Risks and Mitigations)
- Acceptance anchor: "The plan explicitly decides whether ESLint flat-config migration is in scope for the first checklist or deferred." (Acceptance Criteria)
- Acceptance anchor: "The plan preserves the current contributor-facing entry points for lint, format check, and typecheck..." (Acceptance Criteria)
- Validation anchor: "Pass: accepted changes keep the primary commands runnable and meaningful: `yarn lint`, `yarn run prettier --list-different .`, `yarn typecheck`" (Validation Strategy)
- Validation anchor: "Pass: any meaningful new warning/error patterns, formatting churn, or typecheck-scope changes are recorded clearly." (Validation Strategy)

## Additional Scope Control

- This checklist is limited to the current lint/tooling follow-on in the working flat-config state already established on the `priority-4` branch.
- This checklist intentionally covers only:
  - structure-only cleanup of `eslint.config.mjs`
  - verification that representative TS, Svelte, and Cypress lint surfaces preserve behavior across that cleanup
  - explicit disposition of current Prettier alignment work
  - removal of migration leftovers that are demonstrably unused in the active lint/tooling path
- This checklist intentionally excludes:
  - broad formatting rewrites
  - new source-level lint cleanup unrelated to config/tooling structure
  - test-stack, frontend-build, runtime/platform, or Mongo work
  - opportunistic package upgrades outside the narrow Prettier-alignment decision
  - changing rule intent while performing config-structure cleanup

## Atomic Checklist Items

- [x] C01 `[docs]` Create `docs/checklists/Priority4LintToolingModernizationChecklist01Validation.md` with sections for current lint/format/typecheck command evidence, representative TS/Svelte/Cypress config probes, ESLint config cleanup decisions, Prettier alignment disposition, and residual follow-on notes.
  - Depends on: none.
  - Validation: T03.
  - Trace:
    - "Define the exact validation path for accepted lint/tooling changes." (In Scope)
    - "Pass: any meaningful new warning/error patterns, formatting churn, or typecheck-scope changes are recorded clearly." (Validation Strategy)

- [x] C02 `[inventory]` Record the current lint/tooling baseline in the validation notes, including the active `eslint.config.mjs` structure, the current Prettier package/plugin versions, the presence of migration leftovers such as `@eslint/eslintrc`, and the current green status of `yarn lint`, `yarn run prettier --list-different .`, and `yarn typecheck`.
  - Depends on: C01.
  - Validation: T01, T03.
  - Trace:
    - "Inventory the active lint/format/typecheck packages and config surfaces that belong to this lane." (In Scope)
    - "Pass: accepted changes keep the primary commands runnable and meaningful..." (Validation Strategy)

- [x] C03 `[eslint]` Simplify `eslint.config.mjs` mechanically by deduplicating repeated ignore blocks, grouping the config into clearly labeled base/Cypress/Svelte/TypeScript sections, and preserving existing parser, globals, and rule intent without introducing new rule behavior.
  - Depends on: C02.
  - Validation: T01, T02.
  - Trace:
    - "Prefer the smallest reviewable modernization steps that preserve the current contributor entry points..." (Constraints)
    - "This slice should improve contributor trust in the repo's code-quality gate, not create a surprise ecosystem migration." (Intent)

- [x] C04 `[deps]` Remove `@eslint/eslintrc` from `package.json` and `yarn.lock` if repo search still shows no active usage in the current flat-config path, or document an explicit defer rationale in the validation notes if new evidence appears.
  - Depends on: C02.
  - Validation: T01, T03.
  - Trace:
    - "Record any compatibility boundary that must be handed forward..." (In Scope)
    - "If a tooling upgrade requires broader build/test/package changes than this slice can justify, stop and record the handoff..." (Constraints)

- [ ] C05 `[prettier]` Record the current Prettier alignment disposition in the validation notes by deciding whether the current green formatter path is accepted for this checklist or whether `prettier` / `prettier-plugin-svelte` modernization must be handed forward into a separate follow-on checklist, without triggering a broad formatting rewrite in this slice.
  - Depends on: C02.
  - Validation: T01, T03.
  - Trace:
    - "Define the safest modernization path for: ... Prettier ... `prettier-plugin-svelte`" (In Scope)
    - "require the checklist to separate dependency/config modernization from any broad formatting rewrites" (Risks and Mitigations)

- [ ] C06 `[docs]` Finalize `docs/checklists/Priority4LintToolingModernizationChecklist01Validation.md` with the before/after config structure summary, representative TS/Svelte/Cypress validation evidence, `@eslint/eslintrc` disposition, and the explicit Prettier follow-on decision.
  - Depends on: C02, C03, C04, C05.
  - Validation: T03.
  - Trace:
    - "Pass: any meaningful new warning/error patterns, formatting churn, or typecheck-scope changes are recorded clearly." (Validation Strategy)
    - "Record any compatibility boundary that must be handed forward..." (In Scope)

## Validation Items

- [ ] T01 `[validation]` Command validation: run `yarn lint`, `yarn run prettier --list-different .`, and `yarn typecheck` after each accepted config/dependency step and confirm the contributor-facing entry points remain green and meaningful.
  - Trace:
    - "Pass: accepted changes keep the primary commands runnable and meaningful..." (Validation Strategy)

- [ ] T02 `[validation]` Behavior-preservation validation: run representative ESLint probes for one TypeScript file, one Svelte file, and one Cypress file before and after the `eslint.config.mjs` cleanup, and confirm parser/globals/rule behavior stays intentional rather than being lost in block moves.
  - Trace:
    - "Pass: lint/tooling changes do not silently change the repo's contributor quality-gate contract..." (Validation Strategy)
    - "Prefer the smallest reviewable modernization steps..." (Constraints)

- [ ] T03 `[validation]` Documentation/process validation: confirm the checklist state, validation notes, and any defer decisions are internally consistent and sufficient to declare whether the lint/tooling lane is done or requires one more follow-on checklist.
  - Trace:
    - "Pass: any meaningful new warning/error patterns, formatting churn, or typecheck-scope changes are recorded clearly." (Validation Strategy)

## Behavior Slices

### Slice S1
- Goal: Establish the current lint/tooling baseline and evidence ledger.
- Items: C01, C02.
- Type: mechanical.

### Slice S2
- Goal: Simplify the ESLint config structure without changing its behavior.
- Items: C03, T02.
- Type: mechanical.

### Slice S3
- Goal: Remove migration leftovers and explicitly disposition formatter alignment work.
- Items: C04, C05, T01, C06, T03.
- Type: behavior.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None; the checklist stays inside lint/tooling surfaces already named in the plan and uses documentation of Prettier disposition rather than broad formatter churn.

- Atomicity fixes needed:
  - None identified; config cleanup, dependency cleanup, and Prettier disposition are separated into independent reviewable items.

- Validation mapping gaps:
  - None identified; command health, representative surface behavior, and final documentation consistency each have an explicit validation path.

- Pass/Fail: checklist achieves plan goals
  - Pass.
