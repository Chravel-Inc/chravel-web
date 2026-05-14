import { describe, it, expect } from 'vitest';
import { normalizeAuthErrorMessage } from '@/utils/authErrorNormalizer';

describe('normalizeAuthErrorMessage', () => {
  it('returns a generic message when input is null or empty', () => {
    expect(normalizeAuthErrorMessage(null)).toBe('Something went wrong. Please try again.');
    expect(normalizeAuthErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
    expect(normalizeAuthErrorMessage('')).toBe('Something went wrong. Please try again.');
  });

  it('rewrites WKWebView "Load failed" to an actionable network message', () => {
    expect(normalizeAuthErrorMessage('Load failed')).toBe(
      'Network issue while signing in. Please check your connection and try again.',
    );
  });

  it('rewrites "Failed to fetch" to an actionable network message', () => {
    expect(normalizeAuthErrorMessage('Failed to fetch')).toBe(
      'Network issue while signing in. Please check your connection and try again.',
    );
  });

  it('rewrites "Network request failed" to an actionable network message', () => {
    expect(normalizeAuthErrorMessage('Network request failed')).toBe(
      'Network issue while signing in. Please check your connection and try again.',
    );
  });

  it('rewrites timeout-style strings', () => {
    expect(normalizeAuthErrorMessage('Request timed out')).toBe(
      'Sign-in timed out. Please try again.',
    );
    expect(normalizeAuthErrorMessage('timeout')).toBe('Sign-in timed out. Please try again.');
  });

  it('preserves informative Supabase / provider messages verbatim', () => {
    expect(normalizeAuthErrorMessage('Invalid login credentials')).toBe(
      'Invalid login credentials',
    );
    expect(normalizeAuthErrorMessage('Email not confirmed')).toBe('Email not confirmed');
    expect(normalizeAuthErrorMessage('User already registered')).toBe('User already registered');
    expect(
      normalizeAuthErrorMessage('new row violates row-level security policy for table "trips"'),
    ).toBe('new row violates row-level security policy for table "trips"');
  });

  it('is case-insensitive when matching opaque network strings', () => {
    expect(normalizeAuthErrorMessage('LOAD FAILED')).toBe(
      'Network issue while signing in. Please check your connection and try again.',
    );
    expect(normalizeAuthErrorMessage('failed to FETCH')).toBe(
      'Network issue while signing in. Please check your connection and try again.',
    );
  });
});
