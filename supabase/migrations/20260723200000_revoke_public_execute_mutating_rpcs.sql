-- Close the PUBLIC-grant blind spot on mutating SECURITY DEFINER RPCs (2026-07-23)
--
-- 20260723160000 / 20260723170000 / 20260721000000 revoked EXECUTE on mutating
-- action RPCs (and the SMS helpers) FROM anon — but every one of these functions
-- also carries a blanket PUBLIC EXECUTE grant (`=X` in proacl, the Supabase
-- default for RPCs). REVOKE ... FROM anon is a no-op while PUBLIC still grants
-- EXECUTE to every role, so anon retained the ability to invoke them over
-- /rest/v1/rpc/. (Confirmed live: has_function_privilege('anon',
-- 'dismiss_join_request(uuid)','EXECUTE') was still true after 160000 applied.)
--
-- Most of these are not independently exploitable because their bodies are
-- fail-closed on auth.uid(); this closes the surface fail-closed regardless.
--
-- Fix: for each MUTATING ACTION rpc (every overload, resolved from the catalog),
-- revoke PUBLIC + anon and GRANT authenticated + service_role explicitly (so an
-- authenticated client that only reached the function via PUBLIC keeps working).
-- The SMS quota/entitlement helpers and the audit-log writer are server-internal
-- (no client/edge TS caller) and are locked to service_role only.
--
-- Deliberately does NOT touch RLS predicate helpers (is_*/has_*/can_*/get_*):
-- those are evaluated inside RLS policies for the anon role and must keep EXECUTE.
--
-- Only tightens authorization — no Trip-Not-Found, auth desync, RLS read leak, or
-- payment-state drift. REVERSAL: GRANT EXECUTE ON FUNCTION <sig> TO PUBLIC.

-- Mutating action RPCs: anon + PUBLIC removed, authenticated + service_role kept.
DO $$
DECLARE
  r record;
  action_names text[] := ARRAY[
    'assign_trip_role', 'assign_user_to_role', 'create_trip_role', 'delete_trip_role',
    'remove_user_from_role', 'promote_to_admin', 'demote_from_admin', 'set_admin_scope',
    'grant_super_admin', 'revoke_super_admin',
    'approve_join_request', 'reject_join_request', 'dismiss_join_request',
    'assign_org_seat', 'reclaim_org_seat', 'suspend_org_seat', 'transfer_org_seat',
    'leave_trip', 'leave_trip_role',
    'request_account_deletion', 'cancel_account_deletion',
    'append_poll_option', 'remove_vote_from_poll', 'vote_on_poll_batch', 'vote_on_poll',
    'toggle_task_status', 'update_agenda_item_with_version',
    'update_trip_basecamp_with_version', 'log_basecamp_change',
    'set_trip_notifications_muted', 'mark_broadcast_viewed',
    'finalize_calendar_import_batch', 'undo_calendar_import_batch',
    'settle_payment_split', 'unsettle_payment_split', 'settle_payment_splits_for_debtor'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (action_names)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- Server-internal helpers: service_role only (no client/edge caller).
DO $$
DECLARE
  r record;
  svc_only_names text[] := ARRAY[
    'increment_sms_counter', 'check_sms_rate_limit', 'is_user_sms_entitled',
    'log_org_admin_action'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (svc_only_names)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;
