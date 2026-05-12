import { afterEach, describe, expect, it, vi } from 'vitest';
import { openInstalledAuthBrowser } from '@/utils/installedAuthBrowser';

describe('openInstalledAuthBrowser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as unknown as { ChravelNative?: unknown }).ChravelNative;
  });

  it('uses ChravelNative.openOAuthUrl when the bridge is present', async () => {
    const nativeOpen = vi.fn().mockResolvedValue(undefined);
    (window as unknown as { ChravelNative: { openOAuthUrl: typeof nativeOpen } }).ChravelNative = {
      openOAuthUrl: nativeOpen,
    };

    await openInstalledAuthBrowser('https://oauth.example/start');

    expect(nativeOpen).toHaveBeenCalledWith('https://oauth.example/start');
  });

  it('falls back to location.assign when no native opener exists', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    await openInstalledAuthBrowser('https://oauth.example/start');

    expect(assign).toHaveBeenCalledWith('https://oauth.example/start');
  });
});
