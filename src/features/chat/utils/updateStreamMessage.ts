import { toast } from 'sonner';
import type { MessageResponse } from 'stream-chat';
import { getStreamClient } from '@/services/stream/streamClient';

export type StreamMessageUpdatePayload = Pick<Partial<MessageResponse>, 'id' | 'text'>;

export async function updateStreamMessage(payload: StreamMessageUpdatePayload): Promise<boolean> {
  const client = getStreamClient();

  if (!client) {
    toast.error('Chat connection unavailable. Please try again.');
    return false;
  }

  try {
    await client.updateMessage(payload);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[TripChat] Failed to edit message:', error);
    }
    toast.error('Failed to edit message');
    return false;
  }
}
