/**
 * Canonical realtime voice model contract for the LiveKit agent.
 *
 * Production default intentionally remains Gemini 2.5 native audio until
 * Gemini 3.1 continuation semantics are validated end-to-end in our stack.
 */
export const CHRAVEL_REALTIME_VOICE_MODEL = 'gemini-live-2.5-flash-native-audio' as const;

export const GEMINI_LIVE_MODEL_ENV_KEY = 'GEMINI_LIVE_MODEL' as const;

export function resolveRealtimeVoiceModel(envValue: string | undefined): string {
  const model = envValue?.trim();
  return model && model.length > 0 ? model : CHRAVEL_REALTIME_VOICE_MODEL;
}
