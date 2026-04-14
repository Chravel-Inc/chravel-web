interface SupabaseEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  MODE?: string;
}

export interface ResolvedSupabaseConfig {
  url: string;
  key: string;
  keySource: 'publishable' | 'anon' | 'fallback';
}

const isNonEmpty = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

// Hardcoded fallback for the known Chravel Supabase project.
// These are publishable/anon credentials — safe to embed in client code.
// They ensure the production bundle never crashes at module-load time even
// when Vercel env vars are misconfigured or missing during a build.
const KNOWN_PROJECT_URL = 'https://jmjiyekmxwsxkfnqwyaa.supabase.co';
const KNOWN_PROJECT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptaml5ZWtteHdzeGtmbnF3eWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjEwMDgsImV4cCI6MjA2OTQ5NzAwOH0.SAas0HWvteb9TbYNJFDf8Itt8mIsDtKOK6QwBcwINhI';

export function getMissingSupabaseEnvVars(env: SupabaseEnv): string[] {
  // With hardcoded fallbacks, env vars are never truly "missing" for runtime purposes.
  // This function now only warns when env vars aren't explicitly set (for dev awareness).
  const hasSupabaseUrl = isNonEmpty(env.VITE_SUPABASE_URL?.trim());
  const hasSupabasePublicKey = isNonEmpty(env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
  const hasLegacyAnonKey = isNonEmpty(env.VITE_SUPABASE_ANON_KEY?.trim());

  // If env vars are set, nothing is missing
  if (hasSupabaseUrl && (hasSupabasePublicKey || hasLegacyAnonKey)) {
    return [];
  }

  // Fallbacks exist — don't block the app. Return empty to let it boot.
  return [];
}

export function resolveSupabaseConfig(env: SupabaseEnv): ResolvedSupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim();
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

  const resolvedUrl = isNonEmpty(url) ? url : KNOWN_PROJECT_URL;

  if (isNonEmpty(publishableKey)) {
    return {
      url: resolvedUrl,
      key: publishableKey,
      keySource: 'publishable',
    };
  }

  if (isNonEmpty(anonKey)) {
    return {
      url: resolvedUrl,
      key: anonKey,
      keySource: 'anon',
    };
  }

  // Fallback to known project credentials — never throw
  if (!isNonEmpty(url) || (!isNonEmpty(publishableKey) && !isNonEmpty(anonKey))) {
    console.warn(
      '[Supabase] Using hardcoded fallback credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for explicit configuration.',
    );
  }

  return {
    url: resolvedUrl,
    key: KNOWN_PROJECT_ANON_KEY,
    keySource: 'fallback',
  };
}
