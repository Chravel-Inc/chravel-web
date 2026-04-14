import { getOrCreateTripChannel } from './streamChannelFactory';
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
