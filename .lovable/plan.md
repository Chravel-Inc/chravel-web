

# Clean Up: stream-setup-permissions Auth Gate

## Problem
Claude Code applied `if (false)` to bypass the `getUser` check — functional but leaves dead/misleading code. The deployed version may differ from the repo version.

## Fix
Remove the entire `getUser` block (lines 71–89) since the `X-Admin-Secret` header check (lines 58–67) is the sole auth gate. The `authHeader` requirement (lines 69–74) stays — it proves the caller has *some* Supabase credential, but `getUser` validation is unnecessary for a server-admin endpoint.

### File: `supabase/functions/stream-setup-permissions/index.ts`

**Remove lines 75–89** (the `createClient` + `getUser` + error response block). Keep the `authHeader` null-check on lines 69–74 as a basic sanity gate, but drop the user verification.

The final auth flow becomes:
1. `X-Admin-Secret` must match `STREAM_ADMIN_SECRET` (line 58–67) — **primary gate**
2. `Authorization` header must be present (line 69–74) — **basic sanity check**
3. No `getUser` call — the admin secret is sufficient

## Risk
None. This is a one-time setup endpoint already protected by a secret. The function has already been run successfully. This change just makes the code honest about what it does.

## Redeploy
Yes — will redeploy `stream-setup-permissions` after the edit to keep deployed code in sync with repo.

