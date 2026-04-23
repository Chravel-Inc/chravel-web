/**
 * Stream Channel Factory
 *
 * Creates and resolves Stream channels from Chravel entities.
 * Handles channel ID conventions and the channel taxonomy:
 *
 *   - chravel-trip:       trip-{tripId}           (regular trip chat)
 *   - chravel-channel:    channel-{channelId}     (pro role-based channels)
 *   - chravel-broadcast:  broadcast-{tripId}      (announcements)
 */

import { getStreamClient } from './streamClient';
import type { Channel } from 'stream-chat';

// ── Channel Type Constants ────────────────────────────────────────────────
export const CHANNEL_TYPE_TRIP = 'chravel-trip';
export const CHANNEL_TYPE_CHANNEL = 'chravel-channel';
export const CHANNEL_TYPE_BROADCAST = 'chravel-broadcast';

// ── Channel ID Builders ───────────────────────────────────────────────────

export function tripChannelId(tripId: string): string {
  return `trip-${tripId}`;
}

export function proChannelId(channelId: string): string {
  return `channel-${channelId}`;
}

export function broadcastChannelId(tripId: string): string {
  return `broadcast-${tripId}`;
}

// ── Channel Resolution ────────────────────────────────────────────────────

/**
 * Get or create a trip chat channel.
 * Members are synced separately via streamMembershipSync.
 */
export async function getOrCreateTripChannel(
  tripId: string,
  tripName?: string,
): Promise<Channel | null> {
  const client = getStreamClient();
  if (!client) return null;

  const channel = client.channel(CHANNEL_TYPE_TRIP, tripChannelId(tripId), {
    name: tripName || `Trip ${tripId}`,
    trip_id: tripId,
  } as Record<string, unknown>);

  await channel.watch();
  return channel;
}

/**
 * Get or create a pro channel.
 */
export async function getOrCreateProChannel(
  channelId: string,
  channelName: string,
  tripId: string,
): Promise<Channel | null> {
  const client = getStreamClient();
  if (!client) return null;

  const channel = client.channel(CHANNEL_TYPE_CHANNEL, proChannelId(channelId), {
    name: channelName,
    trip_id: tripId,
    chravel_channel_id: channelId,
  } as Record<string, unknown>);

  await channel.watch();
  return channel;
}

/**
 * Get or create a broadcast channel for a trip.
 */
export async function getOrCreateBroadcastChannel(
  tripId: string,
  tripName?: string,
): Promise<Channel | null> {
  const client = getStreamClient();
  if (!client) return null;

  const channel = client.channel(CHANNEL_TYPE_BROADCAST, broadcastChannelId(tripId), {
    name: tripName ? `${tripName} Broadcasts` : `Trip ${tripId} Broadcasts`,
    trip_id: tripId,
  } as Record<string, unknown>);

  await channel.watch();
  return channel;
}
