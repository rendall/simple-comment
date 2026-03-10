# Phase 05 - Frontend Build Modernization

Status: Planned

## Goal

Modernize frontend bundling/dev tooling by replacing the custom frontend Webpack setup with Vite, while preserving runtime behavior and embed compatibility.

## Scope

- Migrate frontend build/dev flows from `webpack.frontend.js` to Vite.
- Preserve current build outputs/entry behavior:
  - `simple-comment`
  - `simple-comment-icebreakers`
  - style bundle/static assets
- Rework frontend scripts and contributor docs around the new bundler workflow.
- Keep backend Netlify-functions bundling unchanged.

## Out of scope

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
5. Complete frontend build migration from `webpack.frontend.js` to Vite and verify Webpack frontend config is no longer required for normal frontend build/dev flows.
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
- Generated artifacts remain compatible with current deployment/embedding model.
- Local frontend dev startup is faster and documented.
- Phase 05 artifacts/docs clearly defer frontend framework/runtime upgrades to Phase 06.

## Rollback

- Keep Webpack config in branch history until Vite parity is fully validated.
- Revert migration PR if integration compatibility is not met.
