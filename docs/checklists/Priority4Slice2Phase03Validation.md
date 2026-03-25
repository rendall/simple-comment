# Priority 4, Slice 2, Phase 03 Validation — Residual Dependency Triage Loop

Status: complete

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
  - decision: remove
  - rationale: repo search found no live `ts-node` usage in scripts, configs, or source imports; typecheck continues to run through `tsc`
- C07 `webpack-bundle-analyzer`:
  - decision: remove
  - rationale: repo search found no live webpack config usage or other source-level references outside package metadata, lockfile, and planning docs
- C08 `webpack-license-plugin`:
  - decision: remove
  - rationale: repo search found no live webpack config usage or other source-level references outside package metadata, lockfile, and planning docs
- C09 `yarn`:
  - decision: remove
  - rationale: repo search found no repo-managed module import of `yarn`, and a clean-workspace retry confirmed the direct dependency can be removed safely when the tree is reinstalled fully before validation
  - note: the earlier `mkdirp` failure after temporary removal did not reproduce on a clean reinstall; the accepted outcome is therefore removal, with the earlier failure reclassified as transient install-tree churn rather than stable build coupling
- C10 `knip.json` configuration hint:
  - decision: fix in place
  - rationale: Knip consistently reports `src/entry/index.ts` as a redundant explicit entry because the current frontend entry surface is already covered by the remaining explicit Vite inputs
  - result: removing the redundant entry eliminated the final Knip configuration hint
- C11 unused exports/types disposition:
  - decision: defer
  - rationale: the remaining 27 unused exports and 22 unused exported types are code-surface cleanup candidates, not dependency-state changes; resolving them would require a broader source-level review than the low-risk dependency loop approved for Slice 2
  - destination: later Priority 4 follow-on or separate repo-health cleanup slice after Slice 2 completes

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
  - `rg -n "ts-node|ts-node/register|ts-node-esm" .`
    - confirmed matches were limited to `package.json`, lockfile, and documentation
  - `yarn knip`
    - pass condition met for this step: `ts-node` is no longer reported in the unused dependency list
  - `yarn typecheck`
    - passed
    - frontend and Netlify functions TypeScript projects both completed successfully after the dependency removal
- C07:
  - `rg -n "webpack-bundle-analyzer|BundleAnalyzerPlugin|bundle-analyzer" .`
    - confirmed matches were limited to `package.json`, lockfile, and documentation
  - `yarn knip`
    - pass condition met for this step: `webpack-bundle-analyzer` is no longer reported in the unused dependency list
  - `yarn build:backend`
    - passed
    - backend build retained the same known MongoDB warning and did not surface new webpack/plugin regressions
- C08:
  - `rg -n "webpack-license-plugin|LicenseWebpackPlugin|license-plugin" .`
    - confirmed matches were limited to `package.json`, lockfile, and documentation
  - `yarn knip`
    - pass condition met for this step: `webpack-license-plugin` is no longer reported in the unused dependency list
  - `yarn build:backend`
    - passed
    - backend build retained the same known MongoDB warning and did not surface new webpack/plugin regressions
- C09:
  - `rg -n "require\\(['\\\"]yarn|from ['\\\"]yarn|\\byarn\\b" .`
    - confirmed there is no repo-managed module import of `yarn`; matches are command/documentation usage plus package metadata
  - clean-workspace retry:
    - `yarn install --non-interactive`
      - passed after a full reinstall on the post-removal tree and saved the updated lockfile
    - `yarn knip`
      - passed for the intended signal: `yarn` no longer appears in the unused dependency list, leaving only `@netlify/functions` and `mongodb-memory-server` as residual unused dependencies
    - `yarn build`
      - passed
      - backend build retained the same known MongoDB warning, and frontend build completed successfully
- C10:
  - `yarn knip`
    - pass condition met for this step: the redundant `src/entry/index.ts` configuration hint is no longer reported

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

- `yarn knip` now reports only these unused dependencies:
  - `@netlify/functions`
  - `mongodb-memory-server`
- each remaining unused dependency has an explicit defer rationale and destination recorded in this document
- the remaining code-surface follow-up is unchanged but explicitly classified:
  - 27 unused exports
  - 22 unused exported types
- the previous Knip configuration hint is gone:
  - redundant `src/entry/index.ts` entry pattern removed from `knip.json`

## Post-Slice-2 Handoff Notes

- deferred to runtime/platform slice:
  - `@netlify/functions`
- deferred to test-stack slice:
  - `mongodb-memory-server`
- deferred to later code-surface cleanup:
  - unused exports report
  - unused exported types report

Slice 2 no longer has any untriaged `yarn knip` dependency findings or unaddressed Knip configuration hints. The remaining items are all explicitly classified as deferred follow-up work.

## Scope / Process Confirmation

- This phase remained within Priority 4 Slice 2 low-risk dependency triage and cleanup.
- No major Svelte, MongoDB, Jest, lint/tooling, or runtime/platform migration work was implemented.
- Every residual issue category present at the start of the phase now has an explicit outcome:
  - removed/fixed in Slice 2, or
  - deferred with rationale and destination.
- An earlier temporary `mkdirp` failure during `yarn` removal did not survive a clean reinstall retry, so the accepted final outcome remains within Slice 2 low-risk scope.
