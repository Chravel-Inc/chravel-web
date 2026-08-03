import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 2026-08-02 — invite surface hardening.
 *
 * 1) get-invite-preview must not expose trip-internal itinerary/poll content to an
 *    unauthenticated caller. Holding (or guessing) an invite code is not authorization to
 *    read the group's schedule. Public trip metadata (name/destination/dates/cover) stays
 *    unauthenticated so shared links still preview.
 * 2) add-trip-member-by-contact distinguishes USER_NOT_FOUND from success/ALREADY_MEMBER,
 *    which is an account-existence oracle. Those responses are required for the feature's
 *    UX, so probe volume must be capped by a per-caller rate limit instead.
 */

const repoRoot = resolve(__dirname, '../../..');
const invitePreview = readFileSync(
  resolve(repoRoot, 'supabase/functions/get-invite-preview/index.ts'),
  'utf8',
);
const addByContact = readFileSync(
  resolve(repoRoot, 'supabase/functions/add-trip-member-by-contact/index.ts'),
  'utf8',
);

describe('get-invite-preview itinerary/poll gating', () => {
  it('resolves the caller from the Authorization header before returning private previews', () => {
    expect(invitePreview).toContain('isAuthenticatedViewer');
    expect(invitePreview).toMatch(/auth\.getUser\(previewToken\)/);
  });

  it('fetches trip_events and trip_polls only inside the authenticated branch', () => {
    const guardIndex = invitePreview.indexOf('if (isAuthenticatedViewer) {');
    expect(guardIndex).toBeGreaterThan(-1);

    // Both private reads must appear after the auth guard, not in the public query path.
    expect(invitePreview.indexOf("from('trip_events')")).toBeGreaterThan(guardIndex);
    expect(invitePreview.indexOf("from('trip_polls')")).toBeGreaterThan(guardIndex);
  });

  it('defaults both private previews to empty for unauthenticated callers', () => {
    expect(invitePreview).toMatch(/let itineraryPreview[^=]*=\s*\[\]/);
    expect(invitePreview).toMatch(/let pollsPreview[^=]*=\s*\[\]/);
  });

  it('still exposes public trip metadata without auth (shared links must preview)', () => {
    expect(invitePreview).toContain("from('trips')");
    expect(invitePreview).toContain('cover_image_url');
  });
});

describe('add-trip-member-by-contact enumeration throttle', () => {
  it('applies a per-caller rate limit before performing the contact lookup', () => {
    expect(addByContact).toContain('applyRateLimit');
    expect(addByContact).toContain('add-member-by-contact:${caller.id}');

    const rateLimitIndex = addByContact.indexOf('applyRateLimit({');
    const lookupIndex = addByContact.indexOf('lookup_user_id_by_contact');
    expect(rateLimitIndex).toBeGreaterThan(-1);
    expect(lookupIndex).toBeGreaterThan(rateLimitIndex);
  });

  it('fails closed by returning the limiter response when the cap is exceeded', () => {
    expect(addByContact).toMatch(/if \(!rateLimit\.allowed\) return rateLimit\.response!/);
  });
});
