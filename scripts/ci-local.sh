#!/usr/bin/env bash

set -euo pipefail

# CI/local parity governance: any required PR-gate CI step/env change in
# .github/workflows/netlify-api-test.yml MUST be reflected here and in
# yarn run ci:local. Source of truth: docs/norms/ci-parity.md

TZ="UTC"
export TZ

yarn --frozen-lockfile --production=false
yarn run lint
yarn run prettier --list-different .
yarn run typecheck
yarn run build

yarn test:backend
yarn test:frontend
