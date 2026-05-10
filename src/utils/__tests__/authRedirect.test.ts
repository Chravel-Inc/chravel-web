import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthRedirectUrl } from '@/utils/authRedirect';

const originalLocation = window.location;

// A standard desktop Chrome UA — does NOT match the iOS WKWebView heuristic
// in platformDetection, so isInstalledApp() returns false unless we explicitly
// install Capacitor or matchMedia(standalone) below.
const DESKTOP_CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const setLocation = (origin: string, search = '') => {
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, origin, search, hash: '' },
    configurable: true,
  });
};

const installCapacitor = (isNative: boolean) => {
  Object.defineProperty(window, 'Capacitor', {
    value: { isNativePlatform: () => isNative },
    configurable: true,
  });
};

describe('getAuthRedirectUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { ...navigator, userAgent: DESKTOP_CHROME_UA });
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    setLocation('http://localhost:3000');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    delete (window as unknown as { ChravelNative?: unknown }).ChravelNative;
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
  });

  it('uses chravel.app/auth-callback for installed (Capacitor) shells', () => {
    installCapacitor(true);
    expect(getAuthRedirectUrl()).toBe('https://chravel.app/auth-callback');
  });

  it('uses the current origin /auth for web', () => {
    setLocation('https://preview-abc.vercel.app');
    expect(getAuthRedirectUrl()).toBe('https://preview-abc.vercel.app/auth');
  });

  it('encodes a same-origin returnTo override on the resolved URL', () => {
    installCapacitor(true);
    expect(getAuthRedirectUrl('/trip/abc?x=1')).toBe(
      `https://chravel.app/auth-callback?returnTo=${encodeURIComponent('/trip/abc?x=1')}`,
    );
  });

  it('drops a malicious returnTo override and falls back to no query', () => {
    installCapacitor(true);
    expect(getAuthRedirectUrl('https://evil.example')).toBe('https://chravel.app/auth-callback');
    expect(getAuthRedirectUrl('//evil.example')).toBe('https://chravel.app/auth-callback');
  });

  it('falls back to the current URL returnTo query when no override is supplied', () => {
    setLocation('http://localhost:3000', '?returnTo=%2Fjoin%2FCODE');
    expect(getAuthRedirectUrl()).toBe(
      `http://localhost:3000/auth?returnTo=${encodeURIComponent('/join/CODE')}`,
    );
  });

  it('ignores a malicious returnTo query', () => {
    setLocation('http://localhost:3000', '?returnTo=https%3A%2F%2Fevil.example');
    expect(getAuthRedirectUrl()).toBe('http://localhost:3000/auth');
  });
});
