import { SUPABASE_AUTH_STORAGE_KEY } from '@/integrations/supabase/config';

/**
 * Whether this device very likely resolves to an authenticated session, so
 * boot/loading states can paint an app skeleton instead of a bare spinner.
 *
 * Checks the canonical Supabase session key only (supabase-js removes it on
 * sign-out) — NOT the broader bootstrapShell marker heuristics, whose legacy
 * residue (old sb- or firebase keys that sign-out never deletes) would paint
 * a fake logged-in skeleton for genuinely signed-out devices forever.
 *
 * Evaluated at call time, not module scope: sign-in/sign-out mid-session must
 * change the answer for later route-chunk fallbacks. Visual decision only —
 * every data fetch stays gated on hydrated auth.
 */
export function deviceLikelyAuthenticated(): boolean {
  try {
    return localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
