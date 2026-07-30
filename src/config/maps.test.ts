import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getGoogleMapsApiKey', () => {
  let warnSpy: any;
  let infoSpy: any;

  beforeEach(() => {
    vi.resetModules();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty string and warn if API key is not set', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    const { getGoogleMapsApiKey } = await import('./maps');

    expect(getGoogleMapsApiKey()).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_GOOGLE_MAPS_API_KEY is not set or invalid'),
    );
  });

  it('should return empty string and warn if API key is too short', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'shortkey');
    const { getGoogleMapsApiKey } = await import('./maps');

    expect(getGoogleMapsApiKey()).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_GOOGLE_MAPS_API_KEY is not set or invalid'),
    );
  });

  it('should return empty string and warn if API key is a placeholder', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'placeholder');
    const { getGoogleMapsApiKey } = await import('./maps');

    expect(getGoogleMapsApiKey()).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_GOOGLE_MAPS_API_KEY is not set or invalid'),
    );
  });

  it('should return empty string and warn if API key contains your_', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'your_api_key_here');
    const { getGoogleMapsApiKey } = await import('./maps');

    expect(getGoogleMapsApiKey()).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_GOOGLE_MAPS_API_KEY is not set or invalid'),
    );
  });

  it('should return empty string and warn if API key contains YOUR_', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'YOUR_API_KEY_HERE');
    const { getGoogleMapsApiKey } = await import('./maps');

    expect(getGoogleMapsApiKey()).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_GOOGLE_MAPS_API_KEY is not set or invalid'),
    );
  });

  it('should return the API key if it is valid', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'valid_google_maps_api_key_123');
    vi.stubEnv('DEV', 'true');
    const { getGoogleMapsApiKey } = await import('./maps');

    expect(getGoogleMapsApiKey()).toBe('valid_google_maps_api_key_123');
  });

  it('should only log the warning once', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    const { getGoogleMapsApiKey } = await import('./maps');

    getGoogleMapsApiKey();
    getGoogleMapsApiKey();
    getGoogleMapsApiKey();

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
