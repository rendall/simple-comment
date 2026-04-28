# Priority 5 Auth Service Slice 8 Checklist

Status: approved

Classification: approved implementation checklist

Source plan: `docs/plans/Priority5AuthServiceSlice8Plan.md`

Parent plan: `docs/plans/Priority5Completion.md` (Item 8: Draft a slice for replacing `Login.svelte` shared-store publication with auth-service state subscriptions)

## Scope Lock

In scope:

- remove `Login.svelte` publication of auth/session state to `currentUserStore` and `loginStateStore`
- keep `Login.svelte` selected-tab UI publication for this slice
- add a temporary widget-scoped compatibility bridge from `AuthService` state to the existing legacy stores
- install that bridge at the current composition root
- preserve the existing `loginStateStore` auth/session shape for unreworked `CommentInput.svelte` and `SelfDisplay.svelte` consumers
- preserve current user flow through the existing component tree
- validate the bridge with fail-first tests before implementation

Out of scope:

- removing `dispatchableStore`
- removing `loginStateStore`
- removing `currentUserStore`
- removing login relay behavior from `CommentInput.svelte`
- removing logout relay behavior from `SelfDisplay.svelte`
- moving selected-tab UI state out of `Login.svelte`
- choosing the final direct-props versus thin auth-service-backed store architecture
- changing backend/API contracts

## Slice Intent

This slice removes auth/session store publication from `Login.svelte` without removing the legacy stores yet. The temporary compatibility bridge should publish the current auth-service state into the existing stores so unreworked consumers keep functioning. `Login.svelte` remains responsible for form-local UI and selected-tab publication only.

## Atomic Checklist Items

- [x] T01 `[tests]` Add fail-first frontend unit tests for a temporary auth store bridge in `src/tests/frontend/auth-store-bridge.test.ts`.
  - Depends on: none.
  - Required coverage:
    - `authService.currentUser` publishes to `currentUserStore`.
    - `authService.authRuntimeSnapshot` publishes `{ state, nextEvents }` to `loginStateStore`.
    - bridge cleanup unsubscribes from auth-service stores so later service updates do not keep publishing.
  - Trace:
    - "Add fail-first tests proving auth-state store publication comes from the widget-scoped `authService` bridge and does not require `Login.svelte` to publish auth/session state." (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Approach)
    - "Pass: tests prove auth/session store updates can be produced from `authService` without relying on `Login.svelte` as publisher." (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Validation Strategy)
    - "This helper keeps bridge behavior testable without making `auth-service.ts` import global legacy stores directly." (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)

- [ ] C01 `[frontend]` Implement `src/lib/auth-store-bridge.ts` as the temporary compatibility bridge from an injected widget-scoped `AuthService` to the legacy `currentUserStore` and `loginStateStore`, returning a cleanup function.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "Add a temporary compatibility bridge from the widget-scoped `AuthService` to the existing shared stores, expected as a small helper such as `src/lib/auth-store-bridge.ts`." (`docs/plans/Priority5AuthServiceSlice8Plan.md`, In Scope)
    - "publish `{ state, nextEvents }` from `authRuntimeSnapshot` to `loginStateStore`" (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)
    - "publish service-owned current user values to `currentUserStore`" (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)

- [ ] C02 `[frontend]` Install the temporary auth store bridge in `src/components/SimpleComment.svelte` using the existing widget-scoped `authService`, and clean up the bridge in `onDestroy`.
  - Depends on: C01.
  - Validated by: `yarn typecheck`.
  - Trace:
    - "Because `SimpleComment.svelte` creates the widget-scoped `authService`, it is the safest current place to install and clean up transitional subscriptions from `authService` to the existing shared stores." (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)
    - "call the temporary bridge helper with the widget-scoped `authService`" (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)
    - "Keep the bridge widget-scoped and lifecycle-cleaned; do not introduce a singleton auth-service or a broad new event bus." (`docs/plans/Priority5AuthServiceSlice8Plan.md`, In Scope)

- [ ] T02 `[tests]` Update `src/tests/frontend/components/Login.auth-service.test.ts` so `Login.svelte` is expected not to publish auth/session state to legacy stores while still publishing selected-tab UI state.
  - Depends on: C02.
  - Required coverage:
    - observed auth runtime state from `Login.svelte` does not update `loginStateStore` with `{ state, nextEvents }`.
    - `Login.svelte` still publishes `{ select }` when the selected tab changes.
  - Trace:
    - "`Login.svelte` stops publishing auth/session state to `currentUserStore` and `loginStateStore`" (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Intent)
    - "`Login.svelte` may still publish selected-tab UI state because that is local UI state, not shared auth/session state" (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Intent)
    - "`Login.svelte` still publishes selected-tab UI state for current unreworked consumers." (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Acceptance Criteria)

- [ ] C03 `[frontend]` Remove auth/session legacy-store publication from `src/components/Login.svelte` while preserving selected-tab publication and all form-local UI behavior.
  - Depends on: T02.
  - Validated by: T02 and `yarn typecheck`.
  - Trace:
    - "remove `currentUserStore.set(self)` on destroy" (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)
    - "remove reactive `currentUserStore.set(self)`" (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)
    - "remove `loginStateStore.set({ state, nextEvents })` from the auth runtime snapshot handler" (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)
    - "keep `loginStateStore.set({ select: selectedIndex })` unless a later slice replaces selected-tab coupling." (`docs/plans/Priority5AuthServiceSlice8Plan.md`, Detailed File Impact)

## Behavior Slices

### Slice 8A

Goal: add a testable temporary compatibility bridge from widget-scoped auth-service state to legacy stores.

Items: T01, C01

Type: behavior

### Slice 8B

Goal: install the compatibility bridge at the current composition root without changing relay consumers.

Items: C02

Type: mechanical

### Slice 8C

Goal: remove auth/session shared-store publication from `Login.svelte` while preserving selected-tab UI publication.

Items: T02, C03

Type: behavior

## Conformance QC (Checklist)

- Missing from plan: none.
- Extra beyond plan: none; the helper seam is explicitly named in the plan.
- Atomicity fixes needed: none; each item can be checked and committed independently.
- Validation mapping gaps: none; implementation items are covered by fail-first tests and typecheck.
- Pass/Fail: checklist achieves plan goals — **Pass**.
