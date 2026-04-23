import { describe, expect, it } from 'vitest';
import { isTrustedStreamCanaryUser } from '../streamCanary';

describe('streamCanary trusted cohort classification', () => {
  it('accepts internal users by email domain', () => {
    expect(
      isTrustedStreamCanaryUser({
        id: 'u-1',
        email: 'engineer@chravelapp.com',
      }),
    ).toBe(true);
  });

  it('accepts trusted roles/permissions and rejects regular users', () => {
    expect(
      isTrustedStreamCanaryUser({
        id: 'u-2',
        permissions: ['chat.trusted.beta'],
      }),
    ).toBe(true);

    expect(
      isTrustedStreamCanaryUser({
        id: 'u-3',
        email: 'traveler@gmail.com',
        permissions: ['read'],
      }),
    ).toBe(false);
  });
});
