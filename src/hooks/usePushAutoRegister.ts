/**
 * Silent push re-registration on app start.
 *
 * Root problem this fixes: push device tokens were only ever (re)registered when
 * a user manually flipped Settings → Notifications, so tokens were never
 * refreshed on login/app-start and `push_device_tokens` / `web_push_subscriptions`
 * stayed empty in production.
 *
 * This hook runs once per mount, after auth is fully hydrated and for a real
 * signed-in user (never in demo/app-preview), and re-persists the current
 * device's push token *only when OS permission is already granted*. It never
 * triggers a new permission prompt — first-time prompting stays with the
 * Settings toggle / pre-prompt flow (`usePushPreferenceToggle`).
 *
 *  - Native (Capacitor/iOS): if the native push plugin is available and the OS
 *    permission is already `granted`, re-run the register flow to upsert the
 *    device token into `push_device_tokens`.
 *  - Web/PWA: if the browser supports notifications and permission is already
 *    `granted`, re-run the Web Push (VAPID) subscribe flow to upsert the
 *    `web_push_subscriptions` row.
 *
 * Best-effort throughout: failures are swallowed so a re-registration hiccup can
 * never surface an error to the UI.
 *
 * Kill switch: `push_notifications_auto_register` (defaults enabled; an admin can
 * insert the flag row to disable without a redeploy). Seeding that row via
 * migration is tracked as a follow-up.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useDemoMode } from './useDemoMode';
import { useNativePush } from './useNativePush';
import { useWebPush } from './useWebPush';
import { isNativePushAvailable, checkNativePushPermissions } from '@/lib/nativePushBridge';
import { useFeatureFlag } from '@/lib/featureFlags';

export function usePushAutoRegister(): void {
  const { user, isHydrated, authState } = useAuth();
  const { showDemoContent } = useDemoMode();
  const { registerForPush } = useNativePush();
  const { subscribe: subscribeWebPush } = useWebPush();
  const autoRegisterEnabled = useFeatureFlag('push_notifications_auto_register', true);

  // Hold the register/subscribe callbacks in refs so the one-shot effect can call
  // the latest version without listing them as deps. `subscribe` from useWebPush
  // gets a new identity every render (its support check is recomputed unmemoized),
  // so depending on it would re-run the effect and could abort an in-flight
  // registration. The effect gates only on stable auth/demo primitives instead.
  const registerForPushRef = useRef(registerForPush);
  registerForPushRef.current = registerForPush;
  const subscribeWebPushRef = useRef(subscribeWebPush);
  subscribeWebPushRef.current = subscribeWebPush;

  // Register at most once per mount.
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    if (!autoRegisterEnabled) return;

    // Gate on FULLY hydrated auth + a real authenticated user. `authState`
    // resolves to 'authenticated' only once loading has settled without error,
    // so we never act on a half-loaded session.
    if (!isHydrated) return;
    if (authState !== 'authenticated' || !user?.id) return;

    // Never register for demo / app-preview users (their id is a throwaway UUID).
    if (showDemoContent) return;

    hasRunRef.current = true;

    // Fire-and-forget: there are no listeners to tear down at this level
    // (registerNativePushToken/subscribe manage and clean up their own), so no
    // cleanup is returned — we never abort an in-flight best-effort registration.
    void (async () => {
      try {
        // Native shells (Capacitor/iOS) use FCM/APNs device tokens.
        if (isNativePushAvailable()) {
          const permission = await checkNativePushPermissions();
          // Only re-register when the OS already granted push — do NOT prompt.
          if (permission === 'granted') {
            await registerForPushRef.current();
          }
          return;
        }

        // Web/PWA uses Web Push (VAPID). Re-subscribe only when the browser has
        // already granted notification permission; 'default'/'denied' → no-op.
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          await subscribeWebPushRef.current();
        }
      } catch {
        // Best-effort re-registration — never surface push failures to the UI.
      }
    })();
  }, [autoRegisterEnabled, isHydrated, authState, user?.id, showDemoContent]);
}

export default usePushAutoRegister;
