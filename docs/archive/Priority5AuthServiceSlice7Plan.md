# Priority 5 Auth Service Slice 7 Plan

Status: planning

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 5`)

Parent plan: `docs/plans/Priority5Completion.md` (Item 7)

Related artifacts:
- `docs/plans/Priority5AuthServiceSlice7Checklist.md` (pre-plan draft checklist input; must be reconciled to this plan before implementation use)

## Goal

Wire `Login.svelte` to use the existing widget-scoped `auth-service` commands and auth runtime so the component stops performing direct auth API work while still owning form-local input, validation, and rendering behavior.

## Intent

This slice is about making `Login.svelte` simpler and less risky without turning the frontend inside out.

Today, `Login.svelte` still does two jobs at once:

- it behaves like a form component,
- and it also behaves like an auth controller that talks to the backend directly and runs its own auth state machine.

For this slice, success means:

- `Login.svelte` still owns its own fields, validation messages, selected tab, and UI rendering,
- but when the user tries to log in, sign up, continue as a guest, or log out, the component calls `auth-service` instead of calling auth APIs directly,
- and the component reads auth state from the service-owned runtime instead of running a second authoritative auth runtime locally.

In plain terms: the login form should stay a form, and the auth service should stay the place that owns auth behavior.

## Motivation

Slice 7 exists because Priority 5 is not only about extracting auth commands into `auth-service`; it is also about removing the remaining hidden dependence on `Login.svelte` as the place where auth actually happens.

The command extraction slices already moved `init()`, `login()`, `logout()`, `signup()`, and `loginGuest()` into `auth-service`. That work lowered risk at the service boundary, but `Login.svelte` still contains direct auth-side-effect code and still interprets its own auth machine. As a result, the codebase still has two competing centers of auth responsibility:

- `auth-service`, which is supposed to own auth behavior,
- and `Login.svelte`, which still behaves like a second auth runtime and command executor.

That split keeps the current relay/store setup harder to reason about, and it makes later decoupling work in `CommentInput.svelte` and `SelfDisplay.svelte` more fragile than it needs to be.

Slice 7 is the smallest reasonable next step because it removes direct command execution from `Login.svelte` without also trying to solve persistence extraction, relay removal, or the final auth-state distribution strategy all at once.

## In Scope

- Replace direct auth API command calls in `Login.svelte` with calls to `auth-service` methods:
  - `init()`
  - `login()`
  - `signup()`
  - `loginGuest()`
  - `logout()`
- Create a widget-scoped `AuthService` instance at the current composition root and thread it explicitly through the current component path into `Login.svelte`.
- Make `Login.svelte` observe service-owned auth state rather than interpret its own auth machine as a second authority.
- Preserve `Login.svelte` ownership of:
  - field values,
  - field-level validation,
  - selected-tab UI,
  - selected-tab persistence,
  - user-facing status/error rendering.
- Preserve compatibility with the current relay/store consumers by continuing to publish the existing `loginStateStore` shape during this slice.
- Add validation that proves `Login.svelte` delegates auth commands to `auth-service` and does not call auth APIs directly for those flows.

## Out of Scope

- Moving `simple_comment_user` persistence out of `Login.svelte`.
- Removing `loginStateStore`, `dispatchableStore`, or `currentUserStore`.
- Removing login relay behavior from `CommentInput.svelte`.
- Removing logout relay behavior from `SelfDisplay.svelte`.
- Choosing the final project-wide answer to direct props versus a thin auth-service-backed store.
- Introducing a singleton auth-service, new event bus, auth controller, runtime wrapper component, or broader frontend state redesign.
- Splitting `Login.svelte` into multiple components.
- Changing backend/API contracts.
- Broad visual or UX redesign of login/signup/guest forms.

## Constraints

- `auth-service` remains widget-scoped; do not introduce a singleton service instance.
- Server verification remains the source of truth for session validity.
- The slice must not create two authoritative auth runtimes after wiring is complete.
- The slice must remain reviewable and reversible; do not fold in slices 6, 8, 9, or 10.
- Test and implementation passes remain separate per current team convention.

## Current State

At the start of this slice:

- `auth-service` already owns the extracted auth commands and the live interpreted auth runtime.
- `Login.svelte` still imports and calls auth APIs directly for init/login/signup/guest/logout flows.
- `Login.svelte` still uses `useMachine(loginMachine)` and publishes login state outward through `loginStateStore`.
- `CommentInput.svelte` and `SelfDisplay.svelte` still rely on the relay-store contract and are not being cleaned up in this slice.

## Approach

1. Add fail-first component tests that treat `Login.svelte` as the boundary under test and assert that it delegates auth actions to an injected `AuthService`.
2. Introduce a widget-scoped service seam at the current composition root and thread it explicitly down to `Login.svelte`.
3. Extend the service boundary only as much as needed for `Login.svelte` to observe service-owned auth runtime state and preserve the existing `loginStateStore` publication contract for unreworked consumers.
4. Replace direct auth API calls and local auth runtime ownership in `Login.svelte` with service delegation plus service-state observation.
5. Stop there. Do not fold relay removal, persistence extraction, or a broader auth-state redesign into this slice.

## Risks and Mitigations

- Risk: slice 7 quietly absorbs slice 8 by redesigning auth-state publication.
  - Mitigation: preserve the current `loginStateStore` contract for now and limit new service state exposure to the minimum needed by `Login.svelte`.

- Risk: slice 7 quietly absorbs slice 9 or 10 by changing `CommentInput.svelte` or `SelfDisplay.svelte` behavior.
  - Mitigation: keep those components working through the existing relay/store contract and treat their cleanup as later slices only.

- Risk: the implementation leaves two active auth runtimes, one in `auth-service` and one in `Login.svelte`.
  - Mitigation: require the plan to treat service-owned runtime state as the only authority after wiring is complete.

- Risk: wiring the service through components encourages a future singleton shortcut.
  - Mitigation: explicitly scope the service per widget instance and pass it explicitly through the current tree.

- Risk: UI behavior regresses because form validation and auth delegation are mixed together carelessly.
  - Mitigation: keep validation/UI behavior explicitly in scope for preservation, and test the component boundary before implementation.

## Acceptance Criteria

1. `Login.svelte` no longer performs direct auth command calls to backend auth APIs for init/login/signup/guest/logout flows.
2. `Login.svelte` delegates auth command execution to a widget-scoped `AuthService`.
3. `Login.svelte` does not continue to run a second authoritative interpreted auth runtime after the slice is complete.
4. `Login.svelte` still owns form-local field state, validation behavior, selected-tab UI, selected-tab persistence, and user-facing status/error presentation.
5. Existing unreworked consumers that depend on the current `loginStateStore` contract continue to function during this slice.
6. The slice does not introduce a singleton auth-service, a new event bus, or a broader auth-state architecture redesign.
7. The resulting changes are narrow enough that later slices can still independently address persistence extraction and relay removal.

## Validation Strategy

Required evidence types for Slice 7:

- **Unit/component evidence**
  - `Login.svelte` delegation behavior is tested at the component boundary.
  - Pass: tests show valid user actions call the appropriate `auth-service` methods, and local validation failures do not call service commands.
  - Fail: `Login.svelte` still calls auth APIs directly for covered command paths, or component validation behavior is lost.

- **Contract/parity evidence**
  - Transitional relay/store behavior remains intact for unreworked consumers.
  - Pass: the current `loginStateStore` publication shape required by existing consumers is still produced during this slice.
  - Fail: slice 7 breaks current relay/store consumers or silently changes the state contract they rely on.

- **Type/build evidence**
  - The new widget-scoped service seam composes cleanly through the current component tree.
  - Pass: frontend typecheck succeeds after the service seam and `Login.svelte` delegation changes.
  - Fail: type errors or composition mismatches are introduced in the component tree.

## Open Questions / Assumptions

- Assumption: a widget-scoped service instance threaded through the current component path is acceptable as an intermediate step even if the later auth-state distribution choice is still open.
- Assumption: `auth-service` can expose the minimal runtime metadata needed by `Login.svelte` without prematurely deciding the broader state-distribution design.
- Open question: should the later direct-props versus thin-store decision happen before slices 9 and 10, or immediately after them?
- Open question: is the existing `loginStateStore` shape sufficient as a temporary compatibility contract once `Login.svelte` stops owning the runtime?

## Scope Guard

The following work is explicitly deferred and must not be folded into Slice 7 without a separate approved plan/checklist update:

- Slice 6 persistence extraction work
- Slice 8 shared-store publication replacement
- Slice 9 login relay removal from `CommentInput.svelte`
- Slice 10 logout relay removal from `SelfDisplay.svelte`
- Final project-wide auth-state distribution redesign

If the implementation appears to require one of those to succeed, stop and revise planning rather than silently expanding scope.

## Conformance QC (Plan)

- Intent clarity issues: none observed; intent is stated in plain language and distinguishes form responsibilities from auth responsibilities.
- Missing required sections: none (`Goal`, `Intent`, `In Scope`, `Out of Scope`, `Acceptance Criteria`, and `Validation Strategy` are present).
- Ambiguities/assumptions to resolve: whether the current `loginStateStore` shape is sufficient as a temporary compatibility layer should be validated during checklist authoring.
- Validation strategy gaps: none for this slice’s delegated-command and transitional-compatibility scope.
- Traceability readiness: ready; headings and acceptance criteria are stable and quoteable for checklist authoring.
- Pass/Fail: structurally ready for collaborative review and checklist reconciliation — **Pass**.
