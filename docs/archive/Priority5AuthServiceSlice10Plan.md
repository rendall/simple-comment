# Priority 5 Auth Service Slice 10 Plan

Status: approved

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 5`)

Parent plan: `docs/plans/Priority5Completion.md` (Item 10)

Related artifacts:

- `docs/archive/Priority5AuthServiceSlice9Plan.md`
- `docs/archive/Priority5AuthServiceSlice9Checklist.md`

## Goal

Remove the logout relay dependency from `SelfDisplay.svelte` so logout is triggered through the widget-scoped `auth-service` instead of through `dispatchableStore` and `loginStateStore`.

## Intent

This slice is about letting the visible user panel perform logout directly through the shared auth service.

Today, `SelfDisplay.svelte` uses `loginStateStore` to decide whether auth is processing and whether logout is allowed. When the user clicks the logout button, it dispatches a `logoutIntent` event through `dispatchableStore`, and `Login.svelte` receives that event and calls `authService.logout()`. That keeps logout behavior coupled to a legacy global relay and to the login form component.

After this slice, `SelfDisplay.svelte` should no longer import or use those legacy stores. It should receive the widget-scoped `authService`, observe auth runtime state from that service, and call `authService.logout()` directly when the user clicks Log out.

In plain terms: the user panel should log out through the auth service, not ask the login form to do it by shouting through a shared store.

## In Scope

- Add an `authService` prop to `SelfDisplay.svelte`.
- Pass the existing widget-scoped `authService` from `SimpleComment.svelte` to `SelfDisplay.svelte`.
- Remove `SelfDisplay.svelte` imports and use of `dispatchableStore`.
- Remove `SelfDisplay.svelte` imports and subscription to `loginStateStore`.
- Have `SelfDisplay.svelte` observe `authService.authRuntimeSnapshot` for auth processing state and `nextEvents`.
- Have `SelfDisplay.svelte` call `authService.logout()` directly from the logout button.
- Preserve the current visible user display and skeleton/processing behavior.
- Add fail-first component tests before production changes.

## Out of Scope

- Removing `dispatchableStore` from `Login.svelte`.
- Removing `loginStateStore` selected-tab publication from `Login.svelte`.
- Removing `loginStateStore`, `dispatchableStore`, or `currentUserStore` definitions.
- Removing the temporary Slice 8 auth store bridge.
- Changing `CommentInput.svelte`.
- Changing backend/API contracts.
- Choosing the final direct-props versus thin auth-service-backed store architecture for the whole widget.

## Constraints

- Keep `auth-service` widget-scoped; do not introduce a singleton auth-service import.
- Keep the implementation narrow to `SelfDisplay.svelte` logout behavior and its composition-root prop wiring.
- Keep test-writing passes separate from production implementation passes.
- Do not edit tests during implementation unless the implementation stops and explains why a test is wrong.
- Preserve current behavior where the logout button is visible only when auth runtime state allows `LOGOUT`.

## Current State

At the start of this slice:

- `SelfDisplay.svelte` receives `currentUser` as a prop.
- `SelfDisplay.svelte` imports `dispatchableStore` and dispatches `logoutIntent` from its logout button.
- `SelfDisplay.svelte` imports `loginStateStore` to observe `state` and `nextEvents`.
- `Login.svelte` still subscribes to `dispatchableStore` for `logoutIntent`.
- `SimpleComment.svelte` creates the widget-scoped `authService` but does not pass it to `SelfDisplay.svelte`.
- `auth-service.ts` already owns `logout()` and exposes `authRuntimeSnapshot`.

## Detailed File Impact

### `src/components/SelfDisplay.svelte`

Expected role: user panel that observes auth state and delegates logout directly to `authService`.

Expected changes:

- add `export let authService: AuthService`,
- subscribe to `authService.authRuntimeSnapshot`,
- derive processing state from `authRuntimeSnapshot.state`,
- derive logout-button visibility from `authRuntimeSnapshot.nextEvents`,
- call `authService.logout()` directly in `onLogoutClick`,
- clean up the auth-service subscription in `onDestroy`,
- remove `dispatchableStore` and `loginStateStore` imports.

Non-goals:

- do not change avatar/user-display markup except as required by auth-service wiring.

### `src/components/SimpleComment.svelte`

Expected role: current composition root that owns and passes the widget-scoped auth service.

Expected changes:

- pass `{authService}` to `SelfDisplay.svelte`.

Non-goals:

- do not remove the temporary auth store bridge in this slice.

### `src/components/Login.svelte`

Expected role: unchanged during Slice 10.

Expected changes:

- no production changes expected.

Non-goals:

- do not remove the now-obsolete `logoutIntent` handler in this slice; leave dead relay cleanup to Slice 11.

### `src/lib/svelte-stores.ts`

Expected role: unchanged legacy compatibility surface.

Expected changes:

- none.

## Approach

1. Add fail-first component tests proving `SelfDisplay.svelte` reads auth runtime state from `authService`, calls `authService.logout()` directly, and does not import legacy relay stores.
2. Wire `SelfDisplay.svelte` to the injected auth service and remove legacy store usage.
3. Pass `authService` from `SimpleComment.svelte` to `SelfDisplay.svelte`.
4. Stop there. Do not remove the legacy store definitions, the Slice 8 bridge, or `Login.svelte` dead relay handling.

## Risks and Mitigations

- Risk: this slice quietly becomes the cleanup slice by deleting legacy stores or bridge code.
  - Mitigation: keep all legacy-store deletion and bridge cleanup deferred to Slice 11.

- Risk: logout button visibility changes because `SelfDisplay.svelte` observes auth-service state instead of `loginStateStore`.
  - Mitigation: derive visibility from the same `nextEvents` shape already bridged from `authService.authRuntimeSnapshot`.

- Risk: processing skeleton behavior changes unintentionally.
  - Mitigation: preserve the existing processing-state vocabulary and cover it with component tests.

## Acceptance Criteria

1. `SelfDisplay.svelte` receives `authService` as an explicit prop.
2. `SimpleComment.svelte` passes the widget-scoped `authService` to `SelfDisplay.svelte`.
3. `SelfDisplay.svelte` no longer imports or uses `dispatchableStore`.
4. `SelfDisplay.svelte` no longer imports or subscribes to `loginStateStore`.
5. Clicking the logout button calls `authService.logout()` directly.
6. Logout button visibility still follows whether auth runtime `nextEvents` includes `LOGOUT`.
7. Processing skeleton behavior remains based on auth runtime state.
8. `Login.svelte` logout relay cleanup is deferred to Slice 11.

## Validation Strategy

Required evidence types for Slice 10:

- **Component evidence**
  - Pass: `SelfDisplay.svelte` component tests prove logout button visibility comes from `authService.authRuntimeSnapshot`, clicking Log out calls `authService.logout()`, and legacy relay stores are not imported.
  - Fail: `SelfDisplay.svelte` still dispatches `logoutIntent` or reads `loginStateStore` for logout behavior.

- **Type/build evidence**
  - Pass: frontend typecheck succeeds after passing `authService` into `SelfDisplay.svelte`.
  - Fail: component composition or auth-service prop typing introduces type errors.

## Open Questions / Assumptions

- Assumption: `SelfDisplay.svelte` should use `authService.authRuntimeSnapshot` directly rather than a new auth-state store, because the final direct-props versus thin-store architecture decision remains deferred.
- Assumption: leaving the obsolete `Login.svelte` logout relay listener in place until Slice 11 is acceptable because this slice only removes `SelfDisplay.svelte` as a relay producer/consumer.
- Assumption: the temporary Slice 8 auth bridge remains until Slice 11 cleanup.

## Scope Guard

The following work is explicitly deferred and must not be folded into Slice 10 without a separate approved plan/checklist update:

- removing `dispatchableStore` handling from `Login.svelte`,
- deleting `loginStateStore`, `currentUserStore`, or `dispatchableStore`,
- removing the temporary Slice 8 auth bridge,
- changing `CommentInput.svelte`,
- redesigning the frontend auth architecture beyond explicit widget-scoped `authService` props.

## Conformance QC (Plan)

- Intent clarity issues: none; the plan states the user-facing goal and the narrow replacement path.
- Missing required sections: none.
- Ambiguities/assumptions to resolve: none blocking; cleanup work is explicitly deferred.
- Validation strategy gaps: none; component and type/build evidence are defined.
- Traceability readiness: ready; scope, acceptance criteria, and validation statements are quoteable under stable headings.
- Pass/Fail: ready for checklist authoring — **Pass**.
