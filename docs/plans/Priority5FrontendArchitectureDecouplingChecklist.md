# Priority 5 Frontend Architecture Decoupling Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source backlog: `docs/RepoHealthImprovementBacklog.md` (Priority 5: Frontend Architecture Decoupling; non-executable).

Planning prerequisite: this draft refines the existing proposal only. A formal plan satisfying `docs/norms/plan.md`, with approved intent, scope, acceptance criteria, and validation strategy, must precede checklist approval. This documentation revision does not authorize runtime implementation.

## Scope Lock (from Source Plan)

In scope:

- reduce component-bound behavior coupling where the repo already flags it as a concern
- clarify boundaries between view components, state machines, and auth/workflow logic

Success signals to satisfy:

- auth and identity flows are less dependent on component presence
- UI modules are easier to test at the right boundary
- future frontend upgrades require less behavioral archaeology
- login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns

Out of scope:

- changing backend/API contracts
- introducing auth feature behavior changes beyond boundary ownership refactor
- unrelated frontend architecture rewrites outside login/auth surfaces

## Acceptance Criteria and Behavior Preservation

1. Verification and session publication work with only the auth runtime mounted. Mounting, hiding, or destroying a login form never starts or stops authentication, clears identity, or repeats verification.
2. Existing `simple_comment_user` values remain raw user JSON, including guest challenge data; no wrapper migration is introduced. Existing login-tab values remain numeric strings: guest `"0"`, login `"1"`, signup `"2"`. Missing or invalid tabs default to guest. Malformed session JSON falls back to no cached session without crashing.
3. Cached identity is prefill/recovery data, not proof of an authenticated cookie. Preserve the existing explicit `currentUser` initialization path; verify through the existing API when no current user is supplied.
4. Preserve registered login, signup followed by login and verification, guest credential recovery with new-guest fallback, changed guest name/email updates, logout, and the existing friendly error messages. Ordinary logout clears active identity but retains the cached profile and selected tab as today; exporting a full-clear helper does not authorize invoking it on logout.
5. Existing field validation, password confirmation, tab selection, field prefill, signup handle suggestions/availability checks, and comment-button behavior remain available. Passwords and password confirmation never enter persistent storage or published snapshots.
6. Submitting a comment while unauthenticated uses the submitting form's explicit credentials or guest/signup payload. Successful authentication resumes that submission once; an auth failure never posts a comment. Logout works without any login form mounted.
7. Each mounted `SimpleComment` root owns one controller, shared by its runtime, login forms, comment inputs, and self display through Svelte context. Additional reply forms do not create controllers or duplicate requests. No module-global controller is introduced. Separate roots do not share mutable in-memory form state.
8. Runtime destruction unsubscribes and stops its interpreter exactly once. Late async completions cannot publish identity or transition a destroyed controller. Subscribing/unsubscribing a view has no session side effects.

## Validation Strategy

- Unit evidence: storage compatibility fixtures (raw user with guest challenge; numeric tabs; missing/malformed values), workflow API call order and errors, and controller commands/transitions. Verify repeated init shares one initialization, commands do not duplicate active effects, and destruction ignores late completions.
- Integration evidence: runtime-only startup verifies and publishes identity; mounting/unmounting/remounting a login form does not repeat verification or change identity. Two reply forms share the root controller and submit only the initiating form's payload. A separate root has its own controller. Runtime-only logout clears active identity.
- Parity/smoke evidence: registered login, signup, recovered guest, new guest, guest profile changes, logout, and bad credentials; successful comment continuation happens once and failed auth posts nothing. Retained profile/tab and existing UI messages/validation must match the baseline.
- Required checks: run repository frontend unit/component checks, typecheck, production build, and applicable auth/comment Cypress smoke commands from the current package scripts and CI guidance. Record exact commands, results, and any unavailable prerequisites; unavailable evidence is not a pass.
- Pass requires all applicable evidence above and no unapproved API, persistence, UI, or machine-transition changes. Baseline defects discovered during extraction must be documented separately rather than silently fixed.

## Atomic Checklist Items

### Reviewer-Requested Explicit Export Contracts (C01-C03)

To remove ambiguity, C01-C03 must include the following concrete exports:

- C01 `auth-storage.ts` exports:
  - `AUTH_STORAGE_KEYS`
  - `readStoredSession`, `writeStoredSession`
  - `readStoredLoginTab`, `writeStoredLoginTab`
  - `clearStoredAuthState`
