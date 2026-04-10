import { describe, expect, it } from 'vitest';

import {
  shouldInvalidateTripsForJoinRequestChange,
  shouldInvalidateTripsForMemberChange,
} from '../useUserTripsRealtime';

describe('useUserTripsRealtime member-change filtering', () => {
  it('invalidates only when the changed member row belongs to the current user', () => {
    const userId = 'user-1';

    expect(shouldInvalidateTripsForMemberChange({ new: { user_id: userId } }, userId)).toBe(true);
    expect(shouldInvalidateTripsForMemberChange({ old: { user_id: userId } }, userId)).toBe(true);
    expect(
      shouldInvalidateTripsForMemberChange(
        {
          new: { user_id: 'other-user' },
          old: { user_id: 'another-user' },
        },
        userId,
      ),
    ).toBe(false);
  });
});

describe('useUserTripsRealtime join-request filtering', () => {
  it('invalidates on INSERT/UPDATE/DELETE rows for the current user', () => {
    const userId = 'user-1';

    expect(
      shouldInvalidateTripsForJoinRequestChange(
        { eventType: 'INSERT', new: { user_id: userId } },
        userId,
      ),
    ).toBe(true);
    expect(
      shouldInvalidateTripsForJoinRequestChange(
        { eventType: 'UPDATE', new: { user_id: userId } },
        userId,
      ),
    ).toBe(true);
    expect(
      shouldInvalidateTripsForJoinRequestChange(
        { eventType: 'DELETE', old: { user_id: userId } },
        userId,
      ),
    ).toBe(true);
  });

  it('does not invalidate when a join-request row belongs to another user', () => {
    expect(
      shouldInvalidateTripsForJoinRequestChange(
        { eventType: 'INSERT', new: { user_id: 'other-user' } },
        'user-1',
      ),
    ).toBe(false);
  });
});
