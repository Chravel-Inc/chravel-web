/**
 * useStreamClient — React hook for Stream client lifecycle
 *
 * Connects the Stream client when the user is authenticated.
 * Disconnects on logout. Returns connection status.
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
  const streamEnabled = useFeatureFlag('stream-chat-trip', false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't connect if Stream is not configured or not enabled
    if (!getStreamApiKey() || !streamEnabled || !isAuthenticated || !user) {
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
  }, [isAuthenticated, user, streamEnabled]);

  // Disconnect on unmount / logout
  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      disconnectStreamClient();
    }
  }, [isAuthenticated]);

  return { isConnected, isConnecting, error };
}
