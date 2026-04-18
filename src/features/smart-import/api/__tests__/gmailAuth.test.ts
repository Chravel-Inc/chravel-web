import { describe, expect, it } from 'vitest';
import { resolveGmailOAuthRedirectUri } from '../gmailAuth';

describe('resolveGmailOAuthRedirectUri', () => {
  it('builds callback URI from current origin', () => {
    expect(resolveGmailOAuthRedirectUri()).toBe(
      `${window.location.origin}/api/gmail/oauth/callback`,
    );
  });
});
