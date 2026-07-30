import { getOrCreateProChannel, getOrCreateTripChannel } from './streamChannelFactory';
import { getStreamClient } from './streamClient';
import { isStreamChatActive } from './streamTransportGuards';
import { buildTripStreamMessagePayload, StreamLinkPreviewInput } from './streamMessagePayload';

export interface TripMessageTransportInput {
  tripId: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  privacyMode?: string;
  messageType?: string;
  attachments?: unknown[];
  linkPreview?: StreamLinkPreviewInput;
}

export async function sendTripMessageViaStream(
  input: TripMessageTransportInput,
): Promise<{ id: string } | null> {
  const streamClient = getStreamClient();
  if (!isStreamChatActive(streamClient?.userID)) return null;

  const channel = await getOrCreateTripChannel(input.tripId);
  if (!channel) return null;

  const payloadResult = buildTripStreamMessagePayload({
    content: input.content ?? '',
    mediaType: input.mediaType,
    mediaUrl: input.mediaUrl,
    privacyMode: input.privacyMode,
    messageType: input.messageType,
    attachments: input.attachments,
    linkPreview: input.linkPreview,
  });

  if (!payloadResult.ok) return null;

  const response = await channel.sendMessage(payloadResult.payload);
  const id = response.message?.id;
  if (!id) return null;

  return { id };
}

export interface ChannelMessageTransportInput extends TripMessageTransportInput {
  /** Pro sub-channel id (trip_channels.id) — messages land in chravel-channel:channel-{id} */
  channelId: string;
  channelName?: string;
}

/**
 * Send a message into a Pro sub-channel instead of the main trip channel.
 * Attachment shares from a sub-channel composer previously fell through to
 * the trip channel (wrong audience) because no channel-scoped transport
 * existed — only text had one (useStreamProChannel.sendMessage).
 */
export async function sendProChannelMessageViaStream(
  input: ChannelMessageTransportInput,
): Promise<{ id: string } | null> {
  const streamClient = getStreamClient();
  if (!isStreamChatActive(streamClient?.userID)) return null;

  const channel = await getOrCreateProChannel(
    input.channelId,
    input.channelName || `Channel ${input.channelId}`,
    input.tripId,
  );
  if (!channel) return null;

  const payloadResult = buildTripStreamMessagePayload({
    content: input.content ?? '',
    mediaType: input.mediaType,
    mediaUrl: input.mediaUrl,
    privacyMode: input.privacyMode,
    messageType: input.messageType,
    attachments: input.attachments,
    linkPreview: input.linkPreview,
  });

  if (!payloadResult.ok) return null;

  const response = await channel.sendMessage(payloadResult.payload);
  const id = response.message?.id;
  if (!id) return null;

  return { id };
}
