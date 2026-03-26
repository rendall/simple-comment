# Priority 4 Runtime / Platform Checklist 01 Validation

Status: archived

Checklist: `docs/archive/Priority4RuntimePlatformChecklist01.md`

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

Outcome after C03:

- direct dependency removal accepted
- remaining matches after removal are limited to:
  - Netlify CLI command strings such as `netlify functions:serve`
  - transitive Netlify-tooling lockfile entries
  - active Priority 4 planning/checklist references
- `yarn knip` no longer reports `@netlify/functions` as an unused dependency

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
- C03:
  - `yarn remove @netlify/functions`
    - removed the direct dependency entry from `package.json`
    - local Yarn remove/install tail stalled after lockfile regeneration began in this session
  - local install-tail note:
    - the direct dependency was removed cleanly from `package.json`
    - the stale `@netlify/functions@^1.0.0` lockfile entry was pruned manually to match the now-updated dependency graph
  - `rg -n "from ['\\\"]@netlify/functions|require\\(['\\\"]@netlify/functions|@netlify/functions|functions:" . --glob '!docs/archive/**'`
    - confirmed no repo-managed source import surfaced after the removal
    - confirmed remaining matches are command strings, transitive lockfile entries, and planning/checklist references
  - `yarn knip`
    - pass condition met for this step: `@netlify/functions` no longer appears in the unused dependency list
  - `yarn build:backend`
    - passed
    - backend build retained the same two MongoDB-related warnings and did not surface new Netlify/runtime regressions
- C04:
  - implementation:
    - added targeted `IgnorePlugin` handling for `@aws-sdk/credential-providers` under the `mongodb/lib` path in `webpack.netlify.functions.cjs`
  - `yarn build:backend`
    - passed
    - removed the `mongodb/lib/deps.js` `@aws-sdk/credential-providers` module-resolution warning
    - retained only the `mongodb/lib/utils.js` critical dependency warning
  - disposition:
    - accepted as a low-risk backend bundler-side remediation
    - no runtime-behavior change observed; the warning removal matches the existing optional-dependency ignore pattern already used for other MongoDB driver peers
- C05:
  - investigation inputs:
    - current `yarn build:backend` after C04 leaves exactly one warning:
      - `mongodb/lib/utils.js`: `Critical dependency: the request of a dependency is an expression`
    - archived backend warning register:
      - `docs/archive/priority2-track-c/warning-register-current.md` records the same warning signature as `TOLERATE`
    - current webpack config already suppresses several optional MongoDB dependency-resolution paths, including the newly added `@aws-sdk/credential-providers`, without touching the driver's dynamic `require()` pattern in `mongodb/lib/utils.js`
  - disposition:
    - tolerate in place for this slice
    - rationale:
      - the remaining warning still comes from the MongoDB driver's dynamic optional dependency path rather than a repo-local import pattern
      - the lower-risk warning elimination already happened in C04; removing the final dynamic-require warning would likely require a more invasive bundler or dependency-level intervention than this runtime/platform slice approves
      - the current warning remains consistent with the previously accepted archived backend warning rationale for the current-stack MongoDB driver pattern

## Validation Outcomes

- T01:
  - post-removal repo search confirms there is no repo-managed source import of `@netlify/functions`
  - `yarn knip` no longer reports `@netlify/functions`; the only remaining unused dependency signal is `ts-node`, which remains intentionally out of scope for this slice
  - result: pass
- T02:
  - `yarn build` baseline before runtime/platform changes:
    - 2 backend warnings
      - `mongodb/lib/deps.js`: `Can't resolve '@aws-sdk/credential-providers'`
      - `mongodb/lib/utils.js`: `Critical dependency: the request of a dependency is an expression`
  - `yarn build:backend` after C03:
    - passed
    - same 2 warnings remained
  - `yarn build:backend` after C04:
    - passed
    - warning count reduced from 2 to 1
    - remaining warning: `mongodb/lib/utils.js` dynamic require
  - `timeout 300s yarn test:backend`
    - passed
    - 11 suites passed
    - 180 tests passed
    - completed in `223.99s` wall time / `106.845s` Jest time
  - result: pass
- T03:
  - checklist state and validation notes agree on all outcomes:
    - `@netlify/functions`: removed
    - `@aws-sdk/credential-providers` warning: fixed in-scope
    - dynamic `mongodb/lib/utils.js` warning: explicitly tolerated with rationale
  - the slice leaves a clear remaining runtime/platform handoff:
    - one residual backend build warning
    - broader runtime/platform major-version modernization still deferred to later Priority 4 work
  - result: pass

## Final Dispositions

- `@netlify/functions`
  - disposition: removed
  - rationale: no live repo-managed source/runtime usage found; validation stayed green after removal
- `mongodb/lib/deps.js` `@aws-sdk/credential-providers` warning
  - disposition: fixed in-scope
  - rationale: targeted `IgnorePlugin` handling matched the existing optional MongoDB dependency strategy and removed the warning without observed runtime regression
- `mongodb/lib/utils.js` critical dependency warning
  - disposition: tolerate
  - rationale: current evidence still points to a MongoDB-driver dynamic `require()` pattern rather than a repo-local import mistake; eliminating it would likely require broader bundler/driver intervention than this slice approves
