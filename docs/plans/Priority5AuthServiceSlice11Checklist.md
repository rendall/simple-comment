# Priority 5 Auth Service Slice 11 Checklist

Status: approved

Classification: approved implementation checklist

Source plan: `docs/plans/Priority5AuthServiceSlice11Plan.md`

Parent plan: `docs/plans/Priority5Completion.md` (Item 11: Draft a cleanup slice for removing the temporary auth-service bridge and any legacy auth/session store paths made obsolete by slices 8-10)

## Scope Lock

In scope:

- remove `Login.svelte` use of `dispatchableStore`
- remove `Login.svelte` use of `loginStateStore`
- remove `Login.svelte` handling for `loginIntent` and `logoutIntent`
- keep `Login.svelte` selected-tab UI, selected-tab binding, and `simple_comment_login_tab` persistence
- remove `SimpleComment.svelte` use of `createAuthStoreBridge`
- remove `SimpleComment.svelte` use of `currentUserStore`
- subscribe `SimpleComment.svelte` directly to `authService.currentUser`
- remove migrated component-test imports of `dispatchableStore` that exist only for negative relay spies
- remove obsolete bridge/store unit tests
- delete `src/lib/auth-store-bridge.ts`
- delete `src/lib/svelte-stores.ts` after imports are removed
- keep test-writing passes separate from production implementation passes

Out of scope:

- changing `auth-service.ts` command behavior or public service API
- changing `CommentInput.svelte` auth request behavior
- changing `SelfDisplay.svelte` logout behavior
- removing `Login.svelte` selected-tab binding to `CommentInput.svelte`
- removing `simple_comment_login_tab` localStorage persistence
- deciding the broader direct-props versus thin auth-service-backed store architecture
- adding a new event bus, auth controller, `AuthRuntime.svelte`, or broad auth workflow module
- splitting `Login.svelte` into smaller form components

## Slice Intent

This slice removes the temporary migration scaffolding left after slices 8-10. After the slice, runtime auth UI should continue to work through the widget-scoped `authService`, but `dispatchableStore`, `loginStateStore`, `currentUserStore`, and `createAuthStoreBridge` should no longer be part of runtime or test code.

## Atomic Checklist Items

- [x] T01 `[tests]` Add fail-first cleanup/source-guard component tests and remove migrated component-test negative relay spies.
  - Depends on: none.
  - Required coverage:
    - `Login.svelte` source must not import `dispatchableStore` or `loginStateStore`.
    - `Login.svelte` source must not handle `loginIntent` or `logoutIntent`.
    - `SimpleComment.svelte` source must not import or install `createAuthStoreBridge`.
    - `SimpleComment.svelte` source must not import or subscribe to `currentUserStore`.
    - `CommentInput.svelte` tests must keep positive `authService.requestAuth()` coverage without importing `dispatchableStore` for a negative spy.
    - `SelfDisplay.svelte` tests must keep positive `authService.logout()` coverage without importing `dispatchableStore` for a negative spy.
    - Existing direct auth-service delegation coverage must remain in place.
  - Trace:
    - "Add or revise fail-first component/source tests for the desired cleanup state." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Approach)
    - "Replace migrated component-test negative relay spies with source guards or direct auth-service assertions that do not import `dispatchableStore`." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "Do not keep `dispatchableStore` solely so tests can spy on events that no runtime component should dispatch." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Constraints)
    - "Keep positive behavior assertions against `authService` (`requestAuth()` for comments, `logout()` for self display)." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, DispatchableStore Test Caveat)

- [x] C01 `[frontend]` Remove dead legacy relay handling and selected-tab store publication from `src/components/Login.svelte`.
  - Depends on: T01.
  - Validated by: T01 and existing `Login.svelte` auth-service component tests.
  - Trace:
    - "Remove `Login.svelte` imports and use of `dispatchableStore`." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "Remove `Login.svelte` imports and use of `loginStateStore`." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "Remove `Login.svelte` handling for `loginIntent` and `logoutIntent`." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "keep `bind:selectedTab` support through the existing `selectedTab` export and `$: selectedTab = selectedIndex`" (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Detailed File Impact)
    - "keep `simple_comment_login_tab` localStorage persistence." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Detailed File Impact)

- [x] C02 `[frontend]` Replace `src/components/SimpleComment.svelte` bridge/global-store plumbing with a direct `authService.currentUser` subscription.
  - Depends on: T01.
  - Validated by: T01 and `yarn typecheck`.
  - Trace:
    - "Remove `SimpleComment.svelte` installation of `createAuthStoreBridge`." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "Remove `SimpleComment.svelte` subscription to `currentUserStore`." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "Have `SimpleComment.svelte` subscribe directly to `authService.currentUser` to keep its local `currentUser` prop flow updated." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "`SimpleComment.svelte` subscribes directly to `authService.currentUser`, preserving the existing local `currentUser` prop flow without the temporary bridge." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Risks and Mitigations)

- [x] T02 `[tests]` Remove obsolete bridge/store test dependencies before deleting their modules.
  - Depends on: C01, C02.
  - Required cleanup:
    - remove `src/tests/frontend/auth-store-bridge.test.ts`,
    - remove `src/tests/frontend/svelte-stores.test.ts`,
    - remove `currentUserStore`, `loginStateStore`, and `dispatchableStore` imports/resets from `src/tests/frontend/components/vitest.setup.ts`,
    - verify component tests still cover auth-service behavior without legacy store imports.
  - Trace:
    - "Remove or revise tests that exist only to exercise the deleted bridge/store modules." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "remove `src/tests/frontend/auth-store-bridge.test.ts`" (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Detailed File Impact)
    - "remove `src/tests/frontend/svelte-stores.test.ts`" (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Detailed File Impact)
    - "remove legacy store resets from component test setup once no component tests import those stores." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Detailed File Impact)

- [x] C03 `[cleanup]` Delete obsolete bridge/store modules and prove no runtime or test imports remain.
  - Depends on: T02.
  - Validated by: repository import search, `yarn typecheck`, and `yarn run ci:local`.
  - Required cleanup:
    - delete `src/lib/auth-store-bridge.ts`,
    - delete `src/lib/svelte-stores.ts`,
    - verify no runtime or test imports remain for `auth-store-bridge` or `svelte-stores`.
  - Trace:
    - "Delete the obsolete `src/lib/auth-store-bridge.ts` module." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "Delete obsolete `src/lib/svelte-stores.ts` relay/store definitions if no runtime or test imports remain." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, In Scope)
    - "Pass: repository search finds no runtime or test imports of `src/lib/auth-store-bridge.ts` or `src/lib/svelte-stores.ts` after deletion." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Validation Strategy)
    - "Fail: deleted modules still have importers or must be kept alive for tests." (`docs/plans/Priority5AuthServiceSlice11Plan.md`, Validation Strategy)

## Behavior Slices

### Slice 11A

Goal: prove and remove the dead Login relay path.

Items: T01, C01

Type: behavior

### Slice 11B

Goal: replace the temporary composition-root bridge with direct auth-service current-user observation.

Items: C02

Type: behavior

### Slice 11C

Goal: delete obsolete bridge/store test scaffolding and modules after all imports are gone.

Items: T02, C03

Type: mechanical

## Conformance QC (Checklist)

- Missing from plan: none.
- Extra beyond plan: none; each item maps to the plan's scope, file impacts, approach, acceptance criteria, or validation strategy.
- Atomicity fixes needed: none; each item can be checked and committed independently.
- Validation mapping gaps: none; implementation items are covered by source/component tests, import search, typecheck, and local CI.
- Pass/Fail: checklist achieves plan goals — **Pass**.
