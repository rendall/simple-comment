# Priority 4 Mini-Plan — Lint / Tooling Modernization

Status: archived

Source plan: `docs/plans/Priority4DependencyModernizationPlan.md`

Classification: formal mini-plan artifact under `docs/norms/plan.md`

## Goal

Modernize the repository's linting, formatting, and TypeScript-adjacent contributor tooling so the quality gate is easier to trust and maintain, without quietly turning this slice into a broader test-stack, frontend-build, or framework migration.

## Intent

This follow-on should make the repo's "day-to-day code health tools" feel current and dependable.

In plain language, success means:

- contributors can run `yarn lint`, `yarn run prettier --list-different .`, and `yarn typecheck` without relying on outdated or fragile tool combinations,
- the repo's lint/format/typecheck stack is more current than it is today,
- the changes stay inside the lint/tooling lane instead of spilling into major frontend/build or Mongo/test-stack work,
- and any larger migration pressure, such as ESLint flat-config adoption or TypeScript-driven build/test coupling, is surfaced explicitly instead of being smuggled into an "upgrade the linter" checklist.

This slice should improve contributor trust in the repo's code-quality gate, not create a surprise ecosystem migration.

## Current Baseline

Current repository state shows a mixed-age lint/tooling surface:

- lint command:
  - `yarn lint` runs `eslint .`
- format command:
  - `yarn run prettier --list-different .`
- typecheck command:
  - `yarn typecheck` runs:
    - `tsc --noEmit -p tsconfig.frontend.json`
    - `tsc --noEmit -p tsconfig.netlify.functions.json`
- active lint config:
  - `src/.eslintrc.json` uses legacy config format
  - parser/tooling stack includes:
    - `eslint@^8.45.0`
    - `@typescript-eslint/eslint-plugin@^5.22.0`
    - `@typescript-eslint/parser@^5.22.0`
    - `eslint-plugin-svelte@^2.32.4`
    - `svelte-eslint-parser@^0.32.2`
    - `eslint-config-prettier@^8.5.0`
- active format/tooling stack includes:
  - `prettier@2.6.2`
  - `prettier-plugin-svelte@^2.10.1`
- active compiler/tooling surface includes:
  - `typescript@^5.9.3`
  - `@types/node@^25.5.0`
  - `@tsconfig/svelte@^5.0.0`

Planning interpretation:

- the repo's core lint/format/typecheck commands are active and trusted, so this is a modernization slice, not a broken-tool rescue,
- but the configuration format and package versions are old enough that larger upgrade jumps are likely coupled,
- and this is exactly the kind of slice that can drift into frontend/build or test-stack work if we do not explicitly pin the boundary.

## In Scope

- Re-evaluate the current ESLint / `@typescript-eslint` / Prettier / TypeScript tooling surface as a dedicated Priority 4 slice.
- Inventory the active lint/format/typecheck packages and config surfaces that belong to this lane.
- Define the safest modernization path for:
  - ESLint core
  - `@typescript-eslint/*`
  - Prettier
  - `eslint-config-prettier`
  - `eslint-plugin-svelte`
  - `svelte-eslint-parser`
  - `prettier-plugin-svelte`
  - TypeScript compiler/version alignment as it affects lint/typecheck quality-gate behavior
- Decide whether this slice should:
  - stay on the legacy ESLint config model for now, or
  - intentionally include flat-config migration as part of the lint modernization effort
- Define the exact validation path for accepted lint/tooling changes.
- Record any compatibility boundary that must be handed forward into later frontend/build or test/tooling slices instead of being absorbed here.

## Out of Scope

- Major Svelte framework modernization.
- Frontend build modernization beyond lint/parser/plugin compatibility.
- MongoDB or Jest test-stack modernization.
- Runtime/platform dependency work outside lint/typecheck tooling.
- Broad webpack/Vite migration work.
- Large source-level cleanup of unused exports/types.
- Non-tooling behavior changes to application code or API contracts.
- Adopting a new contributor workflow unrelated to lint/format/typecheck quality gates.

## Constraints

- Keep this work in the dedicated lint/tooling follow-on lane from `docs/plans/Priority4DependencyModernizationPlan.md`.
- Do not smuggle major frontend/build or test-stack coupling work into this slice unless a later approved checklist expands scope explicitly.
- Treat configuration-format migration as a conscious decision, not an incidental byproduct.
- Prefer the smallest reviewable modernization steps that preserve the current contributor entry points:
  - `yarn lint`
  - `yarn run prettier --list-different .`
  - `yarn typecheck`
