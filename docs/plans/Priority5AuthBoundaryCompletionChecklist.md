# Priority 5 Auth Boundary Completion Checklist

Status: proposed

Source plan:

- `docs/plans/Priority5AuthBoundaryCompletionPlan.md`

- [ ] C01 `[frontend]` Add controller-readable auth outcome state to `AuthControllerSnapshot` in `src/lib/auth/auth-controller.ts` and publish that outcome through `src/lib/auth/auth-stores.ts` without introducing a second coordination channel.
  - Depends on: none.
  - Validated by: T01, T02.
  - Trace:
    - "represent that request/recovery contract as controller-readable outcome state on the existing auth boundary" (In Scope)
    - "The missing request/recovery contract must be represented as controller-readable outcome state" (Constraints)

- [ ] C02 `[frontend]` Update `src/components/Login.svelte` to report local auth-form validation outcomes through controller-readable outcome state while keeping auth form fields and field-level validation UI local to `Login.svelte`.
  - Depends on: C01.
  - Validated by: T01, T03.
  - Trace:
    - "clarify which auth outcomes are local UI validation outcomes versus controller/runtime outcomes" (In Scope)
    - "`Login.svelte` may own auth form fields, field-level validation state, and local status display, but it must not regain ownership of auth workflow orchestration" (Constraints)
    - "make outcome ownership explicit so the UI can distinguish local auth-form validation failure from remote auth failure" (Risks and Mitigations)

- [ ] C03 `[frontend]` Update `src/components/CommentInput.svelte` to consume controller-readable outcome state and recover from local auth validation failure, auth workflow failure, and auth success without remaining hidden or stuck in `loggingIn`.
  - Depends on: C01, C02.
  - Validated by: T01, T03, T04.
  - Trace:
    - "define and implement the missing contract between auth-requesting comment/reply flows and the decoupled auth UI/runtime boundary" (In Scope)
    - "ensure `CommentInput.svelte` and reply flows do not remain stuck in processing/hidden states after local auth validation failure" (In Scope)
    - "A component that requests auth can distinguish, through controller-readable outcome state on the approved boundary" (Acceptance Criteria)
    - "`CommentInput.svelte` and reply forms do not remain hidden or stuck in processing after local auth validation failure" (Acceptance Criteria)

- [ ] C04 `[frontend]` Make status clearing and field-decoration behavior explicit in `src/components/Login.svelte` so guest, login, and signup flows preserve or intentionally clarify prior user-visible validation messaging without relying on broad snapshot-side clearing.
  - Depends on: C02.
  - Validated by: T03, T04.
  - Trace:
    - "preserve or restore field-level validation decoration and status messaging for guest, login, and signup flows" (In Scope)
    - "reuse the existing field-state helpers and make status clearing/reset behavior explicit instead of relying on broad snapshot-side clearing" (Risks and Mitigations)
    - "Guest/login/signup field-level validation and user-visible status behavior are preserved or intentionally clarified" (Acceptance Criteria)

- [ ] C05 `[frontend]` Update `cypress/e2e/generic/reply.cy.js` to remove the stale extra `/verify` expectation that depended on rendering the login UI, and do not change other auth Cypress specs unless T03 documents a parity-backed stale-test classification.
  - Depends on: C03, C04.
  - Validated by: T03.
  - Trace:
    - "update Cypress tests only when they are proven to assert the old coupling instead of the intended behavior contract" (In Scope)
    - "reply-click causing an extra `/verify`" (Risks and Mitigations)
    - "`reply.cy.js` no longer depends on a stale extra `/verify`" (Acceptance Criteria)

- [ ] T01 `[tests]` Add or update focused frontend tests in `src/tests/frontend/auth-controller.test.ts` so controller-readable outcome state directly proves local validation failure, auth workflow failure, and auth success are distinguishable without browser-timing inference.
  - Depends on: C01, C02.
  - Trace:
    - "Add or update focused tests for the controller-readable outcome state boundary" (Validation Strategy)
    - "Pass means controller-readable outcome state makes local validation failure, auth failure, and auth success distinguishable in a direct test." (Validation Strategy)

- [ ] T02 `[tests]` Re-run and, only if required for the approved boundary, update the existing auth runtime integration coverage in `src/tests/frontend/auth-runtime.test.ts` so auth lifecycle still works when `Login.svelte` is not mounted at startup.
  - Depends on: C01, C02, C03, C04.
  - Trace:
    - "Re-run frontend integration coverage that proves auth lifecycle still works when `Login.svelte` is not mounted at startup." (Validation Strategy)
    - "Pass means the original Priority 5 runtime/controller decoupling remains intact while the seam is completed." (Validation Strategy)

- [ ] T03 `[tests]` Re-run the auth-related Cypress contract/parity suite for `cypress/e2e/generic/reply.cy.js`, `cypress/e2e/generic/error-recovery.cy.js`, and `cypress/e2e/generic/input-validation.cy.js`; document any stale-test classification before changing a spec.
  - Depends on: C01, C02, C03, C04, C05, T01, T02.
  - Trace:
    - "Re-run the auth-related Cypress suite with specific attention to:" (Validation Strategy)
    - "`reply.cy.js`" (Validation Strategy)
    - "`error-recovery.cy.js`" (Validation Strategy)
    - "`input-validation.cy.js`" (Validation Strategy)
    - "Pass means true regressions are fixed and any test change is justified against intended behavior rather than old coupling." (Validation Strategy)

- [ ] T04 `[tests]` Re-run guest comment, reply, login, signup, logout, and auth-runtime-late-render smoke coverage after the seam is completed and confirm the user-visible auth flows remain coherent and recoverable end-to-end.
  - Depends on: C01, C02, C03, C04, C05, T01, T02.
  - Trace:
    - "Verify guest comment, reply, login, signup, logout, and auth-runtime-late-render paths after the seam is completed." (Validation Strategy)
    - "Pass means the user-visible auth flows remain coherent and recoverable end-to-end." (Validation Strategy)

## Behavior Slices

### Slice A

Goal: publish controller-readable outcome state on the existing auth boundary without adding a second coordination path.

Items: C01, C02, T01

Type: behavior

### Slice B

Goal: make comment and reply flows recover through controller-readable outcome state instead of hidden `Login.svelte` side effects.

Items: C03, C04, T02

Type: behavior

### Slice C

Goal: align parity expectations in the targeted Cypress contract suite after the seam is completed.

Items: C05, T03

Type: mechanical

### Slice D

Goal: confirm the completed seam remains coherent across end-to-end smoke paths.

Items: T04

Type: mechanical
