# Priority 5 Auth Service Slice 9 Plan

Status: archived, completed

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 5`)

Parent plan: `docs/plans/Priority5Completion.md` (Item 9)

Related artifacts:

- `docs/plans/Priority5AuthServiceSlice8Plan.md`
- `docs/plans/Priority5AuthServiceSlice8Checklist.md`

## Goal

Remove the login relay dependency from `CommentInput.svelte` so comment submission requests authentication through the widget-scoped `auth-service` instead of through `dispatchableStore` and `loginStateStore`.

## Intent

This slice is about letting `CommentInput.svelte` ask for authentication directly through the shared auth service.

Today, when an unauthenticated user tries to submit a comment, `CommentInput.svelte` enters a login state, dispatches a `loginIntent` event through `dispatchableStore`, and waits for auth/session updates through `loginStateStore`. That keeps comment submission coupled to legacy global stores and to `Login.svelte` as a relay participant.

After this slice, `CommentInput.svelte` should no longer import or use those legacy stores for login flow. Instead, it should:

- request authentication through its injected `authService`,
- observe request-scoped auth outcomes from that same service,
- continue posting the comment after the matching auth request succeeds,
- keep selected-tab UI behavior working through a direct component binding with `Login.svelte`.

In plain terms: when a comment needs login first, the comment form should talk to the auth service, not shout across the room through old shared stores.

## In Scope

- Remove `CommentInput.svelte` use of `dispatchableStore` for `loginIntent`.
- Remove `CommentInput.svelte` subscription to `loginStateStore`.
- Use the existing injected widget-scoped `authService` in `CommentInput.svelte` to create an auth request when comment submission requires login.
- Have `CommentInput.svelte` observe auth request outcomes from `authService` and continue its existing comment-post state machine after the matching request succeeds.
- Preserve the current behavior where the active `Login.svelte` tab determines comment-submit validation and button copy.
- Replace `CommentInput.svelte` selected-tab reads from `loginStateStore` with a narrow direct binding to `Login.svelte` selected-tab UI state.
- Teach `Login.svelte` to respond to pending `authService.authRequest` values by submitting the currently selected auth form, preserving the current outer comment-submit UX without using `dispatchableStore`.
- Use existing `auth-service` request/outcome primitives rather than introducing a new event bus or singleton store.
- Add fail-first tests before production changes.

## Out of Scope

- Removing logout relay behavior from `SelfDisplay.svelte`.
- Removing `dispatchableStore` from `Login.svelte` for logout handling.
- Removing `loginStateStore` selected-tab publication from `Login.svelte`.
- Removing `loginStateStore`, `dispatchableStore`, or `currentUserStore` definitions.
- Removing the temporary auth store bridge introduced in Slice 8.
- Redesigning `CommentInput.svelte` or `Login.svelte` layout.
- Splitting `Login.svelte` into smaller form components.
- Changing backend/API contracts.
- Choosing the final direct-props versus thin auth-service-backed store architecture for the whole widget.

## Constraints

- Keep `auth-service` widget-scoped; do not introduce a singleton auth-service import.
- Keep the implementation narrow to login-before-comment behavior.
- Keep test-writing passes separate from production implementation passes.
- Do not edit tests during implementation unless the implementation stops and explains why a test is wrong.
- Preserve existing comment-post behavior for already-authenticated users.
- Preserve existing form-local validation ownership in `Login.svelte`.

## Current State

At the start of this slice:

- `CommentInput.svelte` receives `authService` as a prop.
- `CommentInput.svelte` imports `dispatchableStore` and dispatches `loginIntent` from its `loggingIn` state.
- `CommentInput.svelte` imports `loginStateStore` to observe auth state changes and selected-tab changes.
- `Login.svelte` still subscribes to `dispatchableStore` for `loginIntent` and `logoutIntent`.
- `Login.svelte` still publishes selected-tab UI state to `loginStateStore`.
- `auth-service.ts` exposes `authRequest`, `authOutcome`, `requestAuth`, `clearAuthOutcome`, `cancelAuthRequest`, and `reportLocalValidationError`, but request outcomes are not yet sufficient for `CommentInput.svelte` to complete the login-before-comment flow without legacy stores.

## Detailed File Impact

### `src/lib/auth-service.ts`

Expected role: request/outcome coordinator for auth that was requested by another component.

Expected changes:

- Preserve the existing public `AuthService` surface.
- Ensure successful `login()`, `signup()`, and `loginGuest()` commands publish a matching `authOutcome` success when there is a pending auth request.
- Ensure failed remote auth commands publish a matching `authOutcome` remote error when there is a pending auth request.
- Ensure completed or failed pending auth requests return `authRequest` to idle.
- Preserve existing session state, current-user publication, and persistence behavior.

Non-goals:

- Do not add a new store or event bus.
- Do not make `auth-service.ts` import component stores.

### `src/components/Login.svelte`

Expected role: form-local UI and auth command delegate.

Expected changes:

- Subscribe to `authService.authRequest`.
- When a pending request is observed, submit the currently selected auth form through the existing local submit functions.
- When form-local validation fails during a pending request, report the validation failure through `authService.reportLocalValidationError(...)`.
- Keep existing direct form-submit behavior intact for user-triggered form submission.
- Keep `dispatchableStore` logout handling intact for Slice 10.
- Keep selected-tab publication to `loginStateStore` intact for now.

Non-goals:

- Do not remove logout relay handling.
- Do not move field state or validation out of `Login.svelte`.

### `src/components/CommentInput.svelte`

Expected role: comment form that requests auth through `authService` when needed.

Expected changes:

- Remove `dispatchableStore` import and `loginIntent` dispatch.
- Remove `loginStateStore` import and subscription.
- Track the pending auth request id returned by `authService.requestAuth(...)`.
- Observe `authService.authOutcome`.
- When the matching auth outcome succeeds, continue the existing state machine with `SUCCESS`.
- When the matching auth outcome fails or is cancelled, return the comment form to a non-processing state with the existing error path.
- Bind selected-tab UI state directly with `Login.svelte` so button copy and guest-comment validation keep working without `loginStateStore`.

Non-goals:

- Do not change `postComment(...)` ownership in this slice.
- Do not change the `commentPostMachine` unless implementation proves the current machine cannot represent the required request outcomes cleanly.

### `src/lib/svelte-stores.ts`

Expected role: unchanged legacy compatibility surface.

Expected changes:

- none.

### `src/components/SelfDisplay.svelte`

Expected role: unchanged logout relay consumer during Slice 9.

Expected changes:

- none.

## Approach

1. Add fail-first tests for `auth-service` request outcomes so request-scoped success and remote-error behavior is explicit before `CommentInput.svelte` depends on it.
2. Implement request-outcome publication in `auth-service.ts` without changing command ownership or persistence behavior.
3. Add fail-first component tests for `Login.svelte` consuming pending `authService.authRequest` values and reporting local validation failures through the service.
4. Implement the narrow `Login.svelte` request-consumption behavior.
5. Add fail-first component tests for `CommentInput.svelte` using `authService.requestAuth` / `authOutcome` instead of legacy stores.
6. Implement the `CommentInput.svelte` relay removal.
7. Stop there. Do not remove logout relay behavior, legacy store definitions, or the temporary auth bridge.

## Risks and Mitigations

- Risk: replacing the relay with `authService.authRequest` becomes just another event bus.
  - Mitigation: keep the request channel request-scoped, widget-scoped, and tied to existing `authOutcome` semantics rather than adding a new generic dispatcher.

- Risk: `CommentInput.svelte` loses selected-tab awareness when it stops reading `loginStateStore`.
  - Mitigation: bind selected-tab UI state directly from the rendered `Login.svelte` instance.

- Risk: local login validation failure leaves `CommentInput.svelte` stuck in a processing state.
  - Mitigation: require `Login.svelte` to report pending-request validation failures through `authService.reportLocalValidationError(...)`.

- Risk: this slice accidentally removes logout relay behavior.
  - Mitigation: keep `SelfDisplay.svelte` and `Login.svelte` logout relay behavior out of scope.

## Acceptance Criteria

1. `CommentInput.svelte` no longer imports or uses `dispatchableStore`.
2. `CommentInput.svelte` no longer imports or subscribes to `loginStateStore`.
3. Unauthenticated comment submission creates an auth request through the injected `authService`.
4. A matching successful auth outcome causes the existing comment-post flow to continue.
5. A matching failed or cancelled auth outcome returns the comment form out of the processing login state through an existing error/reset path.
6. Comment submission for an already-authenticated user still posts without requesting auth.
7. Selected-tab-dependent button copy and guest-comment validation still work without `CommentInput.svelte` reading `loginStateStore`.
8. `Login.svelte` can consume pending auth requests from `authService` without relying on `dispatchableStore` login events.
9. Logout relay behavior remains unchanged for Slice 10.

## Validation Strategy

Required evidence types for Slice 9:

- **Unit evidence**
  - Pass: `auth-service` tests prove pending auth requests produce success and remote-error outcomes from auth commands.
  - Fail: `CommentInput.svelte` must infer request completion from global legacy stores or non-request-scoped state.

- **Component evidence**
  - Pass: `Login.svelte` component tests prove pending auth requests trigger the selected auth form path and local validation failures are reported through `authService`.
  - Fail: `Login.svelte` still requires `dispatchableStore` login events for comment-submit auth requests.

- **Component evidence**
  - Pass: `CommentInput.svelte` component tests prove unauthenticated submission calls `authService.requestAuth(...)`, matching success continues posting, selected-tab behavior remains available, and legacy login stores are not used.
  - Fail: `CommentInput.svelte` still imports `dispatchableStore` or `loginStateStore` for login flow.

- **Type/build evidence**
  - Pass: frontend typecheck succeeds after removing legacy-store relay dependencies from `CommentInput.svelte`.
  - Fail: component composition or auth-service request typing introduces type errors.

## Open Questions / Assumptions

- Assumption: using `authService.authRequest` / `authOutcome` is the intended narrow replacement for the legacy `dispatchableStore` login relay because those primitives already exist on the service.
- Assumption: direct selected-tab binding between `Login.svelte` and `CommentInput.svelte` is acceptable for this slice because selected-tab state is local UI state, not shared auth/session state.
- Assumption: `SelfDisplay.svelte` logout relay removal remains Slice 10 and should not be folded into this slice.
- Assumption: the temporary Slice 8 auth bridge remains until the cleanup slice after relay consumers are removed.

## Scope Guard

The following work is explicitly deferred and must not be folded into Slice 9 without a separate approved plan/checklist update:

- Slice 10 logout relay removal from `SelfDisplay.svelte`
- Slice 11 temporary auth bridge cleanup
- Deleting `loginStateStore`, `currentUserStore`, or `dispatchableStore`
- Removing selected-tab publication from `Login.svelte`
- Redesigning the frontend auth architecture beyond the existing widget-scoped `authService`

## Conformance QC (Plan)

- Intent clarity issues: none; the plan states the user-facing goal and the narrow replacement path.
- Missing required sections: none.
- Ambiguities/assumptions to resolve: none blocking; assumptions are explicit and defer broader architecture decisions.
- Validation strategy gaps: none; unit, component, and type/build evidence are defined.
- Traceability readiness: ready; scope, approach, acceptance criteria, and validation statements are quoteable under stable headings.
- Pass/Fail: ready for checklist authoring — **Pass**.
