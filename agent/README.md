# Chravel voice agent (LiveKit + Gemini Realtime)

Runs on **LiveKit Cloud**. The web app’s `livekit-token` edge function mints a JWT with `roomConfig` so this worker is dispatched as **`chravel-voice`** (override with `LIVEKIT_AGENT_NAME`).

## First-time setup

1. Create the agent in LiveKit Cloud and note `subdomain` + `agent` id.
2. Copy `livekit.toml.example` → `livekit.toml` and fill in `[project]` / `[agent]`.
3. Configure runtime secrets in LiveKit Cloud (or pass `SECRET_LIST` in CI): `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `GEMINI_LIVE_MODEL`.
4. Deploy: GitHub Actions → **Deploy LiveKit Voice Agent** (workflow dispatch), or locally `lk agent deploy` from this directory.

Do not commit real `livekit.toml` if it exposes internal IDs you prefer to keep private; keep it local or use a private fork / GitHub Environment secret pattern.

## Local dev

```bash
npm ci
cp .env.example .env   # fill variables
npm run dev
```

## Docker

`Dockerfile` matches [LiveKit Cloud builds](https://docs.livekit.io/deploy/agents/builds/). Cloud injects `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` at runtime — do not bake them into the image.
