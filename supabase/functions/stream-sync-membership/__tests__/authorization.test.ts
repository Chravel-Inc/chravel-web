import { describe, expect, it } from 'vitest';
import { canActorSyncMembership } from '../authorization';

describe('canActorSyncMembership', () => {
  it('allows self add/remove', () => {
    expect(
      canActorSyncMembership({
        actorUserId: 'u1',
        actorRole: null,
        targetUserId: 'u1',
        action: 'add',
      }),
    ).toBe(true);

    expect(
      canActorSyncMembership({
        actorUserId: 'u1',
        actorRole: null,
        targetUserId: 'u1',
        action: 'remove',
      }),
    ).toBe(true);
  });

  it('allows admin-style roles to sync others', () => {
    expect(
      canActorSyncMembership({
        actorUserId: 'admin-1',
        actorRole: 'admin',
        targetUserId: 'u2',
        action: 'remove',
      }),
    ).toBe(true);

    expect(
      canActorSyncMembership({
        actorUserId: 'owner-1',
        actorRole: 'owner',
        targetUserId: 'u2',
        action: 'add',
      }),
    ).toBe(true);
  });

  it('blocks non-admin users from syncing others', () => {
    expect(
      canActorSyncMembership({
        actorUserId: 'member-1',
        actorRole: 'member',
        targetUserId: 'u2',
        action: 'remove',
      }),
    ).toBe(false);
  });
});
