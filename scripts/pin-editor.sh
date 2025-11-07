#!/usr/bin/env bash
set -e

REF="$1"
if [ -z "$REF" ]; then
  echo "Error: No ref provided."
  echo "Usage: bun run editor:pin <branch|commit|tag>"
  echo "Example: bun run editor:pin abc1234"
  echo "Example: bun run editor:pin main"
  echo "Example: bun run editor:pin v1.0.0"
  exit 1
fi

# Script location: src/app/editor/scripts/pin-editor.sh
# When executed via 'bun run editor:pin', CWD is parent repo root
# So we use relative paths from parent repo root

# Fetch and checkout ref inside submodule
git -C src/app/editor fetch origin "$REF" || true
git -C src/app/editor checkout "$REF"
if git -C src/app/editor rev-parse --verify --quiet "$REF" >/dev/null; then
  git -C src/app/editor pull origin "$REF" || true
fi

EDITOR_SHA=$(git -C src/app/editor rev-parse --short HEAD)

# Stage submodule pointer and commit in parent repo (no-op if unchanged)
git add src/app/editor
git commit -m "chore(editor): pin editor to ${EDITOR_SHA}" || true

echo "Pinned editor to ${EDITOR_SHA}"

