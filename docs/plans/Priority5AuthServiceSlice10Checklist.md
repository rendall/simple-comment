# Priority 5 Auth Service Slice 10 Checklist

Status: approved

Classification: approved implementation checklist

Source plan: `docs/plans/Priority5AuthServiceSlice10Plan.md`

Parent plan: `docs/plans/Priority5Completion.md` (Item 10: Draft a slice for removing `dispatchableStore` / `loginStateStore` logout relay behavior from `SelfDisplay.svelte`)

## Scope Lock

In scope:

- add an explicit `authService` prop to `SelfDisplay.svelte`
- pass the widget-scoped `authService` from `SimpleComment.svelte` to `SelfDisplay.svelte`
- remove `SelfDisplay.svelte` use of `dispatchableStore`
- remove `SelfDisplay.svelte` subscription to `loginStateStore`
- use `authService.authRuntimeSnapshot` for processing state and logout-button visibility
- call `authService.logout()` directly from `SelfDisplay.svelte`
- keep test-writing passes separate from production implementation passes

Out of scope:

- removing `dispatchableStore` from `Login.svelte`
- removing `loginStateStore` selected-tab publication from `Login.svelte`
- removing legacy store definitions
- removing the temporary Slice 8 auth bridge
- changing `CommentInput.svelte`
- changing backend/API contracts
- choosing the final direct-props versus thin auth-service-backed store architecture

## Slice Intent

This slice removes the logout relay from `SelfDisplay.svelte`. After the slice, the visible user panel should observe logout availability through the injected widget-scoped `authService` and call `authService.logout()` directly. `SelfDisplay.svelte` should no longer depend on `dispatchableStore` or `loginStateStore` for logout behavior.

## Atomic Checklist Items

- [x] T01 `[tests]` Add fail-first `SelfDisplay.svelte` component tests for auth-service-driven logout behavior in `src/tests/frontend/components/SelfDisplay.auth-service.test.ts`.
  - Depends on: none.
  - Required coverage:
    - when `authService.authRuntimeSnapshot.nextEvents` includes `LOGOUT`, the logout button is visible for a current user.
    - clicking the logout button calls `authService.logout()` directly instead of dispatching `logoutIntent`.
    - when auth runtime state is processing, the skeleton display remains visible.
    - source guard proves `SelfDisplay.svelte` does not import `dispatchableStore` or `loginStateStore`.
  - Trace:
    - "Add fail-first component tests proving `SelfDisplay.svelte` reads auth runtime state from `authService`, calls `authService.logout()` directly, and does not import legacy relay stores." (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Approach)
    - "Pass: `SelfDisplay.svelte` component tests prove logout button visibility comes from `authService.authRuntimeSnapshot`, clicking Log out calls `authService.logout()`, and legacy relay stores are not imported." (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Validation Strategy)
    - "Clicking the logout button calls `authService.logout()` directly." (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Acceptance Criteria)

- [x] C01 `[frontend]` Refactor `src/components/SelfDisplay.svelte` to use injected `authService` runtime state and direct `authService.logout()` instead of legacy logout relay stores.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "add `export let authService: AuthService`" (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Detailed File Impact)
    - "subscribe to `authService.authRuntimeSnapshot`" (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Detailed File Impact)
    - "call `authService.logout()` directly in `onLogoutClick`" (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Detailed File Impact)
    - "remove `dispatchableStore` and `loginStateStore` imports." (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Detailed File Impact)

- [ ] C02 `[frontend]` Pass the widget-scoped `authService` from `src/components/SimpleComment.svelte` to `SelfDisplay.svelte`.
  - Depends on: C01.
  - Validated by: `yarn typecheck`.
  - Trace:
    - "Pass the existing widget-scoped `authService` from `SimpleComment.svelte` to `SelfDisplay.svelte`." (`docs/plans/Priority5AuthServiceSlice10Plan.md`, In Scope)
    - "pass `{authService}` to `SelfDisplay.svelte`." (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Detailed File Impact)
    - "`SimpleComment.svelte` passes the widget-scoped `authService` to `SelfDisplay.svelte`." (`docs/plans/Priority5AuthServiceSlice10Plan.md`, Acceptance Criteria)

## Behavior Slices

### Slice 10A

Goal: prove and implement direct logout behavior in `SelfDisplay.svelte`.

Items: T01, C01

Type: behavior

### Slice 10B

Goal: wire the composition root to provide the widget-scoped auth service to `SelfDisplay.svelte`.

Items: C02

Type: mechanical

## Conformance QC (Checklist)

- Missing from plan: none.
- Extra beyond plan: none; each item maps to the plan's file impacts, approach, and validation strategy.
- Atomicity fixes needed: none; each item can be checked and committed independently.
- Validation mapping gaps: none; implementation items are covered by fail-first component tests or typecheck.
- Pass/Fail: checklist achieves plan goals — **Pass**.
