/**
 * useBroadcastHistory — full broadcast history for the Broadcasts tab.
 *
 * The Broadcasts tab filters the in-memory timeline, which is a bounded window
 * (30 initially loaded, 250 retained). Broadcasts older than that window were
 * silently invisible in the tab even though they exist in the channel. When the
 * tab is active, this hook fetches the channel's broadcast history directly
 * from Stream (server-side message_type filter) so the tab can always show
 * every broadcast. Failure is non-fatal: consumers merge [] and the tab falls
 * back to the window-filtered view (previous behavior).
 */

import { useEffect, useState } from 'react';
import type { MessageResponse } from 'stream-chat';
import { fetchTripBroadcastHistory } from '@/services/stream/streamMessageSearch';

export function useBroadcastHistory(tripId: string | undefined, enabled: boolean) {
  const [history, setHistory] = useState<MessageResponse[]>([]);

  useEffect(() => {
    if (!enabled || !tripId) return;

    let cancelled = false;
    fetchTripBroadcastHistory({ tripId }).then(messages => {
      if (!cancelled) setHistory(messages);
    });

    return () => {
      cancelled = true;
    };
  }, [tripId, enabled]);

  return history;
}
