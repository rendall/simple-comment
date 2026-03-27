# Priority 5 Frontend Architecture Decoupling Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source plan: `docs/RepoHealthImprovementBacklog.md` (Priority 5: Frontend Architecture Decoupling)

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

## Atomic Checklist Items

- [ ] C01 `[frontend]` Create `src/lib/auth/auth-storage.ts` to centralize `localStorage` reads/writes for login/session persistence keys currently embedded in `Login.svelte`.
  - Depends on: none.
  - Trace:
    - "it reads from and writes to `localStorage`" (Priority 5)
    - "That component currently does more than render login UI" (Priority 5)

- [ ] C02 `[frontend]` Create `src/lib/auth/auth-workflows.ts` to orchestrate auth workflows by composing existing `src/apiClient.ts` functions (no duplicated transport/client logic) and normalizing workflow-level error/result handling currently mixed in component handlers.
  - Depends on: C01.
  - Trace:
    - "it performs auth-related API calls such as verify, login, signup, guest creation, profile reads, profile updates, and logout" (Priority 5)

- [ ] C03 `[frontend]` Create `src/lib/auth/auth-controller.ts` that centralizes (does not remove) `loginMachine` orchestration and transition/effect execution outside `Login.svelte`; keep `src/lib/login.xstate.ts` as the state-machine source of truth and expose typed commands (`init`, `login`, `signup`, `guestLogin`, `logout`, `setTab`) plus subscription API.
  - Depends on: C02.
  - Trace:
    - "it drives the `loginMachine` state machine" (Priority 5)
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)

- [ ] C04 `[frontend]` Add `src/lib/auth/auth-stores.ts` and migrate login/session shared-state publication out of `Login.svelte` reactive blocks into controller-owned store updates.
  - Depends on: C03.
  - Trace:
    - "it subscribes to and updates shared Svelte stores such as `currentUserStore`, `dispatchableStore`, and `loginStateStore`" (Priority 5)

- [ ] C05 `[frontend]` Refactor `src/components/Login.svelte` into render-focused container + child form components (`src/components/auth/LoginForm.svelte`, `SignupForm.svelte`, `GuestForm.svelte`) that emit intent payloads to the controller.
  - Depends on: C03, C04.
  - Trace:
    - "That component currently does more than render login UI" (Priority 5)
    - inline TODO: login functionality should move away from `Login.svelte`

- [ ] C06 `[frontend]` Add non-visual `src/components/auth/AuthRuntime.svelte` and mount it from `src/components/SimpleComment.svelte` so auth verification/session lifecycle runs independently of `Login.svelte` visibility.
  - Depends on: C03, C04.
  - Trace:
    - "auth/session behavior is coupled to component presence and lifecycle" (Priority 5)
    - success target: "auth and identity flows are less dependent on component presence" (Priority 5)

- [ ] C07 `[frontend]` Update `src/components/CommentInput.svelte` to consume the controller/store interface instead of relay login events (`loginIntent`) and ad-hoc cross-machine synchronization.
  - Depends on: C04, C06.
  - Trace:
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)
    - success target: "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (Priority 5)

- [ ] C08 `[frontend]` Update `src/components/SelfDisplay.svelte` to consume the controller/store interface instead of relay logout events (`logoutIntent`) and direct dependency on legacy login-state relay semantics.
  - Depends on: C04, C06.
  - Trace:
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)
    - success target: "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (Priority 5)

- [ ] T01 `[validation]` Add unit tests for `auth-controller` transition/effect mapping (verify/login/signup/guest/logout/error) with mocked `auth-workflows` and `auth-storage`.
  - Depends on: C03.
  - Trace:
    - success target: "UI modules are easier to test at the right boundary" (Priority 5)

- [ ] T02 `[validation]` Add integration tests proving auth lifecycle works when `Login.svelte` is not mounted at startup (runtime mounted only), while interactive login still works once `Login.svelte` is rendered.
  - Depends on: C05, C06.
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

- none identified for current Priority 5 scope.

Extra beyond plan:

- none; items are restricted to login/auth decoupling surfaces.

Atomicity fixes needed:

- resolved by splitting prior combined consumer migration into C07 (`CommentInput`) and C08 (`SelfDisplay`) so each item is independently committable.

Validation mapping gaps:

- none identified; each C-item is validated by direct dependency on T-items or behavior-parity evidence.

Pass/Fail: checklist achieves plan goals:

- Pass (for draft readiness; execution remains blocked until explicit checklist approval).
