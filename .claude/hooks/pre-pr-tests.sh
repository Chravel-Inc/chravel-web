#!/bin/bash
# Hook 5: Require passing build gate before PR creation (PreToolUse)
# Runs lint + typecheck (blocking) + tests (warning only).
# Exit 2 = block PR, exit 0 = allow.
#
# NOTE: This hook only fires for the mcp__github__create_pull_request tool.
# PRs created via GitHub UI, gh CLI, or other integrations bypass this gate.
# CI workflows enforce the same checks on all PRs regardless of creation method.

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

echo "=== Pre-PR Build Gate ===" >&2
echo "Running: typecheck (blocking) + lint + tests (warnings)" >&2
echo "" >&2

# Step 1: Type check (blocking — catches real compile errors)
echo "[1/3] Running typecheck..." >&2
if ! npm run typecheck 2>&1 | tail -5 >&2; then
  echo "" >&2
  echo "BLOCKED: Typecheck failed. Fix type errors before creating a PR." >&2
  exit 2
fi
echo "[1/3] Typecheck passed" >&2

# Step 2: Lint check (warning only — pre-existing errors may exist on main)
# CI enforces the hard lint gate on all PRs.
echo "[2/3] Running lint check..." >&2
if ! npm run lint:check 2>&1 | tail -5 >&2; then
  echo "" >&2
  echo "WARNING: Lint errors found. Review lint output before merging — CI will enforce." >&2
else
  echo "[2/3] Lint check passed" >&2
fi

# Step 3: Tests (warning only — local env may lack secrets like VITE_SUPABASE_URL)
# CI enforces the hard test gate on all PRs.
echo "[3/3] Running tests..." >&2
if ! npm run test:run 2>&1 | tail -10 >&2; then
  echo "" >&2
  echo "WARNING: Some tests failed. Review test output before merging — CI will enforce." >&2
else
  echo "[3/3] Tests passed" >&2
fi

echo "" >&2
echo "=== Build gate passed — PR creation allowed ===" >&2
exit 0
