/**
 * Stream Chat Integration — Barrel Export
 *
 * UI strategy: selective Stream primitive adoption allowed.
 * stream-chat (low-level JS client) is the foundation.
 * stream-chat-react may be added later for cherry-picked primitives only.
 * Chravel preserves its travel shell, styling, and brand feel.
 */

// Client lifecycle
export {
  getStreamClient,
  getStreamApiKey,
  connectStreamClient,
  disconnectStreamClient,
} from './streamClient';

// Token management
export { getStreamToken, clearStreamTokenCache } from './streamTokenService';

// User sync
export { syncUserToStream } from './streamUserSync';

// Channel factory
export {
  CHANNEL_TYPE_TRIP,
  CHANNEL_TYPE_CHANNEL,
  CHANNEL_TYPE_BROADCAST,
  tripChannelId,
  proChannelId,
  broadcastChannelId,
  getOrCreateTripChannel,
  getOrCreateProChannel,
  getOrCreateBroadcastChannel,
} from './streamChannelFactory';

// Membership sync (synchronous primary path)
export {
  addMemberToTripChannels,
  removeMemberFromTripChannels,
  addMemberToProChannel,
  removeMemberFromProChannel,
} from './streamMembershipSync';

// Membership sync (retrying coordinator path)
export {
  syncAddMemberToTripChannels,
  syncRemoveMemberFromTripChannels,
  syncAddMemberToProChannel,
  syncRemoveMemberFromProChannel,
} from './streamMembershipCoordinator';

// Mappers
export { chravelUserToStream } from './adapters/mappers/userMapper';
export type { ChrravelUserProfile, StreamUserData } from './adapters/mappers/userMapper';
export {
  tripToStreamChannel,
  proChannelToStreamChannel,
  broadcastToStreamChannel,
} from './adapters/mappers/channelMapper';
export type { StreamChannelConfig } from './adapters/mappers/channelMapper';
