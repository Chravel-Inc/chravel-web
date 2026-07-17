import { describe, expect, it } from 'vitest';
import { authorizeSharedTripPushTargets, authorizeTripPushTargets } from '../authorizeTargets';

describe('send-push authorizeTargets', () => {
  it('rejects non-members for trip-scoped push', () => {
    const decision = authorizeTripPushTargets({
      callerUserId: 'attacker',
      callerIsActiveMember: false,
      tripMemberUserIds: ['a', 'b'],
      requestedUserIds: ['victim'],
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.status).toBe(403);
  });

  it('intersects requested userIds with trip roster (blocks IDOR)', () => {
    const decision = authorizeTripPushTargets({
      callerUserId: 'member-1',
      callerIsActiveMember: true,
      tripMemberUserIds: ['member-1', 'member-2'],
      requestedUserIds: ['member-2', 'outsider'],
      excludeUserId: 'member-1',
    });
    expect(decision).toEqual({ ok: true, targetUserIds: ['member-2'] });
  });

  it('defaults to all trip members when userIds omitted', () => {
    const decision = authorizeTripPushTargets({
      callerUserId: 'member-1',
      callerIsActiveMember: true,
      tripMemberUserIds: ['member-1', 'member-2'],
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.targetUserIds.sort()).toEqual(['member-1', 'member-2']);
    }
  });

  it('blocks userIds-only push to users outside shared trips', () => {
    const decision = authorizeSharedTripPushTargets({
      callerUserId: 'caller',
      requestedUserIds: ['caller', 'stranger'],
      sharedTripUserIds: ['friend'],
    });
    expect(decision.ok).toBe(false);
  });

  it('allows self and shared-trip peers for userIds-only push', () => {
    const decision = authorizeSharedTripPushTargets({
      callerUserId: 'caller',
      requestedUserIds: ['caller', 'friend'],
      sharedTripUserIds: ['friend'],
      excludeUserId: 'caller',
    });
    expect(decision).toEqual({ ok: true, targetUserIds: ['friend'] });
  });
});
