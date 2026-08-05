-- Scale hardening 1/3: stop re-evaluating auth.uid() once per row in every RLS policy.
--
-- THE PROBLEM
-- Postgres treats a bare `auth.uid()` inside a policy predicate as a per-row function call: scan
-- 50,000 rows, call it 50,000 times. Wrapped as `(select auth.uid())` the planner hoists it into a
-- one-time InitPlan and calls it once per statement. auth.uid() is STABLE, so the two forms are
-- semantically identical — this is the optimization Supabase documents for exactly this reason.
--
-- Measured on production before this migration:
--     total policies in public    : 345
--     bare auth.*() in USING      : 245
--     bare auth.*() in WITH CHECK : 137
--     already optimized           : 0
--
-- At today's row counts (trip_members 214, trip_chat_messages 589) this is invisible. It stays
-- invisible right up until it isn't: the cost is O(rows scanned), so it degrades smoothly and then
-- falls off a cliff on the first table to reach five or six figures. Fixing it before launch is far
-- cheaper than diagnosing it under load.
--
-- HOW THIS IS GENERATED
-- The policies are NOT hand-rewritten — 319 of them change, and hand-editing that many security
-- predicates is exactly how an RLS leak gets introduced. Instead the DO block below reads each
-- policy's own deparsed definition from pg_policies, substitutes only the function-call token, and
-- rebuilds the policy with an identical name, table, permissive-ness, role list and command.
-- Postgres does the deparsing; this migration only rewrites `auth.x()` -> `(select auth.x())`.
--
-- WHY IT IS SAFE
--   * Idempotent by construction. Postgres does not store the text you write — it re-deparses the
--     predicate, rendering `(select auth.uid())` back as `( SELECT auth.uid() AS uid)`. Matching on
--     the written form is therefore unreliable and would double-wrap on a second run. Instead each
--     predicate is first UNWRAPPED (any `( SELECT auth.x() AS alias)` collapsed back to `auth.x()`)
--     and then wrapped. Running this migration N times produces the identical result as running it
--     once, whatever form the policies are currently in.
--   * Self-verifying. Every policy is snapshotted before the rewrite. After the rewrite, each new
--     predicate is normalized by stripping the wrapper back off and compared to the original. Any
--     difference — or any change in policy count — raises, and because apply_migration runs in a
--     single transaction, that rolls the ENTIRE migration back. It is all-or-nothing: there is no
--     state where a policy is dropped but not recreated.
--   * Permission-neutral. No predicate logic, role, or command is altered. A policy that allowed a
--     row before allows exactly that row after.
--
-- OPERATIONAL NOTE: recreating a policy takes a brief ACCESS EXCLUSIVE lock on its table, and all
-- of them commit together. At current data volume this is milliseconds; on a large, busy database
-- prefer a low-traffic window.
--
-- Regression scope: RLS predicate *evaluation cost* only. No trip fetch, auth hydration, or payment
-- surface is touched, and the verification block makes a semantic change impossible to commit.

DO $rls_optimize$
DECLARE
  r              record;
  v_new_qual     text;
  v_new_check    text;
  v_roles        text;
  v_ddl          text;
  v_rewritten    int := 0;
  v_unchanged    int := 0;
  v_before_count int;
  v_after_count  int;
  v_mismatch     int;
