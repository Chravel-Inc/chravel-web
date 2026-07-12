/**
 * Pure policy logic for the Stream Before-Message-Send broadcast guard.
 * No Deno / network imports — unit-tested by vitest (see __tests__/policy.test.ts).
 *
 * Rule (mirrors the client UX gate in ChatInput/TripChat): broadcasts follow
 * the trip-type permission model — consumer trips are open to all members;
 * pro and event trips allow broadcast-flagged messages only from
 * admins/organizers/owners. Unauthorized broadcasts are NOT rejected; the
 * broadcast markers are stripped so the message still delivers as a normal
 * chat message (friendlier than erroring the send, and removes any incentive
 * to retry-forge).
 */

export const BROADCAST_ADMIN_ROLES = new Set(['admin', 'organizer', 'owner']);

/** Channel types whose messages can carry trip broadcast markers. */
const GUARDED_CHANNEL_TYPES = new Set(['chravel-trip', 'chravel-broadcast']);

export interface GuardMessage {
  message_type?: string;
  privacy_mode?: string;
  isBroadcast?: boolean;
  [key: string]: unknown;
}

export function isBroadcastFlagged(message: GuardMessage | null | undefined): boolean {
  if (!message) return false;
  return (
    message.message_type === 'broadcast' ||
    message.privacy_mode === 'broadcast' ||
    message.isBroadcast === true
  );
}

export function isGuardedChannelType(channelType: string | undefined | null): boolean {
  return !!channelType && GUARDED_CHANNEL_TYPES.has(channelType);
}

/** Extract the trip id from a guarded channel id (trip-{id} / broadcast-{id}). */
export function tripIdFromChannelId(channelId: string | undefined | null): string {
  if (!channelId) return '';
  if (channelId.startsWith('trip-')) return channelId.slice('trip-'.length);
  if (channelId.startsWith('broadcast-')) return channelId.slice('broadcast-'.length);
  return '';
}

/**
 * Whether a sender may broadcast on this trip.
 * tripType null/undefined/'consumer' → open to all members (consumer model).
 */
export function senderMayBroadcast(
  tripType: string | null | undefined,
  senderRole: string | null | undefined,
): boolean {
  const normalizedType = tripType || 'consumer';
  if (normalizedType !== 'pro' && normalizedType !== 'event') return true;
  return !!senderRole && BROADCAST_ADMIN_ROLES.has(senderRole);
}

/**
 * Return a copy of the message with every broadcast marker removed, so it
 * delivers as a normal chat message.
 */
export function stripBroadcastMarkers(message: GuardMessage): GuardMessage {
  const stripped: GuardMessage = { ...message };
  if (stripped.message_type === 'broadcast') delete stripped.message_type;
  if (stripped.privacy_mode === 'broadcast') delete stripped.privacy_mode;
  if (stripped.isBroadcast === true) delete stripped.isBroadcast;
  return stripped;
}
