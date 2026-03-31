#!/usr/bin/env bash
set -euo pipefail

INPUT="$(cat)"
WORKTREE_NAME="$(printf '%s' "$INPUT" | jq -r '.worktree_name // empty')"
WORKTREE_PATH="$(printf '%s' "$INPUT" | jq -r '.worktree_path // empty')"

if [[ -z "$WORKTREE_NAME" || -z "$WORKTREE_PATH" ]]; then
  echo "Missing worktree_name or worktree_path in WorktreeCreate payload" >&2
  exit 1
fi

DEFAULT_BRANCH="$(git remote show origin 2>/dev/null | awk '/HEAD branch/ {print $NF}' || true)"
if [[ -z "$DEFAULT_BRANCH" ]]; then
  DEFAULT_BRANCH="main"
fi

SLUG="$(printf '%s' "$WORKTREE_NAME" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g; s/-+/-/g')"

if [[ -z "$SLUG" ]]; then
  SLUG="$(date +%Y%m%d-%H%M%S)"
fi

BRANCH_NAME="feature/${SLUG}"

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME" || git show-ref --verify --quiet "refs/remotes/origin/$BRANCH_NAME"; then
  BRANCH_NAME="${BRANCH_NAME}-$(date +%Y%m%d-%H%M%S)"
fi

echo "Creating worktree at: $WORKTREE_PATH" >&2
echo "Using base branch: $DEFAULT_BRANCH" >&2
echo "Creating feature branch: $BRANCH_NAME" >&2

git fetch origin "$DEFAULT_BRANCH" >/dev/null 2>&1 || true
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" "origin/$DEFAULT_BRANCH" >&2

printf '%s\n' "$WORKTREE_PATH"
