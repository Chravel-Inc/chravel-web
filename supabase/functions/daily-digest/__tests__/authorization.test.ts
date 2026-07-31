import { describe, expect, it } from 'vitest';
import { authorizeDailyDigestUser } from '../authorization';

describe('daily-digest authorization', () => {
  it('defaults missing user_id to the authenticated user', () => {
    expect(
      authorizeDailyDigestUser({
        authenticatedUserId: 'user-123',
        requestedUserId: undefined,
      }),
    ).toEqual({
      ok: true,
      userId: 'user-123',
    });
  });

  it('allows callers to request their own digest explicitly', () => {
    expect(
      authorizeDailyDigestUser({
        authenticatedUserId: 'user-123',
        requestedUserId: 'user-123',
      }),
    ).toEqual({
      ok: true,
      userId: 'user-123',
    });
  });

  it('blocks callers from requesting another users digest', () => {
    expect(
      authorizeDailyDigestUser({
        authenticatedUserId: 'user-123',
        requestedUserId: 'user-456',
      }),
    ).toEqual({
      ok: false,
      error: 'Forbidden',
      status: 403,
    });
  });
});
