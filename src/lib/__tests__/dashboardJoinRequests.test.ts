import { describe, expect, it } from 'vitest';
import { getJoinRequestDisplayLabel } from '../dashboardJoinRequests';

describe('getJoinRequestDisplayLabel', () => {
  it('returns safe fallback label when request has no timestamps', () => {
    expect(getJoinRequestDisplayLabel({ requested_at: null, created_at: null })).toBe(
      'Requested date unavailable',
    );
  });
});
