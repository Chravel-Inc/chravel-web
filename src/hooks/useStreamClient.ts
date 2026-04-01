import { useEffect, useState, useCallback } from 'react';
import { StreamChat } from 'stream-chat';
import { supabase } from '@/integrations/supabase/client';
import { initStreamClient, disconnectStreamClient, getStreamClient } from '@/services/stream/streamClient';

/**
 * Hook that initializes the Stream Chat client when stream feature flags are enabled.
 * Checks the 'stream-chat-trip' feature flag to gate Stream initialization.
 *
 * @returns {{ streamConnected: boolean, streamClient: StreamChat | null }}
 */
export function useStreamClient(): { streamConnected: boolean; streamClient: StreamChat | null } {
  const [streamConnected, setStreamConnected] = useState(false);
  const [streamClient, setStreamClient] = useState<StreamChat | null>(null);

  const initializeStream = useCallback(async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return;
      }

      // Check if any stream feature flag is enabled
      const { data: flags, error: flagError } = await supabase
        .from('feature_flags')
        .select('key, enabled')
        .like('key', 'stream-%');

      if (flagError) {
        console.error('[useStreamClient] Error fetching feature flags:', flagError);
        return;
      }

      const anyStreamEnabled = flags?.some((f) => f.enabled === true);
      if (!anyStreamEnabled) {
        return;
      }

      // Get Stream token from edge function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('stream-token');

      if (tokenError || !tokenData?.token || !tokenData?.userId || !tokenData?.apiKey) {
        console.error('[useStreamClient] Failed to get stream token:', tokenError);
        return;
      }

      // Initialize the Stream Chat client
      await initStreamClient(tokenData.token, tokenData.userId, tokenData.apiKey);

      const client = getStreamClient();
      setStreamClient(client);
      setStreamConnected(!!client?.userID);
    } catch (error) {
      console.error('[useStreamClient] Initialization error:', error);
      setStreamConnected(false);
      setStreamClient(null);
    }
  }, []);

  useEffect(() => {
    initializeStream();

    return () => {
      // Disconnect on unmount
      disconnectStreamClient().catch((err) => {
        console.error('[useStreamClient] Disconnect error on unmount:', err);
      });
    };
  }, [initializeStream]);

  return { streamConnected, streamClient };
}
