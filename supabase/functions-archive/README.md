# Edge Functions Archive (pre-undeployment snapshots)

**What this is:** Source-code snapshots of Supabase Edge Functions that were **live-deployed in
production but have no source in this repo** (`supabase/functions/`). Deleting a deployed function
is irreversible, so each function's deployed bundle was pulled via the Supabase Management API and
archived here **before undeployment**.

- **Archive date:** 2026-08-05
- **Project ref:** `jmjiyekmxwsxkfnqwyaa`
- **Captured:** 31 of 32 targeted functions (see failure note below)
- **Do NOT deploy anything from this directory.** Each `index.ts` carries an `// ARCHIVED` header.
  This directory is outside the lint/typecheck/build toolchain scope (like `codebase-atlas/`).

## Layout

Each function lives at `supabase/functions-archive/<slug>/index.ts`. Where the deployed bundle
included `_shared/*` helper snapshots, the ones the entrypoint actually imports are preserved under
`<slug>/_shared/` (import paths like `../_shared/cors.ts` will not resolve in-place — intentional,
these are archives). Note that different functions carry **different vintages** of `_shared/cors.ts`
/ `securityHeaders.ts` — each folder holds the exact snapshot that function was deployed with.
Two bundles (`export-trip-summary`, and the repo files identical to deployed snapshots that were
copied) also shipped unused `_shared` bundle artifacts (`contextBuilder.ts`, `security.ts`,
`validation.ts`) that the entrypoint never imports; those unused artifacts were not duplicated here
because current versions exist in `supabase/functions/_shared/`.

`livekit-token` was deployed with an import map (`deno.json`) that maps the bare specifier
`livekit-server-sdk`; the Management API did not return that file, so only the `.ts` sources are
archived.

## Failure

- **`xai-voice-session`** could not be archived: the Supabase Management API returned
  `InternalServerErrorException: Failed to retrieve function bundle` on 3 attempts
  (2026-08-05). If its source matters, retrieve it from the Supabase Dashboard before deleting;
  otherwise it is unrecoverable after `supabase functions delete xai-voice-session`.

## Redactions

None. No archived file contained a hardcoded secret — all credentials are read via
`Deno.env.get(...)`. (One automated flag on `vertexAuth.ts` was a false positive: the PEM header
string appears only inside a `.replace()` pattern.)

## Pre-deletion checks already done

- **No frontend references:** `src/` contains no `functions.invoke(...)` or URL reference to any
  archived slug (only two incidental string/comment matches: a `syncFailureContext` label in
  `src/lib/joinRequestMutations.ts` and a comment in `src/features/chat/components/PlaceMiniCard.tsx`).
- **No cron references:** `cron.job` only invokes `dispatch-notification-deliveries`,
  `process-account-deletions`, and `event-reminders` — all of which have repo source.
- Caveat: external callers (old share links being unfurled by messaging apps hitting
  `/functions/v1/share-preview`, or any third-party integration) cannot be ruled out from repo
  inspection alone; check function invocation logs in the Supabase dashboard before deleting.

## Not in this archive (on purpose)

`ai-answer`, `ai-search`, and `ai-features` are also candidates for cleanup but are **NOT**
archived here because their source lives in `supabase/functions/` (pending `config.toml` cleanup).

## Function inventory

