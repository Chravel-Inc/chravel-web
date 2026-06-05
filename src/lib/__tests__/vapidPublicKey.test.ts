import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __resetVapidPublicKeyCacheForTests,
  getVapidPublicKeyFromEnv,
  resolveVapidPublicKey,
} from '@/lib/vapidPublicKey';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('vapidPublicKey', () => {
  afterEach(() => {
    __resetVapidPublicKeyCacheForTests();
    vi.clearAllMocks();
  });

  it('getVapidPublicKeyFromEnv returns empty when unset', () => {
    expect(getVapidPublicKeyFromEnv()).toBeNull();
  });

  it('resolveVapidPublicKey fetches from push-client-config when env missing', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { vapidPublicKey: 'test-public-key' },
      error: null,
    } as never);

    await expect(resolveVapidPublicKey()).resolves.toBe('test-public-key');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('push-client-config');
  });
});
