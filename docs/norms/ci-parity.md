# CI Parity Norms

Use this guide when a local command mirrors a pull-request CI validation workflow.

Goal: prevent drift between PR-gate validation behavior and local pre-push validation behavior.

## Scope

Local parity in this repository applies to dependency-resolution + validation behavior.

## Contributor Entry Point

- Canonical quick-start and contributor command entry point: `README.md` (Local development section).
- Secondary references: this document for parity governance details and `docs/CYPRESS.md` for Cypress-specific guidance.

## Required Parity

- Local parity commands MUST run install with the same lockfile/options as the mirrored CI workflow.
- Local parity commands MUST run the same validation sequence as the mirrored CI workflow (lint/format/build/test steps).
- CI env values that affect determinism or runtime behavior (for example `TZ`) MUST be mirrored exactly in local parity.
- Any change to mirrored CI steps/env MUST include the corresponding local parity update in the same PR.

## Explicit Non-Goals

- Local parity does not emulate CI runner/bootstrap steps (`actions/checkout`, `actions/setup-node`, global tool install).
- Local parity does not imply parity with separate security-analysis workflows (for example CodeQL) unless explicitly planned.

## Repository Mapping

- PR-gate workflow: `.github/workflows/netlify-api-test.yml`
- Local parity script: `scripts/ci-local.sh`
- Local parity command: `yarn run ci:local`

## Validation Matrix

- **Required PR gate (parity path):** `yarn run ci:local`
- **Deeper optional checks:** `yarn run test:cypress`
- **Intentionally excluded from parity path:** CI runner/bootstrap setup (`actions/checkout`, `actions/setup-node`, global tool install) and separate security-analysis workflows (for example CodeQL).