- C02 `auth-workflows.ts` exports:
  - `verifySessionWorkflow`, `loginWorkflow`, `signupWorkflow`
  - `guestLoginWorkflow`, `logoutWorkflow`, `updateProfileWorkflow`
  - `toAuthWorkflowError`
- C03 `auth-controller.ts` exports:
  - `createAuthController`
  - returned controller contract includes `subscribe`, `getSnapshot`, `init`, `login`, `signup`, `guestLogin`, `logout`, `setTab`, `destroy` (with explicit payloads)

### C01-C03 File Contract Definitions (Quick Reference)

This section is a reviewer-facing summary so contracts are visible without scanning each checklist item body.

| Item | File | Required named exports |
| --- | --- | --- |
| C01 | `src/lib/auth/auth-storage.ts` | `AUTH_STORAGE_KEYS`, `readStoredSession`, `writeStoredSession`, `readStoredLoginTab`, `writeStoredLoginTab`, `clearStoredAuthState` |
| C02 | `src/lib/auth/auth-workflows.ts` | `verifySessionWorkflow`, `loginWorkflow`, `signupWorkflow`, `guestLoginWorkflow`, `logoutWorkflow`, `updateProfileWorkflow`, `toAuthWorkflowError` |
| C03 | `src/lib/auth/auth-controller.ts` | `createAuthController` (returns `AuthController` with `subscribe`, `getSnapshot`, `init`, `login`, `signup`, `guestLogin`, `logout`, `setTab`, `destroy`; explicit payloads) |

- [ ] C01 `[frontend]` Create `src/lib/auth/auth-storage.ts` to centralize `localStorage` reads/writes for login/session persistence keys currently embedded in `Login.svelte`.
  - Depends on: none.
  - Contract + exports:
    - `AUTH_STORAGE_KEYS`: readonly key map for `"simple_comment_user"` and `"simple_comment_login_tab"`.
    - `type StoredAuthSession = AdminSafeUser` (import the existing type from `simple-comment-types.ts`; raw stored user, no wrapper).
    - `type StoredLoginTab = LoginTab` (reuse the existing enum).
    - `readStoredSession(): StoredAuthSession | null` (never throws on malformed JSON; returns `null` fallback).
    - `writeStoredSession(session: StoredAuthSession | null): void`.
    - `readStoredLoginTab(): StoredLoginTab` (accept only the three existing numeric values; default to `LoginTab.guest`).
    - `writeStoredLoginTab(tab: StoredLoginTab): void`.
    - `clearStoredAuthState(): void` (removes both keys; not used by ordinary logout).
    - Preserve raw user JSON and numeric-string tab encoding. Reads validate the stored shape; storage access failures use safe in-memory fallback rather than preventing auth.
  - Validation: T01 storage fixtures and T03 persistence parity.
  - Trace:
    - "it reads from and writes to `localStorage`" (Priority 5)
    - "That component currently does more than render login UI" (Priority 5)

- [ ] C02 `[frontend]` Create `src/lib/auth/auth-workflows.ts` to orchestrate auth workflows by composing existing `src/apiClient.ts` functions (no duplicated transport/client logic) and normalizing workflow-level error/result handling currently mixed in component handlers.
  - Depends on: C01.
  - Contract + exports:
    - `type AuthWorkflowResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: number }`.
    - Export aliases using existing types: `VerifiedUser = AdminSafeUser`, `SignupPayload = NewUser`, `GuestLoginInput = { name: string; email: string }`, `UpdateUserPayload = User`, `UpdatedUser = AdminSafeUser`, `LoginPayload = { authenticated: true }`.
    - `verifySessionWorkflow(): Promise<AuthWorkflowResult<VerifiedUser>>`.
    - `loginWorkflow(credentials: { username: string; password: string }): Promise<AuthWorkflowResult<LoginPayload>>`.
    - `signupWorkflow(input: SignupPayload): Promise<AuthWorkflowResult<AdminSafeUser>>`.
    - `guestLoginWorkflow(input: GuestLoginInput): Promise<AuthWorkflowResult<LoginPayload>>`.
    - `logoutWorkflow(): Promise<AuthWorkflowResult<{ loggedOut: true }>>`.
    - `updateProfileWorkflow(input: UpdateUserPayload): Promise<AuthWorkflowResult<UpdatedUser>>`.
    - `toAuthWorkflowError(error: unknown): { error: string; code?: number }` (shared normalization helper).
    - Login/signup/guest success reports workflow completion; the controller then follows the existing machine path to verification before publishing identity. Guest recovery reads the stored id/challenge, tries existing credentials, falls back to token plus guest creation, and preserves changed profile updates. Keep existing friendly error mapping; preserve status codes for 401 first-visit handling.
  - Validation: T01 workflow API composition/error cases and T03 flow parity.
    - All workflow functions must call `src/apiClient.ts` exports rather than implementing transport logic directly.
  - Trace:
    - "it performs auth-related API calls such as verify, login, signup, guest creation, profile reads, profile updates, and logout" (Priority 5)

