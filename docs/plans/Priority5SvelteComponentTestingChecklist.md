# Priority 5 Svelte Component Testing Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source plan: `docs/plans/Priority5SvelteComponentTestingPlan.md`

## Scope Lock

In scope:

- add a dedicated frontend component-test lane for `.svelte` components using Vitest
- use `@testing-library/svelte` for DOM-oriented component tests
- keep the current Jest frontend suite in place for existing non-component tests
- add the minimal setup needed for component tests to run reliably in this repo: Vite-aligned Svelte compilation, DOM test environment, shared setup/cleanup, and frontend scripts that compose Jest plus component tests into one required validation path
- prove the harness with a narrow smoke-level `Login.svelte` component test that renders the component and checks stable, user-visible basics such as the login/signup/guest tabs
- preserve CI/local parity if the required frontend validation path changes

Out of scope:

- rewriting the existing frontend Jest suite to Vitest
- teaching the current Jest frontend config to become the primary Svelte component runner
- introducing `svelte-jester` as the main direction for repo component testing
- adding Vitest Browser Mode, Playwright component testing, Storybook, or Cypress into the required PR gate for this slice
- rewiring `Login.svelte` auth behavior to `auth-service`
- redesigning frontend state architecture, relay stores, or auth runtime ownership
- backfilling component tests across the whole component tree in the same pass

## Atomic Checklist Items

- [x] C01 `[frontend]` Add a dedicated Svelte component-test harness in `vitest.components.config.ts` and `src/tests/frontend/components/vitest.setup.ts` with Vite-aligned Svelte compilation, `jsdom`, DOM matchers, and per-test cleanup/reset for `localStorage` and any shared store state touched by `Login.svelte`.
  - Depends on: none.
  - Validated by: T01.
  - Trace:
    - "Add a dedicated frontend component-test lane for `.svelte` components using Vitest." (`In Scope`)
    - "Add the minimal setup needed for component tests to run reliably in this repo: Svelte compilation through Vite-aligned config, DOM test environment, test setup/cleanup for DOM matchers and browser-local state" (`In Scope`)
    - "Add a separate Vitest component-test configuration instead of retrofitting the current Jest frontend config to compile `.svelte`." (`Approach`)
    - "Add one shared component-test setup file for DOM matchers and per-test cleanup of browser-local state that can leak across `Login.svelte` tests" (`Approach`)

- [x] C02 `[frontend]` Update `package.json` and `yarn.lock` to add `vitest`, `@testing-library/svelte`, and `@testing-library/jest-dom`, then wire dedicated frontend component-test scripts and compose them into the required `yarn test:frontend` entry point while keeping the current Jest frontend suite intact.
  - Depends on: C01.
  - Validated by: `yarn test:frontend`.
  - Trace:
    - "Add a dedicated frontend component-test lane for `.svelte` components using Vitest." (`In Scope`)
    - "Use `@testing-library/svelte` for DOM-oriented component tests." (`In Scope`)
    - "Add the minimal setup needed for component tests to run reliably in this repo: Svelte compilation through Vite-aligned config, DOM test environment, test setup/cleanup for DOM matchers and browser-local state" (`In Scope`)
    - "Keep the current Jest frontend suite in place for existing non-component tests." (`In Scope`)
    - "frontend scripts that compose Jest plus component tests into one required validation path." (`In Scope`)
    - "Required frontend validation includes the Svelte component-test lane through the normal repo entry point rather than an optional side command." (`Acceptance Criteria`)
    - "Pass: the existing Jest frontend suite still passes after the component-test lane is introduced." (`Validation Strategy`)

- [x] T01 `[tests]` Add a smoke-level `Login.svelte` component test in `src/tests/frontend/components/Login.smoke.test.ts` that renders the component in the Vitest lane and asserts stable, user-visible basics such as the login/signup/guest tabs, without broader auth-behavior assertions.
  - Depends on: C01, C02.
  - Validated by: `yarn test:frontend`.
  - Trace:
    - "Prove the harness with a narrow `Login.svelte` component test so the repo has a real working example rather than infrastructure-only churn." (`In Scope`)
    - "Prove the harness with a narrow smoke-level `Login.svelte` test that renders the component and checks stable, user-visible basics such as the login/signup/guest tabs" (`Approach`)
    - "At least one smoke-level `Login.svelte` component test runs successfully in the new lane as proof that the harness works in this repo." (`Acceptance Criteria`)
    - "Pass: a real `Login.svelte` component test executes through the new Vitest lane using the repo's Svelte 5/Vite-compatible setup." (`Validation Strategy`)

## Behavior Slices

### Slice 1A

Goal: establish a dedicated Svelte component-test lane that fits the current Vite/Svelte toolchain and required frontend test entry point.

Items: C01, C02

Type: mechanical

### Slice 1B

Goal: prove the new harness works in this repo with one smoke-level `Login.svelte` component test.

Items: T01

Type: behavior

## Conformance QC (Checklist)

- Missing from plan: none.
- Extra beyond plan: none.
- Atomicity fixes needed: none observed; each item is independently checkable and committable.
- Validation mapping gaps: none observed; harness, regression, and smoke-proof evidence are mapped to checklist items.
- Pass/Fail: checklist achieves plan goals — **Pass**.
