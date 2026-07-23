import { describe, expect, it } from 'vitest';
import { resolveGoogleCalendarOAuthRedirectUri } from '../googleCalendarAuth';

describe('resolveGoogleCalendarOAuthRedirectUri', () => {
  it('builds the callback URI from the current origin', () => {
    expect(resolveGoogleCalendarOAuthRedirectUri()).toBe(
      `${window.location.origin}/api/google-calendar/oauth/callback`,
    );
  });

  it('uses a distinct path from the Gmail OAuth callback', () => {
    // Guards against copy-paste collision — the two OAuth flows must not share
    // a redirect path, or Google would hand a calendar code to the Gmail handler.
    expect(resolveGoogleCalendarOAuthRedirectUri()).toContain(
      '/api/google-calendar/oauth/callback',
    );
    expect(resolveGoogleCalendarOAuthRedirectUri()).not.toContain('/api/gmail/');
  });
});
