-- Revoke anon EXECUTE on mutating SECURITY DEFINER RPCs (2026-07-23)
--
-- The Supabase security advisor flags ~70 SECURITY DEFINER functions callable by the
-- `anon` (unauthenticated) role via /rest/v1/rpc/. SECURITY DEFINER runs with owner
-- privileges, so any such function that mutates state and does not fully re-derive the
-- actor from auth.uid() is an unauthenticated attack surface. An unauthenticated caller
-- has NO legitimate reason to invoke role assignment, admin promotion, seat management,
-- account deletion, super-admin grant/revoke, poll/task mutation, etc.
--
-- This revokes anon EXECUTE on the MUTATING ACTION rpcs only (every overload, resolved
-- from the catalog so signatures can't drift). It deliberately does NOT touch the RLS
-- predicate helpers (is_*/has_*/can_*/get_* — e.g. is_active_trip_member, has_admin_permission,
-- can_access_channel): those are invoked inside RLS policies that may be evaluated for the
-- anon role, so anon must retain EXECUTE on them. `authenticated` and `service_role` keep
-- EXECUTE on everything here, so client and edge-function calls are unaffected. This only
-- removes an unauthenticated RPC surface — it cannot cause Trip-Not-Found, auth desync,
-- an RLS read leak, or payment-state drift (no payment RPCs are in scope).
--
-- (toggle_task_status and vote_on_poll were already revoked in 20260721000000.)
--
-- REVERSAL: GRANT EXECUTE ON FUNCTION <sig> TO anon; for any function below.

DO $$
DECLARE
  r record;
  target_names text[] := ARRAY[
    -- role / admin management
    'assign_trip_role', 'assign_user_to_role', 'create_trip_role', 'delete_trip_role',
    'remove_user_from_role', 'promote_to_admin', 'demote_from_admin', 'set_admin_scope',
    'grant_super_admin', 'revoke_super_admin',
    -- join requests
    'approve_join_request', 'reject_join_request', 'dismiss_join_request',
    -- org seat lifecycle
    'assign_org_seat', 'reclaim_org_seat', 'suspend_org_seat', 'transfer_org_seat',
    -- membership lifecycle
    'leave_trip', 'leave_trip_role',
    -- account deletion lifecycle
    'request_account_deletion', 'cancel_account_deletion',
    -- content mutations
    'append_poll_option', 'remove_vote_from_poll', 'vote_on_poll_batch',
    'update_agenda_item_with_version', 'update_trip_basecamp_with_version',
    'log_basecamp_change', 'set_trip_notifications_muted', 'mark_broadcast_viewed',
    'finalize_calendar_import_batch', 'undo_calendar_import_batch',
    -- privileged writes / audit
    'log_org_admin_action'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (target_names)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;