| Slug | What it does | Still-live systems it touches / notes | Undeploy command |
|---|---|---|---|
| `advertiser-management` | CRUD API for advertiser profiles, ad campaigns, and ad cards (action-dispatch via query param) | Writes `advertiser_profiles`, `campaigns`, `ad_cards`, `moderation_queue` with service role; wildcard CORS | `supabase functions delete advertiser-management --project-ref jmjiyekmxwsxkfnqwyaa` |
| `ai-image-checker` | Diagnostic endpoint that only reports presence of `AI_IMAGES_ENABLED` / Google Custom Search env vars | No DB access; discloses config-presence to any caller | `supabase functions delete ai-image-checker --project-ref jmjiyekmxwsxkfnqwyaa` |
| `ai-image-checker-shared-cors` | Stray deploy of a CORS constants module — exports `corsHeaders`, has **no request handler** | Nothing; dead weight | `supabase functions delete ai-image-checker-shared-cors --project-ref jmjiyekmxwsxkfnqwyaa` |
| `approve-join-request` | Approve/reject trip join requests; adds member + notification; cleans orphaned requests | Writes `trip_join_requests`, `trip_members`, `notifications` (service role). Frontend now resolves join requests via direct DB mutations (`src/lib/joinRequestMutations.ts`) — the string match there is only a log label | `supabase functions delete approve-join-request --project-ref jmjiyekmxwsxkfnqwyaa` |
| `concierge-tts` | Text→speech via Google Cloud TTS using Vertex service-account OAuth; per-plan daily limits | Reads `app_settings`, `user_entitlements`, `profiles`, `tts_usage`; rpc `increment_tts_usage`; secret `VERTEX_SERVICE_ACCOUNT_KEY`. Superseded by repo `concierge-voice-tts`/`google-tts` | `supabase functions delete concierge-tts --project-ref jmjiyekmxwsxkfnqwyaa` |
| `elevenlabs-conversation-token` | Mints an ElevenLabs Conversational-AI session token | Secrets `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`; **no user auth in code** | `supabase functions delete elevenlabs-conversation-token --project-ref jmjiyekmxwsxkfnqwyaa` |
| `elevenlabs-tts` | Despite the name: Google Cloud TTS via API key, with the same per-plan daily limits as concierge-tts | Secret `GOOGLE_CLOUD_TTS_API_KEY` (key leaks into request URL); reads/writes same TTS usage tables | `supabase functions delete elevenlabs-tts --project-ref jmjiyekmxwsxkfnqwyaa` |
| `export-trip-summary` | Collects trip calendar/payments/polls/places/tasks as JSON for client-side PDF export; tier-gated | Reads many `trip_*` tables (service role); **invokes still-live `check-subscription`** function | `supabase functions delete export-trip-summary --project-ref jmjiyekmxwsxkfnqwyaa` |
| `gemini-chat` | Auth+rate-limit+privacy wrapper that proxies chat to `lovable-concierge` | rpc `increment_rate_limit`; reads `trip_privacy_configs`; writes `ai_queries`; **invokes still-live `lovable-concierge`** | `supabase functions delete gemini-chat --project-ref jmjiyekmxwsxkfnqwyaa` |
| `gemini-tts` | Text→speech via Gemini TTS API with voice fallback and per-plan daily limits | Secrets `GEMINI_TTS_API_KEY`/`GEMINI_API_KEY`; same TTS usage tables/rpc | `supabase functions delete gemini-tts --project-ref jmjiyekmxwsxkfnqwyaa` |
| `gemini-voice-proxy` | WebSocket relay browser ↔ Vertex AI Live API (server-side GCP OAuth, tool declarations, keepalive) | Secrets `VERTEX_*`; builds trip context from many `trip_*` tables; bundles a snapshot of `concierge/toolRegistry.ts` | `supabase functions delete gemini-voice-proxy --project-ref jmjiyekmxwsxkfnqwyaa` |
| `gemini-voice-session` | Vertex AI Live voice-session variant of the above (same `_shared` voice stack) | Same as gemini-voice-proxy | `supabase functions delete gemini-voice-session --project-ref jmjiyekmxwsxkfnqwyaa` |
| `generate-audio-summary` | URL → GPT-4o-mini summary → ElevenLabs/OpenAI TTS "audio summary" pipeline | Storage bucket `audio-summaries`; writes `audio_summaries`; rpcs `check_audio_quota`, `increment_audio_usage`; **trusts client-supplied `user_id`** for quota + storage path | `supabase functions delete generate-audio-summary --project-ref jmjiyekmxwsxkfnqwyaa` |
| `getstream-token` | Mints Stream Chat user token + upserts Stream user | Secrets `STREAM_API_KEY/SECRET`. Deployed source declares `const token` twice in one scope (would not even compile today); superseded by repo `stream-token` | `supabase functions delete getstream-token --project-ref jmjiyekmxwsxkfnqwyaa` |
| `google-calendar-sync` | Google Calendar OAuth code exchange, event push/import, calendar list, token refresh | **Stores plaintext Google OAuth tokens in `calendar_connections` without a `user_id`**; no in-code auth check; superseded by repo `calendar-auth`/`calendar-sync` | `supabase functions delete google-calendar-sync --project-ref jmjiyekmxwsxkfnqwyaa` |
| `link-preview` | Scrapes URL OG metadata with SSRF guard; caches results | Reads/writes `link_previews` (service role); superseded by repo `fetch-og-metadata` | `supabase functions delete link-preview --project-ref jmjiyekmxwsxkfnqwyaa` |
| `livekit-token` | Creates ephemeral LiveKit voice room (+agent dispatch, signed agent assertion) and returns join token | Gated by `realtime_voice` flag (default OFF → 410); verifies `trip_members`; secrets `LIVEKIT_*`, `AGENT_ASSERTION_SECRET`. Was deployed from this repo's CI (source since removed). Import map (`deno.json`) not returned by API | `supabase functions delete livekit-token --project-ref jmjiyekmxwsxkfnqwyaa` |
| `openai-chat` | Deprecated shim that proxies to `gemini-chat` (drops the caller's Authorization header on the hop) | Invokes `gemini-chat` (also being retired) — delete together | `supabase functions delete openai-chat --project-ref jmjiyekmxwsxkfnqwyaa` |
| `organization-billing-portal` | Creates Stripe Customer Portal session for org owners/admins | Reads `organization_members`, `organization_billing`; secret `STRIPE_SECRET_KEY` | `supabase functions delete organization-billing-portal --project-ref jmjiyekmxwsxkfnqwyaa` |
| `perplexity-chat` | Trip-context chat via Perplexity `sonar` with big inline "Lovable Concierge" prompt | Secret `PERPLEXITY_API_KEY`; reads `trip_privacy_configs` (privacy check **fails open**); writes `ai_queries` | `supabase functions delete perplexity-chat --project-ref jmjiyekmxwsxkfnqwyaa` |
| `photo-upload` | Multipart image upload to storage + metadata row | Storage bucket `trip-photos`; writes `trip_photos` with service role; **no in-code auth — trusts client `userId`/`tripId` form fields** | `supabase functions delete photo-upload --project-ref jmjiyekmxwsxkfnqwyaa` |
| `search` | Trip search: keyword ilike on `trips` + attempted `semantic-search` invoke, with hardcoded investor-demo fallback results | Invokes non-existent `semantic-search` (404 silently ignored); reads `trips` with caller JWT | `supabase functions delete search --project-ref jmjiyekmxwsxkfnqwyaa` |
| `send-organization-invite` | Sends org-invite email via Resend (`invites@chravel.app`) | Secret `RESEND_API_KEY`; **email content (`organization_name`, `invite_token`) is client-supplied** — spoofable invite mails; superseded by repo `invite-organization-member` | `supabase functions delete send-organization-invite --project-ref jmjiyekmxwsxkfnqwyaa` |
| `send-push-notification` | Sends FCM (legacy API) push to arbitrary `userIds` | **`verify_jwt=false` and no auth in code → unauthenticated push endpoint**; reads/updates `push_tokens` with service role; secret `FIREBASE_SERVER_KEY`; APNs/WebPush unimplemented | `supabase functions delete send-push-notification --project-ref jmjiyekmxwsxkfnqwyaa` |
| `send-scheduled-broadcasts` | Cron worker: marks due `broadcasts` sent and fans out push via `push-notifications` | Guarded by `cronGuard` (`CRON_SECRET`); **no `cron.job` entry invokes it** (verified 2026-08-05); writes `broadcasts`, reads `trip_members`, `push_tokens` | `supabase functions delete send-scheduled-broadcasts --project-ref jmjiyekmxwsxkfnqwyaa` |
| `send-trip-notification` | Preference- and quiet-hours-aware push to all trip members | Reads `trip_members`, `notification_preferences`, `push_tokens`; writes `notification_logs`; rpc `increment_badge_count`; FCM v1 URL contains literal `YOUR_PROJECT_ID` placeholder so it always falls back to the legacy API | `supabase functions delete send-trip-notification --project-ref jmjiyekmxwsxkfnqwyaa` |
| `share-preview` | Serves OG/unfurl HTML (+meta-refresh redirect) for trip/invite share links | Reads `trip_invites`, `trips`, `trip_members` (service role). Old share links in the wild may still hit this URL — check invocation logs before deleting | `supabase functions delete share-preview --project-ref jmjiyekmxwsxkfnqwyaa` |
| `voice-assistant` | Whisper STT → GPT-4o reply → ElevenLabs TTS voice pipeline | **Broken as deployed**: references `ELEVENLABS_API_KEY` without ever declaring it → ReferenceError on every request | `supabase functions delete voice-assistant --project-ref jmjiyekmxwsxkfnqwyaa` |
| `voice-processing` | Action endpoint: `speech_to_text` (Whisper) / `text_to_speech` (ElevenLabs) | Secrets `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`; no DB access; no in-code auth | `supabase functions delete voice-processing --project-ref jmjiyekmxwsxkfnqwyaa` |
| `waitlist-signup` | **Not a Chravel function** — "Broadcast Ntwrk" (saintmarlolabs.com) early-access waitlist signup + Resend notification | Upserts into `waitlist` table in **this** project's DB with service role; a foreign product's endpoint living in the Chravel project | `supabase functions delete waitlist-signup --project-ref jmjiyekmxwsxkfnqwyaa` |
| `xai-voice-session` | *(NOT ARCHIVED — bundle retrieval failed server-side; presumably an xAI/Grok voice-session token minting sibling of the other voice functions)* | Unknown; retrieve from dashboard before deleting or accept loss | `supabase functions delete xai-voice-session --project-ref jmjiyekmxwsxkfnqwyaa` |
| `758f320b-b3aa-4a5f-bc50-a82d2c87431d` | Accidental UUID-named deployment — its bundle is an **older duplicate of `gemini-voice-session`** (entrypoint `gemini-voice-session/index.ts`, v56) | Same Vertex voice stack as gemini-voice-session; clearly a mis-slugged deploy | `supabase functions delete 758f320b-b3aa-4a5f-bc50-a82d2c87431d --project-ref jmjiyekmxwsxkfnqwyaa` |
