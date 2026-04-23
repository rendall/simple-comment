# Priority 5 Auth Service Slice 6 Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source plan: `docs/plans/Priority5Completion.md` (Item 6: Draft a slice for moving session/localStorage persistence out of `Login.svelte`)

## Scope Lock

In scope:

- move `simple_comment_user` session/guest persistence out of `Login.svelte`
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
- replace `Login.svelte` direct `simple_comment_user` localStorage reads/writes with the shared persistence boundary while preserving existing form hydration and guest reuse behavior
- validate persistence behavior with fail-first tests before implementation

Out of scope:

- moving `simple_comment_login_tab` persistence out of `Login.svelte`
- changing login tab selection behavior or selected-tab UI persistence semantics
- treating `localStorage` as authoritative authentication state; server verification remains the source of truth for session validity
- adding a broad auth controller, runtime component, workflow module, or event bus
- changing backend/API contracts
- changing `src/apiClient.ts` HTTP transport behavior
- rewiring `Login.svelte` to call `auth-service` commands
- replacing `currentUserStore`, `loginStateStore`, or `dispatchableStore`
- modifying `CommentInput.svelte` or `SelfDisplay.svelte`
- editing tests during an implementation pass; if fail-first tests cannot be made green through production-code changes only, stop and discuss

## Slice Intent

This slice resolves the Item 6 conditional in favor of moving session and guest persistence out of `Login.svelte`. Auth/session continuity should not depend on the `Login.svelte` component being mounted, especially for future auth checks or guest reuse flows that may be initiated by `CommentInput.svelte`, `SelfDisplay.svelte`, or another auth-aware surface.

The safe version is intentionally small: introduce a persistence adapter for `simple_comment_user`, then let `auth-service` depend on that adapter rather than reading browser storage directly. This keeps raw `localStorage` isolated, keeps auth-service testable, and avoids reintroducing the broad frontend architecture churn that Priority 5 has been trying to avoid.

`simple_comment_login_tab` should stay in `Login.svelte` for this slice. It is a UI preference, not session/auth persistence, and moving it now would make the slice look cleaner while expanding its true responsibility.

## Atomic Checklist Items

- [ ] T01 `[tests]` Add fail-first frontend unit tests for the auth persistence boundary in `src/tests/frontend/auth-persistence.test.ts`.
  - Depends on: none.
  - Required coverage:
    - missing `simple_comment_user` returns `undefined`
    - malformed `simple_comment_user` returns `undefined` without throwing
    - saved users round-trip through `saveStoredUser` and `loadStoredUser`
    - `clearStoredUser` removes the stored user
    - `loadStoredGuestIdentity` returns only the reusable guest identity fields needed by `auth-service.loginGuest()`
  - Trace:
    - "Session/localStorage handling remains in `Login.svelte`: ... verified/current user state reads/writes `simple_comment_user`; guest login reads stored `simple_comment_user` to reuse guest credentials; mount logic hydrates form fields from stored user data." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "Draft a slice for moving session/localStorage persistence out of `Login.svelte` only if it blocks service ownership or component decoupling." (`docs/plans/Priority5Completion.md`, Item 6)

- [ ] C01 `[frontend]` Implement `src/lib/auth-persistence.ts` as a small `simple_comment_user` persistence boundary with typed exports for `loadStoredUser`, `saveStoredUser`, `clearStoredUser`, and `loadStoredGuestIdentity`.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "Session/localStorage handling remains in `Login.svelte`: ... verified/current user state reads/writes `simple_comment_user`; guest login reads stored `simple_comment_user` to reuse guest credentials; mount logic hydrates form fields from stored user data." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "avoid introducing another ad-hoc event bus" (`docs/plans/Priority5Completion.md`, Item 12)

- [ ] T02 `[tests]` Add fail-first frontend tests for `auth-service` persistence integration using an injected persistence dependency rather than browser `localStorage`.
  - Depends on: C01.
  - Required coverage:
    - successful `init()`, `login()`, `signup()`, and `loginGuest()` save the verified authenticated user
    - unauthenticated initial verification clears stored user data
    - successful `logout()` clears stored user data
    - failed auth commands do not save a new stored user
    - `loginGuest()` uses persisted guest identity when `storedGuest` is omitted
    - explicit `storedGuest` command input takes precedence over persisted guest identity
  - Trace:
    - "`authService.init()` calls `verifySelf()`, maps success / `401` / non-`401` outcomes onto the live login machine, and publishes `currentUser` from the service." (`docs/plans/Priority5Completion.md`, Item 1 findings)
    - "`authService.login()` calls `postAuth()`, verifies the resulting session with `verifySelf()`, maps success/error onto the live login machine, and publishes authenticated `currentUser` from the service." (`docs/plans/Priority5Completion.md`, Item 1 findings)
    - "guest login flow reads stored guest credentials..." (`docs/plans/Priority5Completion.md`, Item 3 findings)

- [ ] C02 `[frontend]` Integrate the auth persistence boundary into `src/lib/auth-service.ts` through an injectable persistence dependency, preserving server verification as the source of truth while saving, clearing, and reading stored guest identity through the adapter.
  - Depends on: T02.
  - Validated by: T02.
  - Trace:
    - "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (`docs/RepoHealthImprovementBacklog.md`, Priority 5)
    - "Prefer direct `auth-service` API or a thin service-backed store; avoid introducing another ad-hoc event bus." (`docs/plans/Priority5Completion.md`, Item 12)

- [ ] C03 `[frontend]` Replace direct `simple_comment_user` `localStorage` access in `src/components/Login.svelte` with the shared auth persistence boundary, while leaving `simple_comment_login_tab` persistence and all form-local validation/UI behavior in `Login.svelte`.
  - Depends on: C01.
  - Validated by: `yarn typecheck`.
  - Trace:
    - "Session/localStorage handling remains in `Login.svelte`: login tab selection reads/writes `simple_comment_login_tab`; verified/current user state reads/writes `simple_comment_user`; guest login reads stored `simple_comment_user` to reuse guest credentials; mount logic hydrates form fields from stored user data." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "Keep explicitly out of scope: splitting `Login.svelte` into form components, adding `auth-controller.ts`, adding `AuthRuntime.svelte`, creating broad auth workflow modules, or redesigning frontend state architecture." (`docs/plans/Priority5Completion.md`, Item 14)

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

Goal: remove direct `simple_comment_user` storage access from `Login.svelte` without moving UI preference persistence or rewiring auth commands.

Items: C03

Type: mechanical
