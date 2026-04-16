# Voice Provider Migration Note (Google Cloud TTS → Gemini 3.1 Flash TTS)

## Status
The `concierge-tts` edge function (Google Cloud TTS) has been superseded by the
`gemini-tts` edge function, which calls the **Gemini 3.1 Flash TTS Preview** model.

The client-side feature flag `VITE_CONCIERGE_TTS_ENABLED=true` routes TTS requests
to `gemini-tts`. When `false` (default), the old `concierge-tts` path is used as a
rollback.

## What changed
- **Provider**: Gemini API (`generativelanguage.googleapis.com`) via `generateContent`
  with `responseModalities: ["AUDIO"]` and `speechConfig`.
- **Auth**: `GEMINI_API_KEY` (shared with text concierge). Optional dedicated
  `GEMINI_TTS_API_KEY` takes precedence if set.
- **Model**: `gemini-3.1-flash-tts-preview` (configurable via `GEMINI_TTS_MODEL` env var).
- **Voices**: Gemini TTS short names — `Charon` (primary), `Puck` (fallback).
  Configurable via `app_settings` table (`tts_primary_voice_id`, `tts_fallback_voice_id`).
- **Style**: Concierge persona tone tag prepended to text (e.g. `[warm, calm, concise ...]`).
- **Fallback**: Retries with fallback voice on 400/403/404/429 errors.
- **Timeout**: 30s per Gemini API call.

## Verification checklist

```bash
# 1) Enable the Gemini TTS path (client-side)
#    Set VITE_CONCIERGE_TTS_ENABLED=true in .env or Vercel env vars

# 2) Confirm GEMINI_API_KEY is set in Supabase secrets
supabase secrets list --project-ref <project-ref> | rg GEMINI_API_KEY

# 3) Deploy the gemini-tts edge function
supabase functions deploy gemini-tts --project-ref <project-ref>

# 4) Apply the migration to update app_settings voice defaults
supabase db push --project-ref <project-ref>

# 5) Invoke function and confirm audio response
curl -i -X POST "https://<project-ref>.supabase.co/functions/v1/gemini-tts" \
  -H "Authorization: Bearer <user-jwt>" \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  --data '{"text":"Hello, welcome to your trip!","voiceName":"Charon"}'
```

## Rollback path
Set `VITE_CONCIERGE_TTS_ENABLED=false` (or remove it) and redeploy the frontend.
The old `concierge-tts` edge function remains deployed as the fallback path.
