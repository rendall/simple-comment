# Priority 5 Frontend Architecture Decoupling Plan

Status: planning

Classification: formal plan draft

Source input:

- `docs/RepoHealthImprovementBacklog.md` (Priority 5: Frontend Architecture Decoupling)
- `docs/plans/Priority5FrontendArchitectureDecouplingChecklist.md` (current checklist draft used as source of truth for plan back-propagation)

## Goal

Reduce auth/login coupling to component presence by moving auth persistence, workflow orchestration, and shared-state publication out of `Login.svelte` and into smaller dedicated frontend boundaries.

## Intent

Success means the frontend auth system is not coupled to the login component. The login component does not have to be on the page for auth to work.

The login UI must remain user-visible where it is needed, but auth/session behavior must no longer depend on `Login.svelte` owning storage, machine orchestration, shared-store publication, and remote auth side effects.

The result must be easier to test at the controller/runtime boundary, easier to change without behavioral archaeology, and easier to reason about when frontend upgrades happen later.

## In Scope

- reduce component-bound behavior coupling where the repo already flags it as a concern
- clarify boundaries between view components, state machines, and auth/workflow logic
- extract login/session persistence currently embedded in `Login.svelte`
- extract auth-related API orchestration currently embedded in `Login.svelte`
- centralize auth controller/runtime ownership outside `Login.svelte`
- centralize auth-related shared-state publication behind one auth boundary
- migrate `CommentInput.svelte` and `SelfDisplay.svelte` off relay-event coupling (`loginIntent` / `logoutIntent`) onto the new controller/store boundary
- add parity-focused test coverage for the decoupled auth boundary

## Out of Scope

- changing backend/API contracts
- introducing auth feature behavior changes beyond boundary ownership refactor
- unrelated frontend architecture rewrites outside login/auth surfaces
- redesigning initial login UI visibility policy for readers
- page-global auth singleton architecture
- major `xstate` or Svelte architecture changes outside the auth/login seam

## Constraints

- `src/lib/login.xstate.ts` must remain the state-machine source of truth for this phase.
- The plan must extract and relocate existing auth logic; it must not create a second parallel auth system beside the current one.
- Auth ownership must be scoped to the current `SimpleComment` instance, not page-global.
- The runtime boundary must live in plain TypeScript; this phase must not depend on a non-visual Svelte component as the new ownership model.
- Existing persisted values in `localStorage` must remain readable.
- Existing Cypress auth contract tests must stay green unless a parity-backed reason for change is explicitly documented.

## Risks and Mitigations

- Risk: controller/store extraction duplicates current behavior under new names instead of simplifying ownership.
  - Mitigation: require reuse, relocation, or wrapping of existing auth stores and existing `apiClient.ts` functions.

- Risk: test churn could hide regressions by rewriting assertions to match refactor internals.
  - Mitigation: use the parity matrix as the behavioral source of truth and classify failures as regression, stale test, or ambiguity before changing tests.

- Risk: runtime ownership changes could accidentally introduce a second widget bootstrap path.
  - Mitigation: require integration with the existing widget lifecycle in `src/simple-comment.ts` and `src/components/SimpleComment.svelte`.

- Risk: consumer migration could silently reintroduce relay-event coupling under different names.
  - Mitigation: require `CommentInput.svelte` and `SelfDisplay.svelte` to consume the controller/store boundary directly.

## Open Questions / Assumptions

- Assumption: auth ownership should be scoped to the current `SimpleComment` instance rather than made page-global.
- Assumption: initial login UI visibility policy is unchanged in this phase; the plan is about ownership and decoupling, not reader-facing layout redesign.
- Open question: whether profile update deserves Cypress coverage or only integration-level coverage in this phase.

## Acceptance Criteria

This plan is successful when all of the following are true:

1. `Login.svelte` no longer owns auth persistence, direct auth API orchestration, or auth machine lifecycle.
2. Auth workflow orchestration is moved into dedicated frontend modules that reuse existing `apiClient.ts`, `loginMachine`, and auth-store surfaces instead of duplicating them.
3. Auth controller/runtime ownership is scoped to the current `SimpleComment` instance and does not depend on `Login.svelte` being the lifecycle owner.
4. `CommentInput.svelte` and `SelfDisplay.svelte` no longer depend on legacy relay-event coupling as their primary auth coordination mechanism.
5. The following behavior parity is preserved:
   - session restore on startup
   - login tab persistence
   - username/password login
   - signup
   - guest login
   - logout
   - profile read/update flow
   - auth state availability when `Login.svelte` is not mounted
   - no backend/API contract changes
6. The resulting auth boundary is easier to test directly at unit/integration level than the current component-owned flow.

## Validation Strategy

Because this plan changes frontend behavior ownership and lifecycle boundaries, explicit validation evidence is required.

Unit evidence:

- Add controller-focused tests that cover verify/login/signup/guest/logout/error transition and effect mapping.
- Pass means controller behavior can be validated with mocked workflows/storage without mounting `Login.svelte`.

Integration evidence:

- Add integration coverage proving auth lifecycle works when `Login.svelte` is not mounted at startup, while interactive login still works once `Login.svelte` is rendered.
- Pass means runtime/controller lifecycle can initialize auth independently of `Login.svelte` ownership.

Contract/parity evidence:

- Preserve and use the Priority 5 parity matrix (`P01-P10`) as the behavioral source of truth during implementation.
- Add or keep focused auth contract coverage for:
  - login tab persistence
  - current auth smoke paths
  - runtime-without-login target behavior as approved for this phase
- Pass means failing auth-related tests can be justified against parity contracts rather than implementation detail.

Smoke evidence:

- Run focused frontend validation covering login/signup/guest/logout happy-path flows plus at least one error path.
- Pass means the refactor preserves user-visible auth behavior even though ownership boundaries changed.

Non-functional evidence:

- Not required for this phase unless implementation introduces a new warning/build regression.

## Traceability Readiness

The plan is checklist-ready because it contains stable, quoteable statements under:

- `In Scope`
- `Out of Scope`
- `Constraints`
- `Acceptance Criteria`
- `Validation Strategy`

These sections are intended to be the source of truth for final checklist traceability.
