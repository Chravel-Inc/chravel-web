/**
 * Voice feature flags — ship-safe hardening layer.
 *
 * Environment-driven flags with safe defaults. Resolved at runtime via
 * import.meta.env (Vite injects at build time; values can be overridden
 * in .env.local for local dev).
 *
 * Usage:
 *   - VOICE_LIVE_ENABLED: Gate voice UI + initialization. false = no voice init.
 *   - VOICE_DIAGNOSTICS_ENABLED: Extra console logs for debugging.
 *   - VOICE_USE_WEBSOCKET_ONLY: Enforce duplex transport; reject SSE/HTTP fallback.
 */

type VoiceEnvKey =
  | 'VITE_VOICE_LIVE_ENABLED'
  | 'VITE_VOICE_DIAGNOSTICS_ENABLED'
  | 'VITE_VOICE_USE_WEBSOCKET_ONLY'
  | 'VITE_VOICE_AFFECTIVE_DIALOG'
  | 'VITE_VOICE_PROACTIVE_AUDIO'
  | 'VITE_VOICE_RUNTIME'
  | 'VITE_LIVEKIT_WS_URL';

const getEnv = (key: VoiceEnvKey, fallback: string): string => {
  try {
    const v = (import.meta.env as Record<string, string | undefined>)[key];
    return typeof v === 'string' ? v : fallback;
  } catch {
    return fallback;
  }
};

const parseBool = (value: string): boolean => value.toLowerCase() === 'true' || value === '1';

/**
 * Voice Live (LiveKit / Vertex bidirectional) enabled.
 * Default: false — avoids showing a broken Live control until Supabase LiveKit secrets,
 * LiveKit worker `chravel-voice`, and `VITE_LIVEKIT_WS_URL` are verified (see
 * docs/ops/LIVEKIT_VOICE_READINESS_RUNBOOK.md). Set `VITE_VOICE_LIVE_ENABLED=true` to enable.
 */
export const VOICE_LIVE_ENABLED = parseBool(getEnv('VITE_VOICE_LIVE_ENABLED', 'false'));

/** Extra diagnostics (connection codes, audio params) when true. Default: false. */
export const VOICE_DIAGNOSTICS_ENABLED = parseBool(
  getEnv('VITE_VOICE_DIAGNOSTICS_ENABLED', 'false'),
);

/** Require WebSocket for Live voice; reject silent downgrade to SSE/HTTP. Default: true. */
export const VOICE_USE_WEBSOCKET_ONLY = parseBool(getEnv('VITE_VOICE_USE_WEBSOCKET_ONLY', 'true'));

/** Enable affective dialog (emotional tone awareness). Default: true — supported on GA native-audio model. */
export const VOICE_AFFECTIVE_DIALOG = parseBool(getEnv('VITE_VOICE_AFFECTIVE_DIALOG', 'true'));

/** Enable proactive audio (model-initiated speech). Default: false — NOT supported on Gemini 3.1 Flash Live. */
export const VOICE_PROACTIVE_AUDIO = parseBool(getEnv('VITE_VOICE_PROACTIVE_AUDIO', 'false'));

/** Voice runtime selection: 'livekit' (default, new) or 'vertex' (legacy, broken). */
export type VoiceRuntime = 'livekit' | 'vertex';
export const VOICE_RUNTIME: VoiceRuntime =
  (getEnv('VITE_VOICE_RUNTIME', 'livekit') as VoiceRuntime) === 'vertex' ? 'vertex' : 'livekit';

/** LiveKit Cloud WebSocket URL. */
export const LIVEKIT_WS_URL = getEnv(
  'VITE_LIVEKIT_WS_URL',
  'wss://chravel-voice-dev-rgxzbtr0.livekit.cloud',
);

/** All voice flags for debugging / diagnostics. */
export function getVoiceFlags(): {
  VOICE_LIVE_ENABLED: boolean;
  VOICE_DIAGNOSTICS_ENABLED: boolean;
  VOICE_USE_WEBSOCKET_ONLY: boolean;
  VOICE_AFFECTIVE_DIALOG: boolean;
  VOICE_PROACTIVE_AUDIO: boolean;
  VOICE_RUNTIME: VoiceRuntime;
  LIVEKIT_WS_URL: string;
} {
  return {
    VOICE_LIVE_ENABLED,
    VOICE_DIAGNOSTICS_ENABLED,
    VOICE_USE_WEBSOCKET_ONLY,
    VOICE_AFFECTIVE_DIALOG,
    VOICE_PROACTIVE_AUDIO,
    VOICE_RUNTIME,
    LIVEKIT_WS_URL,
  };
}
