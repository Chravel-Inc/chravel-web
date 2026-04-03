import { describe, expect, it } from 'vitest';
import { getBearerToken } from '../authHeaders.ts';

describe('getBearerToken', () => {
  it('returns null when header is missing', () => {
    expect(getBearerToken(null)).toBeNull();
  });

  it('returns null when header does not use Bearer format', () => {
    expect(getBearerToken('Basic abc123')).toBeNull();
  });

  it('returns null when bearer token value is empty', () => {
    expect(getBearerToken('Bearer   ')).toBeNull();
  });

  it('returns token when header is valid', () => {
    expect(getBearerToken('Bearer token-123')).toBe('token-123');
  });
});
