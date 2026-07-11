---
description: Run a task through the OpenAI Codex CLI sub-agent (GPT-5.6 Sol by default)
argument-hint: "[--model gpt-5.6-terra|gpt-5.6-luna] [--read-only] <task>"
allowed-tools: Bash(bash .claude/scripts/codex-agent.sh:*)
---

The user's Codex request is:

$ARGUMENTS

Delegate it to the OpenAI Codex CLI:

1. If the request begins with `--model <slug>` and/or `--read-only`, pass those
   through as flags. Pass the remaining **task text as a single quoted argument**
   (or pipe it on stdin) so shell metacharacters in the task are never interpreted
   by the shell:

   ```
   bash .claude/scripts/codex-agent.sh [flags] "the task text"
   ```

   Do NOT paste the raw request onto the command line unquoted.
2. Return Codex's `CODEX FINAL MESSAGE` block to the user verbatim, noting which model ran.
3. If the wrapper exits with code 3 (missing authentication), tell the user to set
   `OPENAI_API_KEY` as an environment secret (or run `codex login`) — do not attempt
   to work around it.