BEGIN
  -- 1. Snapshot every policy exactly as it stands today.
  CREATE TEMP TABLE _rls_before ON COMMIT DROP AS
  SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public';

  SELECT count(*) INTO v_before_count FROM _rls_before;

  -- 2. Rewrite each policy that contains a bare auth.*() call.
  FOR r IN SELECT * FROM _rls_before ORDER BY tablename, policyname LOOP
    -- Unwrap any already-optimized call, then wrap every bare one. See UNWRAP_RE below.
    v_new_qual := regexp_replace(
      regexp_replace(r.qual, '\(\s*SELECT\s+(auth\.(?:uid|role|jwt)\(\))\s+AS\s+\w+\s*\)', '\1', 'gi'),
      '\mauth\.(uid|role|jwt)\(\)', '(select auth.\1())', 'g');

    v_new_check := regexp_replace(
      regexp_replace(r.with_check, '\(\s*SELECT\s+(auth\.(?:uid|role|jwt)\(\))\s+AS\s+\w+\s*\)', '\1', 'gi'),
      '\mauth\.(uid|role|jwt)\(\)', '(select auth.\1())', 'g');

    -- Nothing to optimize if the policy never calls auth.*() at all.
    IF coalesce(r.qual, '') || coalesce(r.with_check, '') !~ 'auth\.(uid|role|jwt)\(\)' THEN
      v_unchanged := v_unchanged + 1;
      CONTINUE;
    END IF;

    -- Role list. `public` is the PUBLIC pseudo-role and is emitted bare.
    SELECT string_agg(CASE WHEN role_name = 'public' THEN 'public' ELSE quote_ident(role_name) END, ', ')
    INTO v_roles
    FROM unnest(r.roles) AS role_name;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);

    v_ddl := format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s',
      r.policyname,
      r.tablename,
      CASE WHEN r.permissive = 'RESTRICTIVE' THEN 'RESTRICTIVE' ELSE 'PERMISSIVE' END,
      r.cmd,
      v_roles
    );

    IF v_new_qual IS NOT NULL THEN
      v_ddl := v_ddl || format(' USING (%s)', v_new_qual);
    END IF;

    IF v_new_check IS NOT NULL THEN
      v_ddl := v_ddl || format(' WITH CHECK (%s)', v_new_check);
    END IF;

    EXECUTE v_ddl;
    v_rewritten := v_rewritten + 1;
  END LOOP;

  -- 3. Verify: same number of policies, and every predicate is byte-identical once the wrapper is
  --    stripped back off. Anything else rolls the whole migration back.
  SELECT count(*) INTO v_after_count FROM pg_policies WHERE schemaname = 'public';

  IF v_after_count <> v_before_count THEN
    RAISE EXCEPTION
      'RLS optimize aborted: policy count changed (before=%, after=%).',
      v_before_count, v_after_count;
  END IF;

  SELECT count(*) INTO v_mismatch
  FROM _rls_before b
  JOIN pg_policies a
    ON a.schemaname = b.schemaname
   AND a.tablename  = b.tablename
   AND a.policyname = b.policyname
  WHERE
       a.cmd        IS DISTINCT FROM b.cmd
    OR a.permissive IS DISTINCT FROM b.permissive
    OR a.roles::text IS DISTINCT FROM b.roles::text
    -- Compare with BOTH sides unwrapped, so the only permitted difference is the wrapper itself.
    OR regexp_replace(a.qual, '\(\s*SELECT\s+(auth\.(?:uid|role|jwt)\(\))\s+AS\s+\w+\s*\)', '\1', 'gi')
         IS DISTINCT FROM
       regexp_replace(b.qual, '\(\s*SELECT\s+(auth\.(?:uid|role|jwt)\(\))\s+AS\s+\w+\s*\)', '\1', 'gi')
    OR regexp_replace(a.with_check, '\(\s*SELECT\s+(auth\.(?:uid|role|jwt)\(\))\s+AS\s+\w+\s*\)', '\1', 'gi')
         IS DISTINCT FROM
       regexp_replace(b.with_check, '\(\s*SELECT\s+(auth\.(?:uid|role|jwt)\(\))\s+AS\s+\w+\s*\)', '\1', 'gi');

  IF v_mismatch > 0 THEN
    RAISE EXCEPTION
      'RLS optimize aborted: % policy/policies are not semantically identical to their originals.',
      v_mismatch;
  END IF;

  RAISE NOTICE 'RLS optimize: % policies rewritten, % already optimal, % total verified identical.',
    v_rewritten, v_unchanged, v_after_count;
END;
$rls_optimize$;
