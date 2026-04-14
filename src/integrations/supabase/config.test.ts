import { describe, expect, it } from 'vitest';
import { resolveSupabaseConfig } from './config';

describe('resolveSupabaseConfig', () => {
  it('prefers publishable key when both keys are present', () => {
    const result = resolveSupabaseConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
      VITE_SUPABASE_ANON_KEY: 'legacy-anon',
    });

    expect(result).toEqual({
      url: 'https://example.supabase.co',
      key: 'sb_publishable_abc',
      keySource: 'publishable',
    });
  });

  it('accepts legacy anon key if publishable key is missing', () => {
    const result = resolveSupabaseConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'legacy-anon',
    });

    expect(result.key).toBe('legacy-anon');
    expect(result.keySource).toBe('anon');
  });

  it('throws if url is missing', () => {
    expect(() =>
      resolveSupabaseConfig({
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
      }),
    ).toThrow('Missing required env var: VITE_SUPABASE_URL');
  });

  it('throws if neither publishable nor anon key exists', () => {
    expect(() =>
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toThrow(
      'Missing required env var: VITE_SUPABASE_PUBLISHABLE_KEY (or legacy VITE_SUPABASE_ANON_KEY)',
    );
  });
});
