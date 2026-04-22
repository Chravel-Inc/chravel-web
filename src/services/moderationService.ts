import { supabase } from '@/integrations/supabase/client';
import { moderationEvents } from '@/telemetry/events';

export type ModerationAction = 'hide_message' | 'shadow_ban_user' | 'mute_user' | 'ban_user';

interface ExecuteModerationActionParams {
  tripId: string;
  messageId: string;
  targetUserId: string;
  action: ModerationAction;
}

interface ExecuteModerationActionResult {
  success: boolean;
  action: ModerationAction;
}

export async function executeModerationAction(
  params: ExecuteModerationActionParams,
): Promise<ExecuteModerationActionResult> {
  const startedAt = Date.now();

  const { data, error } = await supabase.functions.invoke('stream-moderation-action', {
    body: params,
  });

  const latencyMs = Date.now() - startedAt;

  if (error) {
    moderationEvents.actionFailed({
      trip_id: params.tripId,
      message_id: params.messageId,
      target_user_id: params.targetUserId,
      action: params.action,
      error: error.message || 'Unknown moderation error',
      latency_ms: latencyMs,
    });
    throw new Error(error.message || 'Failed to execute moderation action');
  }

  const typed = data as { success?: boolean; action?: ModerationAction; reason?: string } | null;
  if (!typed?.success) {
    const reason = typed?.reason || 'Moderation action failed';
    moderationEvents.actionFailed({
      trip_id: params.tripId,
      message_id: params.messageId,
      target_user_id: params.targetUserId,
      action: params.action,
      error: reason,
      latency_ms: latencyMs,
    });
    throw new Error(reason);
  }

  moderationEvents.actionExecuted({
    trip_id: params.tripId,
    message_id: params.messageId,
    target_user_id: params.targetUserId,
    action: typed.action || params.action,
    latency_ms: latencyMs,
  });

  return {
    success: true,
    action: typed.action || params.action,
  };
}
