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
  - pending
- C04 `@xstate/test`:
  - pending
- C05 `mongodb-memory-server`:
  - pending
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
  - pending
- C04:
  - pending
- C05:
  - pending
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
