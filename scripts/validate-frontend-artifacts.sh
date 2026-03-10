#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="${1:-dist}"

required_files=(
  "$DIST_DIR/js/simple-comment.js"
  "$DIST_DIR/js/simple-comment-icebreakers.js"
  "$DIST_DIR/css/simple-comment.css"
  "$DIST_DIR/css/simple-comment-style.css"
  "$DIST_DIR/css/index.css"
  "$DIST_DIR/index.html"
  "$DIST_DIR/icebreakers/index.html"
  "$DIST_DIR/img/simple-comment-logo.svg"
  "$DIST_DIR/img/twitter-card-logo.png"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required frontend artifact: $file" >&2
    exit 1
  fi
done

if [[ ! -d "$DIST_DIR/font" ]]; then
  echo "Missing required frontend artifact directory: $DIST_DIR/font" >&2
  exit 1
fi

echo "Frontend artifact contract check passed for $DIST_DIR"
