# LiveKit Voice Readiness Runbook

## Purpose

Prevent false positives where `livekit-token` returns a JWT, but production voice is still down end-to-end.

> **Rule:** Token success is a **prerequisite**, not a readiness signal.

---

## Dependency Chain (must all be green)

1. **Supabase Edge Function** `livekit-token` is deployed and healthy.
2. **LiveKit Cloud worker** `chravel-voice` is deployed and connected.
3. **Room creation** sets metadata (`tripId`, `userId`, `voice`) and agent dispatch (`chravel-voice`).
4. **Frontend voice runtime** (`VITE_VOICE_RUNTIME=livekit`) can:
   - start session
   - observe agent join within 10 seconds
   - stop/disconnect back to idle cleanly

If any one stage is red, voice is not ready.

---

## Fast Verification Checklist

### A) Validate token function behavior

1. Call `POST /functions/v1/livekit-token` with auth and a valid `tripId`.
2. Confirm HTTP `200` with `{ token, wsUrl, roomName }`.
3. The token is a join-only JWT (no room config embedded). Room metadata and agent dispatch are set server-side via `RoomServiceClient.createRoom()` inside the edge function.

Source of truth: `supabase/functions/livekit-token/index.ts`.

### B) Validate LiveKit Cloud worker deployment

In LiveKit Cloud dashboard:

1. Open **Agents / Workers**.
2. Confirm worker name `chravel-voice` is present.
3. Confirm status is healthy/online in the target project/environment.
4. Confirm recent heartbeats/logs are current.

If worker is absent/offline, treat voice as **down** even when token issuance passes.

### C) Validate room metadata + agent dispatch

After calling `livekit-token`, verify the room was created correctly:

1. In LiveKit Cloud dashboard, open **Rooms** and find the room (name pattern: `voice-{tripId}-{shortId}`).
2. Confirm room metadata is a JSON string containing:
   - `tripId`
   - `userId`
   - `voice`
3. Confirm the room's agent dispatch shows `chravel-voice`.

Any key drift breaks tool authorization and response behavior even if media connects.

### D) Validate agent env vars

In LiveKit Cloud dashboard, confirm these env vars are set for the `chravel-voice` worker:

- `GOOGLE_API_KEY` — Gemini API key from Google AI Studio
- `SUPABASE_URL` — Chravel Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `GEMINI_LIVE_MODEL` — `gemini-live-2.5-flash-native-audio` (production canonical model; Gemini 3.1 live remains experimental)

### E) Live session smoke test (required before calling ready)

In Chravel UI:

1. Open trip → AI Concierge.
2. Tap **Start Live**.
3. Confirm agent joins within **10 seconds**.
4. Speak a short prompt (for example, "Give me one plan update").
5. Tap **Stop/Disconnect**.
6. Confirm UI returns to idle with no stuck spinner/transcript artifacts.

Expected pass criteria:

- Join SLA ≤10s
- No terminal error toast
- State returns to idle after stop

---

## Failure Triage

### Token returns 500

Likely root causes:

- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, or `LIVEKIT_URL` not set in Supabase secrets
- `RoomServiceClient.createRoom()` failing (wrong LIVEKIT_URL format, invalid credentials)

### Token passes, agent never joins

Likely root causes:

- `chravel-voice` worker not deployed to the same LiveKit project
- Worker crashed on startup (check LiveKit Cloud logs for `GOOGLE_API_KEY` or `SUPABASE_URL` errors)
- Agent dispatch name mismatch between edge function and worker registration
- Room metadata parsing failure in worker startup path

### Agent joins, but no audio / no response

Likely root causes:

- `GOOGLE_API_KEY` missing or invalid in LiveKit Cloud env vars
- `GEMINI_LIVE_MODEL` set to an unsupported model name
- `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` wrong (agent can't fetch trip context)

### Agent joins, but stop leaves UI in bad state

Likely root causes:

- Frontend `endSession()` path not resetting state
- disconnect event race during reconnect/backoff

---

## Operational Guardrails

- Never mark voice "ready" using only token logs.
- Include both:
  - control-plane proof (worker present + healthy)
  - data-plane proof (live session smoke pass)
- Add this checklist to release QA for any voice-runtime, auth, or LiveKit configuration changes.
