#!/usr/bin/env bash
set -euo pipefail

HOST="${SIMPLE_COMMENT_FRONTEND_HOST:-0.0.0.0}"
PORT="${SIMPLE_COMMENT_FRONTEND_PORT:-5000}"

# Ensure dist artifacts exist before serving embed paths.
npx vite build --config ./vite.config.ts

npx vite build --config ./vite.config.ts --watch &
watch_pid=$!

cleanup() {
  kill "$watch_pid" >/dev/null 2>&1 || true
  wait "$watch_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

npx http-server ./dist -a "$HOST" -p "$PORT"
