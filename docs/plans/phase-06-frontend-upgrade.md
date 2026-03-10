# Phase 06 - Frontend Upgrade

Status: Planned

## Goal

Upgrade frontend framework/runtime dependencies after Phase 05 build-tool modernization is stable, while preserving embed/API behavior and reducing long-term maintenance risk.

## Scope

- Upgrade frontend framework/runtime dependencies with focus on Svelte major-version path (`3 -> 4/5`).
- Preserve current runtime behavior of embedded UI flows and API calls.
- Keep Netlify backend function bundling/runtime out of scope.
- Keep frontend bundle-tool migration itself out of scope (handled in Phase 05).

## Out of scope

- Re-introducing or revisiting frontend bundler migration decisions from Phase 05.
- Backend API contract changes.
- Frontend feature redesign unrelated to upgrade compatibility.

## Inputs and evidence

- Frontend currently targets Svelte 3-era patterns and dependencies.
- Existing frontend test suites (`yarn test:frontend`) cover stores, utilities, and state machines.
- Embed compatibility depends on preserving output behavior and API integration semantics.

## Implementation steps

1. Freeze and document the post-Phase-05 frontend baseline (build outputs, scripts, and test results).
2. Select upgrade target and path:
   - Option A: Svelte 3 -> 4
   - Option B: Svelte 3 -> 5 (or 4 -> 5 staged)
3. Upgrade Svelte-related dependencies and required compiler/runtime integrations.
4. Remediate compile/runtime breakages in frontend modules with minimal behavior change.
5. Run focused compatibility checks for embed/client flows against existing endpoint usage.
6. Update frontend developer documentation and migration notes for contributors.
7. Record gate decision for next phase:
   - close frontend-upgrade phase, or
   - create a scoped follow-up checklist for residual compatibility hotspots.

## Risk and mitigation

- Risk: framework upgrade changes runtime semantics (reactivity, lifecycle, compile output).
- Mitigation:
  - upgrade in small slices
  - preserve behavioral tests and add targeted regressions where needed
  - keep API-consumption behavior unchanged unless explicitly scoped

- Risk: third-party frontend dependencies lag target Svelte version compatibility.
- Mitigation:
  - audit compatibility before lock-in
  - stage upgrades and pin versions where needed

## Acceptance criteria

- Frontend compiles and runs on upgraded framework/runtime dependencies.
- `yarn test:frontend` passes.
- Full local CI parity command passes (`yarn run ci:local`), or blockers are explicitly documented.
- Embed/client behavior remains compatible with existing API usage patterns.
- Contributor docs reflect upgraded frontend stack and workflow.

## Rollback

- Revert frontend dependency upgrade commits independently from docs/checklist updates.
- Keep upgrade slices scoped so regressions can be reverted without unwinding unrelated modernization work.
