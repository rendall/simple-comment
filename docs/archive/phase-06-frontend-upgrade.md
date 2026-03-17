# Phase 06 - Frontend Upgrade

Status: Complete and archived

## Goal

Upgrade the frontend from Svelte 3 to Svelte 4 while preserving embed/API behavior and reducing long-term maintenance risk.

## Intent

Bring the frontend onto a supported Svelte upgrade path without changing what the embedded client does for users or how it talks to the existing API. Success means contributors can build and test the frontend on the upgraded stack, and the embed/client behavior remains meaningfully the same from the API consumer's perspective.

## In Scope

- Audit the current frontend dependency graph and select a supported Svelte upgrade path for this phase.
- Upgrade frontend framework/runtime dependencies required for the selected path.
- Make only the frontend code changes required to restore compile-time and runtime compatibility and satisfy the approved Phase 06.1 validation evidence.
- Preserve existing embed/client behavior and API usage semantics while upgrading.
- Consume the approved pre-upgrade Cypress/embed baseline recorded in [Phase 06.1 Checklist](../archive/phase-06-1-checklist.md) and [Phase 06.1 Validation Notes](../archive/phase-06-1-validation-notes.md), and keep those flows passing on the upgraded stack.
- Update contributor-facing frontend documentation to reflect the upgraded stack, commands, and known constraints.
- Record phase-close evidence and any explicitly deferred follow-up work discovered during the upgrade.

## Out of Scope

- Re-introducing or revisiting frontend bundler migration decisions from Phase 05.
- Netlify backend function bundling or runtime changes.
- Backend API contract changes.
- Frontend feature redesign unrelated to upgrade compatibility.
- Unplanned refactors that are not required to complete the selected Svelte upgrade path.

## Constraints

- Preserve current API-consumption behavior unless a separate approved phase changes the contract.
- Keep changes reversible in small slices so regressions can be isolated and reverted without unwinding unrelated work.
- Use merged code and tests on `master` as the runtime source of truth for current behavior.
- Treat the completed Phase 06.1 baseline as the comparison point for build, test, and embed/client behavior.
- Do not modify any tests during upgrade implementation. Their purpose in this phase is to reveal regressions on the upgraded stack rather than being adapted to fit upgrade breakage.
- Before stopping on a blocking failed item during Stage 1 discovery, record the exact failure and its dependency impact in the discovery notes artifact for that checklist.
- If a checklist item cannot be made to run green:
  - stop if the failing item is a dependency for later behavior in the approved checklist
  - continue only when the failing item is not a dependency for later approved checklist behavior
  - do not change tests to work around the failure; return to plan/checklist refinement if test changes appear necessary

## Inputs and Evidence

- Frontend currently targets Svelte 3-era patterns and dependencies.
- Existing frontend test suites (`yarn test:frontend`) cover stores, utilities, and state machines.
- Embed compatibility depends on preserving output behavior and API integration semantics.
- Phase 05 is expected to provide the stabilized frontend build-tool baseline this phase builds on.
- Phase 06.1 has already provided the approved pre-upgrade Cypress/embed browser baseline and recorded it in archived checklist and validation artifacts.

## Risks and Mitigations

- Risk: framework upgrade changes runtime semantics such as reactivity, lifecycle behavior, or compile output.
  Mitigation: upgrade in small slices, preserve behavioral tests, and add targeted regressions where current coverage does not protect upgraded behavior.
- Risk: third-party frontend dependencies may lag the selected Svelte version.
  Mitigation: audit compatibility before lock-in, prefer the lowest-risk supported target, and pin or defer incompatible packages explicitly.
- Risk: build output changes could silently alter embed delivery or initialization behavior.
  Mitigation: compare upgraded build/test results against the Phase 05 baseline and require explicit compatibility evidence before phase close.

## Open Questions / Assumptions

- Recommended target path for this phase: upgrade the frontend from Svelte 3 to Svelte 4. A direct Svelte 5 upgrade is deferred unless dependency audit and baseline validation show it does not add material compatibility or migration risk.
- Assumption: the completed Phase 06.1 browser baseline, the existing frontend unit tests, and the existing smoke/parity checks are sufficient to detect meaningful embed/client regressions for this phase. If that assumption fails during refinement, additional validation work must be added before implementation.

## Execution Staging

This phase should not use a single checklist that assumes all required implementation work is already known.

