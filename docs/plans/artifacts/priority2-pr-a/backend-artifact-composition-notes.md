# Priority 2 PR A Backend Artifact Composition Notes (Baseline)

Source: `docs/plans/artifacts/priority2-pr-a/build-backend.log`

## Observed Composition Signals

- All function bundles are emitted at approximately `2.94 MiB` (`auth`, `comment`, `gauth`, `topic`, `user`, `verify`).
- Webpack reports `modules by path ./node_modules/ 2.21 MiB` and `modules by path ./src/ 103 KiB` for the backend build.
- Webpack reports approximately `700` JavaScript modules and `66` orphan modules in the backend bundle graph.
- The warning call stack for both backend warnings traces through MongoDB internals and `src/lib/MongodbService.ts`.

## Baseline-Only Hypotheses (No Optimization Applied in PR A)

1. Shared backend dependency weight appears dominated by `node_modules` content, likely including MongoDB and AWS SDK transitive modules.
2. Similar output size for every function entry suggests common dependency duplication across per-entry bundles.
3. Warning-bearing MongoDB paths are candidates for later mitigation analysis in a dedicated remediation PR, not this baseline PR.

## Scope Guard

These are inventory notes only and do not implement any bundler configuration, dependency externalization, or code-path changes.
