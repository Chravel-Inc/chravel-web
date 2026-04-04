#!/bin/bash
# Hook 6: Auto-lint edited files (PostToolUse on Edit|Write)
# Runs ESLint --fix on the specific file after prettier has already formatted it.
# Always exits 0 — lint errors are reported but don't block edits.

set -uo pipefail

FILE_PATHS="${CLAUDE_FILE_PATHS:-}"

if [[ -z "$FILE_PATHS" ]]; then
  exit 0
fi

# Only lint JS/TS files — skip JSON, CSS, MD, etc.
case "$FILE_PATHS" in
  *.ts|*.tsx|*.js|*.jsx)
    # Run ESLint fix on the specific file
    # --no-warn-ignored prevents noise from files excluded by ESLint config
    npx eslint --fix --no-warn-ignored "$FILE_PATHS" 2>&1 | tail -10 || true
    ;;
esac

exit 0
