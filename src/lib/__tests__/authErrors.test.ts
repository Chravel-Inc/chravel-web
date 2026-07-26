import { describe, it, expect } from 'vitest';
import {
  GENERIC_SIGN_IN_ERROR,
  GENERIC_SIGN_UP_RESULT,
  GENERIC_PASSWORD_RESET_RESULT,
  GENERIC_AUTH_ERROR,
  toSafeSignUpError,
  signInBackoffMs,
} from '../authErrors';

describe('authErrors', () => {
  describe('toSafeSignUpError', () => {
    it('keeps password complexity feedback, which does not depend on account existence', () => {
      expect(toSafeSignUpError('Password should be at least 6 characters')).toMatch(/password/i);
    });

    it('collapses account-existence signals to the generic error', () => {
      expect(toSafeSignUpError('User already registered')).toBe(GENERIC_AUTH_ERROR);
      expect(toSafeSignUpError('A user with this email address has already been registered')).toBe(
        GENERIC_AUTH_ERROR,
      );
    });

    it('never echoes raw provider text', () => {
      const providerLeak = 'duplicate key value violates unique constraint "users_email_key"';
      expect(toSafeSignUpError(providerLeak)).toBe(GENERIC_AUTH_ERROR);
      expect(toSafeSignUpError(providerLeak)).not.toContain('users_email_key');
    });
  });

  describe('enumeration safety of the shared strings', () => {
    it('uses one sign-in message for both wrong-password and unconfirmed-account', () => {
      // The whole point: an attacker must not be able to tell these apart.
      expect(GENERIC_SIGN_IN_ERROR).not.toMatch(/not confirmed|unconfirmed|already|exists/i);
    });

    it('does not assert that an account was or was not created/found', () => {
      expect(GENERIC_SIGN_UP_RESULT).toMatch(/if an account/i);
      expect(GENERIC_PASSWORD_RESET_RESULT).toMatch(/if an account/i);
    });
  });

  describe('signInBackoffMs', () => {
    it('does not penalise ordinary typos', () => {
      expect(signInBackoffMs(0)).toBe(0);
      expect(signInBackoffMs(1)).toBe(0);
      expect(signInBackoffMs(2)).toBe(0);
    });

    it('escalates with repeated failures', () => {
      expect(signInBackoffMs(3)).toBeGreaterThan(0);
      expect(signInBackoffMs(5)).toBeGreaterThan(signInBackoffMs(3));
      expect(signInBackoffMs(8)).toBeGreaterThan(signInBackoffMs(5));
    });

    it('is monotonic — a further failure never reduces the delay', () => {
      for (let attempts = 0; attempts < 20; attempts += 1) {
        expect(signInBackoffMs(attempts + 1)).toBeGreaterThanOrEqual(signInBackoffMs(attempts));
      }
    });
  });
});
