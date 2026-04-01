/**
 * useStreamClient — React hook for Stream client lifecycle
 *
 * Connects the Stream client when the user is authenticated AND
 * at least one Stream feature flag is enabled.
 * Disconnects on logout. Returns connection status.
 *
 * Mount this once at the app shell level (e.g. AppInitializer).
 *
 * Usage:
 *   const { isConnected, isConnecting } = useStreamClient();
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlag } from '@/lib/featureFlags';
import {
  connectStreamClient,
  disconnectStreamClient,
  getStreamApiKey,
} from '@/services/stream/streamClient';

interface UseStreamClientResult {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useStreamClient(): UseStreamClientResult {
  const { user, isAuthenticated } = useAuth();

  // Connect if ANY Stream surface is enabled — not just trip chat
  const tripFlag = useFeatureFlag('stream-chat-trip', false);
  const channelsFlag = useFeatureFlag('stream-chat-channels', false);
  const broadcastsFlag = useFeatureFlag('stream-chat-broadcasts', false);
  const conciergeFlag = useFeatureFlag('stream-chat-concierge', false);
  const anyStreamEnabled = tripFlag || channelsFlag || broadcastsFlag || conciergeFlag;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't connect if Stream is not configured or no flags are enabled
    if (!getStreamApiKey() || !anyStreamEnabled || !isAuthenticated || !user) {
      return;
    }

    let cancelled = false;

    const connect = async () => {
      setIsConnecting(true);
      setError(null);

      try {
        const client = await connectStreamClient();
        if (!cancelled) {
          setIsConnected(!!client?.userID);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Stream connection failed';
          setError(msg);
          setIsConnected(false);
        }
      } finally {
        if (!cancelled) {
          setIsConnecting(false);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, anyStreamEnabled]);

  // Disconnect on unmount / logout
  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      disconnectStreamClient();
    }
  }, [isAuthenticated]);

  return { isConnected, isConnecting, error };
}
