interface SupabaseEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  MODE?: string;
}

export interface ResolvedSupabaseConfig {
  url: string;
  key: string;
  keySource: 'publishable' | 'anon';
}

const isNonEmpty = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function getMissingSupabaseEnvVars(env: SupabaseEnv): string[] {
  const hasSupabaseUrl = isNonEmpty(env.VITE_SUPABASE_URL?.trim());
  const hasSupabasePublicKey = isNonEmpty(env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
  const hasLegacyAnonKey = isNonEmpty(env.VITE_SUPABASE_ANON_KEY?.trim());

  const missingEnvVars = [
    !hasSupabaseUrl ? 'VITE_SUPABASE_URL' : null,
    !hasSupabasePublicKey && !hasLegacyAnonKey
      ? 'VITE_SUPABASE_PUBLISHABLE_KEY (or legacy VITE_SUPABASE_ANON_KEY)'
      : null,
  ].filter((value): value is string => value !== null);

  return missingEnvVars;
}

export function resolveSupabaseConfig(env: SupabaseEnv): ResolvedSupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim();
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!isNonEmpty(url)) {
    throw new Error('Missing required env var: VITE_SUPABASE_URL');
  }

  if (isNonEmpty(publishableKey)) {
    return {
      url,
      key: publishableKey,
      keySource: 'publishable',
    };
  }

  if (isNonEmpty(anonKey)) {
    return {
      url,
      key: anonKey,
      keySource: 'anon',
    };
  }

  throw new Error(
    'Missing required env var: VITE_SUPABASE_PUBLISHABLE_KEY (or legacy VITE_SUPABASE_ANON_KEY)',
  );
}
