import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCoMemberProfiles, displayNameFor } from '../coMemberProfiles';
import { supabase } from '@/integrations/supabase/client';
import { UNKNOWN_MEMBER_LABEL } from '@/lib/resolveDisplayName';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));

/**
 * `profiles` has exactly one SELECT policy (auth.uid() = user_id) and
 * `profiles_public` is security_invoker, so any surface reading them to label
 * OTHER people resolves the viewer and nobody else. These surfaces go through
 * get_co_member_profiles instead.
 */
describe('fetchCoMemberProfiles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves co-member names through the RPC, keyed by user_id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        { user_id: 'u1', resolved_display_name: 'Darren Gee', avatar_url: 'a1.png' },
        { user_id: 'u2', resolved_display_name: 'Sam Rivera', avatar_url: null },
      ],
      error: null,
    } as never);

    const result = await fetchCoMemberProfiles(['u1', 'u2']);

    expect(supabase.rpc).toHaveBeenCalledWith('get_co_member_profiles', {
      p_user_ids: ['u1', 'u2'],
    });
    expect(result.get('u1')?.resolved_display_name).toBe('Darren Gee');
    expect(result.get('u2')?.resolved_display_name).toBe('Sam Rivera');
  });

  it('deduplicates ids and skips the round trip when there is nothing to resolve', async () => {
    await fetchCoMemberProfiles([]);
    expect(supabase.rpc).not.toHaveBeenCalled();

    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as never);
    await fetchCoMemberProfiles(['u1', 'u1', 'u1']);
    expect(supabase.rpc).toHaveBeenCalledWith('get_co_member_profiles', { p_user_ids: ['u1'] });
  });

  it('degrades to an empty map rather than throwing when the lookup fails', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    } as never);

    // Name resolution is presentational — it must not take down the payments view.
    await expect(fetchCoMemberProfiles(['u1'])).resolves.toBeInstanceOf(Map);
    expect((await fetchCoMemberProfiles(['u1'])).size).toBe(0);
  });
});

describe('displayNameFor', () => {
  const profiles = new Map([
    ['u1', { user_id: 'u1', resolved_display_name: 'Darren Gee', avatar_url: null }],
  ]);

  it('prefers a snapshot the caller already holds', () => {
    expect(displayNameFor('u1', profiles, 'Snapshot Name')).toBe('Snapshot Name');
  });

  it('falls back to the RPC-resolved name', () => {
    expect(displayNameFor('u1', profiles, null)).toBe('Darren Gee');
  });

  it('never returns a membership status for an unresolvable user', () => {
    const name = displayNameFor('unknown-user', profiles, null);

    // Leaving a trip or closing an account does not change who someone was.
    expect(name).toBe(UNKNOWN_MEMBER_LABEL);
    expect(name).not.toBe('Former Member');
  });

  it('ignores a whitespace-only snapshot', () => {
    expect(displayNameFor('u1', profiles, '   ')).toBe('Darren Gee');
  });
});
