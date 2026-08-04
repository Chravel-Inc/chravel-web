-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260602195655, name 'security_hardening_admin_audit_logs').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

-- Security Hardening: is_super_admin() + admin_audit_logs
-- Reconciles repo migration 20260320000000_security_hardening.sql which was
-- never applied to this project. Purely additive / idempotent.
-- NOTE: is_super_admin() was later re-pointed at the super_admins table by
-- 20260602205304_super_admins_table; this email-array version is the historical
-- intermediate state, kept verbatim.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = ANY (
    ARRAY[
      'ccamechi@gmail.com',
      'christian@chravelapp.com',
      'phil@philquist.com',
      'darren.hartgee@gmail.com'
    ]
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

COMMENT ON FUNCTION public.is_super_admin IS
  'Returns true if the calling user is a Chravel super admin. '
  'Source of truth for all server-side privilege checks. '
  'Must always match src/constants/admins.ts SUPER_ADMIN_EMAILS list exactly.';

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT        NOT NULL,
  trip_id         TEXT,
  target_user_id  UUID,
  old_state       JSONB,
  new_state       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admins_read_admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "super_admins_read_admin_audit_logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "service_role_insert_admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "service_role_insert_admin_audit_logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id
  ON public.admin_audit_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_trip_id
  ON public.admin_audit_logs (trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON public.admin_audit_logs (action, created_at DESC);

COMMENT ON TABLE public.admin_audit_logs IS
  'Immutable log of all deliberate privileged admin actions. '
  'Required for incident investigation and insider threat detection.';
