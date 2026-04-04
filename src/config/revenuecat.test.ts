import { describe, expect, it, vi, afterEach } from 'vitest';
import { canInitializeRevenueCat, generateAnonymousUserId } from './revenuecat';

describe('canInitializeRevenueCat', () => {
  it('skips initialization in Lovable preview', () => {
    expect(canInitializeRevenueCat('rcb_valid_web_key', true)).toBe(false);
  });

  it('skips initialization when the key is missing', () => {
    expect(canInitializeRevenueCat('', false)).toBe(false);
    expect(canInitializeRevenueCat('   ', false)).toBe(false);
  });

  it('skips initialization for non-web RevenueCat keys', () => {
    expect(canInitializeRevenueCat('appl_native_key', false)).toBe(false);
    expect(canInitializeRevenueCat('goog_native_key', false)).toBe(false);
  });

  it('allows initialization for valid web billing keys outside preview', () => {
    expect(canInitializeRevenueCat('rcb_valid_web_key', false)).toBe(true);
  });
});

describe('generateAnonymousUserId', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    globalThis.crypto = originalCrypto;
  });

  it('generates an ID using crypto.randomUUID if available', () => {
    const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: vi.fn().mockReturnValue(mockUUID),
      },
      writable: true,
      configurable: true,
    });

    const id = generateAnonymousUserId();
    expect(id).toBe(`anon_${mockUUID}`);
    expect(globalThis.crypto.randomUUID).toHaveBeenCalled();
  });

  it('generates an ID using crypto.getRandomValues if randomUUID is not available', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: vi.fn((array: Uint8Array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = i; // Mocking some byte values
          }
          return array;
        }),
      },
      writable: true,
      configurable: true,
    });

    const id = generateAnonymousUserId();
    expect(id).toMatch(/^anon_[0-9a-f]{32}$/);
    expect(globalThis.crypto.getRandomValues).toHaveBeenCalled();
  });

  it('throws an error if no crypto API is available', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(() => generateAnonymousUserId()).toThrowError(
      'Web Crypto API is required for secure ID generation',
    );
  });
});
