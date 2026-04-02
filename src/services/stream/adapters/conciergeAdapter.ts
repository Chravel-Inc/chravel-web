/**
 * Concierge Adapter — Stream-backed conversation persistence
 *
 * Stream handles ONLY conversation history persistence and cross-device sync.
 * SSE streaming, function calling, voice, and all AI orchestration stay in the
 * existing backend (lovable-concierge edge function).
 *
 * Flow:
 *   1. User sends message -> write to Stream concierge channel
 *   2. SSE streams AI response chunks to UI (unchanged, via Zustand)
 *   3. On SSE done -> write final assistant message to Stream with rich metadata
 *   4. On page load -> hydrate conversation from Stream channel
 *
 * Channel model: per-user-per-trip, created lazily on first interaction.
 */

import { getStreamClient } from '../streamClient';
import { CHANNEL_TYPE_CONCIERGE, conciergeChannelId } from '../streamChannelFactory';
import type { Channel, MessageResponse, UserResponse } from 'stream-chat';

const AI_BOT_USER_ID = 'ai-concierge-bot';

export interface ConciergeMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
    source?: string;
  }>;
  googleMapsWidget?: string;
  googleMapsWidgetContextToken?: string;
  functionCallPlaces?: Array<Record<string, unknown>>;
  functionCallFlights?: Array<Record<string, unknown>>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Get or create the concierge channel for a user+trip.
 * Created lazily on first interaction.
 */
async function getConciergeChannel(tripId: string, userId: string): Promise<Channel | null> {
  const client = getStreamClient();
  if (!client?.userID) return null;

  const channel = client.channel(CHANNEL_TYPE_CONCIERGE, conciergeChannelId(tripId, userId), {
    name: 'AI Concierge',
    trip_id: tripId,
    members: [userId, AI_BOT_USER_ID],
  } as Record<string, unknown>);

  await channel.watch();
  return channel;
}

/**
 * Persist a user message to Stream.
 * Called when user sends a query to the concierge.
 */
export async function persistUserMessage(
  tripId: string,
  userId: string,
  content: string,
): Promise<void> {
  const channel = await getConciergeChannel(tripId, userId);
  if (!channel) return;

  await channel.sendMessage({
    text: content,
    user_id: userId,
    message_type: 'user',
  } as Parameters<Channel['sendMessage']>[0]);
}

/**
 * Persist an assistant response to Stream.
 * Called after SSE streaming completes with the final assembled response.
 * Rich metadata (sources, cards, tools) stored in custom fields.
 */
export async function persistAssistantMessage(
  tripId: string,
  userId: string,
  content: string,
  metadata?: {
    sources?: ConciergeMessage['sources'];
    googleMapsWidget?: string;
    googleMapsWidgetContextToken?: string;
    functionCallPlaces?: Array<Record<string, unknown>>;
    functionCallFlights?: Array<Record<string, unknown>>;
    usage?: ConciergeMessage['usage'];
    tripCards?: Array<Record<string, unknown>>;
    reservationDraft?: Record<string, unknown>;
  },
): Promise<void> {
  const channel = await getConciergeChannel(tripId, userId);
  if (!channel) return;

  const payload: Record<string, unknown> = {
    text: content,
    user_id: AI_BOT_USER_ID,
    message_type: 'assistant',
  };

  // Store rich metadata as custom fields
  if (metadata?.sources) payload.sources = metadata.sources;
  if (metadata?.googleMapsWidget) payload.google_maps_widget = metadata.googleMapsWidget;
  if (metadata?.googleMapsWidgetContextToken) {
    payload.google_maps_widget_context_token = metadata.googleMapsWidgetContextToken;
  }
  if (metadata?.functionCallPlaces) payload.function_call_places = metadata.functionCallPlaces;
  if (metadata?.functionCallFlights) payload.function_call_flights = metadata.functionCallFlights;
  if (metadata?.usage) payload.usage = metadata.usage;
  if (metadata?.tripCards) payload.trip_cards = metadata.tripCards;
  if (metadata?.reservationDraft) payload.reservation_draft = metadata.reservationDraft;

  await channel.sendMessage(payload as Parameters<Channel['sendMessage']>[0]);
}

/**
 * Load conversation history from Stream.
 * Returns messages in the format expected by the concierge session store.
 */
export async function loadConciergeHistory(
  tripId: string,
  userId: string,
  limit: number = 50,
): Promise<ConciergeMessage[]> {
  const channel = await getConciergeChannel(tripId, userId);
  if (!channel) return [];

  const state = await channel.query({
    messages: { limit },
  });

  return (state.messages || []).map((msg: MessageResponse) => {
    const user = msg.user as UserResponse | undefined;
    const custom = msg as Record<string, unknown>;
    const isAssistant = user?.id === AI_BOT_USER_ID || custom.message_type === 'assistant';

    return {
      id: msg.id,
      type: isAssistant ? 'assistant' : 'user',
      content: msg.text || '',
      timestamp: msg.created_at || new Date().toISOString(),
      sources: custom.sources as ConciergeMessage['sources'],
      googleMapsWidget: custom.google_maps_widget as string | undefined,
      googleMapsWidgetContextToken: custom.google_maps_widget_context_token as string | undefined,
      functionCallPlaces: custom.function_call_places as Array<Record<string, unknown>> | undefined,
      functionCallFlights: custom.function_call_flights as
        | Array<Record<string, unknown>>
        | undefined,
      usage: custom.usage as ConciergeMessage['usage'],
    } as ConciergeMessage;
  });
}
