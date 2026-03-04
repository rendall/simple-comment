# Phase 4.2.1 Checklist - Local CI Parity Command

Source intent: mirror the pull-request workflow in `.github/workflows/netlify-api-test.yml` with a local command for pre-push validation.

## Checklist

- [ ] C01 `[governance]` Confirm scope is limited to adding a local CI-parity command path for the existing PR gate workflow (`.github/workflows/netlify-api-test.yml`) and is aligned to `docs/norms/ci-parity.md`: dependency-resolution + validation parity (install with lockfile/options, lint, prettier check, `build:netlify`, `test:backend`, `test:frontend`) without changing workflow behavior, adding CodeQL-local emulation, or mirroring CI runner/bootstrap steps (`actions/checkout`, `actions/setup-node`, global `npm install yarn@^1 -g`).
- [ ] C02 `[scripts]` Add `scripts/ci-local.sh` that runs local parity steps in order: `yarn --frozen-lockfile --production=false --ignore-optional`, then lint, prettier check, `build:netlify`, `test:backend`, `test:frontend`, with required env parity values (`TZ=UTC`, `MONGOMS_DOWNLOAD_URL` must match `.github/workflows/netlify-api-test.yml` exactly). Depends on: C01.
- [ ] C03 `[package]` Add `ci:local` script in `package.json` that executes `scripts/ci-local.sh` so contributors can run one command before opening/updating PRs. Depends on: C02.
- [ ] C04 `[docs]` Add a short usage note in `README.md` describing `yarn run ci:local`, what it mirrors (dependency-resolution + validation parity for the PR workflow), and explicit non-goals (CodeQL parity and CI runner/bootstrap parity are out of scope). Depends on: C03.
- [ ] C05 `[ci]` Add parity-governance comments in `.github/workflows/netlify-api-test.yml` and near the local CI script (`scripts/ci-local.sh`) that reference `docs/norms/ci-parity.md` and enforce MUST-language sync: any mirrored CI step/env change in this workflow MUST be reflected in `scripts/ci-local.sh` / `yarn run ci:local`. Depends on: C04.

## Behavior Slices

- Goal: Establish explicit scope and non-goals for local CI parity.
  Items: C01
  Type: mechanical

- Goal: Implement one-command local execution that mirrors PR workflow checks and env assumptions.
  Items: C02, C03
  Type: behavior

- Goal: Document usage and drift-prevention expectations so parity remains maintainable.
  Items: C04, C05
  Type: mechanical
