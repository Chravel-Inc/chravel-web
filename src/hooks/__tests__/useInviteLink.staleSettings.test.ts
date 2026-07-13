/**
 * Invite settings must not mint a new DB row when toggles change — only Regenerate applies them.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useInviteLink } from '../useInviteLink';

const insertMock = vi.fn();

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/unfurlConfig', () => ({
  buildInviteLink: (code: string) => `https://chravel.app/join/${code}`,
}));

vi.mock('@/integrations/supabase/client', () => {
  const tripsChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        created_by: 'user-1',
        trip_type: 'consumer',
      },
      error: null,
    }),
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
      from: vi.fn((table: string) => {
        if (table === 'trips') return tripsChain;
        if (table === 'trip_invites') {
          return {
            insert: insertMock,
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    },
  };
});

const VALID_TRIP_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

describe('useInviteLink stale settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
  });

  it('does not insert again when expiry/maxUses change until regenerate', async () => {
    const { result, rerender } = renderHook(
      ({ expireIn7Days, maxUses }: { expireIn7Days: boolean; maxUses: number | null }) =>
        useInviteLink({
          isOpen: true,
          tripName: 'Test Trip',
          expireIn7Days,
          maxUses,
          tripId: VALID_TRIP_ID,
        }),
      { initialProps: { expireIn7Days: false, maxUses: null as number | null } },
    );

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.inviteLink).toContain('https://chravel.app/join/'));
    expect(result.current.hasStaleSettings).toBe(false);

    rerender({ expireIn7Days: true, maxUses: 10 });

    await waitFor(() => expect(result.current.hasStaleSettings).toBe(true));
    expect(insertMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.regenerateInviteToken();
    });

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(2));
    const latestInsert = insertMock.mock.calls[1][0] as Array<Record<string, unknown>>;
    expect(latestInsert[0].expires_at).toBeTruthy();
    expect(latestInsert[0].max_uses).toBe(10);
    expect(result.current.hasStaleSettings).toBe(false);
  });

  it('blocks copy when settings are stale', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result, rerender } = renderHook(
      ({ expireIn7Days }: { expireIn7Days: boolean }) =>
        useInviteLink({
          isOpen: true,
          tripName: 'Test Trip',
          expireIn7Days,
          maxUses: null,
          tripId: VALID_TRIP_ID,
        }),
      { initialProps: { expireIn7Days: false } },
    );

    await waitFor(() => expect(result.current.inviteLink).toBeTruthy());

    rerender({ expireIn7Days: true });
    await waitFor(() => expect(result.current.hasStaleSettings).toBe(true));

    await act(async () => {
      await result.current.handleCopyLink();
    });

    expect(writeText).not.toHaveBeenCalled();
  });
});
