/**
 * Canonical super-admin email bypass list for edge functions.
 *
 * SECURITY: Founder emails are NOT hardcoded here — they live in the
 * `public.super_admins` database table (server-enforced) and/or the
 * `SUPER_ADMIN_EMAILS` Supabase secret (env-enforced). This module only
 * resolves env-configured emails; database-backed checks should use the
 * `public.is_super_admin()` SQL function inside RLS policies.
 *
 * Demo bypass (`demo@chravelapp.com`) is opt-in:
 *   - SUPER_ADMIN_ENABLE_DEMO_EMAIL=true
 *   - or include in SUPER_ADMIN_EMAILS
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const FOUNDER_SUPER_ADMIN_EMAILS: readonly string[] = [];

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const parseCsvEmails = (value: string | undefined): string[] =>
  (value || '').split(',').map(normalizeEmail).filter(Boolean);

const demoBypassEnabled = (value: string | undefined): boolean => {
  const normalized = (value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

export const getSuperAdminEmails = (env: Pick<typeof Deno.env, 'get'> = Deno.env): Set<string> => {
  const envAdmins = parseCsvEmails(env.get('SUPER_ADMIN_EMAILS'));
  const includeDemo = demoBypassEnabled(env.get('SUPER_ADMIN_ENABLE_DEMO_EMAIL'));

  return new Set([
    ...FOUNDER_SUPER_ADMIN_EMAILS.map(normalizeEmail),
    ...(includeDemo ? ['demo@chravelapp.com'] : []),
    ...envAdmins,
  ]);
};

export const isSuperAdminEmail = (
  email: string | null | undefined,
  env: Pick<typeof Deno.env, 'get'> = Deno.env,
): boolean => {
  if (!email) return false;
  return getSuperAdminEmails(env).has(normalizeEmail(email));
};

/**
 * Server-authoritative super-admin check against the revocable, audited public.super_admins table,
 * keyed by durable user_id. Prefer this over isSuperAdminEmail in edge functions: a DB revocation
 * (revoked_at) then takes effect immediately, and email stops being an authorization vector — which
 * is exactly what migration 20260626143000 established for the RLS tier. Pass a service-role client.
 * Fails closed on any error.
 */
export async function isSuperAdminUserId(
  client: SupabaseClient,
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await client
      .from('super_admins')
      .select('user_id')
      .eq('user_id', userId)
      // Revocation is a soft delete (revoked_at timestamp) — an unfiltered lookup would keep
      // treating revoked admins as active.
      .is('revoked_at', null)
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}
