#!/usr/bin/env bash

set -euo pipefail

MONGOMS_DOWNLOAD_URL="https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-6.0.14.tgz"
export MONGOMS_DOWNLOAD_URL

./node_modules/.bin/jest --config jest.backend.config.ts "$@"
