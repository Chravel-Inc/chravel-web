import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getOAuthRedirectOrigin,
  isCapacitorNativeShell,
  isInstalledApp,
  isLikelyMobileDevice,
  isNativeWebView,
  isStandalonePWA,
} from '@/utils/platformDetection';

const originalLocation = window.location;

const setUserAgent = (value: string) => {
  vi.stubGlobal('navigator', {
    ...navigator,
    userAgent: value,
  });
};

const setMatchMedia = (matches: boolean) => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
};

const setLocationSearch = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      ...originalLocation,
      search,
    },
    configurable: true,
  });
};

describe('platformDetection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
  });

  it('does not classify desktop standalone context as installed app', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    );
    setMatchMedia(true);
    setLocationSearch('');

    expect(isStandalonePWA()).toBe(true);
    expect(isLikelyMobileDevice()).toBe(false);
    expect(isInstalledApp()).toBe(false);
  });

  it('classifies mobile standalone context as installed app', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    setMatchMedia(true);
    setLocationSearch('');

    expect(isLikelyMobileDevice()).toBe(true);
    expect(isInstalledApp()).toBe(true);
  });

  it('always treats native app_context as installed', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    );
    setMatchMedia(false);
    setLocationSearch('?app_context=native');

    expect(isNativeWebView()).toBe(true);
    expect(isInstalledApp()).toBe(true);
  });

  it('detects Capacitor TestFlight shell even when UA looks like mobile Safari', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    setMatchMedia(false);
    setLocationSearch('');
    Object.defineProperty(window, 'Capacitor', {
      value: { isNativePlatform: () => true },
      configurable: true,
    });

    expect(isCapacitorNativeShell()).toBe(true);
    expect(isNativeWebView()).toBe(true);
    expect(isInstalledApp()).toBe(true);
  });

  it('does not treat Capacitor web preview as native shell', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    );
    setMatchMedia(false);
    setLocationSearch('');
    Object.defineProperty(window, 'Capacitor', {
      value: { isNativePlatform: () => false },
      configurable: true,
    });

    expect(isCapacitorNativeShell()).toBe(false);
    expect(isNativeWebView()).toBe(false);
  });

  describe('getOAuthRedirectOrigin', () => {
    it('returns production URL for Capacitor native shell', () => {
      setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
      setMatchMedia(false);
      setLocationSearch('');
      Object.defineProperty(window, 'Capacitor', {
        value: { isNativePlatform: () => true },
        configurable: true,
      });

      const result = getOAuthRedirectOrigin();
      expect(result).toBe('https://chravel.app');
    });

    it('returns production URL for native webview (app_context=native)', () => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36');
      setMatchMedia(false);
      setLocationSearch('?app_context=native');

      const result = getOAuthRedirectOrigin();
      expect(result).toBe('https://chravel.app');
    });

    it('returns production URL for mobile standalone PWA', () => {
      setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      );
      setMatchMedia(true);
      setLocationSearch('');

      const result = getOAuthRedirectOrigin();
      expect(result).toBe('https://chravel.app');
    });

    it('returns window.location.origin for desktop browser', () => {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      );
      setMatchMedia(false);
      setLocationSearch('');
      // Mock window.location.origin for test
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          origin: 'http://localhost:5173',
          search: '',
        },
        configurable: true,
      });

      const result = getOAuthRedirectOrigin();
      expect(result).toBe('http://localhost:5173');
    });
  });
});