The next required artifact for this phase is the Stage 1 discovery checklist; implementation checklist authoring must wait until those discovery findings are reviewed and approved.

Instead, checklist authoring and execution should proceed in two stages:

1. Compatibility discovery and scope lock.
   - Author an initial checklist limited to dependency-path confirmation, baseline validation capture, trial upgrade evidence, and concrete finding collection.
   - Include explicit stop conditions when discovery shows the Svelte 3 to Svelte 4 path would require out-of-scope work, such as backend contract changes, broad frontend redesign, or an XState major-version migration.
   - Treat the output of this checklist as implementation-planning evidence, not implicit approval for follow-on code changes beyond that checklist.
2. Implementation against approved findings.
   - Author a second checklist only after the discovery findings are reviewed and approved.
   - Limit implementation items to work directly supported by the approved discovery outputs and the existing phase scope.

This staging is required because the exact breakage set is not fully knowable before the dependency change is attempted, and the plan/checklist process must make those unknowns explicit rather than hiding them inside implementation.

## Validation Strategy

This phase changes frontend dependencies and may change build outputs, so validation evidence is required before the phase can be considered complete.

- Unit evidence: `yarn test:frontend` passes on the upgraded stack. Fail if existing frontend unit/state tests regress without an approved scope change.
- Integration/smoke evidence: the embed/client frontend can build and run through the approved Phase 06.1 baseline behavior set: auto-init mount/discussion load, configured discussion bootstrap, top-level comment submission, reply submission, and authenticated login/verify plus authenticated action. Fail if the upgraded client cannot complete those flows or shows changed user-visible behavior not called out in scope.
- Integration/browser evidence: the approved Phase 06.1 Cypress baseline flows pass on the upgraded stack without modifying those tests. Fail if those flows regress, require broad test-suite expansion, or require test edits to mask behavior changes outside approved scope.
- Contract/parity evidence: frontend requests and API usage semantics remain compatible with the current backend contract. Fail if the upgraded frontend requires backend contract changes or diverges from existing endpoint usage.
- Build/parity evidence: the local parity command for the repository passes (`yarn run ci:local`), or any blocker outside this phase is documented with concrete failure evidence and explicit deferment. Fail if no such evidence exists.

## Acceptance Criteria

- The phase records an approved Svelte 3 to Svelte 4 upgrade target/path in plain language before dependency edits begin, unless a later explicit plan update approves a different path.
- The phase records approved compatibility-discovery findings and uses them to author any follow-on implementation checklist.
- Frontend compiles and runs on the upgraded framework/runtime dependencies for the selected path.
- `yarn test:frontend` passes on the upgraded stack.
- `yarn run ci:local` passes, or any non-phase blocker is documented with explicit failure evidence and deferment.
- The approved Phase 06.1 baseline Cypress generic/embed flows pass on the selected upgrade target, or any excluded flow is documented with a concrete reason and explicit deferment.
- Embed/client behavior remains compatible with existing API usage patterns and current backend contracts.
- Contributor documentation reflects the upgraded frontend stack, workflow, and any approved follow-up constraints.

## Rollback

- Revert frontend dependency upgrade commits independently from docs/checklist updates.
- Keep upgrade slices scoped so regressions can be reverted without unwinding unrelated modernization work.

## Detailed Planning Notes

### Upgrade Path Details

The recommended upgrade path for this phase is a direct upgrade from Svelte 3 to Svelte 4.

This recommendation is based on the current frontend dependency graph and code patterns in the repository:

- The frontend currently uses standard Svelte 3 component patterns that remain aligned with a Svelte 4 upgrade path, including `export let`, `createEventDispatcher`, named slots, `<svelte:component>`, and imperative component construction from `src/simple-comment.ts`.
- The current runtime state-management integration uses `@xstate/svelte` with `xstate` 4. That combination has a supported Svelte 4 path without requiring an XState major-version migration in the same phase.
- `svelte-preprocess` is already on a release line that supports Svelte 4.
- The repository already uses Vite 5, so the Svelte upgrade should also bring `@sveltejs/vite-plugin-svelte` onto a release line that explicitly supports both Vite 5 and Svelte 4.

The intended dependency path for this phase is:

