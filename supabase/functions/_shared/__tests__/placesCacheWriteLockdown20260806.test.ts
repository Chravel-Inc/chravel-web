import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 2026-08-06 — set_places_cache must not be executable by authenticated clients.
 *
 * The shared Places cache is SECURITY DEFINER and keyed by a deterministic hash. With
 * EXECUTE granted to authenticated, any signed-in user could overwrite autocomplete /
 * search results served to every other user for 30 days.
 */

const repoRoot = resolve(__dirname, '../../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

describe('places cache write lockdown (20260806160518)', () => {
  const migration = read('supabase/migrations/20260806160518_lockdown_places_cache_writes.sql');
  const clientCache = read('src/services/googlePlacesCache.ts');

  it('revokes set_places_cache from PUBLIC, anon, and authenticated', () => {
    expect(migration).toContain(
      'REVOKE EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL)',
    );
    expect(migration).toMatch(/REVOKE EXECUTE[\s\S]*FROM PUBLIC/);
    expect(migration).toMatch(/REVOKE EXECUTE[\s\S]*FROM anon/);
    expect(migration).toMatch(/REVOKE EXECUTE[\s\S]*FROM authenticated/);
  });

  it('grants set_places_cache to service_role only', () => {
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL)',
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.set_places_cache[\s\S]*TO service_role/,
    );
    expect(migration).not.toMatch(
      /GRANT EXECUTE ON FUNCTION public\.set_places_cache[\s\S]*TO authenticated/,
    );
  });

  it('truncates the cache so any already-poisoned rows stop being served', () => {
    expect(migration).toContain('TRUNCATE TABLE public.google_places_cache');
  });

  it('makes client setCachedPlace a no-op (does not call the revoked RPC)', () => {
    // The function body must not invoke set_places_cache — calling a revoked RPC would
    // spam 42501s and, if grants were ever loosened again, re-open the poison path.
    const setFnStart = clientCache.indexOf('export async function setCachedPlace');
    expect(setFnStart).toBeGreaterThanOrEqual(0);
    const setFnBody = clientCache.slice(setFnStart, setFnStart + 800);
    expect(setFnBody).not.toContain("rpc('set_places_cache'");
    expect(setFnBody).not.toContain('rpc("set_places_cache"');
  });
});
