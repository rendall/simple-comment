#!/usr/bin/env bash

set -euo pipefail

# CI/local parity governance: any required PR-gate CI step/env change in
# .github/workflows/netlify-api-test.yml MUST be reflected here and in
# yarn run ci:local. Source of truth: docs/norms/ci-parity.md

MONGOMS_DOWNLOAD_URL="https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-6.0.14.tgz"
TZ="UTC"
export MONGOMS_DOWNLOAD_URL TZ

yarn --frozen-lockfile --production=false
yarn run lint
yarn run prettier --list-different .
yarn run typecheck
yarn run build

yarn test:backend
yarn test:frontend
