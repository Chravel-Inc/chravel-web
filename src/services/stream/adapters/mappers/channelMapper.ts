/**
 * Channel Mapper
 *
 * Transforms Chravel channel/trip entities to Stream channel custom data.
 */

import {
  CHANNEL_TYPE_TRIP,
  CHANNEL_TYPE_CHANNEL,
  CHANNEL_TYPE_BROADCAST,
  tripChannelId,
  proChannelId,
  broadcastChannelId,
} from '../../streamChannelFactory';

export interface StreamChannelConfig {
  type: string;
  id: string;
  name: string;
  customData: Record<string, unknown>;
}

/**
 * Build Stream channel config for a trip chat.
 */
export function tripToStreamChannel(tripId: string, tripName?: string): StreamChannelConfig {
  return {
    type: CHANNEL_TYPE_TRIP,
    id: tripChannelId(tripId),
    name: tripName || `Trip ${tripId}`,
    customData: { trip_id: tripId },
  };
}

/**
 * Build Stream channel config for a pro channel.
 */
export function proChannelToStreamChannel(
  channelId: string,
  channelName: string,
  tripId: string,
): StreamChannelConfig {
  return {
    type: CHANNEL_TYPE_CHANNEL,
    id: proChannelId(channelId),
    name: channelName,
    customData: { trip_id: tripId, chravel_channel_id: channelId },
  };
}

/**
 * Build Stream channel config for a broadcast channel.
 */
export function broadcastToStreamChannel(tripId: string, tripName?: string): StreamChannelConfig {
  return {
    type: CHANNEL_TYPE_BROADCAST,
    id: broadcastChannelId(tripId),
    name: tripName ? `${tripName} Broadcasts` : `Trip ${tripId} Broadcasts`,
    customData: { trip_id: tripId },
  };
}
