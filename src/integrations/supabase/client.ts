import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Safe storage implementation for environments where localStorage is unavailable
 */
function createSafeStorage(): Storage {
  try {
    const t = '__supabase_probe__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return localStorage;
  } catch {
    const noop = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as unknown as Storage;
    console.warn('[Supabase] localStorage unavailable — using no-op storage.');
    return noop;
  }
}

/**
 * Supabase credentials must come from environment variables.
 *
 * Supported public key env vars:
 *   1) VITE_SUPABASE_PUBLISHABLE_KEY (new key model)
 *   2) VITE_SUPABASE_ANON_KEY        (legacy compatibility)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vite injects import.meta.env at build time
const env = (import.meta as any)?.env ?? {};

const SUPABASE_URL: string | undefined = env.VITE_SUPABASE_URL as string | undefined;

const SUPABASE_PUBLIC_KEY: string | undefined =
  (env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (env.VITE_SUPABASE_ANON_KEY as string | undefined);

// Track env source for diagnostics (DevEnvBanner, Healthz)
const urlFromEnv = Boolean(env.VITE_SUPABASE_URL);
const keyFromEnv = Boolean(env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const isUsingEnvVars = urlFromEnv && keyFromEnv;

if (!isUsingEnvVars) {
  const missing = [
    !urlFromEnv ? 'VITE_SUPABASE_URL' : null,
    !keyFromEnv ? 'VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)' : null,
  ]
    .filter(Boolean)
    .join(', ');
  throw new Error(
    `[Supabase] Missing required environment configuration: ${missing}. ` +
      'Set Supabase env vars before app startup.',
  );
}

const RESOLVED_SUPABASE_URL = SUPABASE_URL as string;
const RESOLVED_SUPABASE_PUBLIC_KEY = SUPABASE_PUBLIC_KEY as string;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase: SupabaseClient<Database> = createClient<Database>(
  RESOLVED_SUPABASE_URL,
  RESOLVED_SUPABASE_PUBLIC_KEY,
  {
    auth: {
      storage: createSafeStorage(),
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'chravel-auth-session',
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 40,
      },
    },
  },
);

// Export URL for edge function calls
export const SUPABASE_PROJECT_URL = RESOLVED_SUPABASE_URL;

// Export anon key for raw fetch calls to edge functions (apikey header)
export const SUPABASE_PUBLIC_ANON_KEY = RESOLVED_SUPABASE_PUBLIC_KEY;
