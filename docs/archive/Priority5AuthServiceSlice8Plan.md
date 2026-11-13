# Priority 5 Auth Service Slice 8 Plan

Status: approved

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 5`)

Parent plan: `docs/plans/Priority5Completion.md` (Item 8)

Related artifacts:

- `docs/archive/Priority5AuthServiceSlice6Plan.md`
- `docs/archive/Priority5AuthServiceSlice7Plan.md`

## Goal

Move legacy auth-state store publication out of `Login.svelte` so auth state is bridged from the widget-scoped `auth-service` instead of from the login form component.

## Intent

This slice is about removing the last place where `Login.svelte` acts like the owner of shared auth state.

After Slices 6 and 7, `Login.svelte` no longer owns auth commands, auth persistence, or the live auth runtime. It still publishes auth/session state outward through shared Svelte stores:

- `currentUserStore`
- `loginStateStore`

That publication keeps the login form in the middle of unrelated behavior. `CommentInput.svelte` and `SelfDisplay.svelte` still depend on the legacy stores, but the source of those stores should be the shared auth service, not the presence and lifecycle of `Login.svelte`.

For this slice, success means:

- `Login.svelte` stops publishing auth/session state to `currentUserStore` and `loginStateStore`,
- the current legacy consumers keep working because a temporary compatibility bridge publishes those stores from `auth-service`,
- `Login.svelte` may still publish selected-tab UI state because that is local UI state, not shared auth/session state,
- no relay behavior is removed yet from `CommentInput.svelte` or `SelfDisplay.svelte`.

In plain terms: auth state should flow from the auth service, while the login form should remain just a form.

## In Scope

- Remove `Login.svelte` publication of auth/session state:
  - `currentUserStore.set(self)`
  - `loginStateStore.set({ state, nextEvents })`
- Preserve `Login.svelte` publication of selected-tab UI state for now:
  - `loginStateStore.set({ select: selectedIndex })`
- Add a temporary compatibility bridge from the widget-scoped `AuthService` to the existing shared stores, expected as a small helper such as `src/lib/auth-store-bridge.ts`.
- Bridge `authService.currentUser` into the existing current-user path so currently unreworked descendants continue to receive `currentUser`.
- Bridge `authService.authRuntimeSnapshot` into `loginStateStore` so `CommentInput.svelte` and `SelfDisplay.svelte` keep receiving the auth state shape they currently consume.
- Keep the bridge widget-scoped and lifecycle-cleaned; do not introduce a singleton auth-service or a broad new event bus.
- Add fail-first tests that prove store publication no longer depends on rendering `Login.svelte`.

## Out of Scope

- Removing `dispatchableStore`.
- Removing `loginStateStore`.
- Removing login relay behavior from `CommentInput.svelte`.
- Removing logout relay behavior from `SelfDisplay.svelte`.
- Changing `CommentInput.svelte` submit/login state-machine behavior.
- Changing `SelfDisplay.svelte` logout button behavior.
- Moving selected-tab UI state out of `Login.svelte`.
- Choosing the final direct-props versus thin auth-service-backed store architecture for the whole widget.
- Splitting `Login.svelte` into smaller components.
- Changing backend/API contracts.

## Constraints

- `auth-service` remains widget-scoped; no singleton service import.
- The compatibility bridge is transitional and should be easy to delete in later slices.
- Do not make `auth-service` import the legacy global stores directly unless a later checklist explicitly approves that coupling.
- Do not fold Slice 9 or Slice 10 relay removal into this slice.
- Test and implementation passes remain separate per current team convention.

## Current State

At the start of this slice:

- `auth-service` owns auth commands, auth persistence, and the live auth runtime.
- `Login.svelte` observes `authService.currentUser` and `authService.authRuntimeSnapshot`.
- `Login.svelte` still writes observed auth state into `currentUserStore` and `loginStateStore`.
- `SimpleComment.svelte` reads `currentUserStore` to update its local `currentUser` prop flow.
- `CommentInput.svelte` reads `loginStateStore` to react to login results and selected-tab state.
- `SelfDisplay.svelte` reads `loginStateStore` to show login/logout processing state.

## Detailed File Impact

### `src/lib/auth-service.ts`

Expected role: source of auth state, not legacy-store publisher.

This file already exposes the state needed by the bridge:

- `currentUser`
- `authRuntimeSnapshot`

The preferred Slice 8 plan does not require `auth-service.ts` to import `currentUserStore` or `loginStateStore`. If implementation discovers the service needs a small helper to expose bridge-ready state more clearly, that helper must remain service-local and widget-scoped.

Expected changes:

- likely none, unless tests reveal the current readable stores are insufficient for a clean bridge.

Non-goal:

- do not make `auth-service.ts` write to global legacy stores directly.

### `src/lib/auth-store-bridge.ts`

Expected role: temporary compatibility bridge from widget-scoped auth-service state to legacy shared stores.

This helper should subscribe to:

- `authService.currentUser`
- `authService.authRuntimeSnapshot`

It should publish to:

- `currentUserStore`
- `loginStateStore`

Expected changes:

- add a small helper that accepts an `AuthService` instance and optional store dependencies for tests,
- publish `{ state, nextEvents }` from `authRuntimeSnapshot` to `loginStateStore`,
- publish service-owned current user values to `currentUserStore`,
- return a cleanup function that unsubscribes from service stores.

This helper keeps bridge behavior testable without making `auth-service.ts` import global legacy stores directly.

### `src/components/Login.svelte`

Expected role: form-local UI and auth command delegation only.

`Login.svelte` should stop publishing shared auth/session state:

- remove `currentUserStore.set(self)` on destroy,
- remove reactive `currentUserStore.set(self)`,
- remove `loginStateStore.set({ state, nextEvents })` from the auth runtime snapshot handler.

`Login.svelte` should continue to own selected-tab UI behavior for this slice:

- keep `simple_comment_login_tab` persistence,
- keep `loginStateStore.set({ select: selectedIndex })` unless a later slice replaces selected-tab coupling.

This preserves the current guest/login/signup UX while removing auth-state publication from the form component.

### `src/components/SimpleComment.svelte`

Expected role: current composition root and temporary legacy-store bridge installer.

Because `SimpleComment.svelte` creates the widget-scoped `authService`, it is the safest current place to install and clean up transitional subscriptions from `authService` to the existing shared stores.

Expected changes:

- call the temporary bridge helper with the widget-scoped `authService`,
- keep updating local `currentUser` from the legacy `currentUserStore` while the prop flow is still unreworked,
- clean up bridge subscriptions in `onDestroy`.

This keeps the bridge widget-scoped and avoids a singleton auth service.

### `src/components/CommentInput.svelte`

Expected role: unchanged consumer during Slice 8.

`CommentInput.svelte` currently consumes `loginStateStore` and dispatches login intents. This slice should not rewrite that relay behavior.

Expected changes:

- no production changes expected.

Validation relevance:

- tests should protect that `CommentInput.svelte` can still observe login outcomes through the existing `loginStateStore` shape after publication moves away from `Login.svelte`.

### `src/components/SelfDisplay.svelte`

Expected role: unchanged consumer during Slice 8.

`SelfDisplay.svelte` currently consumes `loginStateStore` for processing state and dispatches logout intents. This slice should not rewrite that relay behavior.

Expected changes:

- no production changes expected.

Validation relevance:

- tests should protect that the existing processing-state shape still reaches `SelfDisplay.svelte` through `loginStateStore`.

### `src/lib/svelte-stores.ts`

Expected role: unchanged legacy compatibility surface.

This slice should not remove or redesign the existing stores. It only changes who publishes auth/session state into them.

Expected changes:

- no production changes expected.

## Approach

1. Add fail-first tests proving auth-state store publication comes from the widget-scoped `authService` bridge and does not require `Login.svelte` to publish auth/session state.
2. Add the temporary compatibility bridge as a small helper and install it at the current composition root, where the widget-scoped `authService` already exists.
3. Remove auth/session store publication from `Login.svelte`.
4. Keep `Login.svelte` selected-tab publication intact for now.
5. Stop there. Do not remove relay stores or rewrite `CommentInput.svelte` / `SelfDisplay.svelte`.

## Risks and Mitigations

- Risk: Slice 8 quietly becomes Slice 9 or Slice 10 by rewriting relay consumers.
  - Mitigation: keep `CommentInput.svelte` and `SelfDisplay.svelte` production behavior unchanged.

- Risk: the bridge becomes a new permanent architecture by accident.
  - Mitigation: keep it explicit, widget-scoped, and documented as transitional compatibility.

- Risk: selected-tab state gets confused with auth/session state.
  - Mitigation: leave selected-tab publication in `Login.svelte` for this slice and defer that decision.

- Risk: auth-service becomes coupled to global legacy stores.
  - Mitigation: put store publication in the composition root rather than inside `auth-service.ts`.

## Acceptance Criteria

1. `Login.svelte` no longer publishes `currentUserStore`.
2. `Login.svelte` no longer publishes `{ state, nextEvents }` auth/session updates to `loginStateStore`.
3. `Login.svelte` still publishes selected-tab UI state for current unreworked consumers.
4. The existing `loginStateStore` auth/session shape remains available to unreworked consumers from a widget-scoped `authService` subscription.
5. Current user flow remains available to the existing component tree from `authService.currentUser`.
6. `CommentInput.svelte` and `SelfDisplay.svelte` production relay behavior is unchanged.
7. No singleton auth-service, new event bus, or broad auth-state redesign is introduced.

## Validation Strategy

Required evidence types for Slice 8:

- **Unit/component evidence**
  - Pass: tests prove auth/session store updates can be produced from `authService` without relying on `Login.svelte` as publisher.
  - Fail: tests require `Login.svelte` to publish auth/session store updates.

- **Compatibility evidence**
  - Pass: existing `CommentInput.svelte` and `SelfDisplay.svelte` consumers still receive the current `loginStateStore` auth/session shape.
  - Fail: relay consumers lose the `state` / `nextEvents` data they currently use.

- **Type/build evidence**
  - Pass: frontend typecheck succeeds after bridge installation and Login publication removal.
  - Fail: component composition or subscription cleanup introduces type errors.

## Open Questions / Assumptions

- Assumption: `SimpleComment.svelte` is the correct temporary bridge location because it creates the widget-scoped `AuthService`.
- Assumption: selected-tab publication remains in `Login.svelte` until a later slice decides whether that UI state still belongs in `loginStateStore`.
- Assumption: Slice 9 and Slice 10 will remove the login/logout relay behavior later, so Slice 8 should preserve the current store contract rather than eliminate it.
- Assumption: the temporary bridge should be a tiny helper rather than inline `SimpleComment.svelte` code, because that gives the slice a clean fail-first unit-test seam while keeping service coupling out of `auth-service.ts`.

## Scope Guard

The following work is explicitly deferred and must not be folded into Slice 8 without a separate approved plan/checklist update:

- Slice 9 login relay removal from `CommentInput.svelte`
- Slice 10 logout relay removal from `SelfDisplay.svelte`
- Final direct-props versus thin-store architecture decision
- Deleting `loginStateStore`, `currentUserStore`, or `dispatchableStore`
- Moving selected-tab UI state out of `Login.svelte`

## Conformance QC (Plan)

- Intent clarity issues: none observed; intent distinguishes auth/session store publication from selected-tab UI publication.
- Missing required sections: none (`Goal`, `Intent`, `In Scope`, `Out of Scope`, `Acceptance Criteria`, and `Validation Strategy` are present).
- Ambiguities/assumptions to resolve: none blocking implementation; the bridge helper seam is explicit and intentionally temporary.
- Validation strategy gaps: none for the transitional bridge scope.
- Traceability readiness: ready; headings and acceptance criteria are stable and quoteable for checklist authoring.
- Pass/Fail: structurally ready for checklist execution — **Pass**.
