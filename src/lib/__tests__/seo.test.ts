import { describe, expect, it } from 'vitest';
import { canonicalUrl, shouldNoindex, PUBLIC_SEO_ROUTES, getPublicSeoRoute } from '@/lib/seo';

describe('seo config', () => {
  it('builds canonical urls from chravel production domain', () => {
    expect(canonicalUrl('/group-travel')).toBe('https://chravelapp.com/group-travel');
  });

  it('flags admin and private app routes as noindex', () => {
    expect(shouldNoindex('/admin/seo')).toBe(true);
    expect(shouldNoindex('/trip/123')).toBe(true);
    expect(shouldNoindex('/group-travel')).toBe(false);
  });

  it('contains high-priority public seo pages', () => {
    const paths = PUBLIC_SEO_ROUTES.map(route => route.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/group-trip-planner',
        '/group-travel',
        '/trip-planner',
        '/how-to-plan-a-trip-with-friends',
      ]),
    );
  });

  it('uses one source of truth for route seo configs', () => {
    const config = getPublicSeoRoute('/group-travel');
    expect(config?.title).toBe('Group Travel Coordination Platform | ChravelApp');
  });
});