1. Upgrade `svelte` from the current Svelte 3 line to the latest supported Svelte 4 release selected during implementation.
2. Upgrade `@sveltejs/vite-plugin-svelte` from the current 2.x line to a 3.x release line compatible with Vite 5 and Svelte 4.
3. Keep `vite` on the current major version unless a compatibility issue discovered during implementation requires a separately documented change.
4. Keep `@xstate/svelte` on an `xstate` 4-compatible line unless implementation evidence shows a patch/minor adjustment is needed for Svelte 4 support.
5. Keep `xstate` on the current major version for this phase.
6. Upgrade or adjust any remaining Svelte-adjacent tooling only as required to restore a supported and testable Svelte 4 frontend stack.

The following paths are explicitly not the default for this phase:

- A direct Svelte 3 to Svelte 5 upgrade is deferred because it would likely expand the phase into broader component API and state-management migration work.
- An `xstate` 4 to `xstate` 5 migration is out of scope unless a later explicit plan update approves it.

If implementation uncovers a hard compatibility blocker for the Svelte 3 to Svelte 4 path, the blocker must be documented with concrete package/version evidence before the plan or checklist is changed.

### Preserved Embed/Client Behavior

This phase preserves the current public embed/client contract while upgrading the frontend from Svelte 3 to Svelte 4.

The preserved embed bootstrap contract is:

- The default host element contract remains `#simple-comment`.
- The frontend continues to expose the same global entrypoints on `window`:
  - `loadSimpleComment`
  - `setSimpleCommentOptions`
  - `setSimpleCommentDiscussion`
- The frontend continues to support the current initialization model:
  - default option merging before load
  - automatic initialization on `DOMContentLoaded` unless `cancel` is set
  - imperative mounting into the configured `target`
- The supported setup-option surface remains:
  - `discussionId`
  - `title`
  - `target`
  - `cancel`

The preserved artifact and embed-delivery contract is:

- The frontend continues to emit the current embed-facing artifacts required by host pages:
  - `dist/js/simple-comment.js`
  - `dist/js/simple-comment-icebreakers.js`
  - the current required compiled CSS outputs generated from the frontend SCSS source, including `dist/css/simple-comment-style.css`
  - current sample/static embed pages used for validation
- Existing embed script paths and sample-page wiring remain compatible unless a later approved plan update changes them explicitly.

The preserved API-consumption contract is:

- The frontend continues to use the current backend endpoint paths and HTTP methods.
- Frontend requests continue to use the current credential and cookie behavior (`credentials: "include"`).
- Discussion loading, comment creation, comment update, comment deletion, auth, and verification flows continue to use the same API semantics from the backend's perspective.
- Default discussion-id generation remains unchanged unless a later approved plan update changes that behavior explicitly.

The preserved user-visible behavior for this phase is limited to core shipped client behavior:

- the embed loads into the expected host element
- the discussion loads and renders
- comments can be posted through the existing client flow
- replies can be posted through the existing client flow
- existing auth/verify flows used by the shipped client continue to function

Preservation for this phase is validated by contract/parity checks, embed smoke checks, and a small set of baseline Cypress generic/embed flows. If the upgrade requires changing the public embed bootstrap contract, emitted artifact paths, or API usage semantics, implementation must stop and return to plan/checklist refinement.

Note: repository documentation and Cypress assumptions that previously referenced `#simple-comment-display` were aligned to `#simple-comment` in completed Phase 06.1 work. Phase 06 should use the archived Phase 06.1 artifacts as the pre-upgrade source of truth rather than re-opening that contract-alignment work during upgrade execution.

### Cypress Generic/Embed Validation Flows

This phase uses a small Cypress/browser validation set to confirm the preserved embed/client behavior without turning the upgrade into a broad frontend test rewrite.

The required Cypress/embed validation flows for this phase are:

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

These flows should validate behavior at the browser and network boundary, not internal component implementation details. Where useful, assertions should confirm request path/method/credential behavior with Cypress network interception.

The following checks should remain outside the Cypress flow set and be handled by existing parity or smoke tooling instead:

- emitted artifact filenames and required frontend files
- presence of required global entrypoints in built bundles
- static sample-page script wiring
- low-level implementation details that do not change user-visible or API-visible behavior

The Cypress scope for this phase is intentionally narrow. If preserving the Svelte 4 upgrade path requires broad Cypress expansion, major selector churn, or large new browser test infrastructure, implementation must stop and return to plan/checklist refinement.
