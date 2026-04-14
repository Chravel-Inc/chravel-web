import { afterEach, describe, expect, it, vi } from 'vitest';
import {
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
});
