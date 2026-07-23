import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 2026-07-23 — get-trip-preview data-minimization.
 *
 * The unauthenticated share-link preview returned the free-text trip `description`
 * for ANY trip UUID and did not check archived/hidden state. Description can hold
 * private trip details, and a link to a deleted/archived trip must not leak its
 * metadata. The fix exposes `description` only to members and 404s archived/hidden
 * trips for non-members. name/destination/cover remain public for social previews.
 */

const repoRoot = resolve(__dirname, '../../../..');
const src = readFileSync(resolve(repoRoot, 'supabase/functions/get-trip-preview/index.ts'), 'utf8');

describe('get-trip-preview description gate (2026-07-23)', () => {
  it('exposes description only to members', () => {
    expect(src).toContain('description: isTripMember ? tripRow.description : null');
  });

  it('selects archived/hidden flags and 404s them for non-members', () => {
    expect(src).toContain('is_archived, is_hidden');
    expect(src).toMatch(/\(tripRow\.is_archived \|\| tripRow\.is_hidden\) && !isTripMember/);
  });

  it('no longer unconditionally returns the raw description', () => {
    // The old `description: tripRow.description,` shape (unconditional) must be gone
    // from the DB-backed trip object. (Demo trips keep a static public description.)
    expect(src).not.toContain(
      'member_count: memberCount ?? 0,\n      description: tripRow.description,',
    );
  });
});
