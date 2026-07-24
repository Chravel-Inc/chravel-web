## Goal
Remove the password re-auth step from account deletion. Every user (email/password, Google, Apple) confirms by typing `delete` — nothing else.

## Change
**File:** `src/components/consumer/ConsumerGeneralSettings.tsx`

1. Remove the password `<Input>` field and its "Enter your password to verify your identity" label from the Delete Account dialog.
2. Remove the `password` state, the provider-detection branch that shows/hides the password field, and the `supabase.auth.signInWithPassword({...})` re-auth call in the delete handler.
3. Simplify the submit-disabled logic to a single check: confirmation text (case-insensitive) equals `delete`.
4. Update the helper copy so it reads the same for all users (e.g. "Type **delete** below to confirm. No password required."), removing the OAuth-specific "no password is required" branch.
5. Keep everything else intact: the `window.confirm()` final irreversibility gate, the call to `deleteAccountImmediately()`, sign-out, and redirect to `/`.

## Test updates
**File:** `src/components/consumer/__tests__/ConsumerGeneralSettings.test.tsx`

- Keep the OAuth test (no password prompt, deletes on `delete` + click).
- Rewrite the "requires password re-auth for email/password users" test to assert the opposite: email/password users also see no password field and delete with just the `delete` confirmation. `signInWithPassword` must never be called.
- Keep the "clears DELETE confirmation on dismiss" test as-is.

## Docs
**File:** `docs/account-deletion.md`

Update the UI flow section (step 1) to remove the "Email/password accounts must re-enter their password" line. Everything downstream (edge function, audit log, storage cleanup) is unchanged.

## Out of scope
- No edge function changes (`supabase/functions/delete-account/index.ts` already doesn't require a password).
- No changes to Apple revocation, storage cleanup, or the audit-log pipeline.
- No changes to the `window.confirm()` final gate — that stays as the irreversibility safeguard.

## Risk
Low. Deletion already runs on JWT + typed confirmation server-side; the password check was purely a client-side extra step for one auth provider path.
