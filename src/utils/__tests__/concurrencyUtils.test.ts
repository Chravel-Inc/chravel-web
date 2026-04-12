import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateMutationId, rateLimiter } from '../concurrencyUtils';
import type { OfflineQueue } from '../concurrencyUtils';

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
        randomUUID: vi.fn().mockReturnValue(mockUUID),
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

describe('OfflineQueue', () => {
  let queue: OfflineQueue;
  let setOnline: (online: boolean) => void;
  let originalConsoleError: typeof console.error;

  beforeEach(async () => {
    originalConsoleError = console.error;
    console.error = vi.fn();
    const concurrencyUtils = await import('../concurrencyUtils');
    const { OfflineQueue, connectionMonitor } = concurrencyUtils;

    // @ts-expect-error accessing private property for testing
    connectionMonitor.listeners.clear();
    // @ts-expect-error accessing private property for testing
    connectionMonitor.isOnline = true;

    setOnline = (online: boolean) => {
      // @ts-expect-error accessing private property for testing
      connectionMonitor.isOnline = online;
      // @ts-expect-error accessing private property for testing
      connectionMonitor.listeners.forEach((listener: (online: boolean) => void) =>
        listener(online),
      );
    };

    queue = new OfflineQueue();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  it('should process operations immediately when online', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    queue.add('1', operation);

    // Wait for processQueue async method to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should defer operations when offline and process them when back online', async () => {
    setOnline(false);
    const operation = vi.fn().mockResolvedValue('success');

    queue.add('1', operation);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(operation).toHaveBeenCalledTimes(0);

    // Come back online
    setOnline(true);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry failed operations up to 3 times', async () => {
    const error = new Error('Test error');
    const operation = vi.fn().mockImplementation(() => {
      return Promise.reject(error);
    });

    queue.add('1', operation);

    // Wait for all retries to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(operation).toHaveBeenCalledTimes(3); // Initial call + 2 retries (based on < 3 check)
    expect(console.error).toHaveBeenCalledWith(
      'Failed to process queued operation 1 after 3 attempts:',
      error,
    );
  });
});