- [ ] C03 `[frontend]` Create `src/lib/auth/auth-controller.ts` that centralizes (does not remove) `loginMachine` orchestration and transition/effect execution outside `Login.svelte`; keep `src/lib/login.xstate.ts` as the state-machine source of truth and expose typed commands (`init`, `login`, `signup`, `guestLogin`, `logout`, `setTab`) plus subscription API.
  - Depends on: C02.
  - Contract + exports:
    - `type AuthControllerSnapshot = { state: LoginMachineState; context: LoginMachineContext; currentUser?: AdminSafeUser; nextEvents: string[]; uiTab: StoredLoginTab; message?: string; error?: string }`.
    - `type AuthController = {`
      - `subscribe(run: (snapshot: AuthControllerSnapshot) => void): () => void`
      - `getSnapshot(): AuthControllerSnapshot`
      - `init(currentUser?: AdminSafeUser): Promise<void>`
      - `login(input: { username: string; password: string }): Promise<void>`
      - `signup(input: SignupPayload): Promise<void>`
      - `guestLogin(input: GuestLoginInput): Promise<void>`
      - `logout(): Promise<void>`
      - `setTab(tab: StoredLoginTab): void`
      - No payload-free login intent: consumers call `login`, `signup`, or `guestLogin` with the initiating form payload.
      - `destroy(): void`
      - `}`
    - `createAuthController(deps?: AuthControllerDeps): AuthController` as the module factory export.
    - Export `LoginMachineState` and `LoginMachineContext` from `src/lib/login.xstate.ts`; include the existing `guestLoggingIn` state in the state union. Preserve transition semantics.
    - Define/export `AuthControllerDeps` as injectable workflow functions and storage adapter matching C01/C02 signatures; factory defaults use production adapters. No view or DOM dependency.
    - `createAuthController` owns machine interpreter lifecycle but does not redefine `loginMachine`. `init` is idempotent; async commands settle after their resulting workflow/verification reaches a stable state, with failure in the snapshot. `subscribe` immediately emits the current snapshot. Busy duplicate commands do not repeat API effects. `destroy` is idempotent and invalidates pending completions.
  - Validation: T01 lifecycle/effect tests and T02 runtime isolation.
  - Trace:
    - "it drives the `loginMachine` state machine" (Priority 5)
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)

- [ ] C04 `[frontend]` Add `src/lib/auth/auth-stores.ts` and migrate login/session shared-state publication out of `Login.svelte` reactive blocks into controller-owned store updates.
  - Depends on: C03.
  - Completion criterion: Expose a read-only per-root snapshot store from the context-provided controller; consumers cannot overwrite auth state. Migrate the named auth consumers together through the dependency order. Legacy auth stores may be temporary compatibility adapters with the controller as sole writer, never a second interpreter. Remove auth relay writes/subscriptions once migrated; unrelated dispatch events remain out of scope. Validation: T02 shared-controller integration and T03 consumer parity.
  - Trace:
    - "it subscribes to and updates shared Svelte stores such as `currentUserStore`, `dispatchableStore`, and `loginStateStore`" (Priority 5)

- [ ] C05 `[frontend]` Refactor `src/components/Login.svelte` into render-focused container + child form components (`src/components/auth/LoginForm.svelte`, `SignupForm.svelte`, `GuestForm.svelte`) that emit intent payloads to the controller.
  - Depends on: C03, C04.
  - Completion criterion: Keep field values, validation helpers, debounce, and password confirmation in presentation/form code. Forms emit typed command payloads; no session persistence, machine interpreter, or auth workflow effects remain in Login.svelte. Availability lookup may stay in form validation and must not become session ownership. Validation: T02 mount/remount and T03 UI parity.
  - Trace:
    - "That component currently does more than render login UI" (Priority 5)
    - inline TODO: login functionality should move away from `Login.svelte`

