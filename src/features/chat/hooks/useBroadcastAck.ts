/**
 * Marks DB-backed broadcasts as viewed when the Broadcasts tab is open,
 * and exposes a stream_message_id → { broadcastId, readCount } map for UI.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BroadcastAckEntry = {
  broadcastId: string;
  readCount: number;
};

function extractStreamMessageId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const streamId = (metadata as { stream_message_id?: unknown }).stream_message_id;
  return typeof streamId === 'string' && streamId.length > 0 ? streamId : null;
}

export function useBroadcastAck(params: {
  tripId: string | undefined;
  userId: string | undefined;
  enabled: boolean;
}): {
  ackByStreamMessageId: Record<string, BroadcastAckEntry>;
  refresh: () => Promise<void>;
} {
  const { tripId, userId, enabled } = params;
  const [ackByStreamMessageId, setAckByStreamMessageId] = useState<
    Record<string, BroadcastAckEntry>
  >({});

  const refresh = useCallback(async () => {
    if (!tripId || !enabled) {
      setAckByStreamMessageId({});
      return;
    }

    const { data: rows, error } = await supabase
      .from('broadcasts')
      .select('id, metadata')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !rows) {
      if (import.meta.env.DEV && error) {
        console.error('[useBroadcastAck] fetch failed:', error.message);
      }
      return;
    }

    const next: Record<string, BroadcastAckEntry> = {};
    await Promise.all(
      rows.map(async row => {
        const streamId = extractStreamMessageId(row.metadata);
        if (!streamId) return;

        if (userId) {
          const { error: markError } = await supabase.rpc('mark_broadcast_viewed', {
            p_broadcast_id: row.id,
            p_user_id: userId,
          });
          if (markError && import.meta.env.DEV) {
            console.error('[useBroadcastAck] mark viewed failed:', markError.message);
          }
        }

        const { data: count, error: countError } = await supabase.rpc('get_broadcast_read_count', {
          p_broadcast_id: row.id,
        });
        if (countError && import.meta.env.DEV) {
          console.error('[useBroadcastAck] read count failed:', countError.message);
        }

        next[streamId] = {
          broadcastId: row.id,
          readCount: typeof count === 'number' ? count : 0,
        };
      }),
    );

    setAckByStreamMessageId(next);
  }, [tripId, userId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ackByStreamMessageId, refresh };
}
