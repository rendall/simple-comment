# Priority 4, Slice 2, Phase 03 Validation — Residual Dependency Triage Loop

Status: in_progress

Checklist: `docs/checklists/Priority4Slice2Phase03.md`

## Starting Residual Queue

Baseline captured on 2026-03-25 before Phase 03 implementation:

- `yarn knip` reported the following unused dependencies:
  - `@netlify/functions`
  - `@xstate/cli`
  - `@xstate/test`
  - `mongodb-memory-server`
  - `ts-node`
  - `webpack-bundle-analyzer`
  - `webpack-license-plugin`
  - `yarn`
- `yarn knip` also reported:
  - 27 unused exports
  - 22 unused exported types
  - configuration hint: redundant `src/entry/index.ts` entry pattern in `knip.json`

## Per-Item Decisions

- C02 `@netlify/functions`:
  - decision: defer
  - rationale: repo search found no direct source imports, but this package sits on the runtime/platform boundary already named in the Priority 4 plan; removing it in Slice 2 would force a runtime/tooling judgment better handled in the dedicated runtime/platform follow-on
  - destination: Priority 4 runtime/platform modernization slice
- C03 `@xstate/cli`:
  - decision: remove
  - rationale: repo search found no live usage outside package metadata, lockfile, and prior planning documents
- C04 `@xstate/test`:
  - decision: remove
  - rationale: repo search found no live usage outside package metadata, lockfile, and prior planning documents
  - note: the first `yarn test:frontend` attempt failed because the interrupted Yarn remove/install tail left `node_modules` transiently incomplete (`jest-resolve` missing); a clean reinstall restored the workspace and the rerun passed, so the item remains accepted as a package-manager churn issue rather than a real dependency coupling issue
- C05 `mongodb-memory-server`:
  - decision: defer
  - rationale: repo search ties the package directly to the active Jest Mongo preset path, pinned MongoDB 6.x behavior, and existing `MONGOMS_DOWNLOAD_URL` parity handling; removing it here would force test-stack behavior decisions that belong in the dedicated test-stack slice
  - destination: Priority 4 test-stack modernization slice
- C06 `ts-node`:
  - pending
- C07 `webpack-bundle-analyzer`:
  - pending
- C08 `webpack-license-plugin`:
  - pending
- C09 `yarn`:
  - pending
- C10 `knip.json` configuration hint:
  - pending
- C11 unused exports/types disposition:
  - pending

## Command Evidence

- C02:
  - `rg -n "@netlify/functions|functions:" .`
    - confirmed direct references are limited to `package.json`, lockfile, plan/checklist docs, and Netlify command strings rather than source imports
  - `yarn knip`
    - package remains reported as unused
    - defer decision recorded instead of forcing a runtime/platform removal in Slice 2
- C03:
  - `rg -n "@xstate/cli|xstate-cli" .`
    - confirmed matches were limited to `package.json`, lockfile, and documentation
  - `yarn knip`
    - pass condition met for this step: `@xstate/cli` is no longer reported in the unused dependency list
  - `yarn build:frontend`
    - passed
    - frontend build completed successfully after the dependency removal
- C04:
  - `rg -n "@xstate/test|xstate/test" .`
    - confirmed matches were limited to `package.json`, lockfile, and documentation
  - `yarn knip`
    - pass condition met for this step: `@xstate/test` is no longer reported in the unused dependency list
  - `yarn test:frontend`
    - passed on clean rerun: 6 suites, 139 tests
- C05:
  - `rg -n "mongodb-memory-server|jest-mongodb|MONGOMS" .`
    - confirmed the package is intertwined with `@shelf/jest-mongodb`, `jest-mongodb-config.js`, and the documented Mongo test-runtime compatibility controls
  - `yarn knip`
    - package remains reported as unused
    - defer decision recorded instead of forcing a test-stack removal in Slice 2
- C06:
  - pending
- C07:
  - pending
- C08:
  - pending
- C09:
  - pending
- C10:
  - pending

## Before/After Knip Comparison

Before this phase:

- unused dependencies:
  - `@netlify/functions`
  - `@xstate/cli`
  - `@xstate/test`
  - `mongodb-memory-server`
  - `ts-node`
  - `webpack-bundle-analyzer`
  - `webpack-license-plugin`
  - `yarn`
- residual follow-up:
  - 27 unused exports
  - 22 unused exported types
  - redundant `src/entry/index.ts` entry hint in `knip.json`

After C02-C11:

- pending

## Post-Slice-2 Handoff Notes

- pending
