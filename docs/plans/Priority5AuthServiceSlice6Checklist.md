# Priority 5 Auth Service Slice 6 Checklist

Status: approved

Classification: approved implementation checklist

Source plan: `docs/plans/Priority5AuthServiceSlice6Plan.md`

Parent plan: `docs/plans/Priority5Completion.md` (Item 6: Draft a slice for moving session/localStorage persistence out of `Login.svelte`)

## Scope Lock

In scope:

- move `simple_comment_user` session/guest persistence ownership out of `Login.svelte`
- create a small auth persistence boundary, such as `src/lib/auth-persistence.ts`, for `simple_comment_user` reads/writes
- expose explicit persistence operations for stored auth user data:
  - `loadStoredUser`
  - `saveStoredUser`
  - `clearStoredUser`
  - `loadStoredGuestIdentity`
- make the persistence boundary tolerate missing storage, malformed JSON, and incomplete stored data without throwing during normal auth flows
- let `auth-service` use an injectable persistence dependency so tests and non-browser clients can provide their own storage behavior
- have `auth-service` save verified/authenticated users and clear stored session data on confirmed logout or unauthenticated initial verification
- have `auth-service.loginGuest()` use stored guest identity from the persistence dependency when the caller does not pass `storedGuest` explicitly
- have explicit `storedGuest` command input take precedence over persisted guest identity
- replace `Login.svelte` direct `simple_comment_user` `localStorage` reads/writes with the shared persistence boundary while preserving existing form hydration behavior
- stop `Login.svelte` from saving authenticated users or reading stored guest identity for command submission
- validate persistence behavior with fail-first tests before implementation

Out of scope:

- moving `simple_comment_login_tab` persistence out of `Login.svelte`
- changing login tab selection behavior or selected-tab UI persistence semantics
- treating `localStorage` as authoritative authentication state; server verification remains the source of truth for session validity
- adding a broad auth controller, runtime component, workflow module, or event bus
- changing backend/API contracts
- changing `src/apiClient.ts` HTTP transport behavior
- rewiring `Login.svelte` to call `auth-service` commands; Slice 7 already completed that work
- replacing `currentUserStore`, `loginStateStore`, or `dispatchableStore`
- modifying `CommentInput.svelte` or `SelfDisplay.svelte`
- editing tests during an implementation pass; if fail-first tests cannot be made green through production-code changes only, stop and discuss

## Slice Intent

This slice resolves the Item 6 conditional in favor of moving session and guest persistence ownership out of `Login.svelte`. Auth/session continuity should not depend on the `Login.svelte` component being mounted, especially for future auth checks or guest reuse flows that may be initiated by `CommentInput.svelte`, `SelfDisplay.svelte`, or another auth-aware surface.

The safe version is intentionally small: introduce a persistence adapter for `simple_comment_user`, then let `auth-service` depend on that adapter rather than `Login.svelte` reading browser storage for session/guest command behavior. This keeps raw `localStorage` isolated, keeps auth-service testable, and avoids reintroducing the broad frontend architecture churn that Priority 5 has been trying to avoid.

After Slice 7, `Login.svelte` already delegates auth commands to `auth-service`. This slice should not redo that wiring. It should remove the remaining `simple_comment_user` storage ownership from the component while preserving form hydration from stored user data through the shared boundary.

`simple_comment_login_tab` should stay in `Login.svelte` for this slice. It is a UI preference, not session/auth persistence, and moving it now would make the slice look cleaner while expanding its true responsibility.

## Atomic Checklist Items

- [x] T01 `[tests]` Add fail-first frontend unit tests for the auth persistence boundary in `src/tests/frontend/auth-persistence.test.ts`.
  - Depends on: none.
  - Required coverage:
    - missing `simple_comment_user` returns `undefined`
    - malformed `simple_comment_user` returns `undefined` without throwing
    - saved users round-trip through `saveStoredUser` and `loadStoredUser`
    - `clearStoredUser` removes the stored user
    - `loadStoredGuestIdentity` returns only the reusable guest identity fields needed by `auth-service.loginGuest()`
  - Trace:
    - "Add a small `simple_comment_user` persistence boundary, expected as `src/lib/auth-persistence.ts`." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "The persistence boundary safely handles missing storage, malformed JSON, incomplete stored data, and non-browser environments." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, Acceptance Criteria)
    - "Pass: tests prove missing/malformed/incomplete stored data is handled safely and valid stored users/guest identity load as expected." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, Validation Strategy)

