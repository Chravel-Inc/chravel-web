/**
 * Stream Chat Client — Singleton
 *
 * Manages a single StreamChat instance for the application.
 * Connects on login, disconnects on logout.
 *
 * Usage:
 *   import { connectStreamClient, disconnectStreamClient, getStreamClient } from '@/services/stream/streamClient';
 *
 * Architecture:
 *   - Uses stream-chat JS client (low-level, no UI components)
 *   - Token fetched from stream-token edge function
 *   - User profile synced to Stream on connect
 *   - Disconnects cleanly on logout via Supabase auth listener
 */

import { StreamChat } from 'stream-chat';
import { supabase } from '@/integrations/supabase/client';
import { getStreamToken, clearStreamTokenCache } from './streamTokenService';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

let clientInstance: StreamChat | null = null;
let connectionPromise: Promise<void> | null = null;
let isConnecting = false;

/**
 * Get the Stream API key from environment.
 * Returns null if not configured (Stream migration not active).
 */
export function getStreamApiKey(): string | null {
  return STREAM_API_KEY || null;
}

/**
 * Get the StreamChat client instance.
 * Returns null if not initialized or Stream is not configured.
 */
export function getStreamClient(): StreamChat | null {
  return clientInstance;
}

/**
 * Connect the StreamChat client for the authenticated user.
 * Safe to call multiple times — returns existing connection if active.
 */
export async function connectStreamClient(): Promise<StreamChat | null> {
  if (!STREAM_API_KEY) {
    return null;
  }

  // Already connected
  if (clientInstance?.userID) {
    return clientInstance;
  }

  // Connection already in progress — wait for it
  if (isConnecting && connectionPromise) {
    await connectionPromise;
    return clientInstance;
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      const { token, userId } = await getStreamToken();

      if (!clientInstance) {
        clientInstance = StreamChat.getInstance(STREAM_API_KEY);
      }

      await clientInstance.connectUser({ id: userId }, token);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (import.meta.env.DEV) {
        console.error('[StreamClient] Connection failed:', msg);
      }
      // Don't throw — Stream is optional, app should work without it
    } finally {
      isConnecting = false;
      connectionPromise = null;
    }
  })();

  await connectionPromise;
  return clientInstance;
}

/**
 * Disconnect the StreamChat client.
 * Called on logout.
 */
export async function disconnectStreamClient(): Promise<void> {
  clearStreamTokenCache();

  if (clientInstance) {
    try {
      await clientInstance.disconnectUser();
    } catch {
      // Ignore disconnect errors
    }
    clientInstance = null;
  }
}

// ── Auto-disconnect on Supabase logout ────────────────────────────────────
supabase.auth.onAuthStateChange(event => {
  if (event === 'SIGNED_OUT') {
    disconnectStreamClient();
  }
});
