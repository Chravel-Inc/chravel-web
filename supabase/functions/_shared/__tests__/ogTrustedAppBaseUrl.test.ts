import { beforeEach, describe, expect, it, vi } from 'vitest';

const envMap = new Map<string, string>();

vi.stubGlobal('Deno', {
  env: { get: (key: string) => envMap.get(key) ?? undefined },
});

describe('resolveTrustedAppBaseUrl / resolveTrustedCanonicalUrl', () => {
  beforeEach(() => {
    vi.resetModules();
    envMap.clear();
  });

  async function load() {
    return import('../ogUtils.ts');
  }

  it('falls back to SITE_URL / chravel.app when candidate is missing', async () => {
    const { resolveTrustedAppBaseUrl } = await load();
    expect(resolveTrustedAppBaseUrl(null)).toBe('https://chravel.app');
    expect(resolveTrustedAppBaseUrl('')).toBe('https://chravel.app');

    envMap.set('SITE_URL', 'https://app.chravelapp.com/');
    vi.resetModules();
    const { resolveTrustedAppBaseUrl: resolve2 } = await load();
    expect(resolve2(undefined)).toBe('https://app.chravelapp.com');
  });

  it('accepts first-party app hosts', async () => {
    const { resolveTrustedAppBaseUrl } = await load();
    expect(resolveTrustedAppBaseUrl('https://chravel.app')).toBe('https://chravel.app');
    expect(resolveTrustedAppBaseUrl('https://www.chravel.app/')).toBe('https://www.chravel.app');
    expect(resolveTrustedAppBaseUrl('https://app.chravel.com')).toBe('https://app.chravel.com');
  });

  it('rejects attacker-controlled appBaseUrl (open redirect)', async () => {
    const { resolveTrustedAppBaseUrl } = await load();
    expect(resolveTrustedAppBaseUrl('https://evil.example')).toBe('https://chravel.app');
    expect(resolveTrustedAppBaseUrl('https://evil.example/phish')).toBe('https://chravel.app');
    expect(resolveTrustedAppBaseUrl('javascript:alert(1)')).toBe('https://chravel.app');
    expect(resolveTrustedAppBaseUrl('http://evil.example')).toBe('https://chravel.app');
  });

  it('accepts exact ADDITIONAL_ALLOWED_ORIGINS matches only', async () => {
    envMap.set('ADDITIONAL_ALLOWED_ORIGINS', 'https://preview.example.com,.vercel.app');
    const { resolveTrustedAppBaseUrl } = await load();
    expect(resolveTrustedAppBaseUrl('https://preview.example.com')).toBe(
      'https://preview.example.com',
    );
    // Wildcard subdomain entries are ignored (same policy as CORS).
    expect(resolveTrustedAppBaseUrl('https://foo.vercel.app')).toBe('https://chravel.app');
  });

  it('rejects untrusted canonicalUrl and keeps fallback', async () => {
    const { resolveTrustedCanonicalUrl } = await load();
    const fallback = 'https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/generate-trip-preview';
    expect(resolveTrustedCanonicalUrl('https://evil.example/x', fallback)).toBe(fallback);
    expect(resolveTrustedCanonicalUrl('https://chravel.app/trip/1/preview', fallback)).toBe(
      'https://chravel.app/trip/1/preview',
    );
  });

  it('builds public OG description without private free-text', async () => {
    const { buildPublicOgDescription } = await load();
    expect(
      buildPublicOgDescription({
        location: 'Paris',
        dateRange: 'Jul 1 - Jul 5',
        participantCount: 4,
      }),
    ).toBe('📍 Paris • 📅 Jul 1 - Jul 5 • 4 Chravelers');
  });
});
