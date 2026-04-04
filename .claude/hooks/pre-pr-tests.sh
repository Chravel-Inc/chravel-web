#!/bin/bash
# Hook 5: Require passing build gate before PR creation (PreToolUse)
# Runs lint + typecheck + tests. Exit 2 = block PR, exit 0 = allow.

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

echo "=== Pre-PR Build Gate ===" >&2
echo "Running: lint:check → typecheck → test:run" >&2
echo "" >&2

# Step 1: Lint check
echo "[1/3] Running lint check..." >&2
if ! npm run lint:check 2>&1 | tail -5 >&2; then
  echo "" >&2
  echo "BLOCKED: Lint check failed. Fix lint errors before creating a PR." >&2
  exit 2
fi
echo "[1/3] Lint check passed ✓" >&2

# Step 2: Type check
echo "[2/3] Running typecheck..." >&2
if ! npm run typecheck 2>&1 | tail -5 >&2; then
  echo "" >&2
  echo "BLOCKED: Typecheck failed. Fix type errors before creating a PR." >&2
  exit 2
fi
echo "[2/3] Typecheck passed ✓" >&2

# Step 3: Tests
echo "[3/3] Running tests..." >&2
if ! npm run test:run 2>&1 | tail -10 >&2; then
  echo "" >&2
  echo "BLOCKED: Tests failed. Fix failing tests before creating a PR." >&2
  exit 2
fi
echo "[3/3] Tests passed ✓" >&2

echo "" >&2
echo "=== All checks passed — PR creation allowed ===" >&2
exit 0
