#!/usr/bin/env bash
set -euo pipefail
# ───────────────────────────────────────────────────────
# Chravel Merge-Conflict Preflight
# Detects merge conflicts and high-risk file overlap
# before they become blocking.
#
# Usage:
#   bash scripts/merge-conflict-preflight.sh
#   bash scripts/merge-conflict-preflight.sh --base=develop
#   bash scripts/merge-conflict-preflight.sh --json
#   npm run merge:preflight
# ───────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

pass=0
fail_count=0
warn=0

# ── Helpers ───────────────────────────────────────────

ok() {
  if [ "$OUTPUT_JSON" = "false" ]; then
    echo -e "  ${GREEN}✅ $1${NC}"
  fi
  pass=$((pass + 1))
}

warning() {
  if [ "$OUTPUT_JSON" = "false" ]; then
    echo -e "  ${YELLOW}⚠️  $1${NC}"
  fi
  warn=$((warn + 1))
}

fail_msg() {
  if [ "$OUTPUT_JSON" = "false" ]; then
    echo -e "  ${RED}❌ $1${NC}"
  fi
  fail_count=$((fail_count + 1))
}

step() {
  if [ "$OUTPUT_JSON" = "false" ]; then
    echo ""
    echo -e "${BOLD}▶ $1${NC}"
  fi
}

# ── Argument parsing ──────────────────────────────────

BASE_BRANCH="main"
OUTPUT_JSON="false"

for arg in "$@"; do
  case "$arg" in
    --base=*)
      BASE_BRANCH="${arg#--base=}"
      ;;
    --json)
      OUTPUT_JSON="true"
      ;;
    --help|-h)
      echo "Usage: merge-conflict-preflight.sh [--base=<branch>] [--json]"
      echo ""
      echo "Options:"
      echo "  --base=<branch>  Target branch to check against (default: main)"
      echo "  --json           Output machine-readable JSON instead of terminal report"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Run with --help for usage."
      exit 2
      ;;
  esac
done

# ── High-risk zone patterns ──────────────────────────

HIGH_RISK_ZONES=(
  "src/types/"
  "supabase/migrations/"
  "src/hooks/useAuth"
  "supabase/functions/_shared/requireAuth"
  "supabase/functions/_shared/cors"
  "supabase/functions/_shared/validateSecrets"
  "src/stores/"
  "src/store/"
  "src/components/ui/"
  "src/lib/queryKeys"
  "src/integrations/supabase/client"
  "supabase/functions/lovable-concierge/"
  "vercel.json"
  "supabase/config.toml"
  "package-lock.json"
)

# Files with merge=union in .gitattributes (git merge-tree won't respect this)
UNION_MERGE_FILES=(
  "DEBUG_PATTERNS.md"
  "LESSONS.md"
  "TEST_GAPS.md"
  "agent_memory.jsonl"
)

