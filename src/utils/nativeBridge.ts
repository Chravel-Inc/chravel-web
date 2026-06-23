/**
 * Native bridge for the chravel-mobile WebView shell.
 *
 * Bridge contract (mirrored in chravel-mobile/CLAUDE.md):
 *   - Shell injects `window.ChravelNative.isNative === true` and a `ChravelNative/<v>`
 *     UA suffix before loading the web app.
 *   - Web app emits `{ type: 'ready', source: 'chravel-web', surface, timestamp }` when
 *     an interactive surface mounts (same `surface` may re-emit after leaving/re-entering
 *     a route; rapid duplicates within ~400ms are deduped for React StrictMode).
 *   - Message names ('ready', 'chravel-web' source) are part of the contract — do
 *     not rename without updating chravel-mobile in lockstep.
 *   - Optional Settings: `window.ChravelNative.openAppSettings()` and/or
 *     `openNotificationSettings()` — used by Permissions Center when the OS has
 *     denied a capability (see `src/lib/webPermissions.ts`). Implement in the shell
 *     when `App.openUrl` / Capacitor is not available.
 *   - Optional OAuth: `window.ChravelNative.openOAuthUrl(url)` — native should open
 *     the provider URL in an auth session (e.g. Expo `WebBrowser.openAuthSessionAsync`),
 *     then navigate the **main** WebView to `https://chravel.app/auth-callback?...` /
 *     hash so Supabase `detectSessionInUrl` completes in-app. Used when Capacitor
 *     `Plugins.Browser` is not present (typical Expo shell).
 */

import { isChravelNativeShell } from './platformDetection';

interface NativeBridgePostMessage {
  postMessage?: (payload: string) => void;
}

interface WebkitMessageHandlers {
  ChravelNative?: { postMessage?: (payload: unknown) => void };
}

/** Last successful `ready` postMessage (used to dedupe React StrictMode double-invoke only). */
let lastReadyDispatch: { surface: string; at: number } | null = null;

/** Suppress duplicate identical-surface posts within this window (StrictMode ~0ms; re-entry to /auth is much later). */
const READY_SAME_SURFACE_DEDUPE_MS = 400;

export interface NativeReadyOptions {
  /** Logical surface that became interactive (e.g. "auth", "trip"). Defaults to current pathname. */
  surface?: string;
}

/**
 * Notify the native shell that the current surface is mounted and interactive.
 * Dedupes rapid repeat calls for the same `surface` (React StrictMode) but allows the
 * same surface again after a short quiet window so re-entry to `/auth` can dismiss
 * native chrome again. No-op outside the chravel-mobile shell.
 */
export function notifyNativeShellReady(options: NativeReadyOptions = {}): void {
  if (typeof window === 'undefined') return;
  if (!isChravelNativeShell()) return;

  const surface = options.surface ?? window.location.pathname;
  const now = Date.now();
  if (
    lastReadyDispatch &&
    lastReadyDispatch.surface === surface &&
    now - lastReadyDispatch.at < READY_SAME_SURFACE_DEDUPE_MS
  ) {
    return;
  }

  const message = {
    type: 'ready' as const,
    source: 'chravel-web' as const,
    surface,
    timestamp: now,
  };

  try {
    const native = (window as unknown as { ChravelNative?: NativeBridgePostMessage }).ChravelNative;
    if (typeof native?.postMessage === 'function') {
      native.postMessage(JSON.stringify(message));
      lastReadyDispatch = { surface, at: Date.now() };
      return;
    }
    const webkit = (window as unknown as { webkit?: { messageHandlers?: WebkitMessageHandlers } })
      .webkit;
    if (typeof webkit?.messageHandlers?.ChravelNative?.postMessage === 'function') {
      webkit.messageHandlers.ChravelNative.postMessage(message);
      lastReadyDispatch = { surface, at: Date.now() };
      return;
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[NativeBridge] ready dispatch failed', err);
    }
  }
}

/** Test-only: reset dedupe state so unit tests can re-trigger dispatch. */
export function __resetNativeBridgeForTests(): void {
  lastReadyDispatch = null;
}
