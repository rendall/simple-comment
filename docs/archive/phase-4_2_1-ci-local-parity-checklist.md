# Phase 4.2.1 Checklist - Local CI Parity Command

Status: Complete

Source intent: mirror the pull-request workflow in `.github/workflows/netlify-api-test.yml` with a local command for pre-push validation.

## Checklist

- [x] C01 `[governance]` Confirm scope is limited to adding a local CI-parity command path for the existing PR gate workflow (`.github/workflows/netlify-api-test.yml`) and is aligned to `docs/norms/ci-parity.md`: dependency-resolution + validation parity (install with lockfile/options, lint, prettier check, `build:netlify`, `test:backend`, `test:frontend`) without changing workflow behavior, adding CodeQL-local emulation, or mirroring CI runner/bootstrap steps (`actions/checkout`, `actions/setup-node`, global `npm install yarn@^1 -g`).
- [x] C02 `[scripts]` Add `scripts/ci-local.sh` that runs local parity steps in order with exact command parity to `.github/workflows/netlify-api-test.yml`: `yarn --frozen-lockfile --production=false --ignore-optional`, `yarn run lint`, `yarn run prettier --list-different .`, `yarn run build:netlify`, `yarn test:backend`, `yarn test:frontend`; include required env parity values (`TZ=UTC`, `MONGOMS_DOWNLOAD_URL` must match `.github/workflows/netlify-api-test.yml` exactly). Depends on: C01.
- [x] C03 `[package]` Add `ci:local` script in `package.json` that executes `scripts/ci-local.sh` so contributors can run one command before opening/updating PRs. Depends on: C02.
- [x] C04 `[docs]` Add a short usage note in `README.md` describing `yarn run ci:local`, what it mirrors (dependency-resolution + validation parity for the PR workflow), and explicit non-goals (CodeQL parity and CI runner/bootstrap parity are out of scope). Depends on: C03.
- [x] C05 `[ci]` Add a parity-governance comment in `.github/workflows/netlify-api-test.yml` that references `docs/norms/ci-parity.md` and enforces MUST-language sync: any mirrored CI step/env change in this workflow MUST be reflected in `scripts/ci-local.sh` / `yarn run ci:local`. Depends on: C04.
- [x] C06 `[scripts]` Add a parity-governance comment near `scripts/ci-local.sh` that references `docs/norms/ci-parity.md` and enforces MUST-language sync with `.github/workflows/netlify-api-test.yml` to avoid drift. Depends on: C05.

## Behavior Slices

- Goal: Establish explicit scope and non-goals for local CI parity.
  Items: C01
  Type: mechanical

- Goal: Implement one-command local execution that mirrors PR workflow checks and env assumptions.
  Items: C02, C03
  Type: behavior

- Goal: Document usage and drift-prevention expectations so parity remains maintainable.
  Items: C04, C05, C06
  Type: mechanical
