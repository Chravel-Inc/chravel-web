import { describe, it, expect } from 'vitest';
import {
  splitJoinRequestsByDirection,
  type DashboardJoinRequest,
} from '../useDashboardJoinRequests';

describe('splitJoinRequestsByDirection', () => {
  it('partitions inbound vs outbound', () => {
    const rows: DashboardJoinRequest[] = [
      {
        id: '1',
        trip_id: 't1',
        user_id: 'u1',
        requested_at: '2026-01-01',
        direction: 'outbound',
      },
      {
        id: '2',
        trip_id: 't1',
        user_id: 'u2',
        requested_at: '2026-01-02',
        direction: 'inbound',
        requesterLabel: 'Alex',
      },
    ];
    const { outbound, inbound } = splitJoinRequestsByDirection(rows);
    expect(outbound).toHaveLength(1);
    expect(outbound[0].id).toBe('1');
    expect(inbound).toHaveLength(1);
    expect(inbound[0].id).toBe('2');
  });
});
