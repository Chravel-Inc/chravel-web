#!/bin/bash
# Hook 7: Log every Bash command Claude runs (PostToolUse on Bash)
# Appends timestamped entries to .claude/command-log.txt.
# Always exits 0 — logging must never block execution.

set -uo pipefail

INPUT="$(cat)"
COMMAND="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude"
LOG_FILE="$LOG_DIR/command-log.txt"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Append timestamped entry
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "[$TIMESTAMP] $COMMAND" >> "$LOG_FILE"

exit 0
