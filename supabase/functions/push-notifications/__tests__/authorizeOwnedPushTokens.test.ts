import { describe, expect, it } from 'vitest';
import { authorizeOwnedPushTokens } from '../authorizeOwnedPushTokens.ts';

describe('authorizeOwnedPushTokens', () => {
  it('uses all owned tokens when the caller does not request a subset', () => {
    expect(
      authorizeOwnedPushTokens({
        ownedTokens: ['token-a', 'token-b'],
      }),
    ).toEqual({
      ok: true,
      targetTokens: ['token-a', 'token-b'],
    });
  });

  it('allows a requested subset when every token belongs to the caller', () => {
    expect(
      authorizeOwnedPushTokens({
        ownedTokens: ['token-a', 'token-b'],
        requestedTokens: ['token-b'],
      }),
    ).toEqual({
      ok: true,
      targetTokens: ['token-b'],
    });
  });

  it('rejects requests containing tokens not owned by the caller', () => {
    expect(
      authorizeOwnedPushTokens({
        ownedTokens: ['token-a'],
        requestedTokens: ['token-a', 'token-b'],
      }),
    ).toEqual({
      ok: false,
      status: 403,
      error: 'Cannot send push notifications to tokens not owned by the authenticated user',
    });
  });

  it('rejects push sends when the caller has no active tokens', () => {
    expect(
      authorizeOwnedPushTokens({
        ownedTokens: [],
      }),
    ).toEqual({
      ok: false,
      status: 404,
      error: 'No active push tokens found for this user',
    });
  });
});
