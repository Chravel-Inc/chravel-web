/**
 * Usage-limit resolution spec for the InviteModal "Limit uses" control.
 *
 * resolveMaxUses maps the preset (off / 10 / 25 / 50 / custom) and the
 * committed custom value to the max_uses persisted on the invite.
 */
import { describe, expect, it, vi } from 'vitest';

// InviteModal imports useInviteLink (supabase client, toasts) at module load;
// mock the heavy edges so this stays a pure unit test of the resolver.
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getUser: vi.fn() }, rpc: vi.fn(), from: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/hooks/useDemoMode', () => ({ useDemoMode: () => ({ isDemoMode: false }) }));

import { MAX_CUSTOM_USAGE_LIMIT, resolveMaxUses } from '../InviteModal';

describe('resolveMaxUses', () => {
  it('returns null when the limit is off', () => {
    expect(resolveMaxUses('off', '')).toBeNull();
    expect(resolveMaxUses('off', '50')).toBeNull();
  });

  it('returns the numeric preset values', () => {
    expect(resolveMaxUses('10', '')).toBe(10);
    expect(resolveMaxUses('25', '')).toBe(25);
    expect(resolveMaxUses('50', '')).toBe(50);
  });

  it('parses valid custom values', () => {
    expect(resolveMaxUses('custom', '7')).toBe(7);
    expect(resolveMaxUses('custom', ' 120 ')).toBe(120);
  });

  it('treats invalid custom values as unlimited (null)', () => {
    expect(resolveMaxUses('custom', '')).toBeNull();
    expect(resolveMaxUses('custom', '0')).toBeNull();
    expect(resolveMaxUses('custom', '-3')).toBeNull();
    expect(resolveMaxUses('custom', 'abc')).toBeNull();
  });

  it('caps custom values at the maximum custom limit', () => {
    expect(resolveMaxUses('custom', '999999')).toBe(MAX_CUSTOM_USAGE_LIMIT);
  });
});
