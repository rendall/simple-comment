# Priority 5 Svelte Component Testing Plan

Status: planning

Related artifacts:

- `package.json`
- `jest.frontend.config.ts`
- `vite.config.ts`
- `tsconfig.frontend.json`
- `src/components/Login.svelte`
- `.github/workflows/netlify-api-test.yml`
- `scripts/ci-local.sh`

## Goal

Introduce a first-class, maintainable Svelte component testing path for this repository so `Login.svelte` component tests can run in required frontend validation without forcing a broad frontend test-runner migration.

## Intent

Success means contributors can write focused Svelte 5 component tests against real `.svelte` files in this repo, starting with `Login.svelte`, and run them through the normal frontend validation path.

In plain language:

- the existing Jest frontend suite keeps doing what it already does well,
- Svelte component tests get a dedicated runner that actually understands the repo's Vite/Svelte setup,
- required CI and `ci:local` treat those component tests as first-class validation,
- and this side quest stops before it turns into a full Jest-to-Vitest migration or a broader Priority 5 architecture rewrite.

## Motivation

Priority 5 work now needs first-class component tests for `Login.svelte`, but the current frontend Jest setup does not compile `.svelte` files. That is the real tooling gap.

The current repo state makes a Jest-first Svelte component path possible but awkward:

- frontend Jest currently handles `.ts` and `.js`, not `.svelte`,
- the repo does not have a root `svelte.config.js`; Svelte preprocessing currently lives inside `vite.config.ts`,
- `Login.svelte` depends on browser-facing behavior such as DOM rendering and `localStorage`,
- and a Jest Svelte path would require `svelte-jester`, Jest ESM mode, extra preprocess wiring, and additional `node_modules` transform exceptions.

By contrast, the repo already builds frontend Svelte through Vite. A narrow Vitest component lane aligns with the existing Svelte 5 toolchain and is the smallest good way to unlock first-class component tests without disturbing the current Jest unit/integration coverage.

## In Scope

- Add a dedicated frontend component-test lane for `.svelte` components using Vitest.
- Use `@testing-library/svelte` for DOM-oriented component tests.
- Keep the current Jest frontend suite in place for existing non-component tests.
- Scope the new component lane to a dedicated test location so Jest and Vitest do not compete for the same test files.
- Add the minimal setup needed for component tests to run reliably in this repo:
  - Svelte compilation through Vite-aligned config,
  - DOM test environment,
  - test setup/cleanup for DOM matchers and browser-local state,
  - frontend scripts that compose Jest plus component tests into one required validation path.
- Prove the harness with a narrow `Login.svelte` component test so the repo has a real working example rather than infrastructure-only churn.
- Update CI/local parity if the required frontend validation path changes.

## Out of Scope

- Rewriting the existing frontend Jest suite to Vitest.
- Teaching the current Jest frontend config to become the primary Svelte component runner.
- Introducing `svelte-jester` as the main direction for repo component testing.
- Adding Vitest Browser Mode, Playwright component testing, Storybook, or Cypress into the required PR gate for this slice.
- Rewiring `Login.svelte` auth behavior to `auth-service`; that remains separate auth implementation work.
- Redesigning frontend state architecture, relay stores, or auth runtime ownership.
- Backfilling component tests across the whole component tree in the same pass.

## Constraints

- Keep Priority 5 churn low; this is enabling infrastructure, not a modernization campaign.
- Preserve the current contributor mental model where `yarn test:frontend` is the required frontend validation entry point.
- Preserve CI/local parity under `docs/norms/ci-parity.md` if required validation commands change.
- Keep fail-first testing and production implementation as separate passes.
- Prefer the smallest runner split that is easy to explain and maintain: Jest for current frontend unit/service/state tests, Vitest for Svelte component tests.
- Avoid introducing a second test approach for the same class of tests unless there is a clear boundary.

## Current State

At the start of this side quest:

- `package.json` contains Jest, `ts-jest`, `babel-jest`, `jsdom`, Vite, and Svelte 5.
- `jest.frontend.config.ts` transforms `.ts` and `.js`, but not `.svelte`.
- the current frontend Jest suite passes and already covers stores, XState logic, utilities, and `auth-service`.
- `Login.svelte` has no first-class component tests.
- Cypress indirectly covers login/signup/logout/guest flows, but Cypress is intentionally outside required CI and `ci:local`.
- `vite.config.ts` already holds the repo's active Svelte preprocess/plugin configuration.

## Approach

1. Add a separate Vitest component-test configuration instead of retrofitting the current Jest frontend config to compile `.svelte`.
2. Use `@testing-library/svelte` with a DOM environment for component-boundary tests that focus on user-visible behavior and submission/validation outcomes.
3. Keep existing Jest frontend tests on their current path and give Vitest ownership only of Svelte component tests under a dedicated directory such as `src/tests/frontend/components/`.
4. Add one shared component-test setup file for DOM matchers and per-test cleanup of browser-local state that can leak across `Login.svelte` tests, such as `localStorage` and shared stores.
5. Make `yarn test:frontend` the composed entry point for both lanes so required CI and `ci:local` remain simple and first-class component tests are not optional.
6. Prove the harness with a narrow smoke-level `Login.svelte` test that renders the component and checks stable, user-visible basics such as the login/signup/guest tabs, without folding auth-service delegation work into the same change.
7. Stop there. Leave broader component coverage growth and later auth-behavior component tests to explicitly scoped follow-up checklist work.

