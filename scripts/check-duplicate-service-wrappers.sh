#!/usr/bin/env bash
set -euo pipefail

DUPES=$(rg -n "functions\.invoke\('artifact-search'|functions\.invoke\('enhanced-ai-parser'" src/hooks src/services | rg -v "src/services/dal/" || true)
if [[ -n "$DUPES" ]]; then
  echo "Duplicate endpoint wrapper usage detected. Use canonical DAL services instead:"
  echo "$DUPES"
  exit 1
fi

# Billing edge functions (create-checkout / customer-portal) were invoked inline
# from 6+ components with copy-pasted boilerplate. They now have one home in
# src/billing/checkout.ts — forbid new inline callers outside it (tests excluded).
BILLING=$(rg -n "functions\.invoke\('(create-checkout|customer-portal)'" src -g '!**/*.test.*' | rg -v "src/billing/" || true)
if [[ -n "$BILLING" ]]; then
  echo "Direct billing edge-function call detected. Use src/billing/checkout.ts"
  echo "(createCheckoutSession / openCustomerPortal) instead:"
  echo "$BILLING"
  exit 1
fi

echo "No duplicate endpoint wrappers detected."
