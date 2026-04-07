import { describe, expect, it } from 'vitest';
import {
  mapCancelOwnJoinRequestResult,
  splitJoinRequestsByDirection,
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
