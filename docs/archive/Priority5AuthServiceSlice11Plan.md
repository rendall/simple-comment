# Priority 5 Auth Service Slice 11 Plan

Status: archived, completed

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 5`)

Parent plan: `docs/plans/Priority5Completion.md` (Item 11)

Related artifacts:

- `docs/archive/Priority5AuthServiceSlice8Plan.md`
- `docs/archive/Priority5AuthServiceSlice9Plan.md`
- `docs/archive/Priority5AuthServiceSlice10Plan.md`

## Goal

Remove the temporary auth-service bridge and the legacy auth/session relay stores made obsolete by slices 8-10.

## Intent

This slice is about finishing the cleanup after the careful auth-service extraction work.

`CommentInput.svelte` no longer asks `Login.svelte` to log in through `dispatchableStore`, and `SelfDisplay.svelte` no longer asks `Login.svelte` to log out through `dispatchableStore`. Both now work through the widget-scoped `authService`.

That leaves a few old support pieces behind: `Login.svelte` still listens for relay events that no runtime component sends anymore, `SimpleComment.svelte` still installs the temporary bridge from `authService` into legacy global stores, and tests still import `dispatchableStore` only to prove the old path is not called.

After this slice, the widget should keep the same visible auth behavior, but the old relay path should be gone. `SimpleComment.svelte` should observe `authService.currentUser` directly, `Login.svelte` should no longer import or publish through legacy stores, and the obsolete bridge/store modules should be deleted.

In plain terms: now that the components talk to the auth service directly, remove the scaffolding that helped us migrate there.

## Motivation

Slice 8 intentionally introduced `src/lib/auth-store-bridge.ts` as temporary migration scaffolding so existing consumers could keep working while ownership moved to `auth-service`.

Slices 9 and 10 removed the two runtime consumers that needed that scaffolding:

- `CommentInput.svelte` now requests auth through `authService`.
- `SelfDisplay.svelte` now reads logout state and performs logout through `authService`.

Keeping the bridge and relay stores after that point creates avoidable confusion: future work could accidentally revive `dispatchableStore` / `loginStateStore`, and tests could keep the dead relay alive by importing `dispatchableStore` only for negative assertions.

## In Scope

- Remove `Login.svelte` imports and use of `dispatchableStore`.
- Remove `Login.svelte` imports and use of `loginStateStore`.
- Remove `Login.svelte` handling for `loginIntent` and `logoutIntent`.
- Preserve `Login.svelte` form-local state, validation, selected-tab UI, selected-tab binding, and `simple_comment_login_tab` localStorage behavior.
- Remove `SimpleComment.svelte` installation of `createAuthStoreBridge`.
- Remove `SimpleComment.svelte` subscription to `currentUserStore`.
- Have `SimpleComment.svelte` subscribe directly to `authService.currentUser` to keep its local `currentUser` prop flow updated.
- Delete the obsolete `src/lib/auth-store-bridge.ts` module.
- Delete obsolete `src/lib/svelte-stores.ts` relay/store definitions if no runtime or test imports remain.
- Remove or revise tests that exist only to exercise the deleted bridge/store modules.
- Replace migrated component-test negative relay spies with source guards or direct auth-service assertions that do not import `dispatchableStore`.

## Out of Scope

- Changing `auth-service.ts` command behavior or public service API.
- Changing backend/API contracts.
- Changing `CommentInput.svelte` auth request behavior.
- Changing `SelfDisplay.svelte` logout behavior.
- Removing `Login.svelte` selected-tab binding to `CommentInput.svelte`.
- Removing `simple_comment_login_tab` localStorage persistence.
- Deciding the broader direct-props versus thin auth-service-backed store architecture for future auth state.
- Adding a new event bus, auth controller, `AuthRuntime.svelte`, or broad auth workflow module.
- Splitting `Login.svelte` into smaller form components.

## Constraints

- Keep test-writing and production implementation passes separate.
- Tests must move from failing to passing through production code changes only.
- If implementation discovers an actual runtime consumer of `dispatchableStore`, `loginStateStore`, `currentUserStore`, or `createAuthStoreBridge` outside the expected cleanup surfaces, stop and revise the plan.
- Do not keep `dispatchableStore` solely so tests can spy on events that no runtime component should dispatch.
- Do not replace the old relay with another ad-hoc event bus.

## Current State

At the start of this slice:

- `Login.svelte` imports `dispatchableStore` and `loginStateStore`.
- `Login.svelte` subscribes to `dispatchableStore` and handles `loginIntent` / `logoutIntent`.
- `Login.svelte` publishes selected-tab state through `loginStateStore`.
- `SimpleComment.svelte` imports and installs `createAuthStoreBridge(authService)`.
- `SimpleComment.svelte` subscribes to `currentUserStore` to keep local `currentUser` updated.
- `src/lib/auth-store-bridge.ts` publishes `authService.currentUser` and `authService.authRuntimeSnapshot` to legacy stores.
- `src/lib/svelte-stores.ts` defines `dispatchableStore`, `loginStateStore`, and `currentUserStore`.
- `CommentInput.svelte` and `SelfDisplay.svelte` no longer import or use those legacy stores.
- Some component tests still import `dispatchableStore` only to prove migrated components no longer dispatch legacy relay events.

## Detailed File Impact

### `src/components/Login.svelte`

Expected role: form-local auth UI that delegates auth commands to `authService`.

Expected changes:

- remove the `dispatchableStore` / `loginStateStore` import,
- remove the `dispatchableStore.subscribe(...)` relay listener,
- remove `unsubscribeDispatchableStore()` from `onDestroy`,
- remove `$: loginStateStore.set({ select: selectedIndex })`,
- keep `bind:selectedTab` support through the existing `selectedTab` export and `$: selectedTab = selectedIndex`,
- keep `simple_comment_login_tab` localStorage persistence.

### `src/components/SimpleComment.svelte`

Expected role: widget composition root that owns the widget-scoped `authService`.

Expected changes:

- remove `createAuthStoreBridge` import and setup,
- remove `currentUserStore` import and subscription,
- subscribe directly to `authService.currentUser`,
- clean up that subscription in `onDestroy`,
- keep passing the same widget-scoped `authService` to child components.

### `src/lib/auth-store-bridge.ts`

Expected role: obsolete temporary migration helper.

Expected changes:

- delete the file after `SimpleComment.svelte` no longer imports it.

### `src/lib/svelte-stores.ts`

Expected role: obsolete relay/global-store module after bridge and relay consumers are removed.

Expected changes:

- delete the file after runtime and test imports are removed.

### `src/tests/frontend/components/Login.auth-service.test.ts`

Expected role: component coverage for `Login.svelte` auth-service delegation.

Expected changes:

- remove tests that assert legacy `dispatchableStore` relay behavior,
- remove tests that assert selected-tab publication to `loginStateStore`,
- add or keep source guards proving `Login.svelte` no longer imports legacy relay stores,
- preserve tests for direct auth-service delegation, form-local validation, selected-tab UI behavior, and selected-tab binding.

### `src/tests/frontend/components/CommentInput.auth-service.test.ts`

Expected role: component coverage for `CommentInput.svelte` auth-service auth requests.

Expected changes:

- remove the `dispatchableStore` import used only for negative spying,
- keep direct assertions that `authService.requestAuth()` is called,
- keep source guards proving `CommentInput.svelte` does not import legacy relay stores.

### `src/tests/frontend/components/SelfDisplay.auth-service.test.ts`

Expected role: component coverage for `SelfDisplay.svelte` auth-service logout.

Expected changes:

- remove the `dispatchableStore` import used only for negative spying,
- keep direct assertions that `authService.logout()` is called,
- keep source guards proving `SelfDisplay.svelte` does not import legacy relay stores.

### Obsolete Bridge/Store Tests

Expected role: removed along with deleted modules.

Expected changes:

- remove `src/tests/frontend/auth-store-bridge.test.ts`,
- remove `src/tests/frontend/svelte-stores.test.ts`,
- remove legacy store resets from component test setup once no component tests import those stores.

## DispatchableStore Test Caveat

Slice 10 left a test caveat: some migrated component tests still import `dispatchableStore` only to assert that `loginIntent` or `logoutIntent` is not dispatched.

The minimal solution is not to keep `dispatchableStore` alive for those tests. Instead:

1. Keep positive behavior assertions against `authService` (`requestAuth()` for comments, `logout()` for self display).
2. Keep source guards proving migrated runtime components do not import `dispatchableStore` or `loginStateStore`.
3. Remove the negative relay spies and then delete `dispatchableStore` with the rest of `src/lib/svelte-stores.ts`.

This preserves regression coverage without retaining a dead event bus as test scaffolding.

## Approach

1. Add or revise fail-first component/source tests for the desired cleanup state.
2. Remove dead relay handling and legacy selected-tab publication from `Login.svelte`.
3. Replace `SimpleComment.svelte` bridge/global-store subscription with a direct `authService.currentUser` subscription.
4. Remove obsolete test dependencies on the soon-to-be-deleted bridge/store modules.
5. Delete the obsolete bridge/store modules.
6. Validate no runtime or test imports remain for `auth-store-bridge` or `svelte-stores`.

## Risks and Mitigations

- Risk: removing `currentUserStore` breaks current-user propagation from auth commands to discussion/comment/self-display components.
  - Mitigation: `SimpleComment.svelte` subscribes directly to `authService.currentUser`, preserving the existing local `currentUser` prop flow without the temporary bridge.

- Risk: deleting `loginStateStore` removes selected-tab coordination needed by `CommentInput.svelte`.
  - Mitigation: `CommentInput.svelte` already uses `bind:selectedTab` on `Login.svelte`; keep that direct binding and preserve selected-tab UI/localStorage behavior.

- Risk: deleting `dispatchableStore` hides a regression where components silently stop requesting auth/logout.
  - Mitigation: rely on positive auth-service component assertions and source guards rather than negative relay spies.

- Risk: cleanup grows into a frontend state architecture decision.
  - Mitigation: use existing `authService` stores and explicit props only; do not introduce a new store or event bus.

## Acceptance Criteria

1. `Login.svelte` no longer imports `dispatchableStore` or `loginStateStore`.
2. `Login.svelte` no longer subscribes to or handles `loginIntent` / `logoutIntent`.
3. `Login.svelte` still preserves form-local validation, selected-tab UI, selected-tab binding, and `simple_comment_login_tab` localStorage behavior.
4. `SimpleComment.svelte` no longer imports or installs `createAuthStoreBridge`.
5. `SimpleComment.svelte` no longer imports or subscribes to `currentUserStore`.
6. `SimpleComment.svelte` directly subscribes to `authService.currentUser` and cleans up that subscription on destroy.
7. `src/lib/auth-store-bridge.ts` is removed.
8. `src/lib/svelte-stores.ts` is removed if no imports remain.
9. Migrated component tests do not import `dispatchableStore` solely for negative relay assertions.
10. Obsolete bridge/store unit tests are removed with the modules they covered.
11. No runtime or test imports remain for `auth-store-bridge` or `svelte-stores`.

## Validation Strategy

Required evidence types for Slice 11:

- **Component/source evidence**
  - Pass: component/source tests prove `Login.svelte`, `CommentInput.svelte`, `SelfDisplay.svelte`, and `SimpleComment.svelte` no longer import or use legacy auth relay stores or bridge plumbing.
  - Fail: any migrated runtime component still imports `dispatchableStore`, `loginStateStore`, `currentUserStore`, or `createAuthStoreBridge`.

- **Behavior evidence**
  - Pass: existing component tests still prove `Login.svelte` delegates auth commands to `authService`, `CommentInput.svelte` requests auth through `authService`, and `SelfDisplay.svelte` logs out through `authService`.
  - Fail: cleanup removes or weakens direct auth-service behavior coverage.

- **Import cleanup evidence**
  - Pass: repository search finds no runtime or test imports of `src/lib/auth-store-bridge.ts` or `src/lib/svelte-stores.ts` after deletion.
  - Fail: deleted modules still have importers or must be kept alive for tests.

- **Type/build evidence**
  - Pass: `yarn typecheck` and `yarn run ci:local` pass.
  - Fail: deleting the bridge/store modules causes unresolved imports, type errors, or test regressions.

## Open Questions / Assumptions

- Assumption: `bind:selectedTab` is now the only needed selected-tab coordination path between `Login.svelte` and `CommentInput.svelte`.
- Assumption: no runtime component outside the expected surfaces still depends on `dispatchableStore`, `loginStateStore`, `currentUserStore`, or `createAuthStoreBridge`.
- Assumption: deleting `src/lib/svelte-stores.ts` is acceptable once runtime and test imports are gone; if an unexpected non-auth consumer appears, stop and revise the plan.

## Scope Guard

The following work is explicitly deferred and must not be folded into Slice 11 without a separate approved plan/checklist update:

- broader auth state architecture decisions,
- replacing explicit auth-service props with a new store,
- deleting selected-tab localStorage persistence,
- changing auth-service command semantics,
- changing comment submission behavior,
- splitting or redesigning `Login.svelte`.

## Conformance QC (Plan)

- Intent clarity issues: none; the plan states the cleanup goal and why the temporary bridge/stores are now obsolete.
- Missing required sections: none.
- Ambiguities/assumptions to resolve: none blocking; expected cleanup surfaces and stop conditions are explicit.
- Validation strategy gaps: none; source/component, behavior, import-cleanup, and type/build evidence are defined.
- Traceability readiness: ready; scope, acceptance criteria, and validation statements are quoteable under stable headings.
- Pass/Fail: ready for checklist authoring — **Pass**.
