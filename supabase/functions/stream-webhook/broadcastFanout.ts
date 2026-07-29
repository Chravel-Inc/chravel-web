/**
 * Dual-write Stream chat broadcasts into public.broadcasts so the existing
 * notify_on_broadcast trigger fans out push/in-app notifications.
 * Idempotent on metadata.stream_message_id.
 */

export type StreamBroadcastMessage = {
  id?: string;
  text?: string;
  user?: { id?: string; name?: string };
  message_type?: string;
  /** Stream may nest custom fields under `custom` depending on SDK version. */
  custom?: { message_type?: string; target_role_ids?: string[] };
  target_role_ids?: string[];
};

export function isStreamBroadcastMessage(message: StreamBroadcastMessage | undefined): boolean {
  if (!message) return false;
  const type = message.message_type || message.custom?.message_type;
  return type === 'broadcast';
}

export function resolveBroadcastTargetRoleIds(
  message: StreamBroadcastMessage | undefined,
): string[] {
  if (!message) return [];
  const raw = message.target_role_ids || message.custom?.target_role_ids;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function buildBroadcastInsertRow(input: {
  tripId: string;
  senderId: string;
  messageText: string;
  streamMessageId: string;
  targetRoleIds: string[];
}): {
  trip_id: string;
  created_by: string;
  message: string;
  is_sent: boolean;
  priority: string;
  metadata: Record<string, unknown>;
} {
  const metadata: Record<string, unknown> = {
    source: 'stream-webhook',
    stream_message_id: input.streamMessageId,
  };
  if (input.targetRoleIds.length > 0) {
    metadata.target_role_ids = input.targetRoleIds;
  }
  return {
    trip_id: input.tripId,
    created_by: input.senderId,
    message: input.messageText.slice(0, 4000),
    is_sent: true,
    priority: 'normal',
    metadata,
  };
}
