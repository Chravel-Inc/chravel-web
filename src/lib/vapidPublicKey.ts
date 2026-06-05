/**
 * Resolve the VAPID public key for Web Push subscriptions.
 *
 * Build-time `VITE_VAPID_PUBLIC_KEY` is preferred. When missing (common in preview
 * deploys), fall back to the public `push-client-config` edge function which
 * returns only the public key — safe to expose to clients.
 */

import { supabase } from '@/integrations/supabase/client';

let cachedKey: string | null | undefined;

export function getVapidPublicKeyFromEnv(): string | null {
  const fromEnv = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  return typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : null;
}

export async function resolveVapidPublicKey(): Promise<string | null> {
  const fromEnv = getVapidPublicKeyFromEnv();
  if (fromEnv) return fromEnv;

  if (cachedKey !== undefined) return cachedKey;

  try {
    const { data, error } = await supabase.functions.invoke<{ vapidPublicKey?: string | null }>(
      'push-client-config',
    );
    if (!error && data?.vapidPublicKey) {
      cachedKey = data.vapidPublicKey;
      return cachedKey;
    }
  } catch {
    // fall through
  }

  cachedKey = null;
  return null;
}

/** Reset cache for unit tests. */
export function __resetVapidPublicKeyCacheForTests(): void {
  cachedKey = undefined;
}
