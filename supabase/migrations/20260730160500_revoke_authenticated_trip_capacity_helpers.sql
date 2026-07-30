-- Re-assert service_role-only EXECUTE on trip capacity helpers (2026-07-30)
--
-- Regression: 20260727140000 re-issued get_trip_member_limit /
-- is_trip_at_member_capacity (needed because 20260626120000 never applied) but
-- also re-GRANTed EXECUTE to authenticated. That undid the intentional lockdown
-- in 20260626143000:
--
--   "Capacity helpers disclose trip existence/creator entitlement metadata.
--    They are used by server-side invite/join flows, so keep service_role and
--    remove direct client execution."
--
-- Both helpers are SECURITY DEFINER with NO membership / auth.uid() gate.
-- Any authenticated caller can pass an arbitrary trip_id and learn:
--   * whether the trip exists (NULL vs integer / boolean)
--   * the creator's paid plan band (50/100/200/250 maps to entitlement tiers)
--   * whether the trip is currently at capacity
--
-- The only production caller is join-trip (service_role client). list_trip_members
-- stays authenticated — it gates on is_active_trip_member inside the body.
--
-- Idempotent: safe if 20260626143000 already applied, and required after
-- 20260727140000.
--
-- Regression safety: does not change trips/trip_members RLS, auth hydration,
-- trip loading paths, or payment write paths — only tightens EXECUTE grants.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_trip_member_limit', 'is_trip_at_member_capacity')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);

    -- Comment only when the function exists (avoids hard-fail on DBs that never
    -- received 20260727140000). Catalog loop already guarantees presence here.
    IF r.proname = 'get_trip_member_limit' THEN
      EXECUTE format(
        'COMMENT ON FUNCTION %s IS %L',
        r.sig,
        'Returns trip member cap from creator plan. SECURITY DEFINER; EXECUTE service_role only (re-asserted 2026-07-30 — discloses creator entitlement metadata).'
      );
    ELSIF r.proname = 'is_trip_at_member_capacity' THEN
      EXECUTE format(
        'COMMENT ON FUNCTION %s IS %L',
        r.sig,
        'True when active member count >= get_trip_member_limit. SECURITY DEFINER; EXECUTE service_role only (re-asserted 2026-07-30).'
      );
    END IF;
  END LOOP;
END $$;
