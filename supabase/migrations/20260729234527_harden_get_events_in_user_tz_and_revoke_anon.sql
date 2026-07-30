-- Harden get_events_in_user_tz + (re)revoke anon/authenticated EXECUTE (2026-07-29)
--
-- Production still had PUBLIC+anon EXECUTE on this SECURITY DEFINER helper while
-- repo migration 20260725143000 (same revoke set) had not been applied. This
-- migration:
--   1) Replaces the function body so it requires service_role OR active trip
--      membership / creator — even if EXECUTE is accidentally re-granted later.
--   2) Idempotently REVOKE EXECUTE FROM PUBLIC, anon, authenticated and GRANT
--      to service_role only (client calendar path uses direct trip_events SELECT).
--
-- No client callers of get_events_in_user_tz remain (calendarService uses RLS
-- select). Pair with OG preview edge-function hardening in the same PR.
--
-- Regression safety: does not change trips/trip_members RLS, auth hydration, or
-- payment state. Only tightens a DEFINER helper that clients no longer invoke.

CREATE OR REPLACE FUNCTION public.get_events_in_user_tz(p_trip_id text, p_user_id uuid)
RETURNS TABLE(
  id uuid,
  trip_id text,
  title text,
  description text,
  location text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  event_category text,
  created_by uuid,
  user_local_start text,
  user_local_end text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    e.id,
    e.trip_id,
    e.title,
    e.description,
    e.location,
    e.start_time,
    e.end_time,
    e.event_category,
    e.created_by,
    to_char(
      e.start_time AT TIME ZONE COALESCE(p.timezone, 'UTC'),
      'YYYY-MM-DD HH24:MI:SS'
    ) AS user_local_start,
    to_char(
      e.end_time AT TIME ZONE COALESCE(p.timezone, 'UTC'),
      'YYYY-MM-DD HH24:MI:SS'
    ) AS user_local_end
  FROM public.trip_events e
  CROSS JOIN public.profiles p
  WHERE e.trip_id = p_trip_id
    AND p.user_id = p_user_id
    AND (
      -- Privileged server callers (edge/cron with service role JWT)
      auth.role() = 'service_role'
      -- Or an authenticated active member / creator of the trip
      OR (
        auth.uid() IS NOT NULL
        AND (
          public.is_active_trip_member(auth.uid(), p_trip_id)
          OR EXISTS (
            SELECT 1
            FROM public.trips t
            WHERE t.id = p_trip_id
              AND t.created_by = auth.uid()
          )
        )
      )
    )
  ORDER BY e.start_time ASC;
$function$;

COMMENT ON FUNCTION public.get_events_in_user_tz(text, uuid) IS
  'Timezone-localized trip_events. SECURITY DEFINER; requires auth.role()=service_role '
  'or active trip membership/creator. EXECUTE revoked from PUBLIC/anon/authenticated '
  '2026-07-29 — clients must use RLS-gated trip_events SELECT.';

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_events_in_user_tz'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- Re-assert the rest of the 20260725143000 non-predicate revoke set in case that
-- migration is still pending on a given environment. Idempotent.
DO $$
DECLARE
  r record;
  keep_authenticated text[] := ARRAY[
    'increment_rate_limit',
    'check_invite_code_exists',
    'increment_campaign_stat',
    'get_trip_admin_permissions'
  ];
  service_role_only text[] := ARRAY[
    'cleanup_rate_limits',
    'queue_notification_deliveries',
    'deactivate_expired_invites',
    'verify_admin_audit_chain',
    'get_account_deletion_status',
    'should_send_notification',
    'get_broadcast_read_count',
    'enforce_profile_self_update_scope'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (keep_authenticated)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;

  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (service_role_only)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;
