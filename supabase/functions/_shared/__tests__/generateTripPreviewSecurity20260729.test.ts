import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 2026-07-29 — generate-trip-preview / generate-invite-preview hardening.
 *
 * 1) Unauthenticated UUID OG preview must not emit private trips.description.
 * 2) Archived/hidden trips must 404 for public unfurl.
 * 3) Client-supplied appBaseUrl / canonicalUrl must go through trusted resolvers
 *    (open-redirect prevention).
 */

const repoRoot = resolve(__dirname, '../../../..');
const tripPreview = readFileSync(
  resolve(repoRoot, 'supabase/functions/generate-trip-preview/index.ts'),
  'utf8',
);
const invitePreview = readFileSync(
  resolve(repoRoot, 'supabase/functions/generate-invite-preview/index.ts'),
  'utf8',
);
const revokeMigration = readFileSync(
  resolve(
    repoRoot,
    'supabase/migrations/20260729234527_harden_get_events_in_user_tz_and_revoke_anon.sql',
  ),
  'utf8',
);

describe('generate-trip-preview security (2026-07-29)', () => {
  it('does not select or emit private trips.description for UUID previews', () => {
    expect(tripPreview).toContain('buildPublicOgDescription');
    expect(tripPreview).not.toMatch(/select\(\s*'name, description,/);
    expect(tripPreview).not.toContain('description: trip.description');
  });

  it('404s archived/hidden trips for public unfurl', () => {
    expect(tripPreview).toContain('is_archived, is_hidden');
    expect(tripPreview).toMatch(/trip\.is_archived \|\| trip\.is_hidden/);
  });

  it('resolves appBaseUrl and canonicalUrl via trusted helpers', () => {
    expect(tripPreview).toContain('resolveTrustedAppBaseUrl');
    expect(tripPreview).toContain('resolveTrustedCanonicalUrl');
    expect(tripPreview).not.toMatch(/appBaseUrlParam && appBaseUrlParam\.startsWith\('http'\)/);
  });
});

describe('generate-invite-preview security (2026-07-29)', () => {
  it('uses trusted appBaseUrl resolution', () => {
    expect(invitePreview).toContain('resolveTrustedAppBaseUrl');
    expect(invitePreview).not.toMatch(
      /url\.searchParams\.get\('appBaseUrl'\) \|\| Deno\.env\.get\('SITE_URL'\)/,
    );
  });

  it('does not scrape private trips.description into OG HTML', () => {
    expect(invitePreview).toContain('buildPublicOgDescription');
    expect(invitePreview).not.toContain('description: trip.description');
  });
});

describe('get_events_in_user_tz hardening migration (2026-07-29)', () => {
  it('requires service_role or active membership and revokes anon execute', () => {
    expect(revokeMigration).toContain("auth.role() = 'service_role'");
    expect(revokeMigration).toContain('is_active_trip_member(auth.uid(), p_trip_id)');
    expect(revokeMigration).toContain(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
    );
    expect(revokeMigration).toContain('get_events_in_user_tz');
  });
});
