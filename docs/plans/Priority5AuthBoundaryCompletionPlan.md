# Priority 5 Auth Boundary Completion Plan

Status: proposed

Source input:

- `docs/archive/Priority5FrontendArchitectureDecouplingPlan.md`
- `docs/archive/Priority5FrontendArchitectureDecouplingChecklist.md`
- `docs/archive/Priority5FrontendArchitectureDecouplingChecklistValidation.md`
- current Cypress failure analysis for:
  - `cypress/e2e/generic/error-recovery.cy.js`
  - `cypress/e2e/generic/input-validation.cy.js`
  - `cypress/e2e/generic/reply.cy.js`

## Goal

Complete the frontend auth architectural separation by making the boundary between auth lifecycle ownership and auth UI behavior explicit, reliable, and testable.

## Intent

Success means auth still lives outside `Login.svelte`, but the UI components that request auth can recover cleanly from every outcome.

That includes:

- local auth-form validation failure
- auth workflow failure
- successful auth
- returning to an interactive comment or reply form without getting stuck hidden or mid-process

The result must feel principled rather than patched together. `Login.svelte` must remain the place where auth form fields and field-level feedback live, but comment and reply flows must no longer depend on hidden side effects or old coupling assumptions to know what happened.

## In Scope

- define and implement the missing contract between auth-requesting comment/reply flows and the decoupled auth UI/runtime boundary
- preserve the current architectural direction where auth lifecycle ownership stays outside `Login.svelte`
- fix real regressions in guest/login/signup error recovery caused by the incomplete seam
- clarify which auth outcomes are local UI validation outcomes versus controller/runtime outcomes
- ensure `CommentInput.svelte` and reply flows do not remain stuck in processing/hidden states after local auth validation failure
- preserve or restore field-level validation decoration and status messaging for guest, login, and signup flows where they existed before decoupling
- update Cypress tests only when they are proven to assert the old coupling instead of the intended behavior contract

## Out of Scope

- backend or API contract changes
- multi-widget support on a single page
- redesigning initial login visibility or broader auth UX policy
- replacing the current auth controller/runtime approach
- major `xstate` redesign outside the auth seam
- introducing a new component testing stack as part of this phase
- unrelated frontend cleanup beyond the auth-request/recovery boundary

## Constraints

- `src/lib/login.xstate.ts` must remain the auth machine source of truth for this phase.
- `src/lib/auth/auth-controller.ts` must remain the non-visual auth lifecycle boundary.
- `Login.svelte` may own auth form fields, field-level validation state, and local status display, but it must not regain ownership of auth workflow orchestration or auth lifecycle startup.
- `CommentInput.svelte` and reply flows must not depend on mounting or rendering `Login.svelte` to infer auth lifecycle progress through side effects.
- The single-widget-per-page contract remains the supported product contract for this phase.
- Test changes must follow parity reasoning: a failing test must be classified as regression, stale test, or ambiguity before it is changed.

## Risks and Mitigations

- Risk: piecemeal fixes reintroduce hidden coupling between `CommentInput.svelte` and `Login.svelte`.
  - Mitigation: define the auth-request/recovery contract first, then implement against that contract instead of patching each Cypress failure independently.

- Risk: local validation failures and controller/runtime failures remain conflated.
  - Mitigation: make outcome ownership explicit so the UI can distinguish local auth-form validation failure from remote auth failure.

- Risk: tests are rewritten to match refactor internals instead of intended behavior.
  - Mitigation: preserve behavior-first assertions and update tests only when they are proven to rely on old coupling, such as reply-click causing an extra `/verify`.

- Risk: status messaging and field error decoration drift apart across guest/login/signup flows.
  - Mitigation: reuse the existing field-state helpers and make status clearing/reset behavior explicit instead of relying on broad snapshot-side clearing.

## Open Questions / Assumptions

- Assumption: the supported contract remains one mounted `SimpleComment` widget per page.
- Assumption: auth form field ownership remains inside `Login.svelte`.
- Open question to resolve during checklist authoring: whether the missing request/recovery contract is best represented as controller-readable outcome state, a narrow auth UI outcome channel, or another equally explicit boundary that keeps lifecycle ownership outside `Login.svelte`.

## Acceptance Criteria

This plan is successful when all of the following are true:

1. Auth lifecycle ownership remains outside `Login.svelte`.
2. A component that requests auth can distinguish, through the approved boundary, between:
   - local auth-form validation failure
   - auth workflow failure
   - auth success
   - return to an interactive form state
3. Guest/login/signup field-level validation and user-visible status behavior are preserved or intentionally clarified without depending on hidden snapshot-clearing side effects.
4. `CommentInput.svelte` and reply forms do not remain hidden or stuck in processing after local auth validation failure.
5. `reply.cy.js` no longer depends on a stale extra `/verify` that was previously tied to rendering the login UI.
6. `error-recovery.cy.js` and `input-validation.cy.js` either pass unchanged or are updated only where a parity-backed stale-test classification is documented.
7. The solution completes the architectural separation cleanly without restoring the old relay-event model or moving auth lifecycle ownership back into `Login.svelte`.

## Validation Strategy

Because this plan changes frontend auth behavior ownership at the UI/runtime seam, explicit validation evidence is required.

Unit evidence:

- Add or update focused tests for the chosen request/recovery boundary so the requesting flow can be validated without relying on browser timing guesses.
- Pass means the chosen boundary makes local validation failure, auth failure, and auth success distinguishable in a direct test.

Integration evidence:

- Re-run frontend integration coverage that proves auth lifecycle still works when `Login.svelte` is not mounted at startup.
- Pass means the original Priority 5 runtime/controller decoupling remains intact while the seam is completed.

Contract/parity evidence:

- Re-run the auth-related Cypress suite with specific attention to:
  - `reply.cy.js`
  - `error-recovery.cy.js`
  - `input-validation.cy.js`
  - existing login/signup/guest/logout/auth-runtime smoke coverage
- Pass means true regressions are fixed and any test change is justified against intended behavior rather than old coupling.

Smoke evidence:

- Verify guest comment, reply, login, signup, logout, and auth-runtime-late-render paths after the seam is completed.
- Pass means the user-visible auth flows remain coherent and recoverable end-to-end.
