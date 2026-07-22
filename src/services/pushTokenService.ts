/**
 * Push Token Storage Service
 * Manages device tokens in Supabase for push notification delivery
 */

import { supabase } from '@/integrations/supabase/client';
import { detectNativePushPlatform, isNativePushAvailable } from '@/lib/nativePushBridge';

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string | null;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

const DEVICE_ID_KEY = 'chravel_device_id';

/**
 * Generate or retrieve a stable device ID
 * Persisted in localStorage for consistency across sessions
 */
function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function getPlatform(): 'ios' | 'android' | 'web' {
  if (isNativePushAvailable()) {
    return detectNativePushPlatform();
  }
  return 'web';
}

/**
 * Save a device token to Supabase
 * Uses upsert to handle token refresh scenarios
 */
export async function saveDeviceToken(
  userId: string,
  token: string,
  platformOverride?: 'ios' | 'android' | 'web',
): Promise<boolean> {
  const platform = platformOverride ?? getPlatform();
  const deviceId = getDeviceId();
  const now = new Date().toISOString();

  try {
    const { error } = await supabase.from('push_device_tokens').upsert(
      {
        user_id: userId,
        token,
        platform,
        device_id: deviceId,
        last_seen_at: now,
        updated_at: now,
      },
      {
        onConflict: 'user_id,token',
      },
    );

    if (error) {
      if (import.meta.env.DEV) {
        console.error('[PushTokenService] Failed to save token:', error);
      }
      return false;
    }

    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[PushTokenService] Unexpected error saving token:', err);
    }
    return false;
  }
}

/**
 * Remove a device token from Supabase
 * Called on logout or when user disables notifications
 */
export async function removeDeviceToken(userId: string, token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_device_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      if (import.meta.env.DEV) {
        console.error('[PushTokenService] Failed to remove token:', error);
      }
      return false;
    }

    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[PushTokenService] Unexpected error removing token:', err);
    }
    return false;
  }
}

/**
 * Remove all device tokens for a user
 * Called on full logout from all devices
 */

/**
 * Update last_seen_at timestamp for a token
 * Call periodically to track active devices
 */
export async function updateLastSeen(userId: string, token: string): Promise<void> {
  try {
    await supabase
      .from('push_device_tokens')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('token', token);
  } catch {
    // Silent fail - not critical
  }
}

/**
 * Returns true when the user has at least one active native push device token.
 */

/**
 * Get all tokens for a user (for debugging)
 */