- [x] C01 `[frontend]` Implement `src/lib/auth-persistence.ts` as a small `simple_comment_user` persistence boundary with typed exports for `loadStoredUser`, `saveStoredUser`, `clearStoredUser`, and `loadStoredGuestIdentity`.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "Expose explicit operations for stored auth user data" (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "Make the persistence boundary tolerate missing storage, malformed JSON, incomplete stored data, and non-browser environments without throwing during normal auth flows." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "`src/lib/auth-persistence.ts` exposes typed persistence operations for `simple_comment_user`." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, Acceptance Criteria)

- [x] T02 `[tests]` Add fail-first frontend tests for `auth-service` persistence integration using an injected persistence dependency rather than browser `localStorage`.
  - Depends on: C01.
  - Required coverage:
    - successful `init()`, `login()`, `signup()`, and `loginGuest()` save the verified authenticated user
    - unauthenticated initial verification clears stored user data
    - successful `logout()` clears stored user data
    - failed auth commands do not save a new stored user
    - `loginGuest()` uses persisted guest identity when `storedGuest` is omitted
    - explicit `storedGuest` command input takes precedence over persisted guest identity
  - Trace:
    - "Let `auth-service` receive an injectable persistence dependency so tests and non-browser clients can provide their own storage behavior." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "Make `auth-service.loginGuest()` use persisted guest identity when command input does not include `storedGuest`." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "Pass: tests with an injected fake persistence dependency prove save, clear, failed-command, persisted-guest, and explicit-guest precedence behavior." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, Validation Strategy)

- [x] C02 `[frontend]` Integrate the auth persistence boundary into `src/lib/auth-service.ts` through an injectable persistence dependency, preserving server verification as the source of truth while saving, clearing, and reading stored guest identity through the adapter.
  - Depends on: T02.
  - Validated by: T02.
  - Trace:
    - "Make `auth-service` save verified/authenticated users after successful `init()`, `login()`, `signup()`, and `loginGuest()` flows." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "Make `auth-service` clear stored session data on unauthenticated initial verification and confirmed logout." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "`auth-service` accepts an injectable persistence dependency." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, Acceptance Criteria)

- [x] T03 `[tests]` Update the `Login.svelte` component-boundary guest submission test so stored guest identity is not passed from the component to `authService.loginGuest()`; persisted guest reuse is covered at the `auth-service` boundary instead.
  - Depends on: C02.
  - Trace:
    - "Make `auth-service.loginGuest()` use persisted guest identity when command input does not include `storedGuest`." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "Preserve `Login.svelte` form hydration from stored user data without letting the component own session saving, clearing, or guest reuse." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "Fail: `auth-service` requires browser `localStorage` or guest reuse still depends on `Login.svelte`." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, Validation Strategy)

- [x] C03 `[frontend]` Remove `src/components/Login.svelte` direct `simple_comment_user` `localStorage` access by using the shared auth persistence boundary only for stored-user form hydration, leaving session save/clear and stored-guest command reuse owned by `auth-service`.
  - Depends on: T03.
  - Validated by: `yarn typecheck` and existing `src/tests/frontend/components/Login.auth-service.test.ts`.
  - Trace:
    - "Replace `Login.svelte` direct `simple_comment_user` `localStorage` access with the shared persistence boundary." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "Preserve `Login.svelte` form hydration from stored user data without letting the component own session saving, clearing, or guest reuse." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, In Scope)
    - "`Login.svelte` no longer directly calls `localStorage` for `simple_comment_user`." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, Acceptance Criteria)
    - "`Login.svelte` still preserves form hydration from stored user data and still owns `simple_comment_login_tab` UI preference persistence." (`docs/plans/Priority5AuthServiceSlice6Plan.md`, Acceptance Criteria)

## Behavior Slices

### Slice 6A

Goal: define and implement the small persistence adapter without touching auth command behavior.

Items: T01, C01

Type: behavior

### Slice 6B

Goal: let `auth-service` own session persistence through an injected adapter while preserving server verification as the source of truth.

Items: T02, C02

Type: behavior

### Slice 6C

Goal: remove direct `simple_comment_user` storage access from `Login.svelte` without moving UI preference persistence, rewiring auth commands, or keeping guest reuse in the component.

Items: T03, C03

Type: mechanical
