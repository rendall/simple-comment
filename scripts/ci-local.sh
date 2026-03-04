#!/usr/bin/env bash

set -euo pipefail

# CI/local parity governance: any mirrored CI step/env change in
# .github/workflows/netlify-api-test.yml MUST be reflected here and in
# yarn run ci:local. Source of truth: docs/norms/ci-parity.md

MONGOMS_DOWNLOAD_URL="https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-6.0.14.tgz"
TZ="UTC"

yarn --frozen-lockfile --production=false --ignore-optional
yarn run lint
yarn run prettier --list-different .
yarn run build:netlify

MONGOMS_DOWNLOAD_URL="$MONGOMS_DOWNLOAD_URL" TZ="$TZ" yarn test:backend
MONGOMS_DOWNLOAD_URL="$MONGOMS_DOWNLOAD_URL" TZ="$TZ" yarn test:frontend
