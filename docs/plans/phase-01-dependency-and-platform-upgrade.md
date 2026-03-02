# Phase 01 - Dependency and Platform Upgrade

Status: Planned

## Goal

Upgrade runtime and dependency baseline first, without changing product behavior.

## Scope

- Node/tooling baseline updates:
  - `.nvmrc` to Node 20 LTS or Node 22 LTS (pick one and keep CI consistent).
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

1. Pick target Node version (`20.x` or `22.x`) and apply to:
   - `.nvmrc`
   - all CI workflows
   - README/dev docs where version is referenced
2. Upgrade dependencies in small coherent groups:
   - test stack
   - lint stack
   - build stack
   - platform SDKs
3. Regenerate lockfile.
4. Run full checks:
   - `yarn lint`
   - `yarn test:frontend`
   - `yarn test:backend` (with test env setup)
5. Record compatibility notes and any pinned versions required.

## Risk and mitigation

- Risk: upgrade introduces behavior regressions hidden by brittle tests.
- Mitigation:
  - Keep logic untouched in this phase.
  - Separate upgrade commits by subsystem.
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
