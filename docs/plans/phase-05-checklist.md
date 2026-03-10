# Phase 05 Checklist - Frontend Build Modernization

Source plan: `docs/plans/phase-05-frontend-build-modernization.md`

## Execution Locks

- Phase 05 validation evidence levels are locked to plan `Validation Strategy`: `Unit`, `Integration/smoke`, `Contract/parity`, and `Non-functional (in-scope)`.
- Framework/runtime upgrade assertions remain out of scope for Phase 05.
- Build/runtime validation must assert behavior and artifact contracts, not bundler-internal implementation details.

## Checklist

- [x] T01 `[governance]` Confirm Phase 05 validation scope and evidence levels from `Validation Strategy` are locked for execution.
  - Depends on: none.
  - Trace:
    - "Switch the frontend build and local dev workflow from Webpack to Vite without changing what host sites load or how embeds behave." (Plain-Language Intent)
    - "Validate required output artifact roles remain compatible (`simple-comment`, `simple-comment-icebreakers`, and style/static assets)." (Validation Strategy)

- [x] C01 `[governance]` Confirm and document Phase 05 scope boundaries: frontend bundler migration only, backend Netlify-functions bundling unchanged, and framework/runtime upgrades deferred to Phase 06.
  - Depends on: none.
  - Trace:
    - "Migrate frontend build/dev flows from `webpack.frontend.js` to Vite." (In Scope)
    - "Keep backend Netlify-functions bundling unchanged." (In Scope)
    - "Svelte major-version upgrades and frontend framework/runtime modernization (handled in Phase 06)." (Out of Scope)

- [x] T02 `[validation]` Capture pre-migration local frontend dev startup timing baseline using the same machine and method that will be used post-migration.
  - Depends on: C01.
  - Trace:
    - "Local frontend dev startup timing is measured before/after migration using the same machine/method" (Acceptance criteria)
    - "Measure local frontend dev startup timing before and after migration using the same machine/method." (Validation Strategy)

- [x] C02 `[frontend]` Add `vite.config.ts` with frontend entry/output configuration for `simple-comment` and `simple-comment-icebreakers`.
  - Depends on: C01.
  - Validation: T03.
  - Trace:
    - "Create Vite config replicating current entry/output semantics." (Implementation steps)
    - "Preserve current build outputs/entry behavior:" (In Scope)
    - "`simple-comment`" (In Scope)
    - "`simple-comment-icebreakers`" (In Scope)

- [x] C03 `[frontend]` Configure style/static asset handling in `vite.config.ts` so frontend output roles remain compatible with current embedding expectations.
  - Depends on: C02.
  - Validation: T03.
  - Trace:
    - "style bundle/static assets" (In Scope)
    - "Port static asset handling and env variable wiring." (Implementation steps)

- [x] C04 `[frontend]` Port frontend env variable wiring to the Vite-based build path in `vite.config.ts` and `src/apiClient.ts`.
  - Depends on: C02.
  - Validation: T03; T06 (if logic changes in test-covered modules).
  - Trace:
    - "Port static asset handling and env variable wiring." (Implementation steps)
    - "Migrate frontend build/dev flows from `webpack.frontend.js` to Vite." (In Scope)

- [x] C05 `[tooling]` Update `package.json` frontend build scripts so normal frontend build flow uses Vite.
  - Depends on: C03, C04.
  - Validation: C07.
  - Trace:
    - "Rework frontend scripts and contributor docs around the new bundler workflow." (In Scope)
    - "Verify frontend build/dev default paths no longer depend on `webpack.frontend.js`" (Implementation steps)

- [x] C06 `[tooling]` Update `package.json` frontend dev scripts so normal local frontend workflow uses Vite.
  - Depends on: C05.
  - Validation: C07; T05.
  - Trace:
    - "Switch the frontend build and local dev workflow from Webpack to Vite" (Plain-Language Intent)
    - "Verify frontend build/dev default paths no longer depend on `webpack.frontend.js` and that normal contributor flows use Vite." (Implementation steps)

- [x] C07 `[tooling]` Verify normal frontend build/dev flows no longer require `webpack.frontend.js` while backend Netlify-functions bundling remains unchanged.
  - Depends on: C05, C06.
  - Validation: T03, T04, T05.
  - Trace:
    - "Verify frontend build/dev default paths no longer depend on `webpack.frontend.js`" (Implementation steps)
    - "Keep backend Netlify-functions bundling unchanged." (In Scope)

- [x] T03 `[validation]` Validate contract/parity for required artifacts: `simple-comment`, `simple-comment-icebreakers`, and style/static assets.
  - Depends on: C03, C07.
  - Trace:
    - "Generated artifacts required by current embedding remain compatible: `simple-comment`, `simple-comment-icebreakers`, and frontend style/static assets." (Acceptance criteria)
    - "Validate required output artifact roles remain compatible (`simple-comment`, `simple-comment-icebreakers`, and style/static assets)." (Validation Strategy)

- [ ] T04 `[validation]` Run integration/smoke checks on a sample embed page for script load, mount/render, and baseline API-call wiring.
  - Depends on: C07.
  - Trace:
    - "validate with sample embed page and cypress flows" (Risk and mitigation)
    - "Validate script load, mount/render, and baseline API-call wiring on a sample embed page." (Validation Strategy)

- [ ] T05 `[validation]` Measure post-migration local frontend dev startup timing with the same machine/method as baseline and document before/after results.
  - Depends on: C06, T02.
  - Trace:
    - "Local frontend dev startup timing is measured before/after migration using the same machine/method, and results are documented." (Acceptance criteria)
    - "Pass when timing results are documented in phase/PR validation notes." (Validation Strategy)

- [ ] T06 `[validation]` If migration changes logic in test-covered modules, update/run impacted unit tests and record results in validation notes.
  - Depends on: C03, C04.
  - Trace:
    - "Add or update unit tests only when migration changes logic in test-covered modules." (Validation Strategy)
    - "Pass when touched module tests stay green." (Validation Strategy)

- [ ] C08 `[docs]` Update contributor-facing docs (`README.md` and any impacted Phase 05 docs) for Vite-based frontend build/dev workflow and unchanged embed behavior expectations.
  - Depends on: C05, C06.
  - Trace:
    - "Rework frontend scripts and contributor docs around the new bundler workflow." (In Scope)
    - "keeping comment embeds working the same way for host sites and end users." (Goal)

- [ ] C09 `[docs]` Record Phase 06 handoff note that defers framework/runtime upgrades and lists residual upgrade hotspots found during Phase 05.
  - Depends on: T03, T04, T05, T06, C08.
  - Trace:
    - "Record Phase 06 handoff note for frontend framework/runtime upgrades after Vite parity is stable." (Implementation steps)
    - "Phase 05 artifacts/docs clearly defer frontend framework/runtime upgrades to Phase 06." (Acceptance criteria)

## Behavior Slices

- Goal: Lock scope and validation expectations before migration work.
  Items: T01, C01, T02
  Type: mechanical

- Goal: Complete frontend bundler/tooling migration from Webpack frontend path to Vite while preserving backend boundary.
  Items: C02, C03, C04, C05, C06, C07
  Type: behavior

- Goal: Produce required parity, smoke, unit-conditional, and non-functional validation evidence.
  Items: T03, T04, T05, T06
  Type: behavior

- Goal: Align contributor docs and complete formal handoff to Phase 06.
  Items: C08, C09
  Type: mechanical
