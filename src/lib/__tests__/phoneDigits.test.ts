import { describe, expect, it } from 'vitest';
import {
  looksLikeEmailContact,
  looksLikePhoneContact,
  normalizePhoneDigits,
  phoneLast10,
} from '../phoneDigits';

describe('phoneDigits', () => {
  it('strips formatting from phone numbers', () => {
    expect(normalizePhoneDigits('+1 (555) 123-4567')).toBe('15551234567');
    expect(normalizePhoneDigits('555-123-4567')).toBe('5551234567');
  });

  it('returns last 10 digits for US-style matching', () => {
    expect(phoneLast10('15551234567')).toBe('5551234567');
    expect(phoneLast10('5551234567')).toBe('5551234567');
  });

  it('validates email and phone contact shapes', () => {
    expect(looksLikeEmailContact('friend@email.com')).toBe(true);
    expect(looksLikeEmailContact('not-an-email')).toBe(false);
    expect(looksLikePhoneContact('+1 555 123 4567')).toBe(true);
    expect(looksLikePhoneContact('123')).toBe(false);
  });
});