- If a tooling upgrade requires broader build/test/package changes than this slice can justify, stop and record the handoff instead of compensating with unrelated migrations.

## Risks and Mitigations

- Risk: lint/tooling modernization silently becomes an ESLint flat-config migration plus parser/plugin churn.
  - Mitigation: make flat-config adoption an explicit checklist decision rather than an accidental side effect.

- Risk: a TypeScript version change ripples into `ts-jest`, `ts-loader`, or other build/test surfaces that do not belong in this slice.
  - Mitigation: treat those as explicit stop conditions unless compatibility work is narrowly required and separately approved.

- Risk: format/lint upgrades create a repo-wide output churn that is hard to review.
  - Mitigation: require the checklist to separate dependency/config modernization from any broad formatting rewrites, and document when a formatting wave is intentional.

- Risk: the repo lands on a partially modernized tool stack that is harder to maintain than the current one.
  - Mitigation: require version-alignment rationale and command-level validation after each accepted step.

## Acceptance Criteria

1. The plan defines a dedicated Priority 4 lint/tooling lane separate from runtime/platform, frontend/build, and Mongo/test-stack work.
2. The plan identifies the active lint/format/typecheck packages and config surfaces that belong to this slice.
3. The plan explicitly decides whether ESLint flat-config migration is in scope for the first checklist or deferred.
4. The plan preserves the current contributor-facing entry points for lint, format check, and typecheck unless a later approved checklist intentionally changes them.
5. The plan includes clear stop conditions for build/test coupling that exceeds the lint/tooling lane.
6. The resulting checklist can validate lint, format, and typecheck behavior with explicit evidence rather than tool-version optimism.

## Validation Strategy

Because this slice changes contributor tooling, lint/format output expectations, and typecheck behavior, explicit validation evidence is required.

- **Tooling command evidence**
  - Pass: accepted changes keep the primary commands runnable and meaningful:
    - `yarn lint`
    - `yarn run prettier --list-different .`
    - `yarn typecheck`
  - Fail: a tooling change leaves one of those commands broken, misleading, or dependent on undocumented extra steps.

- **Contract/parity evidence**
  - Pass: lint/tooling changes do not silently change the repo's contributor quality-gate contract or CI/local parity assumptions without being documented.
  - Fail: the slice changes expected command behavior or required workflow without explicit documentation and acceptance.

- **Non-functional evidence**
  - Pass: any meaningful new warning/error patterns, formatting churn, or typecheck-scope changes are recorded clearly.
  - Fail: the repo experiences large lint/format/typecheck signal changes that are not attributed and explained.

- **Scope-control evidence**
  - Pass: build/test/runtime coupling discovered during lint/tooling modernization is either handled by a narrowly justified in-scope compatibility step or deferred explicitly.
  - Fail: the slice drifts into test-stack, frontend/build, or runtime/platform modernization without a separate approved checklist update.

## Open Questions / Assumptions

- Assumption: the next Priority 4 slice should be lint/tooling modernization before frontend/build modernization.
- Assumption: contributor-facing command names should stay the same in this slice.
- Open question: should the first lint/tooling checklist keep the legacy ESLint config model and modernize package versions around it, or should it intentionally migrate to flat config immediately?
- Open question: should TypeScript compiler modernization in this slice stop at the typecheck surface, or should narrowly required `ts-loader` / `ts-jest` compatibility work be allowed when the compiler upgrade demands it?
- Open question: should broad formatting rewrites be accepted in the same checklist as the dependency/config modernization, or deferred into a separate follow-up commit/checklist for review clarity?

## Conformance QC (Plan)

- Intent clarity issues:
  - None identified; the plan clearly frames this as contributor-tool modernization rather than app/runtime modernization.

- Missing required sections:
  - None (`Goal`, `Intent`, `In Scope`, `Out of Scope`, `Acceptance Criteria`, and `Validation Strategy` are present).

- Ambiguities/assumptions to resolve:
  - Whether ESLint flat-config migration is in scope for the first checklist or deferred.
  - Whether narrowly required `ts-loader` / `ts-jest` compatibility updates are allowed if TypeScript modernization forces them.
  - Whether broad formatting rewrites belong in the same checklist or should be separated for review clarity.

- Validation strategy gaps:
  - None at plan level; the checklist will need to bind exact commands and stop conditions to each accepted tool step.

- Traceability readiness:
  - Ready; section language is stable and quoteable for checklist authoring.

- Pass/Fail: ready for checklist authoring
  - Pass after collaborator confirmation of the open questions above.
