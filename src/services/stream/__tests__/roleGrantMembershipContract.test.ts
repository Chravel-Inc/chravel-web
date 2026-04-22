import { describe, expect, it } from 'vitest';
import {
  buildExpectedChannelAccess,
  evaluateRoleGrantContract,
} from '../roleGrantMembershipContract';

describe('roleGrantMembershipContract', () => {
  it('maps Supabase role grants to expected Stream channel membership', () => {
    const channelRoles = new Map<string, Set<string>>([
      ['channel-a', new Set(['role-ops'])],
      ['channel-b', new Set(['role-security'])],
      ['channel-c', new Set(['role-ops', 'role-admin'])],
    ]);

    const expected = buildExpectedChannelAccess(channelRoles, new Set(['role-ops']));

    expect(Array.from(expected).sort()).toEqual(['channel-a', 'channel-c']);

    const inconsistencies = evaluateRoleGrantContract(expected, [
      { channelId: 'channel-a', isMember: true, canPost: true },
      { channelId: 'channel-b', isMember: false, canPost: false },
      { channelId: 'channel-c', isMember: true, canPost: true },
    ]);

    expect(inconsistencies).toEqual([]);
  });

  it('reports missing membership after role assignment when Stream did not project access', () => {
    const expected = new Set(['channel-a']);

    const inconsistencies = evaluateRoleGrantContract(expected, [
      { channelId: 'channel-a', isMember: false, canPost: false },
    ]);

    expect(inconsistencies).toHaveLength(1);
    expect(inconsistencies[0]).toMatchObject({
      type: 'missing_membership',
      channelId: 'channel-a',
      expectedMember: true,
      streamMember: false,
    });
  });

  it('reports unexpected membership after role revocation when Stream still keeps membership', () => {
    const inconsistencies = evaluateRoleGrantContract(new Set(), [
      { channelId: 'channel-a', isMember: true, canPost: true },
    ]);

    expect(inconsistencies).toHaveLength(1);
    expect(inconsistencies[0]).toMatchObject({
      type: 'unexpected_membership',
      channelId: 'channel-a',
      expectedMember: false,
      streamMember: true,
    });
  });

  it('reports posting rights mismatch when member exists but send permission is missing', () => {
    const inconsistencies = evaluateRoleGrantContract(new Set(['channel-a']), [
      { channelId: 'channel-a', isMember: true, canPost: false },
    ]);

    expect(inconsistencies).toHaveLength(1);
    expect(inconsistencies[0]).toMatchObject({
      type: 'posting_rights_mismatch',
      channelId: 'channel-a',
      expectedCanPost: true,
      streamCanPost: false,
    });
  });
});