is_high_risk() {
  local file="$1"
  for pattern in "${HIGH_RISK_ZONES[@]}"; do
    if [[ "$file" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

is_union_merge_file() {
  local file="$1"
  local basename
  basename=$(basename "$file")
  for uf in "${UNION_MERGE_FILES[@]}"; do
    if [[ "$basename" == "$uf" ]]; then
      return 0
    fi
  done
  return 1
}

# ── Guard checks ─────────────────────────────────────

if [ "$OUTPUT_JSON" = "false" ]; then
  echo ""
  echo -e "${BOLD}🔍 Merge Conflict Preflight${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

step "1/5  Guard checks"

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  fail_msg "Not inside a git repository"
  exit 2
fi

GIT_VERSION=$(git --version | sed 's/git version //')
GIT_MAJOR=$(echo "$GIT_VERSION" | cut -d. -f1)
GIT_MINOR=$(echo "$GIT_VERSION" | cut -d. -f2)
if (( GIT_MAJOR < 2 )) || (( GIT_MAJOR == 2 && GIT_MINOR < 38 )); then
  fail_msg "git >= 2.38 required for merge-tree --write-tree (found $GIT_VERSION)"
  exit 2
fi
ok "git $GIT_VERSION (>= 2.38)"

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ -z "$CURRENT_BRANCH" ]; then
  CURRENT_BRANCH="(detached HEAD at $(git rev-parse --short HEAD))"
fi

if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
  fail_msg "Already on base branch '$BASE_BRANCH' — nothing to check"
  exit 2
fi
ok "Branch: $CURRENT_BRANCH (base: $BASE_BRANCH)"

# ── Fetch latest base ────────────────────────────────

step "2/5  Sync with remote"

if ! git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null; then
  fail_msg "Failed to fetch origin/$BASE_BRANCH"
  exit 2
fi
ok "Fetched origin/$BASE_BRANCH"

BASE_REF="origin/$BASE_BRANCH"
BASE_SHA=$(git rev-parse --short "$BASE_REF")

# ── Compute merge-base ───────────────────────────────

step "3/5  Divergence analysis"

MERGE_BASE=$(git merge-base HEAD "$BASE_REF" 2>/dev/null || echo "")
if [ -z "$MERGE_BASE" ]; then
  fail_msg "No common ancestor found between HEAD and $BASE_REF"
  exit 2
fi
MERGE_BASE_SHORT=$(git rev-parse --short "$MERGE_BASE")

BRANCH_FILES=$(git diff --name-only "$MERGE_BASE"...HEAD 2>/dev/null || echo "")
BASE_FILES=$(git diff --name-only "$MERGE_BASE"..."$BASE_REF" 2>/dev/null || echo "")

BRANCH_COUNT=0
BASE_COUNT=0
if [ -n "$BRANCH_FILES" ]; then
  BRANCH_COUNT=$(echo "$BRANCH_FILES" | wc -l | tr -d ' ')
fi
if [ -n "$BASE_FILES" ]; then
  BASE_COUNT=$(echo "$BASE_FILES" | wc -l | tr -d ' ')
fi

ok "Merge-base: $MERGE_BASE_SHORT"
ok "Files changed on branch: $BRANCH_COUNT"
ok "Files changed on base since merge-base: $BASE_COUNT"

# ── Overlap detection ────────────────────────────────

OVERLAP=""
if [ -n "$BRANCH_FILES" ] && [ -n "$BASE_FILES" ]; then
  OVERLAP=$(comm -12 <(echo "$BRANCH_FILES" | sort) <(echo "$BASE_FILES" | sort) || echo "")
fi

OVERLAP_COUNT=0
HIGH_RISK_OVERLAP=()
LOW_RISK_OVERLAP=()

if [ -n "$OVERLAP" ]; then
  OVERLAP_COUNT=$(echo "$OVERLAP" | wc -l | tr -d ' ')
  while IFS= read -r file; do
    if is_high_risk "$file"; then
      HIGH_RISK_OVERLAP+=("$file")
    else
      LOW_RISK_OVERLAP+=("$file")
    fi
  done <<< "$OVERLAP"
fi

if [ "$OVERLAP_COUNT" -eq 0 ]; then
  ok "No overlapping files"
elif [ "${#HIGH_RISK_OVERLAP[@]}" -gt 0 ]; then
  warning "Overlapping files: $OVERLAP_COUNT (${#HIGH_RISK_OVERLAP[@]} high-risk)"
  if [ "$OUTPUT_JSON" = "false" ]; then
    for f in "${HIGH_RISK_OVERLAP[@]}"; do
      echo -e "    ${RED}⚠️  $f${NC}"
    done
    for f in "${LOW_RISK_OVERLAP[@]}"; do
      echo -e "    ${CYAN}   $f${NC}"
    done
  fi
else
  warning "Overlapping files: $OVERLAP_COUNT (none high-risk)"
  if [ "$OUTPUT_JSON" = "false" ]; then
    for f in "${LOW_RISK_OVERLAP[@]}"; do
      echo -e "    ${CYAN}   $f${NC}"
    done
  fi
fi

# ── Dry-run merge ────────────────────────────────────

step "4/5  Dry-run merge (git merge-tree)"

MERGE_TREE_OUTPUT=""
MERGE_CLEAN="true"
CONFLICT_FILES=()
UNION_CONFLICT_FILES=()
LOCKFILE_CONFLICT="false"

MERGE_TREE_OUTPUT=$(git merge-tree --write-tree HEAD "$BASE_REF" 2>&1) && MERGE_EXIT=0 || MERGE_EXIT=$?

if [ "$MERGE_EXIT" -eq 0 ]; then
  ok "Dry-run merge: CLEAN"
else
  # Parse conflict file paths from merge-tree output
  RAW_CONFLICTS=$(echo "$MERGE_TREE_OUTPUT" | grep "^CONFLICT" | sed 's/CONFLICT.*: //' | sed 's/ .*//' || echo "")

  if [ -z "$RAW_CONFLICTS" ]; then
    # Fallback: try to extract from "Merge conflict in <file>" lines
    RAW_CONFLICTS=$(echo "$MERGE_TREE_OUTPUT" | grep "Merge conflict in" | sed 's/.*Merge conflict in //' || echo "")
  fi

  if [ -n "$RAW_CONFLICTS" ]; then
    while IFS= read -r cfile; do
      [ -z "$cfile" ] && continue
      if is_union_merge_file "$cfile"; then
        UNION_CONFLICT_FILES+=("$cfile")
      elif [ "$cfile" = "package-lock.json" ]; then
        LOCKFILE_CONFLICT="true"
      else
        CONFLICT_FILES+=("$cfile")
        MERGE_CLEAN="false"
      fi
    done <<< "$RAW_CONFLICTS"
  else
    # merge-tree returned non-zero but we couldn't parse conflicts
    MERGE_CLEAN="false"
    fail_msg "Dry-run merge failed (exit $MERGE_EXIT) — could not parse conflict details"
  fi

  # Report union-merge files (auto-resolved)
  if [ "${#UNION_CONFLICT_FILES[@]}" -gt 0 ]; then
    ok "Union-merge files (auto-resolved by .gitattributes): ${#UNION_CONFLICT_FILES[@]}"
    if [ "$OUTPUT_JSON" = "false" ]; then
      for f in "${UNION_CONFLICT_FILES[@]}"; do
        echo -e "    ${GREEN}↳ $f (merge=union)${NC}"
      done
    fi
  fi

  # Report lockfile conflict
  if [ "$LOCKFILE_CONFLICT" = "true" ]; then
    warning "package-lock.json conflict (resolve with: npm install)"
  fi

  # Report real conflicts
  if [ "${#CONFLICT_FILES[@]}" -gt 0 ]; then
    fail_msg "Dry-run merge: ${#CONFLICT_FILES[@]} REAL CONFLICT(S)"
    if [ "$OUTPUT_JSON" = "false" ]; then
      for f in "${CONFLICT_FILES[@]}"; do
        echo -e "    ${RED}✖ $f${NC}"
      done
    fi
  elif [ "$MERGE_CLEAN" = "true" ]; then
    ok "Dry-run merge: CLEAN (after filtering auto-resolved files)"
  fi
fi

# ── Verdict ──────────────────────────────────────────

step "5/5  Verdict"

VERDICT="SAFE"
if [ "$MERGE_CLEAN" = "false" ]; then
  VERDICT="CONFLICTS"
  fail_msg "CONFLICTS MUST BE RESOLVED before merge"
elif [ "${#HIGH_RISK_OVERLAP[@]}" -gt 0 ]; then
  VERDICT="WARN"
  warning "SAFE TO MERGE but high-risk overlap detected — review carefully"
else
  ok "SAFE TO MERGE — no conflicts, no high-risk overlap"
fi

# ── JSON output ──────────────────────────────────────

if [ "$OUTPUT_JSON" = "true" ]; then
  # Build JSON arrays
  json_array() {
    local arr=("$@")
    local result="["
    local first="true"
    for item in "${arr[@]}"; do
      if [ "$first" = "true" ]; then
        result="$result\"$item\""
        first="false"
      else
        result="$result,\"$item\""
      fi
    done
    echo "$result]"
  }

  HR_JSON=$(json_array "${HIGH_RISK_OVERLAP[@]+"${HIGH_RISK_OVERLAP[@]}"}")
  LR_JSON=$(json_array "${LOW_RISK_OVERLAP[@]+"${LOW_RISK_OVERLAP[@]}"}")
  CF_JSON=$(json_array "${CONFLICT_FILES[@]+"${CONFLICT_FILES[@]}"}")
  UF_JSON=$(json_array "${UNION_CONFLICT_FILES[@]+"${UNION_CONFLICT_FILES[@]}"}")

  cat <<ENDJSON
{
  "branch": "$CURRENT_BRANCH",
  "base": "$BASE_BRANCH",
  "baseRef": "$BASE_REF",
  "baseSha": "$BASE_SHA",
  "mergeBase": "$MERGE_BASE_SHORT",
  "branchFilesChanged": $BRANCH_COUNT,
  "baseFilesChanged": $BASE_COUNT,
  "overlapCount": $OVERLAP_COUNT,
  "highRiskOverlap": $HR_JSON,
  "lowRiskOverlap": $LR_JSON,
  "mergeClean": $MERGE_CLEAN,
  "conflictFiles": $CF_JSON,
  "unionMergeFiles": $UF_JSON,
  "lockfileConflict": $LOCKFILE_CONFLICT,
  "verdict": "$VERDICT"
}
ENDJSON
  # Exit based on verdict (for programmatic use)
  if [ "$VERDICT" = "CONFLICTS" ]; then
    exit 1
  fi
  exit 0
fi

# ── Terminal summary ─────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}Summary:${NC} ${GREEN}$pass passed${NC}, ${YELLOW}$warn warnings${NC}, ${RED}$fail_count failed${NC}"

if [ "$fail_count" -gt 0 ]; then
  echo -e "${RED}Merge conflicts detected. Resolve before pushing.${NC}"
  exit 1
else
  echo -e "${GREEN}Branch is merge-ready.${NC}"
  exit 0
fi
