# Phase 01 Checklist - Dependency and Platform Upgrade

Source plan: `docs/plans/phase-01-dependency-and-platform-upgrade.md`

## Checklist

- [x] C01 `[governance]` Confirm this checklist remains within approved Phase 01 scope in `docs/plans/phase-01-dependency-and-platform-upgrade.md`.
- [x] C02 `[runtime]` Select the target Node major using Phase 01 fallback rules (`latest LTS -> 22 -> 20`) and record the decision rationale in the Phase 01 PR notes.
- [x] C03 `[runtime]` Update `.nvmrc` to the selected Node major. Depends on: C02.
- [x] C04 `[ci]` Update `.github/workflows/netlify-api-test.yml` to use the selected Node major. Depends on: C02.
- [x] C05 `[ci]` Upgrade GitHub Actions versions used in `.github/workflows/netlify-api-test.yml` and `.github/workflows/codeql.yml` to supported current majors. Depends on: C02.
- [x] C06 `[config]` Resolve the deprecated ts-jest `isolatedModules` configuration path by updating `jest.frontend.config.ts` and/or `tsconfig.frontend.json` to remove deprecation warnings.
- [x] C07 `[audit]` Capture baseline audit output using `yarn audit --json` and record where the output is stored/referenced in Phase 01 PR notes.
- [x] C08 `[deps-loop]` Select the next dependency upgrade unit from audit findings using severity/reachability and dependency-coupling criteria (for example test, lint, build/platform families). Depends on: C07.
- [x] C09 `[deps-loop]` Add/adjust tests for the selected dependency unit only when behavior risk is non-trivial. Depends on: C08.
- [x] C10 `[deps-loop]` Upgrade only the selected dependency unit in `package.json` and `yarn.lock` as one isolated change. Depends on: C08.
- [x] C11 `[deps-loop]` Run validation for the selected unit (`yarn lint`, targeted scope checks, and full test checks required by this phase); if checks fail, resolve before commit. Depends on: C10.
- [x] C12 `[deps-loop]` Commit the isolated dependency unit change with an intent-revealing dependency commit message. Depends on: C11.
- [x] C13 `[deps-loop]` Repeat C08-C12 until the Phase 01 stop conditions in `docs/plans/phase-01-dependency-and-platform-upgrade.md` are satisfied. Depends on: C07.
- [x] C14 `[docs]` Update Node/tooling version references in `README.md` and any other modified docs to match the selected Node major. Depends on: C02, C13.
- [x] C15 `[docs]` Record final Phase 01 compatibility notes, pinned-version rationale, audit delta summary, loop iteration summary, and fallback decision outcome in PR phase notes. Depends on: C13.

## Behavior Slices

- Goal: Establish approved execution boundary and Node target.
  Items: C01, C02
  Type: mechanical

- Goal: Align repository and CI runtime baseline to the selected Node major.
  Items: C03, C04
  Type: mechanical

- Goal: Modernize CI action runtime/tooling wrappers.
  Items: C05
  Type: mechanical

- Goal: Remove known deprecation configuration in test tooling.
  Items: C06
  Type: mechanical

- Goal: Execute dependency upgrades in iterative, isolated loop slices until Phase 01 stop conditions are met.
  Items: C07, C08, C09, C10, C11, C12, C13
  Type: mechanical

- Goal: Synchronize documentation and phase evidence with final implementation state.
  Items: C14, C15
  Type: mechanical
