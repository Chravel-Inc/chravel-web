# Codex CLI as a Claude Code sub-agent

The OpenAI **Codex CLI** is wired in so Claude Code can hand tasks to it on
request. Default model: **GPT-5.6 Sol** (flagship). Say **"use codex ..."** and
Claude runs the task through Codex and relays the result.

## Pieces

| File | Role |
|---|---|
| `.claude/scripts/codex-agent.sh` | Wrapper: self-heals the install, seeds config, runs `codex exec`, prints the final message. |
| `.claude/codex/config.toml` | Codex defaults (model = `gpt-5.6-sol`). Copied to `~/.codex/config.toml` on first run. |
| `.claude/agents/codex.md` | Claude Code sub-agent named `codex` (thin relay). |
| `.claude/commands/codex.md` | Slash command `/codex <task>`. |

## How to invoke

- **Natural language:** "use codex to refactor the trip loader" -> Claude runs the wrapper.
- **Slash command:** `/codex refactor the trip loader`
- **Direct:** `bash .claude/scripts/codex-agent.sh "refactor the trip loader"`

Tiers: `gpt-5.6-sol` (flagship, default), `gpt-5.6-terra` (balanced), `gpt-5.6-luna` (volume).
Pass `--model <slug>` to switch, or `--read-only` for analysis with no file edits.

## Authentication (required before Codex can run)

Codex needs credentials. The wrapper checks for them and exits `3` with guidance
if missing. Choose one:

1. **API key (recommended for headless/web sessions).** Set `OPENAI_API_KEY` as an
   **environment secret** for this Claude Code environment — never paste a key into
   chat or commit it. Codex reads it automatically.
2. **ChatGPT sign-in.** Run `codex login` in an interactive terminal; it stores
   credentials in `~/.codex/auth.json`.

## Notes

- **Ephemeral containers:** global npm installs and `~/.codex/` do not survive a new
  container. The wrapper reinstalls Codex and re-seeds config on first run, but
  `OPENAI_API_KEY` must be provided by the environment (a persisted secret) each time.
- **Sandbox:** write tasks run with `--dangerously-bypass-approvals-and-sandbox` because
  the container is already externally sandboxed and Codex's own sandbox cannot nest
  reliably here. Use `--read-only` when you only want analysis.
