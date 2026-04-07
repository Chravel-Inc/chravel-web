# LiveKit Voice Readiness Runbook

## Purpose

Prevent false positives where `livekit-token` returns a JWT, but production voice is still down end-to-end.

> **Rule:** Token success is a **prerequisite**, not a readiness signal.

---

## Dependency Chain (must all be green)

1. **Supabase Edge Function** `livekit-token` is deployed and healthy.
2. **LiveKit Cloud worker** `chravel-voice` is deployed and connected.
3. **Room dispatch metadata** includes `tripId`, `userId`, and `voice`.
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
3. Decode token payload and confirm `roomConfig` includes:
   - `metadata.tripId`
   - `metadata.userId`
   - `metadata.voice`
   - `agents[0].agentName === "chravel-voice"`

Source of truth: `supabase/functions/livekit-token/index.ts`.

### B) Validate LiveKit Cloud worker deployment

In LiveKit Cloud dashboard:

1. Open **Agents / Workers**.
2. Confirm worker name `chravel-voice` is present.
3. Confirm status is healthy/online in the target project/environment.
4. Confirm recent heartbeats/logs are current.

If worker is absent/offline, treat voice as **down** even when token issuance passes.

### C) Validate room metadata contract

Confirm the agent runtime reads room metadata keys:

- `tripId`
- `userId`
- `voice`

Any key drift breaks tool authorization and response behavior even if media connects.

### D) Live session smoke test (required before calling ready)

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

### Token passes, agent never joins

Likely root causes:

- `chravel-voice` worker not deployed to the same LiveKit project
- Worker crashed on startup
- Agent dispatch name mismatch
- Room metadata parsing failure in worker startup path

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
