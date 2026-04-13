import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  getLaunchContext,
  NATIVE_APP_CONTEXT_QUERY_PARAM,
  NATIVE_APP_CONTEXT_QUERY_VALUE,
} from './launchContext';

const setLocationSearch = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      search,
    },
    configurable: true,
  });
};

describe('getLaunchContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setLocationSearch('');
  });

  it('returns browser when not standalone and no native launch param', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    setLocationSearch('');

    expect(getLaunchContext()).toBe('browser');
  });

  it('returns installed_app when native launch param is present', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    setLocationSearch(`?${NATIVE_APP_CONTEXT_QUERY_PARAM}=${NATIVE_APP_CONTEXT_QUERY_VALUE}`);

    expect(getLaunchContext()).toBe('installed_app');
  });

  it('returns installed_app when launched as standalone pwa', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    setLocationSearch('');

    expect(getLaunchContext()).toBe('installed_app');
  });
});
