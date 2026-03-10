#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="${1:-dist}"
PORT="${2:-5051}"
HOST="127.0.0.1"
BASE_URL="http://${HOST}:${PORT}"

server_log="/tmp/phase05-embed-smoke-server.log"
index_html="/tmp/phase05-embed-index.html"
icebreakers_html="/tmp/phase05-embed-icebreakers.html"
simple_comment_js="/tmp/phase05-simple-comment.js"
icebreakers_js="/tmp/phase05-simple-comment-icebreakers.js"

rm -f "$server_log" "$index_html" "$icebreakers_html" "$simple_comment_js" "$icebreakers_js"

npx http-server "$DIST_DIR" -a "$HOST" -p "$PORT" >"$server_log" 2>&1 &
server_pid=$!

cleanup() {
  kill "$server_pid" >/dev/null 2>&1 || true
  wait "$server_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -fsS "${BASE_URL}/index.html" >"$index_html" 2>/dev/null; then
    break
  fi
  sleep 1
done

curl -fsS "${BASE_URL}/icebreakers/index.html" >"$icebreakers_html"
curl -fsS "${BASE_URL}/js/simple-comment.js" >"$simple_comment_js"
curl -fsS "${BASE_URL}/js/simple-comment-icebreakers.js" >"$icebreakers_js"

rg -q 'id="simple-comment-display"' "$index_html"
rg -q 'src="./js/simple-comment.js"' "$index_html"
rg -q 'src="/js/simple-comment.js"' "$icebreakers_html"
rg -q 'src="/js/simple-comment-icebreakers.js"' "$icebreakers_html"

# Baseline runtime wiring checks
rg -q 'window\.loadSimpleComment' "$simple_comment_js"
rg -q '/verify|/topic/|/auth|/comment/' "$simple_comment_js"
rg -q 'window\.getQuestion' "$icebreakers_js"

echo "Frontend embed smoke check passed (${BASE_URL})"
