import { describe, expect, it } from 'vitest';
import { extractFunctionErrorMessage, resolveGmailOAuthRedirectUri } from '../gmailAuth';

describe('resolveGmailOAuthRedirectUri', () => {
  it('builds callback URI from current origin', () => {
    expect(resolveGmailOAuthRedirectUri()).toBe(
      `${window.location.origin}/api/gmail/oauth/callback`,
    );
  });
});

describe('extractFunctionErrorMessage', () => {
  it('extracts backend error field from function error context payloads', async () => {
    const mockError = {
      context: {
        json: async () => ({ error: 'GOOGLE_CLIENT_ID secret is not set.' }),
      },
    };

    const message = await extractFunctionErrorMessage(mockError as unknown, 'fallback message');

    expect(message).toBe('GOOGLE_CLIENT_ID secret is not set.');
  });

  it('falls back to provided message for unknown errors', async () => {
    const message = await extractFunctionErrorMessage({ random: true }, 'fallback message');
    expect(message).toBe('fallback message');
  });
});
