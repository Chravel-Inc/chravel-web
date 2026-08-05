#!/usr/bin/env bash
# Compare DEPLOYED edge functions against the ones with source in this repo.
#
# WHY THIS EXISTS
# `supabase functions deploy` only ever adds or updates. It never removes. So a function whose
# source is deleted from the repo stays live in production forever — still routable over HTTP, still
# holding whatever secrets it reads from the environment, and no longer reviewable because there is
# nothing left to read. An audit on 2026-08-05 found 40 such orphans, several of them superseded
# predecessors of hardened functions (`getstream-token` vs `stream-token`, `approve-join-request`
# vs the hardened RPC, `send-trip-notification` vs the current fanout).
#
# Deleting the source is NOT the fix — undeploying is. This script surfaces the gap so it cannot
# accumulate silently again.
#
# USAGE
#   SUPABASE_ACCESS_TOKEN=... ./scripts/check-edge-function-drift.sh <project-ref>
#   SUPABASE_ACCESS_TOKEN=... ./scripts/check-edge-function-drift.sh <project-ref> --print-undeploy
#
# Exits 1 when drift exists, so it can gate CI.
# --print-undeploy emits the `supabase functions delete` commands WITHOUT running them. Undeploying
# is destructive and irreversible from here, so it is always a deliberate human step.

set -euo pipefail

PROJECT_REF="${1:-}"
MODE="${2:-}"

if [ -z "$PROJECT_REF" ]; then
  echo "usage: $0 <project-ref> [--print-undeploy]" >&2
  exit 2
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "error: SUPABASE_ACCESS_TOKEN is not set." >&2
  exit 2
fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUNCTIONS_DIR="$REPO_DIR/supabase/functions"

# Source of truth for "should exist": a directory with an index.ts, ignoring _shared and friends.
in_repo="$(
  find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d -not -name '_*' \
    -exec test -f '{}/index.ts' ';' -print \
  | xargs -n1 basename | sort -u
)"

deployed="$(
  npx --yes supabase functions list --project-ref "$PROJECT_REF" 2>/dev/null \
  | awk 'NR>1 {print $3}' | grep -E '^[a-zA-Z0-9_-]+$' | sort -u
)"

if [ -z "$deployed" ]; then
  echo "error: could not list deployed functions (bad token or project ref?)." >&2
  exit 2
fi

orphans="$(comm -13 <(echo "$in_repo") <(echo "$deployed") || true)"
undeployed="$(comm -23 <(echo "$in_repo") <(echo "$deployed") || true)"

echo "edge function drift for $PROJECT_REF"
echo "  in repo  : $(echo "$in_repo" | grep -c . || true)"
echo "  deployed : $(echo "$deployed" | grep -c . || true)"
echo

if [ -n "$undeployed" ]; then
  echo "IN REPO BUT NOT DEPLOYED (a deploy has failed or never ran):"
  echo "$undeployed" | sed 's/^/  - /'
  echo
fi

if [ -z "$orphans" ]; then
  echo "No orphans: every deployed function has source in the repo."
  [ -z "$undeployed" ] && exit 0 || exit 1
fi

echo "DEPLOYED WITH NO SOURCE IN REPO — live, routable, unreviewable:"
echo "$orphans" | sed 's/^/  - /'
echo

if [ "$MODE" = "--print-undeploy" ]; then
  echo "Review each one, then run the commands you actually want:"
  echo "$orphans" | while read -r fn; do
    [ -n "$fn" ] && echo "  npx supabase functions delete $fn --project-ref $PROJECT_REF"
  done
  echo
  echo "Undeploy in waves and watch the edge logs between waves. Anything still receiving traffic"
  echo "is not dead — restore its source and bring it back under review instead."
fi

exit 1