- [ ] C06 `[frontend]` Add non-visual `src/components/auth/AuthRuntime.svelte` and mount it from `src/components/SimpleComment.svelte` so auth verification/session lifecycle runs independently of `Login.svelte` visibility.
  - Depends on: C03, C04.
  - Completion criterion: SimpleComment creates and provides the controller synchronously through Svelte context; AuthRuntime invokes init on mount and destroy on root teardown. Login/forms subscribe only. Pass the existing currentUser initialization value explicitly. Validation: T02 runtime-only, multiple-form, separate-root, and teardown cases.
  - Trace:
    - "auth/session behavior is coupled to component presence and lifecycle" (Priority 5)
    - success target: "auth and identity flows are less dependent on component presence" (Priority 5)

- [ ] C07 `[frontend]` Update `src/components/CommentInput.svelte` to consume the controller/store interface instead of relay login events (`loginIntent`) and ad-hoc cross-machine synchronization.
  - Depends on: C04, C06.
  - Completion criterion: Pass the active form payload explicitly to the controller and await its stable outcome before advancing commentPostMachine. Preserve local draft/cancel behavior; remove timer-based auth relay synchronization. Validation: T02 initiating-form isolation and T03 exactly-once posting/error cases.
  - Trace:
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)
    - success target: "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (Priority 5)

- [ ] C08 `[frontend]` Update `src/components/SelfDisplay.svelte` to consume the controller/store interface instead of relay logout events (`logoutIntent`) and direct dependency on legacy login-state relay semantics.
  - Depends on: C04, C06.
  - Completion criterion: Read current user, processing state, and allowed commands from the same root snapshot; call controller.logout directly. Release view subscriptions on teardown. Validation: T02 logout without Login and T03 display/logout parity.
  - Trace:
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)
    - success target: "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (Priority 5)

- [ ] T01 `[validation]` Add unit tests for `auth-controller` transition/effect mapping (verify/login/signup/guest/logout/error) with mocked `auth-workflows` and `auth-storage`.
  - Depends on: C01, C02, C03.
  - Required evidence: storage fixtures, workflow composition, and controller lifecycle/effect cases in Validation Strategy; mocked transports alone do not prove workflow ordering.
  - Trace:
    - success target: "UI modules are easier to test at the right boundary" (Priority 5)

- [ ] T02 `[validation]` Add integration tests proving auth lifecycle works when `Login.svelte` is not mounted at startup (runtime mounted only), while interactive login still works once `Login.svelte` is rendered.
  - Depends on: C05, C06, C07, C08.
  - Required evidence: every integration scenario in Validation Strategy, including shared forms, isolated roots, teardown, and runtime-only logout.
  - Trace:
    - success target: "auth and identity flows are less dependent on component presence" (Priority 5)

- [ ] T03 `[validation]` Run focused frontend validation and auth smoke coverage (login/signup/guest/logout happy-path + one error-path), then record parity notes against current behavior.
  - Depends on: C07, C08, T01, T02.
  - Trace:
    - risk note: "it carries a higher risk of accidental behavioral drift than earlier priorities" (Priority 5)

## Behavior Slices

### Slice A

- Goal: extract non-UI auth persistence and API side effects from `Login.svelte`.
- Items: C01, C02.
- Type: mechanical.

### Slice B

- Goal: move auth workflow ownership from component lifecycle to controller/runtime.
- Items: C03, C04, C06.
- Type: behavior.

### Slice C

- Goal: reduce `Login.svelte` to presentation + intent dispatch.
- Items: C05.
- Type: behavior.

### Slice D

- Goal: decouple consumer components from relay-event coupling with incremental, lower-risk migration.
- Items: C07, C08.
- Type: behavior.

### Slice E

- Goal: validate decoupling boundaries and behavior parity.
- Items: T01, T02, T03.
- Type: behavior.

## Conformance QC (Checklist Norms)

Missing from plan:

- Formal approved source plan is missing. The backlog is explicitly non-executable; this revision records proposed criteria for plan refinement, not plan approval.

Extra beyond plan:

- none; items are restricted to login/auth decoupling surfaces.

Atomicity fixes needed:

- resolved by splitting prior combined consumer migration into C07 (`CommentInput`) and C08 (`SelfDisplay`) so each item is independently committable.

Validation mapping gaps:

- C01-C03 map explicitly to T01; C04-C08 map to T02/T03. Evidence requirements are defined above; none has been executed in this documentation-only revision.

Pass/Fail: checklist achieves plan goals:

- Fail for implementation readiness: first complete formal plan refinement/approval under `docs/norms/plan.md`, reconcile this draft against that plan, and then obtain checklist approval. The previous draft-readiness claim did not establish this prerequisite.
