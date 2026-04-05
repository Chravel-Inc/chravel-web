/**
 * Native Push Notifications Hook (web stub).
 *
 * Native push is handled by the separate chravel-mobile Expo app.
 * This stub preserves the API for consumer components.
 */

export interface NativePushState {
  token: string | null;
  permission: 'granted' | 'denied' | 'prompt';
  isNative: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
}

const noop = () => Promise.resolve();

export function useNativePush() {
  return {
    token: null,
    permission: 'denied' as const,
    isNative: false,
    isRegistered: false,
    isLoading: false,
    error: null,
    registerForPush: () => Promise.resolve(null) as Promise<string | null>,
    unregisterFromPush: noop,
    checkPermission: () => Promise.resolve('denied' as const),
    clearNotifications: noop,
  };
}
