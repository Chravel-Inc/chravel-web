/**
 * Client-side Super Admin *hint* (env allowlist only).
 *
 * SECURITY MODEL — read before changing:
 * - The authoritative super-admin check is the server `public.is_super_admin()`
 *   RPC (backed by the `public.super_admins` table), consumed on the client via
 *   `useSuperAdmin()`. Use that for any real entitlement / access decision.
 * - This module exposes only a synchronous env-allowlist match, used purely as a
 *   no-flicker UI hint (it mirrors the `envMatch` inside `useSuperAdmin`). It is
 *   empty unless `VITE_SUPER_ADMIN_EMAILS` is set, and is not authoritative.
 * - Super-admin status is NEVER derived from a client-supplied `roles[]` /
 *   `appRole`. Those are attacker-controllable and must not confer paid access,
 *   so this module intentionally does not provide a roles-based grant.
 */

import { SUPER_ADMIN_EMAILS } from '@/constants/admins';

/**
 * Check if an email is on the client env allowlist (UI hint only).
 * Not authoritative — the server `is_super_admin()` RPC (via `useSuperAdmin`) is.
 */
export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};
