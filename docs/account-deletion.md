# Account Deletion (App Store 5.1.1(v))

Account deletion in Chravel is **immediate and irreversible**. There is no
30-day grace period, no soft-delete flag, and no background job that finalizes
the delete later.

## End-to-end flow

1. **UI (Consumer Settings):** `src/components/consumer/DeleteAccountDialog.tsx`
   - User opens the Delete Account dialog.
   - Types `delete` (case-insensitive) in the confirmation input. No password
     is required — the active Supabase session JWT authorizes the deletion for
     every auth provider (email/password, Google, Apple).
   - Clicks **Delete Account Permanently**.
   - A `window.confirm()` modal appears with a final, explicit warning:
     *"This will IMMEDIATELY and PERMANENTLY delete your Chravel account…
     There is NO 30-day grace period. There is NO way to recover this account
     or its data after you click OK."*
   - Only after the user clicks **OK** does the client call the edge function.

2. **Client wrapper:** `src/lib/accountDeletion.ts → deleteAccountImmediately()`
   - Calls `POST /functions/v1/delete-account` with the user's JWT and a
     `{ confirmation: 'DELETE' }` body.
3. **Edge function:** `supabase/functions/delete-account/index.ts`
   - Validates JWT → resolves the calling `user.id`.
   - Validates the `confirmation` field (`delete`, case-insensitive).
   - Writes an `account_deletion_started` row to `public.security_audit_log`.
   - Runs the deletion pipeline (see below) in a single request.
   - Calls `supabaseAdmin.auth.admin.deleteUser(userId)` to destroy the
     `auth.users` row.
   - Writes an `account_deletion_completed` row to
     `public.security_audit_log` with the per-step report.
4. **Client:** signs the user out and navigates to `/`.

The same request handles every step — the user is signed out, the auth record
is gone, and the audit trail is written before the response returns.

## What gets deleted (immediately, in the same request)

Storage:
- `avatars/<userId>/*`
- `trip-media/*` for every row in `trip_media_index` where
  `uploaded_by = userId`

Owned trips (`trips.created_by = userId`):
- If the trip has no other members → the trip is hard-deleted.
- If the trip has other members → ownership transfers to an admin / organizer
  (or the first remaining member), so the group's data is preserved.

Per-user rows (hard-deleted via `DELETE … WHERE <col> = userId`):
- `notifications`
- `ai_queries`
- `concierge_usage`
- `user_locations`
- `user_payment_methods`
- `user_loyalty_programs`
- `push_subscriptions`
- `trip_join_requests`
- `event_rsvps`
- `event_qa_upvotes`
- `poll_votes`
- `message_reactions`
- `broadcast_reactions`
- `message_read_receipts`
- `trip_media_index` (rows where `uploaded_by = userId`)
- `channel_members`
- `trip_members`
- `trip_admins`
- `trip_role_assignments`
- `advertisers`
- `organization_members`

Profile (`profiles` row, `user_id = userId`):
- Anonymized in place: `display_name = '[Deleted User]'`,
  `email = null`, `phone = null`, `bio = null`, `avatar_url = null`,
  `notification_settings = null`, `stripe_customer_id = null`,
  `stripe_subscription_id = null`, `subscription_status = 'deleted'`.
- Anonymization (rather than hard delete) preserves message authorship
  attribution as `[Deleted User]` so other trip members' chat history stays
  readable — no PII remains.

Messages (`trip_messages.sender_id`, `channel_messages.sender_id`):
- Counted in the deletion report. Author attribution falls back to the
  anonymized profile (`[Deleted User]`); the message *content* is preserved
  for the rest of the group, which is the expected behavior for shared chat
  history.

Apple Sign-In:
- `revokeAppleForUser()` revokes the Apple OAuth grant before `auth.users`
  is deleted, satisfying App Store 5.1.1(v).

Auth:
- `supabaseAdmin.auth.admin.deleteUser(userId)` destroys the
  `auth.users` row and invalidates all sessions / refresh tokens.

## Audit verification

Two rows are written to `public.security_audit_log` per deletion:

| `action`                       | When                                  |
| ------------------------------ | ------------------------------------- |
| `account_deletion_started`     | Immediately after JWT + confirmation. |
| `account_deletion_completed`   | After `auth.admin.deleteUser` returns. |

The `metadata` JSON on the completion row includes the per-step deletion
report (`storage`, `trips`, `messages`, `deleted_records`,
`profile_anonymized`, `apple_revocation`, `auth_user_deleted`,
`completed_at`, `immediate: true`). The `started_at` and `completed_at`
timestamps prove the entire pipeline runs in a single request — no
deferred job, no grace period.

To verify in logs after a test deletion:

```sql
select created_at, action, user_id, metadata
from public.security_audit_log
where action in ('account_deletion_started', 'account_deletion_completed')
order by created_at desc
limit 10;
```

Edge function logs (Supabase dashboard → Functions → `delete-account` →
Logs) additionally show step-by-step `[DELETE-ACCOUNT]` lines for every
deletion, with the same `userId` and a final
`Account deletion completed` line containing the full report.

## What is intentionally retained (and why)

- **Anonymized message bodies** — preserved so other trip members' chat
  history remains coherent after one member deletes their account. The
  sender's identity becomes `[Deleted User]`; no PII remains attached.
- **Trips with other members** — ownership transfers to a remaining admin
  / organizer so the group does not lose their shared trip. The deleting
  user's `trip_members` row is removed in the same request.
- **`security_audit_log` rows** — required for security and App Store
  verification; they contain only the `user_id` (now orphaned) and the
  deletion timestamps / counts, no profile PII.
- **Anonymized aggregate analytics** — retained per the privacy policy
  for up to 90 days, with no personal identifiers.
