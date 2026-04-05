/**
 * Stream User Sync
 *
 * Syncs Chravel user profiles to Stream. Called when:
 * - User connects to Stream (profile data sent with connectUser)
 * - Profile is updated (display name, avatar changes)
 *
 * The primary sync happens in the stream-token edge function (server-side).
 * This module provides client-side sync for profile updates after initial connect.
 */

import { getStreamClient } from './streamClient';

interface ChrravelProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
}

/**
 * Sync a user's profile to Stream.
 * Call after profile updates (name change, avatar upload).
 * No-op if Stream client is not connected.
 */
export async function syncUserToStream(profile: ChrravelProfile): Promise<void> {
  const client = getStreamClient();
  if (!client?.userID) return;

  try {
    await client.upsertUser({
      id: profile.userId,
      name: profile.displayName,
      image: profile.avatarUrl || undefined,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[StreamUserSync] Failed to sync user:', msg);
    }
    // Non-fatal — profile data will sync on next token refresh
  }
}
