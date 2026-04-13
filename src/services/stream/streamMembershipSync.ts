/**
 * Stream Membership Sync — Synchronous Primary Path
 *
 * Called directly in app flows (join trip, leave trip, role change)
 * to synchronously update Stream channel membership.
 *
 * This is the PRIMARY and ONLY membership sync path in the current release.
 *
 * Architecture:
 *   - Supabase remains source of truth for membership
 *   - This service pushes membership changes to Stream synchronously
 *   - Failed syncs are non-fatal (no automatic retry/reconciliation job yet)
 */

import { getStreamClient } from './streamClient';
import {
  CHANNEL_TYPE_TRIP,
  CHANNEL_TYPE_BROADCAST,
  tripChannelId,
  broadcastChannelId,
} from './streamChannelFactory';

/**
 * Add a member to all Stream channels for a trip.
 * Called synchronously when a user joins a trip.
 */
export async function addMemberToTripChannels(tripId: string, userId: string): Promise<void> {
  const client = getStreamClient();
  if (!client) return;

  try {
    // Add to main trip chat
    const tripChannel = client.channel(CHANNEL_TYPE_TRIP, tripChannelId(tripId));
    await tripChannel.addMembers([userId]);

    // Add to broadcast channel
    const broadcastChannel = client.channel(CHANNEL_TYPE_BROADCAST, broadcastChannelId(tripId));
    await broadcastChannel.addMembers([userId]);
  } catch (error) {
    if (import.meta.env.DEV) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[StreamMembershipSync] addMember failed:', msg);
    }
    // Non-fatal — membership is already committed in Supabase.
    // Retries: none in this module (caller fire-and-forget + no background reconciler yet).
    // Operator action: monitor Stream join failures via client error telemetry/logs
    // for "[StreamMembershipSync] addMember failed" and re-run membership sync manually if needed.
  }
}

/**
 * Remove a member from all Stream channels for a trip.
 * Called synchronously when a user leaves a trip.
 */
export async function removeMemberFromTripChannels(tripId: string, userId: string): Promise<void> {
  const client = getStreamClient();
  if (!client) return;

  try {
    const tripChannel = client.channel(CHANNEL_TYPE_TRIP, tripChannelId(tripId));
    await tripChannel.removeMembers([userId]);

    const broadcastChannel = client.channel(CHANNEL_TYPE_BROADCAST, broadcastChannelId(tripId));
    await broadcastChannel.removeMembers([userId]);
  } catch (error) {
    if (import.meta.env.DEV) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[StreamMembershipSync] removeMember failed:', msg);
    }
    // Non-fatal — membership is already committed in Supabase.
    // Retries: none in this module (caller fire-and-forget + no background reconciler yet).
    // Operator action: monitor Stream removal failures via client error telemetry/logs
    // for "[StreamMembershipSync] removeMember failed" and re-run membership sync manually if needed.
  }
}

/**
 * Add a member to a specific pro channel.
 * Called when a user is assigned a role that grants channel access.
 */
export async function addMemberToProChannel(channelId: string, userId: string): Promise<void> {
  const client = getStreamClient();
  if (!client) return;

  try {
    const channel = client.channel('chravel-channel', `channel-${channelId}`);
    await channel.addMembers([userId]);
  } catch (error) {
    if (import.meta.env.DEV) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[StreamMembershipSync] addMemberToProChannel failed:', msg);
    }
  }
}

/**
 * Remove a member from a specific pro channel.
 */
export async function removeMemberFromProChannel(channelId: string, userId: string): Promise<void> {
  const client = getStreamClient();
  if (!client) return;

  try {
    const channel = client.channel('chravel-channel', `channel-${channelId}`);
    await channel.removeMembers([userId]);
  } catch (error) {
    if (import.meta.env.DEV) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[StreamMembershipSync] removeMemberFromProChannel failed:', msg);
    }
  }
}
