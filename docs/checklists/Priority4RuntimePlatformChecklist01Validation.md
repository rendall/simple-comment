# Priority 4 Runtime / Platform Checklist 01 Validation

Status: in progress

Checklist: `docs/checklists/Priority4RuntimePlatformChecklist01.md`

## Baseline Runtime / Platform Evidence

Baseline captured on 2026-03-25 before Checklist 01 implementation:

- direct dependency under review:
  - `@netlify/functions@^1.0.0` in `package.json`
- current repo-usage signal:
  - Slice 2 deferred `@netlify/functions` because repo search found no direct source imports, but the package sat on the runtime/platform boundary and needed a dedicated follow-on decision
- current backend build warning pair from `yarn build`:
  - `mongodb/lib/deps.js`: `Module not found: Error: Can't resolve '@aws-sdk/credential-providers'`
  - `mongodb/lib/utils.js`: `Critical dependency: the request of a dependency is an expression`

## @netlify/functions Triage

Baseline inventory after C02:

- repo search:
  - no live source import or runtime usage of `@netlify/functions` was found in `src`, scripts, workflow files, or contributor docs
  - current matches are limited to:
    - direct declaration in `package.json`
    - transitive lockfile entries through Netlify tooling
    - prior Priority 4 planning/checklist references
    - the Netlify CLI command string `netlify functions:serve`, which does not itself import the direct package from repo source
- `yarn knip`:
  - still reports `@netlify/functions` as an unused dependency
- provisional classification:
  - `@netlify/functions`: `remove now`

## Backend Warning Investigation

Baseline inventory after C02:

- fresh `yarn build` warning signatures:
  - `mongodb/lib/deps.js`: `Module not found: Error: Can't resolve '@aws-sdk/credential-providers'`
  - `mongodb/lib/utils.js`: `Critical dependency: the request of a dependency is an expression`
- current webpack config signal:
  - `webpack.netlify.functions.cjs` already uses `IgnorePlugin` to suppress several MongoDB optional dependency paths without changing runtime behavior
- provisional classifications:
  - `@aws-sdk/credential-providers` warning: `fix now`
  - dynamic `mongodb/lib/utils.js` warning: `tolerate` unless a comparably low-risk webpack-side remediation is found during C05

## Per-Item Command Evidence

- C02:
  - `rg -n "from ['\\\"]@netlify/functions|require\\(['\\\"]@netlify/functions|@netlify/functions|functions:" . --glob '!docs/archive/**'`
    - confirmed no repo-managed source import of `@netlify/functions`
    - confirmed remaining direct matches are package metadata, lockfile transitives, Netlify CLI command strings, and active Priority 4 docs
  - `yarn knip`
    - still reports `@netlify/functions` as an unused dependency
    - also still reports `ts-node` as unused, but that remains out of scope for this slice because the earlier Mongo checklist re-established it as required for backend Jest config loading
  - `yarn build`
    - passed
    - reproduced the current backend warning pair for the runtime/platform slice baseline

## Validation Outcomes

To be completed in T01-T03.

## Final Dispositions

To be completed in C06.
