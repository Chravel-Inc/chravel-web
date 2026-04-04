#!/bin/bash
# Hook 2: Block dangerous Bash commands (PreToolUse on Bash)
# Reads tool input JSON from stdin, blocks destructive patterns with exit 2.

set -euo pipefail

INPUT="$(cat)"
COMMAND="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')"

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Normalize for matching: lowercase, collapse whitespace
CMD_LOWER="$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]' | tr -s ' ')"

block() {
  echo "BLOCKED: $1" >&2
  echo "Command was: $COMMAND" >&2
  exit 2
}

# --- Destructive file operations ---
echo "$CMD_LOWER" | grep -qE 'rm\s+-rf\s+/' && block "rm -rf with root path is forbidden"
echo "$CMD_LOWER" | grep -qE 'rm\s+-rf\s+~' && block "rm -rf on home directory is forbidden"
echo "$CMD_LOWER" | grep -qE 'rm\s+-rf\s+\.' && block "rm -rf on current directory is forbidden"
echo "$CMD_LOWER" | grep -qE 'rm\s+-r\s+/' && block "rm -r with root path is forbidden"
echo "$CMD_LOWER" | grep -qE 'rm\s+-r\s+~' && block "rm -r on home directory is forbidden"

# --- SQL destruction ---
echo "$CMD_LOWER" | grep -qE 'drop\s+table' && block "DROP TABLE is forbidden — use migrations"
echo "$CMD_LOWER" | grep -qE 'drop\s+database' && block "DROP DATABASE is forbidden"
echo "$CMD_LOWER" | grep -qE 'truncate\s+table' && block "TRUNCATE TABLE is forbidden — use migrations"

# --- Pipe-to-shell (remote code execution) ---
echo "$CMD_LOWER" | grep -qE 'curl\s.*\|\s*(sh|bash)' && block "Piping curl to shell is forbidden"
echo "$CMD_LOWER" | grep -qE 'wget\s.*\|\s*(sh|bash)' && block "Piping wget to shell is forbidden"
echo "$CMD_LOWER" | grep -qE 'curl\s.*\|\s*sudo' && block "Piping curl to sudo is forbidden"

# --- Dangerous permissions ---
echo "$CMD_LOWER" | grep -qE 'chmod\s+777' && block "chmod 777 is forbidden — use specific permissions"

# --- System destruction ---
echo "$CMD_LOWER" | grep -qE 'mkfs\.' && block "mkfs (format disk) is forbidden"
echo "$CMD_LOWER" | grep -qE 'dd\s+if=' && block "dd (raw disk write) is forbidden"
echo "$CMD_LOWER" | grep -qE ':\(\)\s*\{' && block "Fork bomb detected"

# --- Accidental publish/reset ---
echo "$CMD_LOWER" | grep -qE 'npm\s+publish' && block "npm publish is forbidden — publish manually"
echo "$CMD_LOWER" | grep -qE 'supabase\s+db\s+reset' && block "supabase db reset is forbidden — use migrations"

# --- Overwrite disk ---
echo "$CMD_LOWER" | grep -qE '>\s*/dev/sd[a-z]' && block "Writing to raw disk device is forbidden"

# Command is safe
exit 0
