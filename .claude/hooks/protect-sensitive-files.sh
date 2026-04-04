#!/bin/bash
# Hook 3: Protect sensitive files from edits (PreToolUse on Edit|Write)
# Blocks edits to .env*, secrets, lockfiles, and infrastructure config.
# Exit 2 = block, exit 0 = allow.

set -euo pipefail

INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Normalize: strip leading ./ and resolve relative to project dir
FILE_PATH="${FILE_PATH#./}"
BASENAME="$(basename "$FILE_PATH")"

block() {
  echo "BLOCKED: Cannot edit '$FILE_PATH' — $1" >&2
  echo "To override, remove this rule from .claude/hooks/protect-sensitive-files.sh" >&2
  exit 2
}

# --- Environment files (allow .env.example and .env.*.example) ---
if [[ "$BASENAME" == .env* ]]; then
  if [[ "$BASENAME" == *.example ]]; then
    exit 0  # .env.example is safe to edit
  fi
  block "environment files contain secrets — edit .env.example instead"
fi

# --- Secret files ---
if [[ "$BASENAME" == *secret* || "$BASENAME" == *SECRET* ]]; then
  block "files containing 'secret' in the name are protected"
fi

# --- Git internals ---
if [[ "$FILE_PATH" == .git/* ]]; then
  block "git internals are protected"
fi

# --- Secrets directory ---
if [[ "$FILE_PATH" == secrets/* ]]; then
  block "the secrets/ directory is protected"
fi

# --- Lockfiles (should only change via package manager) ---
if [[ "$BASENAME" == "package-lock.json" || "$BASENAME" == "pnpm-lock.yaml" || "$BASENAME" == "yarn.lock" ]]; then
  block "lockfiles should only be modified by the package manager (npm install, etc.)"
fi

# --- Hook config (protect itself from accidental edits) ---
if [[ "$FILE_PATH" == ".claude/settings.json" || "$FILE_PATH" == *"/.claude/settings.json" ]]; then
  block "Claude Code settings are protected — edit manually or remove this rule first"
fi

# --- Supabase project config ---
if [[ "$BASENAME" == "config.toml" && "$FILE_PATH" == *supabase* ]]; then
  block "Supabase config.toml is protected — edit manually"
fi

# File is safe to edit
exit 0
