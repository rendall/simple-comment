# Phase 06.1 - Cypress Embed Baseline and Contract Alignment

Status: Planned

## Goal

Establish a pre-upgrade Cypress/embed validation baseline for the current frontend and align documentation and test assumptions to the `#simple-comment` embed contract before the Svelte 3 to Svelte 4 upgrade.

## Intent

Make the current browser-visible embed behavior explicit and testable before Phase 06 changes frontend dependencies. Success means the repository has a small approved set of Cypress/embed flows that pass on the current frontend, and the related documentation and test assumptions match the actual public embed contract.

## In Scope

- Confirm and document the current public embed/client contract for the pre-upgrade frontend, with `#simple-comment` as the default host element.
- Audit existing Cypress frontend coverage and select the minimum generic/embed validation flows needed as the pre-upgrade baseline.
- Implement, refresh, or repair the selected Cypress flows against the current frontend behavior.
- Align repository documentation and Cypress assumptions that still refer to `#simple-comment-display` so they match the `#simple-comment` contract.
- Capture baseline validation evidence that Phase 06 will use when verifying the Svelte 3 to Svelte 4 upgrade.
- Record any explicitly deferred flows, known gaps, or setup constraints discovered during this baseline work.

## Out of Scope

- Svelte, Vite, or other frontend dependency upgrades.
- Frontend runtime behavior changes unrelated to documentation/test alignment for the current embed contract.
- Backend API contract changes.
- Broad Cypress suite expansion beyond the approved minimum embed/generic flow set.
- New browser-test infrastructure not required to validate the approved baseline flows.

## Constraints

- Use merged code and runtime behavior on `master` as the source of truth for the pre-upgrade frontend contract.
- Treat `#simple-comment` as the embed host-element contract for this phase; conflicting documentation/test assumptions must align to that runtime contract.
- Keep the Cypress baseline narrowly focused on flows Phase 06 needs to detect upgrade regressions.
- Keep changes reversible and avoid mixing upgrade work into this baseline phase.

## Inputs and Evidence

- The frontend currently exposes embed bootstrap globals from `src/simple-comment.ts` and mounts into `#simple-comment` by default.
- Existing Cypress coverage is present but partially stale relative to current runtime and documentation assumptions.
- Current Cypress 12 execution fails before running specs unless the repository provides a supported `cypress/support/e2e` file or explicitly disables the support file in config.
- Existing frontend artifact and smoke tooling already validate required built outputs and embed wiring outside Cypress.
- Phase 06 needs a known-good pre-upgrade browser baseline so upgrade regressions can be detected without ambiguity.

## Risks and Mitigations

- Risk: existing Cypress coverage may rely on outdated selectors or assumptions and fail for reasons unrelated to the future Svelte upgrade.
  Mitigation: align tests and documentation to the current runtime contract first, then keep the validated flow set intentionally small.
- Risk: browser-flow setup may reveal hidden environment or data dependencies that reduce determinism.
  Mitigation: document required setup explicitly, prefer stable baseline fixtures/paths, and defer flows that cannot be made reliable within phase scope.
- Risk: this phase could expand into a general frontend E2E rewrite.
  Mitigation: limit scope to the approved embed/generic baseline flows and treat broader test additions as out of scope.

## Open Questions / Assumptions

- Assumption: the required baseline flow set is limited to the five flows listed under `Detailed Planning Notes`.
- Assumption: current artifact and smoke tooling remains the right place to validate emitted files, bundle globals, and static sample-page wiring rather than moving those checks into Cypress.

## Validation Strategy

This phase establishes validation evidence for later upgrade work, so the evidence must show both current-browser behavior and documentation/test alignment.

- Browser/integration evidence: the approved baseline Cypress/embed flows pass on the current pre-upgrade frontend. Fail if selected flows do not pass and no explicit approved deferment is recorded.
- Smoke/contract evidence: existing frontend artifact and embed smoke checks continue to pass on the current frontend after any test/documentation alignment work. Fail if baseline alignment breaks required artifact or embed wiring checks.
- Documentation/traceability evidence: repository documentation and Cypress assumptions that describe the embed host element align to the `#simple-comment` contract. Fail if conflicting assumptions remain undocumented.

## Acceptance Criteria

- The phase records an approved minimal Cypress/embed baseline flow set for pre-upgrade validation.
- The approved required baseline flows pass against the current frontend, and any excluded or optional flow is documented with a concrete reason and explicit deferment.
- Repository documentation and Cypress assumptions are aligned to the `#simple-comment` embed contract.
- Baseline validation evidence is recorded in a form that Phase 06 can quote and reuse.
- No frontend dependency-upgrade work is introduced in this phase.

## Rollback

- Revert Cypress baseline additions/repairs independently from later upgrade work.
- Revert documentation alignment changes independently from test-flow additions where possible.
- Keep the baseline-flow set small so problematic browser validations can be removed without unwinding unrelated frontend changes.

## Detailed Planning Notes

### Baseline Cypress/Embed Flows

The baseline flow set for this phase is:

1. Auto-init mount and discussion load.
   - Visit a host page that includes `<div id="simple-comment"></div>`.
   - Load the embed script and allow normal `DOMContentLoaded` initialization.
   - Assert that the client mounts into `#simple-comment`, requests the configured discussion, and renders the initial discussion shell.
2. Configured discussion bootstrap flow.
   - Exercise `setSimpleCommentDiscussion` or `setSimpleCommentOptions` before load.
   - Assert that the rendered discussion corresponds to the configured discussion id rather than only the default derived value.
3. Comment submission flow.
   - Use the existing client input flow to submit a top-level comment or discussion reply.
   - Assert the expected network request shape and successful UI update after submission.
4. Reply submission flow.
   - Open the existing reply UI for a comment and submit a reply.
   - Assert the expected network request shape and successful rendering of the reply in the thread.
5. Authenticated login/verify flow.
   - Exercise the shipped login/verify path used by the frontend client.
   - Assert that the client can still complete authentication/verification and perform an authenticated action with the current backend semantics.

These flows define the browser baseline that Phase 06 will reuse during the Svelte 3 to Svelte 4 upgrade. They should validate behavior at the browser and network boundary rather than internal component implementation details.
