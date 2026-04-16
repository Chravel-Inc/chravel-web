

# Fix Stream Permissions + Run Migration

## Problem
1. `setup.ts` still contains invalid kebab-case Stream permission names — the approved fix was never persisted
2. Migration script can't run without `npm install` first (dependencies missing locally)

## Plan

### Step 1: Fix `setup.ts` permission names (code change + deploy)
Replace all kebab-case grants with Stream's valid format in `supabase/functions/stream-setup-permissions/setup.ts`:

| Old (invalid) | New (valid) |
|---|---|
| `read-channel` | `read-channel` stays (actually valid in kebab) |
| `create-message` | `create-message` stays |
| `search-messages` | **REMOVE** (not a Stream grant) |
| `read-events` | **REMOVE** (not a Stream grant) |
| `update-message-owner` | `update-message-owner` stays |
| `delete-message-owner` | `delete-message-owner` stays |
| `send-custom-event` | `send-custom-event` stays |

Wait — looking at the actual Stream API errors more carefully, the errors are specifically about `search-messages` and `read-events`. The other kebab-case names (`read-channel`, `create-message`, etc.) are actually working fine — Stream accepts both formats. The real fix is just:

- **Remove `search-messages`** from chravel-trip channel_member grants (not a valid Stream permission)
- **Remove `read-events`** from chravel-broadcast and chravel-channel grants (not a valid Stream permission)
- **Keep `max_message_length: 20000`** (already correct at exactly 20,000)

Actually wait, the error says "max_message_length must be 20,000 or less" but the code already says `20000`. Let me re-read... The error from the terminal is `max_message_length must be 20,000 or less` on chravel-concierge. The code shows `max_message_length: 20000` which IS 20,000. This might be a Stream API issue where 20000 = 20000 is rejected. We should try lowering to 19999 or removing it entirely.

**Actual changes to `setup.ts`:**
- Remove any `search-messages` entries from grant arrays
- Remove any `read-events` entries from grant arrays  
- Change `max_message_length: 20000` to `max_message_length: 19999` (or remove if not needed)

Then deploy via `deploy_edge_functions` and re-invoke via `curl_edge_functions`.

### Step 2: Run migration script
After step 1, run the migration script from the sandbox (we have the Supabase service role key and Stream credentials). The script just reads from Supabase and writes to Stream — it can run from the sandbox, no need for the user's local machine.

Install `stream-chat` and `@supabase/supabase-js` in `/tmp`, then execute the migration script with the provided env vars.

## Risk
- **Low.** Removing invalid permissions unblocks the setup. Migration is read-from-Supabase, write-to-Stream — no destructive operations.

