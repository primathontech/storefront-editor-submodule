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

# Fetch latest branches and tags from origin so REF can be a remote-only branch or tag
git -C src/app/editor fetch origin --tags

# Verify the ref exists locally after fetch
if ! git -C src/app/editor rev-parse --verify --quiet "$REF" >/dev/null; then
  echo "Error: ref '$REF' not found after fetching from origin."
  echo "Make sure the branch or tag exists on the 'origin' remote."
  exit 1
fi

# Checkout the requested ref
git -C src/app/editor checkout "$REF"

# If REF is a branch that also exists on origin, fast-forward to the latest remote commit
if git -C src/app/editor rev-parse --verify --quiet "origin/$REF" >/dev/null; then
  git -C src/app/editor merge --ff-only "origin/$REF" || true
fi

EDITOR_SHA=$(git -C src/app/editor rev-parse --short HEAD)

# Stage submodule pointer and commit in parent repo (no-op if unchanged)
git add src/app/editor
git commit -m "chore(editor): pin editor to ${EDITOR_SHA}" || true

echo "Pinned editor to ${EDITOR_SHA}"

