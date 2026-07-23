-- Enforce pro/event trip creation server-side — close the direct-insert paywall bypass (2026-07-23)
--
-- PROBLEM: create-trip (a service-role edge function) enforces plan entitlement before
-- creating pro/event trips (free tier is blocked). But the `trips` INSERT RLS policy
-- "Trip creators can create trips" only checked `auth.uid() = created_by` and placed NO
-- restriction on trip_type. A client could therefore bypass create-trip entirely and
-- `supabase.from('trips').insert({ trip_type: 'pro', created_by: self })` to get a
-- pro/event trip without the entitlement check. (Revenue/paywall bypass, not a data
-- breach — a user can only create their own trip, never read another user's data.)
--
-- FIX: restrict the client-facing INSERT policy to consumer trips. Pro/event creation must
-- go through create-trip, which is the single entitlement-checked path. This is safe:
--   * The frontend never inserts into `trips` directly (all creation calls create-trip).
--   * create-trip and the seed function use the SERVICE ROLE, which bypasses RLS, so this
--     policy change does not affect them — entitled pro/event creation is unchanged.
-- Consumer trip creation via any client path remains allowed.
--
-- This only tightens INSERT authorization (no SELECT/read change), so it cannot cause
-- Trip-Not-Found, auth desync, an RLS read leak, or payment-state drift.
-- REVERSAL: recreate the policy with WITH CHECK ((SELECT auth.uid()) = created_by).

DROP POLICY IF EXISTS "Trip creators can create trips" ON public.trips;
CREATE POLICY "Trip creators can create trips"
  ON public.trips
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = created_by
    AND COALESCE(trip_type, 'consumer') = 'consumer'
  );
