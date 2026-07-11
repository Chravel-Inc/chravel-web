#!/usr/bin/env bash
#
# codex-agent.sh — invoke the OpenAI Codex CLI as a sub-agent from Claude Code.
#
# Claude Code runs this whenever the user says "use codex …". It self-heals the
# install (the container is ephemeral), runs Codex non-interactively via
# `codex exec`, and prints Codex's final message.
#
# Usage:
#   codex-agent.sh "refactor FooService and add tests"
#   echo "explain this stack trace" | codex-agent.sh
#   codex-agent.sh --model gpt-5.6-terra --read-only "review src/features/trips"
#
# Flags:
#   -m, --model <slug>   Model (default: $CODEX_MODEL or gpt-5.6-sol).
#                        Tiers: gpt-5.6-sol | gpt-5.6-terra | gpt-5.6-luna
#   --read-only          Let Codex read/analyze but NOT modify files.
#   -C, --cd <dir>       Working root for Codex (default: current directory).
#   -h, --help           Show this help.
#
set -euo pipefail

DEFAULT_MODEL="gpt-5.6-sol"
MODEL="${CODEX_MODEL:-$DEFAULT_MODEL}"
READ_ONLY=0
WORKDIR="$PWD"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_CONFIG="$SCRIPT_DIR/../codex/config.toml"

# Print only the leading doc block (stop at the first non-comment line).
usage() { awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "${BASH_SOURCE[0]}"; }

PROMPT_PARTS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--model)   MODEL="${2:?--model needs a value}"; shift 2 ;;
    --read-only)  READ_ONLY=1; shift ;;
    -C|--cd)      WORKDIR="${2:?--cd needs a value}"; shift 2 ;;
    -h|--help)    usage; exit 0 ;;
    --)           shift; PROMPT_PARTS+=("$@"); break ;;
    *)            PROMPT_PARTS+=("$1"); shift ;;
  esac
done

# 1. Ensure Codex is installed (container is ephemeral; self-heal on miss).
if ! command -v codex >/dev/null 2>&1; then
  echo "[codex-agent] Codex CLI not found — installing @openai/codex globally…" >&2
  npm install -g @openai/codex >&2
fi

# 2. Ensure ~/.codex/config.toml exists (seed from the repo copy).
mkdir -p "$HOME/.codex"
if [[ ! -f "$HOME/.codex/config.toml" && -f "$REPO_CONFIG" ]]; then
  cp "$REPO_CONFIG" "$HOME/.codex/config.toml"
  echo "[codex-agent] seeded ~/.codex/config.toml from repo defaults" >&2
fi

# 3. Verify authentication (never prompt for or echo the secret).
if [[ -z "${OPENAI_API_KEY:-}" && ! -f "$HOME/.codex/auth.json" ]]; then
  cat >&2 <<'MSG'
[codex-agent] No Codex authentication found. Provide ONE, then retry:
  • Set OPENAI_API_KEY as an environment secret (recommended for headless), or
  • Run `codex login` interactively to sign in with a ChatGPT account.
Do NOT paste your API key into chat — configure it as an environment secret.
MSG
  exit 3
fi

# 4. Assemble the prompt (positional args, else stdin). Reading stdin here also
#    means the codex call below can safely take its stdin from /dev/null.
PROMPT="${PROMPT_PARTS[*]:-}"
if [[ -z "$PROMPT" && ! -t 0 ]]; then
  PROMPT="$(cat)"
fi
if [[ -z "${PROMPT// }" ]]; then
  echo "[codex-agent] No prompt provided." >&2
  usage
  exit 2
fi

# 5. Sandbox policy. Read-only tasks use Codex's read-only sandbox; write tasks
#    bypass sandboxing because this container is already externally sandboxed
#    (OpenAI's documented recommendation for externally-sandboxed environments).
CODEX_ARGS=(exec -m "$MODEL" -C "$WORKDIR" --skip-git-repo-check)
if [[ "$READ_ONLY" -eq 1 ]]; then
  CODEX_ARGS+=(-s read-only)
else
  CODEX_ARGS+=(--dangerously-bypass-approvals-and-sandbox)
fi

LAST_MSG="$(mktemp)"
trap 'rm -f "$LAST_MSG"' EXIT
CODEX_ARGS+=(-o "$LAST_MSG")

echo "[codex-agent] model=$MODEL read_only=$READ_ONLY cwd=$WORKDIR" >&2
# `--` terminates option parsing so a task starting with '-' is treated as the
# prompt, not a flag. stdin is taken from /dev/null (any piped prompt was already
# captured into $PROMPT above) so Codex never blocks probing for extra input.
set +e
codex "${CODEX_ARGS[@]}" -- "$PROMPT" < /dev/null
STATUS=$?
set -e

# 6. Emit a clean final-answer block for the caller.
if [[ -s "$LAST_MSG" ]]; then
  echo
  echo "===== CODEX FINAL MESSAGE ($MODEL) ====="
  cat "$LAST_MSG"
fi
exit "$STATUS"
