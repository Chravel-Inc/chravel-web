/**
 * Bind Supabase JWT auto-refresh to native app foreground/background.
 *
 * On Capacitor iOS, the default interval-based refresh can read secure storage while
 * the app is inactive, which may surface repeated Face ID / Keychain prompts. Supabase
 * recommends calling startAutoRefresh when active and stopAutoRefresh when backgrounded.
 *
 * @see https://supabase.com/docs/reference/javascript/auth-startautorefresh
 */

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { isChravelNativeAuthShell } from '@/lib/chravelNativeShell';
import { onNativeBackground, onNativeResume } from '@/native/lifecycle';

type AuthWithRefreshControl = {
  startAutoRefresh?: () => void | Promise<void>;
  stopAutoRefresh?: () => void | Promise<void>;
};

let initialized = false;

export function initNativeSupabaseAuthRefresh(): void {
  if (initialized) return;
  if (!isChravelNativeAuthShell()) return;

  initialized = true;

  const auth = supabase.auth as AuthWithRefreshControl;

  const start = (): void => {
    try {
      void auth.startAutoRefresh?.();
    } catch {
      // Non-fatal: older clients or test doubles may omit the API.
    }
  };

  const stop = (): void => {
    try {
      void auth.stopAutoRefresh?.();
    } catch {
      // Non-fatal
    }
  };

  // Cold start: app is foreground; begin refresh after client exists.
  start();

  if (Capacitor.isNativePlatform()) {
    onNativeBackground(stop);
    onNativeResume(start);
    return;
  }

  // Despia / hybrid WebViews may not wire Capacitor App events — use Page Visibility.
  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      start();
    } else {
      stop();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
}
