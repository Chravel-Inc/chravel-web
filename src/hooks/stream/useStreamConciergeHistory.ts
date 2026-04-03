/**
 * useStreamConciergeHistory — Load AI concierge history from Stream
 *
 * Hydrates conversation history from the chravel-concierge channel.
 * Used on page load to restore previous conversations.
 *
 * The Zustand conciergeSessionStore still handles in-flight SSE streaming
 * state — Stream is only for persisted messages.
 */

import { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/lib/featureFlags';
import { getStreamClient } from '@/services/stream/streamClient';
import {
  loadConciergeHistory,
  type ConciergeMessage,
} from '@/services/stream/adapters/conciergeAdapter';

export function useStreamConciergeHistory(tripId: string | undefined, userId: string | undefined) {
  const streamEnabled = useFeatureFlag('stream-chat-concierge', false);
  const streamConnected = !!getStreamClient()?.userID;
  const useStream = streamEnabled && streamConnected;

  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!useStream || !tripId || !userId) return;

    let cancelled = false;
    setIsLoading(true);

    loadConciergeHistory(tripId, userId)
      .then(history => {
        if (!cancelled) {
          setMessages(history);
          setIsLoaded(true);
        }
      })
      .catch(() => {
        // Non-fatal — Zustand store remains the fallback
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [useStream, tripId, userId]);

  return {
    messages,
    isLoading,
    isLoaded,
    streamEnabled: useStream,
  };
}
