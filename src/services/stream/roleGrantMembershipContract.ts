import { supabase } from '@/integrations/supabase/client';
import { getStreamClient } from './streamClient';
import { CHANNEL_TYPE_CHANNEL, proChannelId } from './streamChannelFactory';
import { isStreamConfigured } from './streamTransportGuards';

export type RoleGrantOperation = 'assign' | 'revoke';

interface TripChannelAccessRow {
  id: string;
  required_role_id: string | null;
}

interface ChannelRoleAccessRow {
  channel_id: string;
  role_id: string;
}

export interface StreamChannelContractState {
  channelId: string;
  isMember: boolean;
  canPost: boolean;
}

export interface RoleGrantContractInconsistency {
  type: 'missing_membership' | 'unexpected_membership' | 'posting_rights_mismatch';
  channelId: string;
  expectedMember: boolean;
  streamMember: boolean;
  expectedCanPost: boolean;
  streamCanPost: boolean;
}

export interface RoleGrantContractValidation {
  operation: RoleGrantOperation;
  tripId: string;
  userId: string;
  roleId: string;
  expectedAccessibleChannelIds: string[];
  streamStates: StreamChannelContractState[];
  inconsistencies: RoleGrantContractInconsistency[];
  skipped: boolean;
  skipReason?: string;
}

export function buildExpectedChannelAccess(
  channelRoles: Map<string, Set<string>>,
  assignedRoleIds: Set<string>,
): Set<string> {
  const accessibleChannels = new Set<string>();

  for (const [channelId, roleIds] of channelRoles.entries()) {
    for (const roleId of roleIds) {
      if (assignedRoleIds.has(roleId)) {
        accessibleChannels.add(channelId);
        break;
      }
    }
  }

  return accessibleChannels;
}

export function evaluateRoleGrantContract(
  expectedAccessibleChannelIds: Set<string>,
  streamStates: StreamChannelContractState[],
): RoleGrantContractInconsistency[] {
  const inconsistencies: RoleGrantContractInconsistency[] = [];
  const streamStateByChannel = new Map(streamStates.map(state => [state.channelId, state]));
  const unionChannelIds = new Set<string>([
    ...expectedAccessibleChannelIds,
    ...streamStates.map(state => state.channelId),
  ]);

  for (const channelId of unionChannelIds) {
    const expectedMember = expectedAccessibleChannelIds.has(channelId);
    const expectedCanPost = expectedMember;
    const streamState = streamStateByChannel.get(channelId);
    const streamMember = streamState?.isMember ?? false;
    const streamCanPost = streamState?.canPost ?? false;

    if (expectedMember && !streamMember) {
      inconsistencies.push({
        type: 'missing_membership',
        channelId,
        expectedMember,
        streamMember,
        expectedCanPost,
        streamCanPost,
      });
      continue;
    }

    if (!expectedMember && streamMember) {
      inconsistencies.push({
        type: 'unexpected_membership',
        channelId,
        expectedMember,
        streamMember,
        expectedCanPost,
        streamCanPost,
      });
      continue;
    }

    if (expectedCanPost !== streamCanPost) {
      inconsistencies.push({
        type: 'posting_rights_mismatch',
        channelId,
        expectedMember,
        streamMember,
        expectedCanPost,
        streamCanPost,
      });
    }
  }

  return inconsistencies;
}

function canPostFromOwnCapabilities(capabilities: unknown): boolean {
  if (!Array.isArray(capabilities)) return false;
  return capabilities.some(
    capability => capability === 'send-message' || capability === 'SendMessage',
  );
}

export async function validateRoleGrantStreamContract(params: {
  tripId: string;
  userId: string;
  roleId: string;
  operation: RoleGrantOperation;
}): Promise<RoleGrantContractValidation> {
  const { tripId, userId, roleId, operation } = params;

  if (!isStreamConfigured()) {
    return {
      operation,
      tripId,
      userId,
      roleId,
      expectedAccessibleChannelIds: [],
      streamStates: [],
      inconsistencies: [],
      skipped: true,
      skipReason: 'stream_not_configured',
    };
  }

  const streamClient = getStreamClient();
  if (!streamClient?.userID) {
    return {
      operation,
      tripId,
      userId,
      roleId,
      expectedAccessibleChannelIds: [],
      streamStates: [],
      inconsistencies: [],
      skipped: true,
      skipReason: 'stream_client_unavailable',
    };
  }

  const [userRolesResult, channelsResult, accessResult] = await Promise.all([
    supabase.from('user_trip_roles').select('role_id').eq('trip_id', tripId).eq('user_id', userId),
    supabase.from('trip_channels').select('id, required_role_id').eq('trip_id', tripId),
    supabase.from('channel_role_access').select('channel_id, role_id'),
  ]);

  if (userRolesResult.error) throw userRolesResult.error;
  if (channelsResult.error) throw channelsResult.error;
  if (accessResult.error) throw accessResult.error;

  const assignedRoleIds = new Set((userRolesResult.data || []).map(row => row.role_id));

  const channelRoles = new Map<string, Set<string>>();
  (channelsResult.data as TripChannelAccessRow[] | null)?.forEach(channel => {
    channelRoles.set(channel.id, new Set<string>());
    if (channel.required_role_id) {
      channelRoles.get(channel.id)?.add(channel.required_role_id);
    }
  });

  (accessResult.data as ChannelRoleAccessRow[] | null)?.forEach(access => {
    if (!channelRoles.has(access.channel_id)) return;
    channelRoles.get(access.channel_id)?.add(access.role_id);
  });

  const expectedAccessible = buildExpectedChannelAccess(channelRoles, assignedRoleIds);

  const expectedCids = Array.from(channelRoles.keys()).map(
    channelId => `${CHANNEL_TYPE_CHANNEL}:${proChannelId(channelId)}`,
  );

  const streamChannels =
    expectedCids.length > 0
      ? await streamClient.queryChannels(
          {
            type: CHANNEL_TYPE_CHANNEL,
            cid: { $in: expectedCids },
          },
          { last_message_at: -1 },
          {
            watch: false,
            state: true,
            presence: false,
            limit: 200,
          },
        )
      : [];

  const streamStates: StreamChannelContractState[] = Array.from(channelRoles.keys()).map(
    channelId => {
      const cid = `${CHANNEL_TYPE_CHANNEL}:${proChannelId(channelId)}`;
      const channel = streamChannels.find(c => c.cid === cid);
      const member = Boolean(channel?.state?.members?.[userId]);
      const canPost = canPostFromOwnCapabilities(
        (channel?.data as { own_capabilities?: unknown } | undefined)?.own_capabilities,
      );

      return {
        channelId,
        isMember: member,
        canPost,
      };
    },
  );

  const inconsistencies = evaluateRoleGrantContract(expectedAccessible, streamStates);

  return {
    operation,
    tripId,
    userId,
    roleId,
    expectedAccessibleChannelIds: Array.from(expectedAccessible),
    streamStates,
    inconsistencies,
    skipped: false,
  };
}

export function reportRoleGrantContractInconsistencies(
  validation: RoleGrantContractValidation,
): void {
  if (validation.skipped || validation.inconsistencies.length === 0) {
    return;
  }

  console.error('[RoleGrantMembershipContract] Inconsistency detected', {
    operation: validation.operation,
    tripId: validation.tripId,
    userId: validation.userId,
    roleId: validation.roleId,
    expectedAccessibleChannelIds: validation.expectedAccessibleChannelIds,
    streamStates: validation.streamStates,
    inconsistencies: validation.inconsistencies,
  });
}
