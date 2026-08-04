-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260614194644, name 'waitlist_admin_access_and_super_admins').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

-- Grant super-admin to the requested operator emails. is_super_admin() matches
-- on the JWT email, so these take effect on the account's next sign-in.
-- ccamechi@gmail.com is already a super admin (bootstrap).
insert into public.super_admins (email, note)
values
  (lower('chrisatown@gmail.com'), 'bootstrap'),
  (lower('ca@saintmarlolabs.com'), 'bootstrap')
on conflict (email) do update set revoked_at = null;

-- Let super admins read early access signups directly from the client.
-- RLS still restricts every row to super admins; signups are still written
-- only by the service-role edge function.
grant select on public.waitlist to authenticated;
grant execute on function public.is_super_admin() to authenticated;

drop policy if exists "super_admins_read_waitlist" on public.waitlist;
create policy "super_admins_read_waitlist"
  on public.waitlist for select to authenticated
  using (public.is_super_admin());
