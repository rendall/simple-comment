# Priority 5 Auth Service Slice 9 Checklist

Status: approved

Classification: approved implementation checklist

Source plan: `docs/plans/Priority5AuthServiceSlice9Plan.md`

Parent plan: `docs/plans/Priority5Completion.md` (Item 9: Draft a slice for removing `dispatchableStore` / `loginStateStore` login relay behavior from `CommentInput.svelte`)

## Scope Lock

In scope:

- remove `CommentInput.svelte` use of `dispatchableStore` for `loginIntent`
- remove `CommentInput.svelte` subscription to `loginStateStore`
- use the injected widget-scoped `authService` to request authentication before comment posting
- use request-scoped auth outcomes to continue or stop the comment-post flow
- preserve selected-tab-dependent button copy and guest-comment validation without `CommentInput.svelte` reading `loginStateStore`
- teach `Login.svelte` to consume pending auth requests from `authService`
- keep test-writing passes separate from production implementation passes

Out of scope:

- removing logout relay behavior from `SelfDisplay.svelte`
- removing `dispatchableStore` from `Login.svelte` for logout handling
- removing `loginStateStore` selected-tab publication from `Login.svelte`
- removing legacy store definitions
- removing the temporary Slice 8 auth bridge
- changing backend/API contracts
- choosing the final direct-props versus thin auth-service-backed store architecture

## Slice Intent

This slice removes the login-before-comment relay from `CommentInput.svelte`. After the slice, unauthenticated comment submission should request auth through the injected `authService`, `Login.svelte` should consume that pending request through the same service, and `CommentInput.svelte` should continue posting only after the matching auth request succeeds. The old `dispatchableStore` / `loginStateStore` login relay should no longer be part of `CommentInput.svelte`.

## Atomic Checklist Items

- [x] T01 `[tests]` Add fail-first frontend unit tests proving pending auth requests produce request-scoped success and remote-error outcomes from `auth-service` auth commands.
  - Depends on: none.
  - Required coverage:
    - a pending `requestAuth(...)` followed by successful `login(...)` publishes an `authOutcome` success with the matching request id and authenticated user.
    - a pending `requestAuth(...)` followed by failed `login(...)` publishes an `authOutcome` remote error with the matching request id and returns `authRequest` to idle.
    - pending request success and remote-error outcome behavior is covered for `signup(...)`.
    - pending request success and remote-error outcome behavior is covered for `loginGuest(...)`.
    - command behavior without a pending auth request preserves existing session/current-user behavior.
  - Trace:
    - "Ensure successful `login()`, `signup()`, and `loginGuest()` commands publish a matching `authOutcome` success when there is a pending auth request." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Ensure failed remote auth commands publish a matching `authOutcome` remote error when there is a pending auth request." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Pass: `auth-service` tests prove pending auth requests produce success and remote-error outcomes from auth commands." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Validation Strategy)

- [x] C01 `[frontend]` Implement request-scoped auth outcome publication in `src/lib/auth-service.ts` while preserving existing auth command behavior.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "Preserve the existing public `AuthService` surface." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Ensure completed or failed pending auth requests return `authRequest` to idle." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Preserve existing session state, current-user publication, and persistence behavior." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)

- [x] T02 `[tests]` Add fail-first `Login.svelte` component tests for pending `authService.authRequest` consumption and local validation failure reporting.
  - Depends on: C01.
  - Required coverage:
    - a pending auth request triggers the currently selected auth form path without requiring `dispatchableStore.dispatch("loginIntent")`.
    - a pending auth request with invalid local form data calls `authService.reportLocalValidationError(...)` with the pending request id.
    - existing direct form-submit behavior remains intact.
  - Trace:
    - "Subscribe to `authService.authRequest`." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "When a pending request is observed, submit the currently selected auth form through the existing local submit functions." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Pass: `Login.svelte` component tests prove pending auth requests trigger the selected auth form path and local validation failures are reported through `authService`." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Validation Strategy)

- [x] C02 `[frontend]` Implement `Login.svelte` consumption of pending `authService.authRequest` values without removing existing logout relay behavior.
  - Depends on: T02.
  - Validated by: T02.
  - Trace:
    - "Keep existing direct form-submit behavior intact for user-triggered form submission." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Keep `dispatchableStore` logout handling intact for Slice 10." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Do not move field state or validation out of `Login.svelte`." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)

- [x] T03 `[tests]` Add fail-first `CommentInput.svelte` component tests for auth-service request/outcome flow and selected-tab behavior without legacy login stores.
  - Depends on: C02.
  - Required coverage:
    - unauthenticated submit calls `authService.requestAuth(...)` instead of dispatching `loginIntent`.
    - a matching success `authOutcome` continues the existing comment-post flow and calls `postComment(...)`.
    - a matching failed or cancelled `authOutcome` leaves the comment form out of the processing login state.
    - selected-tab-dependent button copy and guest-comment validation continue without `CommentInput.svelte` subscribing to `loginStateStore`.
    - source guard proves `CommentInput.svelte` does not import `dispatchableStore` or `loginStateStore`.
  - Trace:
    - "Remove `dispatchableStore` import and `loginIntent` dispatch." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Remove `loginStateStore` import and subscription." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Pass: `CommentInput.svelte` component tests prove unauthenticated submission calls `authService.requestAuth(...)`, matching success continues posting, selected-tab behavior remains available, and legacy login stores are not used." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Validation Strategy)

- [x] C03 `[frontend]` Refactor `src/components/CommentInput.svelte` to use injected `authService` request/outcome flow and direct `Login.svelte` selected-tab binding instead of legacy login relay stores.
  - Depends on: T03.
  - Validated by: T03 and `yarn typecheck`.
  - Trace:
    - "Track the pending auth request id returned by `authService.requestAuth(...)`." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Observe `authService.authOutcome`." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)
    - "Bind selected-tab UI state directly with `Login.svelte` so button copy and guest-comment validation keep working without `loginStateStore`." (`docs/plans/Priority5AuthServiceSlice9Plan.md`, Detailed File Impact)

## Behavior Slices

### Slice 9A

Goal: make auth-service request outcomes reliable enough for comment-submit auth flow.

Items: T01, C01

Type: behavior

### Slice 9B

Goal: let `Login.svelte` consume widget-scoped pending auth requests without the login relay event.

Items: T02, C02

Type: behavior

### Slice 9C

Goal: remove `CommentInput.svelte` dependency on legacy login relay stores while preserving comment-submit UX.

Items: T03, C03

Type: behavior

## Conformance QC (Checklist)

- Missing from plan: none.
- Extra beyond plan: none; each item maps to the plan's file impacts, approach, and validation strategy.
- Atomicity fixes needed: none; each test item and implementation item can be checked and committed independently.
- Validation mapping gaps: none; each implementation item is validated by a preceding fail-first test item, plus typecheck where component typing changes.
- Pass/Fail: checklist achieves plan goals — **Pass**.
