import { Capacitor } from '@capacitor/core';

/**
 * True when the app runs inside a native-ish shell where WebView storage / token
 * refresh should be tied to app foreground (Capacitor iOS/Android, Despia/Lovable native).
 */
export function isChravelNativeAuthShell(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  try {
    return typeof navigator !== 'undefined' && navigator.userAgent.includes('despia');
  } catch {
    return false;
  }
}
