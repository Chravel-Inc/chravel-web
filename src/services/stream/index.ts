/**
 * Stream Chat Integration — Barrel Export
 *
 * Scope guard: This migration uses stream-chat (low-level JS client) ONLY.
 * No stream-chat-react or any Stream UI components.
 * Chravel preserves its existing UI — Stream is the backend/realtime substrate.
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
  CHANNEL_TYPE_CONCIERGE,
  tripChannelId,
  proChannelId,
  broadcastChannelId,
  conciergeChannelId,
  getOrCreateTripChannel,
  getOrCreateProChannel,
  getOrCreateBroadcastChannel,
  getOrCreateConciergeChannel,
} from './streamChannelFactory';

// Membership sync (synchronous primary path)
export {
  addMemberToTripChannels,
  removeMemberFromTripChannels,
  addMemberToProChannel,
  removeMemberFromProChannel,
} from './streamMembershipSync';

// Mappers
export {
  streamMessageToChravel,
  chravelMessageToStreamPayload,
} from './adapters/mappers/messageMapper';
export type { ChrravelChatMessage } from './adapters/mappers/messageMapper';
export { chravelUserToStream } from './adapters/mappers/userMapper';
export type { ChrravelUserProfile, StreamUserData } from './adapters/mappers/userMapper';
export {
  tripToStreamChannel,
  proChannelToStreamChannel,
  broadcastToStreamChannel,
  conciergeToStreamChannel,
} from './adapters/mappers/channelMapper';
export type { StreamChannelConfig } from './adapters/mappers/channelMapper';
