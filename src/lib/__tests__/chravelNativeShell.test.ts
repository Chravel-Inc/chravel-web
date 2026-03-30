import { describe, expect, it, vi, afterEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { isChravelNativeAuthShell } from '../chravelNativeShell';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

describe('isChravelNativeAuthShell', () => {
  const originalUA = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  afterEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });

  it('returns false on typical web UA when Capacitor is not native', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Chrome/120',
      configurable: true,
    });
    expect(isChravelNativeAuthShell()).toBe(false);
  });

  it('returns true when user agent contains despia', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 despia/1.0',
      configurable: true,
    });
    expect(isChravelNativeAuthShell()).toBe(true);
  });

  it('returns true when Capacitor reports native platform', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0',
      configurable: true,
    });
    expect(isChravelNativeAuthShell()).toBe(true);
  });
});
