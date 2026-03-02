# Phase 05 - Frontend Build Modernization

Status: Planned

## Goal

Modernize frontend build and developer workflow with lower config overhead and faster feedback loops.

## Scope

- Migrate frontend build from custom Webpack config to Vite.
- Preserve current build outputs/entry behavior:
  - `simple-comment`
  - `simple-comment-icebreakers`
  - style bundle/static assets
- Rework dev/start scripts and docs around new tooling.
- Evaluate and execute Svelte major upgrade path after build migration baseline is stable.

## Inputs and evidence

- Frontend currently uses `webpack.frontend.js` with manual Svelte loader setup.
- Backend functions have separate Webpack config and should remain isolated unless explicitly in scope.

## Implementation steps

1. Create Vite config replicating current entry/output semantics.
2. Port static asset handling and env variable wiring.
3. Update npm/yarn scripts and local dev docs.
4. Validate output compatibility against existing embedding instructions.
5. After stable Vite baseline, evaluate Svelte upgrade path (3 -> 4/5).

## Risk and mitigation

- Risk: output filenames or asset paths break host-site integrations.
- Mitigation:
  - introduce compatibility checks for expected output artifacts
  - validate with sample embed page and cypress flows

## Acceptance criteria

- Frontend build succeeds with Vite.
- Generated artifacts remain compatible with current deployment/embedding model.
- Local frontend dev startup is faster and documented.

## Rollback

- Keep Webpack config in branch history until Vite parity is fully validated.
- Revert migration PR if integration compatibility is not met.
