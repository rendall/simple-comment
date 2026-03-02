# Phase 01 - Dependency and Platform Upgrade

Status: Planned

## Goal

Upgrade runtime and dependency baseline first, without changing product behavior.

## Scope

- Node/tooling baseline updates:
  - Adopt latest Node LTS first via `nvm install --lts && nvm use --lts`.
  - Set `.nvmrc` and CI to that same LTS major.
  - If latest LTS is too risky in this phase, fall back in order: `22.x`, then `20.x`.
  - GitHub Actions versions in `.github/workflows/*.yml`.
  - CI Node version alignment in workflows.
- Dependency refresh in `package.json` and lockfile:
  - Netlify/toolchain packages.
  - Jest/ts-jest ecosystem to compatible versions.
  - ESLint + TypeScript ESLint ecosystem.
  - Cypress and related transitive security resolutions.
- Remove deprecated config usage flagged during test runs:
  - Move/adjust `isolatedModules` config per current ts-jest guidance.

## Out of scope

- Behavior fixes to API/business logic.
- Webpack-to-Vite migration.
- Strict mode enablement across application code.

## Inputs and evidence

- `.nvmrc` currently `18.12.1`.
- CI currently Node `16` in `.github/workflows/netlify-api-test.yml`.
- ts-jest deprecation warning observed for `isolatedModules` in `jest.frontend.config.ts`.

## Implementation steps

1. Apply Node version strategy:
   - Try latest LTS first: `nvm install --lts && nvm use --lts`.
   - If risk is unacceptable for Phase 1, downgrade to `22.x`; if still risky, downgrade to `20.x`.
2. Apply chosen Node major to:
   - `.nvmrc`
   - all CI workflows
   - README/dev docs where version is referenced
3. Upgrade dependencies in small coherent groups:
   - test stack
   - lint stack
   - build stack
   - platform SDKs
4. Regenerate lockfile.
5. Run full checks:
   - `yarn lint`
   - `yarn test:frontend`
   - `yarn test:backend` (with test env setup)
6. Record compatibility notes and any pinned versions required.

## Node Fallback Decision Rule

The fallback path (`latest LTS -> 22 -> 20`) is triggered only when latest LTS
cannot be adopted within Phase 1 constraints.

### Phase 1 constraint boundary

Phase 1 must not require product behavior changes in runtime code.

### Decision criteria

1. Stay on latest LTS if required work is limited to:
   - test/dev tooling changes (for example `jest`, `cypress`, `eslint`)
   - build/tooling ergonomics
   - non-breaking compatibility updates
2. Fall back to `22.x` if latest LTS requires:
   - major upgrades to runtime-critical dependencies, or
   - production runtime code changes beyond compatibility shims, or
   - API/contract/output behavior changes to keep the app running
3. Fall back to `20.x` if `22.x` still requires the same high-risk runtime changes.

### Runtime-critical definition (for this repo)

Runtime-critical dependencies are those directly affecting shipped behavior
(backend functions/auth/db/runtime paths and frontend runtime paths), not
test harnesses or developer ergonomics tooling.

## Dependency Upgrade Loop

Repeat this loop until stop conditions are met.

### Stop conditions

- No critical/high reachable vulnerabilities remain in audit output.
- CI-equivalent checks are green (`yarn lint`, `yarn test:frontend`, `yarn test:backend` with test env setup).
- Any remaining issues are explicitly documented as accepted/deferred with rationale.

### Loop steps

1. Capture baseline:
   - `yarn audit --json` (or equivalent) and current test/lint status.
2. Pick one upgrade unit:
   - one package or tightly coupled package family (for example `jest` + `ts-jest`).
3. Add/adjust tests first only when behavior risk is non-trivial.
4. Upgrade dependency unit.
5. Run targeted tests for touched areas.
6. Run full checks:
   - `yarn lint`
   - `yarn test:frontend`
   - `yarn test:backend` (with test env setup)
7. Commit only that unit with clear message (for example `chore(deps): upgrade <pkg> to <version>`).
8. Re-run audit, compare delta, and loop.

### Notes

- Prefer `yarn` for dependency changes in this repository (Yarn classic lockfile).
- Keep dependency units small to simplify bisecting and rollback.

## Checklist QC Decisions (2026-03-02)

1. Issue: The checklist had two upgrade paths (fixed dependency-family items and an iterative loop), which created execution ambiguity.
   Decision: Use one loop-driven path as the source of execution truth; fixed family items are folded into loop selection criteria.

2. Issue: Checklist ordering/dependencies allowed loop execution and documentation finalization without explicit gating.
   Decision: Require audit baseline before loop iteration starts, and require loop completion before final docs/evidence items.

3. Issue: Loop steps did not explicitly gate commit on test results per iteration.
   Decision: Add an explicit loop item for targeted/full checks and block per-unit commit when checks fail.

## Risk and mitigation

- Risk: upgrade introduces behavior regressions hidden by brittle tests.
- Mitigation:
  - Keep logic untouched in this phase.
  - Separate upgrade commits by subsystem.
  - Use staged Node fallback path (`latest LTS -> 22 -> 20`) if dependency/runtime breakage is too high-risk for this phase.
  - Capture before/after command outputs in PR.

## Acceptance criteria

- Node and CI versions aligned.
- Dependencies upgraded with lockfile committed.
- No newly introduced lint errors.
- Tests pass in CI with deterministic env setup.
- PR includes upgrade notes and breaking-change rationale.

## Rollback

- Revert phase PR entirely if unexpected runtime behavior appears.
- If needed, retain only Node/CI alignment and defer risky package jumps.
