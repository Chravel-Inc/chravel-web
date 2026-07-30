import { describe, expect, it } from 'vitest';
import { authorizeDigestScope } from '../authorizeDigestScope.ts';

describe('authorizeDigestScope', () => {
  it('binds omitted user_id requests to the authenticated user', () => {
    expect(authorizeDigestScope('user-123')).toEqual({
      ok: true,
      userId: 'user-123',
    });
  });

  it('allows callers to request their own digest explicitly', () => {
    expect(authorizeDigestScope('user-123', 'user-123')).toEqual({
      ok: true,
      userId: 'user-123',
    });
  });

  it('rejects cross-user digest access attempts', () => {
    expect(authorizeDigestScope('user-123', 'victim-456')).toEqual({
      ok: false,
      status: 403,
      error: "Cannot access another user's digest",
    });
  });

  it('treats blank user_id values as omitted', () => {
    expect(authorizeDigestScope('user-123', '   ')).toEqual({
      ok: true,
      userId: 'user-123',
    });
  });
});
