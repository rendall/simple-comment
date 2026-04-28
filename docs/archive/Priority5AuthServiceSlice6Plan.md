# Priority 5 Auth Service Slice 6 Plan

Status: approved

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 5`)

Parent plan: `docs/plans/Priority5Completion.md` (Item 6)

Related artifacts:

- `docs/plans/Priority5AuthServiceSlice6Checklist.md`
- `docs/archive/Priority5AuthServiceSlice7Plan.md`

## Goal

Move `simple_comment_user` session and guest persistence out of `Login.svelte` and behind a small auth persistence boundary that `auth-service` can use directly.

## Intent

This slice is about making stored auth/session data belong to the auth layer, not the login form.

After Slice 7, `Login.svelte` delegates auth commands to `auth-service`, but it still reads and writes `simple_comment_user` itself. That means guest reuse and saved session data still depend on the login component being mounted and still require the component to know the raw browser storage format.

For this slice, success means:

- `auth-service` saves verified authenticated users after successful auth flows,
- `auth-service` clears stored session data when server verification says there is no valid session or when logout succeeds,
- `auth-service.loginGuest()` can reuse stored guest identity through an injected persistence dependency when the caller does not provide one,
- `Login.svelte` stops saving authenticated users and stops reading stored guest identity for command submission,
- `Login.svelte` may still read persisted user data through the shared boundary only to prefill local form fields.

In plain terms: the login form may remember what to show in its fields, but the auth service owns what counts as stored auth/session data.

## In Scope

- Add a small `simple_comment_user` persistence boundary, expected as `src/lib/auth-persistence.ts`.
- Expose explicit operations for stored auth user data:
  - `loadStoredUser`
  - `saveStoredUser`
  - `clearStoredUser`
  - `loadStoredGuestIdentity`
- Make the persistence boundary tolerate missing storage, malformed JSON, incomplete stored data, and non-browser environments without throwing during normal auth flows.
- Let `auth-service` receive an injectable persistence dependency so tests and non-browser clients can provide their own storage behavior.
- Make `auth-service` save verified/authenticated users after successful `init()`, `login()`, `signup()`, and `loginGuest()` flows.
- Make `auth-service` clear stored session data on unauthenticated initial verification and confirmed logout.
- Make `auth-service.loginGuest()` use persisted guest identity when command input does not include `storedGuest`.
- Make explicit `storedGuest` command input take precedence over persisted guest identity.
- Replace `Login.svelte` direct `simple_comment_user` `localStorage` access with the shared persistence boundary.
- Preserve `Login.svelte` form hydration from stored user data without letting the component own session saving, clearing, or guest reuse.

## Out of Scope

- Moving `simple_comment_login_tab` persistence out of `Login.svelte`.
- Changing login tab selection behavior or selected-tab UI persistence semantics.
- Treating local persistence as authoritative authentication state; server verification remains the source of truth for session validity.
- Rewiring `Login.svelte` auth commands to `auth-service`; Slice 7 already completed that work.
- Replacing `currentUserStore`, `loginStateStore`, or `dispatchableStore`.
- Removing login relay behavior from `CommentInput.svelte`.
- Removing logout relay behavior from `SelfDisplay.svelte`.
- Modifying `CommentInput.svelte` or `SelfDisplay.svelte`.
- Adding a broad auth controller, runtime component, workflow module, singleton service, or event bus.
- Changing backend/API contracts or `src/apiClient.ts` HTTP transport behavior.

## Constraints

- `auth-service` remains widget-scoped and injectable; do not introduce a singleton auth-service.
- Persistence is cache/form/guest-reuse support only, not proof of authentication.
- Keep the slice narrow and reversible; do not fold in Slice 8, 9, or 10 relay/store cleanup.
- Test and implementation passes remain separate per current team convention.

## Current State

At the start of this slice:

- `auth-service` owns auth command execution and the live auth runtime.
- `Login.svelte` receives an `AuthService` and delegates login, signup, guest login, logout, and init behavior to it.
- `Login.svelte` still directly reads `simple_comment_user` to hydrate form fields.
- `Login.svelte` still directly reads `simple_comment_user` to pass stored guest identity into `authService.loginGuest()`.
- `Login.svelte` still directly writes `simple_comment_user` when `authService.currentUser` changes.
- No shared auth persistence boundary exists.

## Approach

1. Add fail-first unit tests for the new persistence boundary.
2. Implement the persistence boundary as a small module that hides raw browser storage access and parsing.
3. Add fail-first unit tests for `auth-service` persistence integration using an injected persistence dependency.
4. Integrate persistence into `auth-service` so the service owns save/clear/guest-reuse behavior.
5. Update `Login.svelte` so it no longer reads/writes raw `simple_comment_user`; it may only use the shared boundary to hydrate local form fields.
6. Stop there. Do not remove relay stores, redesign auth-state distribution, or move UI preference persistence.

## Risks and Mitigations

- Risk: persisted user data becomes treated as logged-in truth.
  - Mitigation: `auth-service.init()` must still verify with the server; persistence only stores cache/form/guest-reuse data.

- Risk: moving persistence accidentally changes tab or form behavior.
  - Mitigation: keep `simple_comment_login_tab` and form-local validation/UI behavior in `Login.svelte`.

- Risk: `Login.svelte` keeps owning guest reuse by calling the new persistence boundary before `loginGuest()`.
  - Mitigation: require `auth-service.loginGuest()` to read persisted guest identity when command input omits `storedGuest`.

- Risk: tests become browser-storage-coupled and hard to run outside JSDOM.
  - Mitigation: inject persistence into `auth-service` and test service behavior with a fake dependency.

## Acceptance Criteria

1. `src/lib/auth-persistence.ts` exposes typed persistence operations for `simple_comment_user`.
2. The persistence boundary safely handles missing storage, malformed JSON, incomplete stored data, and non-browser environments.
3. `auth-service` accepts an injectable persistence dependency.
4. Successful `init()`, `login()`, `signup()`, and `loginGuest()` flows save the verified authenticated user.
5. Unauthenticated initial verification and successful logout clear stored user data.
6. Failed auth commands do not save a new stored user.
7. `authService.loginGuest()` uses persisted guest identity when command input omits `storedGuest`.
8. Explicit `storedGuest` command input takes precedence over persisted guest identity.
9. `Login.svelte` no longer directly calls `localStorage` for `simple_comment_user`.
10. `Login.svelte` still preserves form hydration from stored user data and still owns `simple_comment_login_tab` UI preference persistence.

## Validation Strategy

Required evidence types for Slice 6:

- **Unit evidence for persistence boundary**
  - Pass: tests prove missing/malformed/incomplete stored data is handled safely and valid stored users/guest identity load as expected.
  - Fail: malformed storage throws during normal auth flows or the boundary leaks raw storage assumptions to callers.

- **Unit evidence for auth-service integration**
  - Pass: tests with an injected fake persistence dependency prove save, clear, failed-command, persisted-guest, and explicit-guest precedence behavior.
  - Fail: `auth-service` requires browser `localStorage` or guest reuse still depends on `Login.svelte`.

- **Component/type evidence**
  - Pass: `Login.svelte` typechecks after raw `simple_comment_user` access is removed, and existing component delegation tests continue to pass.
  - Fail: `Login.svelte` keeps direct `simple_comment_user` localStorage reads/writes or loses existing form hydration behavior.

## Open Questions / Assumptions

- Assumption: `Login.svelte` may import the persistence boundary to load stored user data for form hydration only.
- Assumption: keeping `simple_comment_login_tab` in `Login.svelte` is still correct because it is UI preference state, not auth/session persistence.
- Assumption: preserving the explicit `storedGuest` command input remains useful for tests and non-browser clients even after service-side persistence is added.

## Scope Guard

The following work is explicitly deferred and must not be folded into Slice 6 without a separate approved plan/checklist update:

- Slice 8 shared-store publication replacement
- Slice 9 login relay removal from `CommentInput.svelte`
- Slice 10 logout relay removal from `SelfDisplay.svelte`
- Final project-wide auth-state distribution redesign
- Login form component splitting or visual redesign

## Conformance QC (Plan)

- Intent clarity issues: none observed; intent distinguishes auth/session persistence ownership from form-field hydration.
- Missing required sections: none (`Goal`, `Intent`, `In Scope`, `Out of Scope`, `Acceptance Criteria`, and `Validation Strategy` are present).
- Ambiguities/assumptions to resolve: none blocking implementation; the allowed `Login.svelte` form-hydration use of the persistence boundary is explicit.
- Validation strategy gaps: none for persistence-boundary, service-integration, and Login raw-storage-removal scope.
- Traceability readiness: ready; headings and acceptance criteria are stable and quoteable for checklist refinement.
- Pass/Fail: structurally ready for checklist execution after checklist reconciliation — **Pass**.