## Risks and Mitigations

- Risk: adding Vitest quietly turns into a repo-wide migration away from Jest.
  - Mitigation: keep the boundary explicit and stable: Vitest owns `.svelte` component tests only; existing Jest tests stay where they are.

- Risk: this side quest quietly absorbs separate auth rewiring work by changing `Login.svelte` production behavior just to make tests possible.
  - Mitigation: keep the proof test narrow and treat auth-service delegation assertions as later follow-up work.

- Risk: using the existing `vite.config.ts` directly for tests introduces unintended build-root assumptions because that file is build-oriented and sets `root` to `src/entry`.
  - Mitigation: use a dedicated Vitest config that reuses only the Svelte plugin/preprocess parts needed for tests.

- Risk: component tests become flaky because shared stores or `localStorage` state leak between tests.
  - Mitigation: add explicit per-test cleanup/reset in the shared component-test setup file.

- Risk: required CI grows confusing if scripts or parity paths split in an ad hoc way.
  - Mitigation: keep `yarn test:frontend` as the single required frontend test entry point and update `.github/workflows/netlify-api-test.yml` and `scripts/ci-local.sh` together only if necessary.

## Acceptance Criteria

1. The repo has a dedicated, documented test path that can execute Svelte 5 component tests against real `.svelte` files.
2. `@testing-library/svelte` is the standard DOM-level API for this component test lane.
3. The existing frontend Jest suite remains intact and continues to own the current non-component frontend tests.
4. Required frontend validation includes the Svelte component-test lane through the normal repo entry point rather than an optional side command.
5. At least one smoke-level `Login.svelte` component test runs successfully in the new lane as proof that the harness works in this repo.
6. The plan does not require `svelte-jester`, Jest ESM mode, or a broader Jest frontend reconfiguration as the primary solution.
7. The change remains narrow enough that later `Login.svelte` behavior-focused component tests can build on the same runner selection without reopening framework choice.

## Validation Strategy

This plan changes required test infrastructure and the frontend validation path, so explicit evidence is required.

- **Component-harness evidence**
  - Pass: a real `Login.svelte` component test executes through the new Vitest lane using the repo's Svelte 5/Vite-compatible setup.
  - Fail: `.svelte` tests still cannot compile or run, or the harness only exists on paper.

- **Frontend-regression evidence**
  - Pass: the existing Jest frontend suite still passes after the component-test lane is introduced.
  - Fail: enabling component tests breaks the current frontend Jest suite or forces unrelated test rewrites.

- **Parity evidence**
  - Pass: if `yarn test:frontend` or other required frontend validation commands change, the mirrored CI/local parity surfaces remain aligned in `.github/workflows/netlify-api-test.yml` and `scripts/ci-local.sh`.
  - Fail: required PR-gate behavior and `ci:local` drift apart.

- **Scope evidence**
  - Pass: the side quest introduces component-test infrastructure and a smoke-level proof test without also implementing `Login.svelte` auth rewiring.
  - Fail: the same slice changes `Login.svelte` auth behavior, relay architecture, or broader frontend state design.

## Open Questions / Assumptions

- Assumption: `jsdom` is sufficient for the first `Login.svelte` component tests because the immediate need is form rendering, submission, validation, and `localStorage` interaction rather than layout-accurate browser rendering.
- Assumption: a dedicated component-test directory is the cleanest way to keep Jest and Vitest ownership boundaries obvious.
- Assumption: the proof `Login.svelte` test should stay smoke-level only: render the component and assert stable, user-visible basics rather than broader auth behavior.

## Scope Guard

The following work is explicitly deferred and must not be folded into this plan without a separate approved plan/checklist update:

- converting existing frontend Jest tests to Vitest,
- expanding required CI to Browser Mode, Playwright, Cypress, or Storybook,
- rewriting `Login.svelte` to use `auth-service`,
- broad component-test backfill across unrelated components,
- frontend state or auth architecture redesign.

## Conformance QC (Plan)

- Intent clarity issues: none observed; the plan distinguishes the test-harness side quest from separate `Login.svelte` auth rewiring work in plain language.
- Missing required sections: none (`Goal`, `Intent`, `In Scope`, `Out of Scope`, `Acceptance Criteria`, and `Validation Strategy` are present).
- Ambiguities/assumptions to resolve: none blocking checklist authoring.
- Validation strategy gaps: none for the runner-selection, parity, and proof-of-harness scope.
- Traceability readiness: ready; stable headings and explicit acceptance criteria are present for checklist citation.
- Pass/Fail: structurally ready for collaborative review and checklist authoring once the plain-language intent is approved — **Pass**.
