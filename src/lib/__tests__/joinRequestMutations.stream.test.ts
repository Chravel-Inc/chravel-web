import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { approveJoinRequestById, rejectJoinRequestById } from '@/lib/joinRequestMutations';

const mockRpc = vi.fn();
const mockMaybeSingle = vi.fn();
const mockEq1 = vi.fn();
const mockSelect = vi.fn();

const syncTripMemberToStreamAndEmitMemberJoined = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

vi.mock('@/lib/streamTripMemberInlineActivity', () => ({
  syncTripMemberToStreamAndEmitMemberJoined: (...args: unknown[]) =>
    syncTripMemberToStreamAndEmitMemberJoined(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('approveJoinRequestById Stream activity', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq1 });
    mockEq1.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({
      data: {
        resolved_display_name: 'Alex',
        display_name: null,
        first_name: null,
        last_name: null,
      },
      error: null,
    });
  });

  it('passes emitMemberJoinedMessage false when RPC reports member_inserted false', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        trip_id: 'trip-a',
        user_id: 'user-b',
        member_inserted: false,
      },
      error: null,
    });

    await approveJoinRequestById(queryClient, { requestId: 'req-1', tripId: 'trip-a' });

    expect(syncTripMemberToStreamAndEmitMemberJoined).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: 'trip-a',
        joiningUserId: 'user-b',
        emitMemberJoinedMessage: false,
      }),
    );
  });

  it('defaults emitMemberJoinedMessage to true when member_inserted is omitted (older RPC)', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        trip_id: 'trip-a',
        user_id: 'user-b',
      },
      error: null,
    });

    await approveJoinRequestById(queryClient, { requestId: 'req-1' });

    expect(syncTripMemberToStreamAndEmitMemberJoined).toHaveBeenCalledWith(
      expect.objectContaining({
        emitMemberJoinedMessage: true,
      }),
    );
  });

  it('passes emitMemberJoinedMessage true when member_inserted is true', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        trip_id: 'trip-a',
        user_id: 'user-b',
        member_inserted: true,
      },
      error: null,
    });

    await approveJoinRequestById(queryClient, { requestId: 'req-1' });

    expect(syncTripMemberToStreamAndEmitMemberJoined).toHaveBeenCalledWith(
      expect.objectContaining({
        emitMemberJoinedMessage: true,
      }),
    );
  });
});

describe('join request idempotency (stale/duplicate clicks)', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('approve: already_resolved success does not throw, info toast, no Stream emit', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        already_resolved: true,
        message: 'This request was already approved',
      },
      error: null,
    });

    await expect(
      approveJoinRequestById(queryClient, { requestId: 'req-1', tripId: 'trip-a' }),
    ).resolves.toBeUndefined();

    // No duplicate "member joined" Stream activity on a stale re-click.
    expect(syncTripMemberToStreamAndEmitMemberJoined).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('This request was already approved');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('approve: already_resolved with success=false (request was rejected) does not throw', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        already_resolved: true,
        message: 'This request was already rejected',
      },
      error: null,
    });

    await expect(
      approveJoinRequestById(queryClient, { requestId: 'req-1', tripId: 'trip-a' }),
    ).resolves.toBeUndefined();

    expect(syncTripMemberToStreamAndEmitMemberJoined).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('This request was already rejected');
  });

  it('reject: already_resolved does not throw and shows info toast', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        already_resolved: true,
        message: 'This request was already rejected',
        trip_id: 'trip-a',
      },
      error: null,
    });

    await expect(
      rejectJoinRequestById(queryClient, { requestId: 'req-1', tripId: 'trip-a' }),
    ).resolves.toBeUndefined();

    expect(toast.info).toHaveBeenCalledWith('This request was already rejected');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('approve: genuine failure (not already_resolved) still throws', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, message: 'Only trip admins can approve join requests' },
      error: null,
    });

    await expect(
      approveJoinRequestById(queryClient, { requestId: 'req-1', tripId: 'trip-a' }),
    ).rejects.toThrow('Only trip admins can approve join requests');
  });
});
