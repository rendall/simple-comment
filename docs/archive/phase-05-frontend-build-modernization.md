# Phase 05 - Frontend Build Modernization

Status: Planned

## Goal

Modernize frontend bundling/dev tooling by replacing the custom frontend Webpack setup with Vite, while keeping comment embeds working the same way for host sites and end users.

## Plain-Language Intent

Switch the frontend build and local dev workflow from Webpack to Vite without changing what host sites load or how embeds behave. We are doing this to reduce custom build complexity, speed up local frontend iteration, and make build tooling easier to maintain. After this phase, contributors should use Vite for normal frontend build/dev work, while backend function bundling and framework upgrades remain outside this phase.

## In Scope

- Migrate frontend build/dev flows from `webpack.frontend.js` to Vite.
- Preserve current build outputs/entry behavior:
  - `simple-comment`
  - `simple-comment-icebreakers`
  - style bundle/static assets
- Rework frontend scripts and contributor docs around the new bundler workflow.
- Keep backend Netlify-functions bundling unchanged.

## Out of Scope

- Svelte major-version upgrades and frontend framework/runtime modernization (handled in Phase 06).
- Frontend feature redesigns unrelated to bundler migration parity.
- Backend build-pipeline changes outside frontend asset/build wiring touchpoints.

## Inputs and evidence

- Frontend currently uses `webpack.frontend.js` with manual Svelte loader setup.
- Backend functions have separate Webpack config and should remain isolated unless explicitly in scope.

## Implementation steps

1. Create Vite config replicating current entry/output semantics.
2. Port static asset handling and env variable wiring.
3. Update npm/yarn scripts and local dev docs.
4. Validate output compatibility against existing embedding instructions.
5. Verify frontend build/dev default paths no longer depend on `webpack.frontend.js` and that normal contributor flows use Vite.
6. Record Phase 06 handoff note for frontend framework/runtime upgrades after Vite parity is stable.

## Risk and mitigation

- Risk: output filenames or asset paths break host-site integrations.
- Mitigation:
  - introduce compatibility checks for expected output artifacts
  - validate with sample embed page and cypress flows

- Risk: accidental scope creep into framework-upgrade/refactor work during bundler migration.
- Mitigation:
  - treat framework upgrades as explicit out-of-scope items for Phase 05
  - defer framework/runtime changes to Phase 06 planning/checklist

## Acceptance criteria

- Frontend build succeeds with Vite.
- Generated artifacts required by current embedding remain compatible: `simple-comment`, `simple-comment-icebreakers`, and frontend style/static assets.
- Local frontend dev startup timing is measured before/after migration using the same machine/method, and results are documented.
- Phase 05 artifacts/docs clearly defer frontend framework/runtime upgrades to Phase 06.

## Validation Strategy

- Unit:
  - Add or update unit tests only when migration changes logic in test-covered modules.
  - Pass when touched module tests stay green.
- Integration/smoke:
  - Validate script load, mount/render, and baseline API-call wiring on a sample embed page.
  - Pass when smoke checks succeed for the migrated build outputs.
- Contract/parity:
  - Validate required output artifact roles remain compatible (`simple-comment`, `simple-comment-icebreakers`, and style/static assets).
  - Pass when artifact and embedding checks show no unintended behavior change for host-site integration.
- Non-functional (in-scope):
  - Measure local frontend dev startup timing before and after migration using the same machine/method.
  - Pass when timing results are documented in phase/PR validation notes.

## Phase 06 Handoff (Framework/Runtime Upgrade)

Framework/runtime upgrade work remains deferred to Phase 06.

Residual hotspots discovered during Phase 05:

- Svelte runtime remains on the legacy major line in this phase; upgrade planning/execution remains a separate concern for Phase 06.
- Frontend API URL wiring currently preserves `process.env.SIMPLE_COMMENT_API_URL` compatibility via Vite define replacement; Phase 06 should evaluate migration to native `import.meta.env` conventions.
- Vite build logs show CJS Node API deprecation notice; Phase 06 should update tooling/runtime integration to remove compatibility shims and deprecated pathways.
- Frontend output includes an additional generated CSS asset (`dist/assets/simple-comment-*.css`) alongside expected bundle outputs; Phase 06 should decide whether to keep, rename, or eliminate this artifact as part of framework/runtime modernization.

## Rollback

- Revert migration PR if integration compatibility is not met.
