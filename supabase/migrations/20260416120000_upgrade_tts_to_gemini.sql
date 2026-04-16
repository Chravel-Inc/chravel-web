-- Upgrade TTS provider from Google Cloud TTS to Gemini 3.1 Flash TTS Preview.
-- Voice names change from Google Cloud format (en-US-*) to Gemini format (short names).

UPDATE public.app_settings
SET value = 'Charon',
    description = 'Gemini TTS primary voice name',
    updated_at = now()
WHERE key = 'tts_primary_voice_id';

UPDATE public.app_settings
SET value = 'Puck',
    description = 'Gemini TTS fallback voice name',
    updated_at = now()
WHERE key = 'tts_fallback_voice_id';

UPDATE public.app_settings
SET value = 'gemini-3.1-flash-tts-preview',
    description = 'Gemini TTS model ID',
    updated_at = now()
WHERE key = 'tts_model_id';

UPDATE public.app_settings
SET value = 'gemini',
    description = 'TTS voice provider (gemini)',
    updated_at = now()
WHERE key = 'voice_provider';
