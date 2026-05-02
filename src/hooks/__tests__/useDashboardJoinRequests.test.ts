import { describe, expect, it } from 'vitest';
import {
  getJoinRequestRequestedAt,
  getJoinRequestDisplayLabel,
  mapCancelOwnJoinRequestResult,
  shouldBackfillJoinRequestsOnSubscribe,
  shouldRefreshJoinRequestsOnForeground,
  sortJoinRequestsByRecency,
  splitJoinRequestsByDirection,
  getInboundAdminReviewRequests,
  type DashboardJoinRequest,
} from '@/hooks/useDashboardJoinRequests';

describe('splitJoinRequestsByDirection', () => {
  it('separates outbound and inbound requests', () => {
    const rows: DashboardJoinRequest[] = [
      {
        id: 'out-1',
        trip_id: 'trip-1',
        user_id: 'user-1',
        requested_at: '2026-04-01T00:00:00Z',
        direction: 'outbound',
      },
      {
        id: 'in-1',
        trip_id: 'trip-2',
        user_id: 'user-2',
        requested_at: '2026-04-02T00:00:00Z',
        direction: 'inbound',
      },
      {
        id: 'out-2',
        trip_id: 'trip-3',
        user_id: 'user-1',
        requested_at: '2026-04-03T00:00:00Z',
        direction: 'outbound',
      },
    ];

    const result = splitJoinRequestsByDirection(rows);

    expect(result.outbound.map(r => r.id)).toEqual(['out-1', 'out-2']);
    expect(result.inbound.map(r => r.id)).toEqual(['in-1']);
  });
});

describe('mapCancelOwnJoinRequestResult', () => {
  it('maps successful RPC response', () => {
    expect(mapCancelOwnJoinRequestResult({ success: true, message: 'ok' })).toEqual({
      success: true,
    });
  });

  it('maps explicit RPC failure response', () => {
    expect(
      mapCancelOwnJoinRequestResult({
        success: false,
        message: 'Only pending requests can be canceled',
      }),
    ).toEqual({
      success: false,
      message: 'Only pending requests can be canceled',
    });
  });

  it('guards against null payloads', () => {
    expect(mapCancelOwnJoinRequestResult(null)).toEqual({
      success: false,
      message: 'Unable to cancel request.',
    });
  });
});

describe('getJoinRequestRequestedAt', () => {
  it('uses requested_at when available', () => {
    expect(
      getJoinRequestRequestedAt({
        requested_at: '2026-04-09T00:00:00Z',
        created_at: '2026-04-08T00:00:00Z',
      }),
    ).toBe('2026-04-09T00:00:00Z');
  });

  it('falls back to created_at when requested_at is missing', () => {
    expect(
      getJoinRequestRequestedAt({
        requested_at: null,
        created_at: '2026-04-08T00:00:00Z',
      }),
    ).toBe('2026-04-08T00:00:00Z');
  });

  it('returns undefined when both requested_at and created_at are missing', () => {
    expect(
      getJoinRequestRequestedAt({
        requested_at: null,
        created_at: null,
      }),
    ).toBeUndefined();
  });
});

describe('sortJoinRequestsByRecency', () => {
  it('sorts rows with timestamps before rows with missing timestamps and uses deterministic id tie-breaker', () => {
    const sorted = sortJoinRequestsByRecency([
      {
        id: 'z-request',
        trip_id: 'trip-1',
        user_id: 'user-1',
        direction: 'outbound',
      },
      {
        id: 'a-request',
        trip_id: 'trip-2',
        user_id: 'user-2',
        direction: 'inbound',
      },
      {
        id: 'recent',
        trip_id: 'trip-3',
        user_id: 'user-3',
        requested_at: '2026-04-10T00:00:00Z',
        direction: 'inbound',
      },
    ]);

    expect(sorted.map(row => row.id)).toEqual(['recent', 'a-request', 'z-request']);
  });
});

describe('getJoinRequestDisplayLabel', () => {
  it('returns safe fallback label when request has no timestamps', () => {
    expect(getJoinRequestDisplayLabel({ requested_at: null, created_at: null })).toBe(
      'Requested date unavailable',
    );
  });
});

describe('dashboard join request recovery helpers', () => {
  it('refreshes requests when the app returns to the foreground', () => {
    expect(shouldRefreshJoinRequestsOnForeground('visible')).toBe(true);
    expect(shouldRefreshJoinRequestsOnForeground('hidden')).toBe(false);
  });

  it('only backfills after a reconnect, not on the initial subscribe', () => {
    expect(shouldBackfillJoinRequestsOnSubscribe('SUBSCRIBED', false)).toBe(false);
    expect(shouldBackfillJoinRequestsOnSubscribe('SUBSCRIBED', true)).toBe(true);
    expect(shouldBackfillJoinRequestsOnSubscribe('CHANNEL_ERROR', true)).toBe(false);
  });
});

describe('getInboundAdminReviewRequests', () => {
  it('returns only inbound rows for admin moderation surfaces', () => {
    const rows: DashboardJoinRequest[] = [
      {
        id: 'out-1',
        trip_id: 'trip-1',
        user_id: 'user-1',
        requested_at: '2026-04-01T00:00:00Z',
        direction: 'outbound',
      },
      {
        id: 'in-1',
        trip_id: 'trip-2',
        user_id: 'user-2',
        requested_at: '2026-04-02T00:00:00Z',
        direction: 'inbound',
      },
    ];

    expect(getInboundAdminReviewRequests(rows).map(row => row.id)).toEqual(['in-1']);
  });
});
