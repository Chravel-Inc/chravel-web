import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateMutationId, rateLimiter } from '../concurrencyUtils';

describe('concurrencyUtils', () => {
  describe('generateMutationId', () => {
    let originalCrypto: Crypto;

    beforeEach(() => {
      originalCrypto = globalThis.crypto;
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
      vi.restoreAllMocks();
    });

    it('should use crypto.randomUUID when available', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      const mockCrypto = {
        randomUUID: vi.fn().mockReturnValue(mockUUID)
      };

      Object.defineProperty(globalThis, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true,
      });

      const id = generateMutationId();
      expect(mockCrypto.randomUUID).toHaveBeenCalled();
      expect(id).toBe(mockUUID);
    });

    it('should use fallback logic when crypto.randomUUID is not available', () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const id = generateMutationId();
      expect(id).toMatch(/^mut_\d+_[a-z0-9]+$/);
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Need to reset the rate limiter map or use a new instance for isolated tests
      // Since we export a singleton, we need to mock or clear its internal map
      // A cleaner way is to just use unique keys per test
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow requests within limit', () => {
      const key = 'test-key-1';
      expect(rateLimiter.checkLimit(key, 3, 1000)).toBe(true);
      expect(rateLimiter.getRemainingAttempts(key, 3)).toBe(2);

      expect(rateLimiter.checkLimit(key, 3, 1000)).toBe(true);
      expect(rateLimiter.getRemainingAttempts(key, 3)).toBe(1);

      expect(rateLimiter.checkLimit(key, 3, 1000)).toBe(true);
      expect(rateLimiter.getRemainingAttempts(key, 3)).toBe(0);
    });

    it('should block requests over limit', () => {
      const key = 'test-key-2';
      expect(rateLimiter.checkLimit(key, 2, 1000)).toBe(true);
      expect(rateLimiter.checkLimit(key, 2, 1000)).toBe(true);

      // Third attempt should fail
      expect(rateLimiter.checkLimit(key, 2, 1000)).toBe(false);
      expect(rateLimiter.getRemainingAttempts(key, 2)).toBe(0);
    });

    it('should reset after window expires', () => {
      const key = 'test-key-3';
      const windowMs = 1000;

      // Exhaust limits
      expect(rateLimiter.checkLimit(key, 1, windowMs)).toBe(true);
      expect(rateLimiter.checkLimit(key, 1, windowMs)).toBe(false);

      // Fast forward past window
      vi.advanceTimersByTime(windowMs + 1);

      // Should work again
      expect(rateLimiter.checkLimit(key, 1, windowMs)).toBe(true);
      expect(rateLimiter.getRemainingAttempts(key, 1)).toBe(0);
    });

    it('should track keys independently', () => {
      const key1 = 'test-key-4';
      const key2 = 'test-key-5';

      // Exhaust limits for key1
      expect(rateLimiter.checkLimit(key1, 1, 1000)).toBe(true);
      expect(rateLimiter.checkLimit(key1, 1, 1000)).toBe(false);

      // key2 should still have its limit
      expect(rateLimiter.checkLimit(key2, 1, 1000)).toBe(true);
      expect(rateLimiter.getRemainingAttempts(key2, 1)).toBe(0);
      expect(rateLimiter.getRemainingAttempts(key1, 1)).toBe(0);
    });
  });
});
