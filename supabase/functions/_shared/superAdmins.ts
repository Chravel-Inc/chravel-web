/**
 * Canonical super-admin email bypass list for edge functions.
 *
 * NOTE: `demo@chravelapp.com` is intentionally excluded from defaults.
 * It can be enabled explicitly via env for demo/staging workflows:
 *   - SUPER_ADMIN_ENABLE_DEMO_EMAIL=true
 *   - or SUPER_ADMIN_EMAILS=demo@chravelapp.com
 */
export const FOUNDER_SUPER_ADMIN_EMAILS = [
  'ccamechi@gmail.com',
  'christian@chravelapp.com',
  'phil@philquist.com',
  'darren.hartgee@gmail.com',
] as const;

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
