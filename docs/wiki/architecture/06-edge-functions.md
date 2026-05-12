# Edge Functions

**88 edge functions** under `supabase/functions/` at SHA `1e833665`. All Deno-runtime, deployed via the `deploy-functions.yml` GitHub Action when changes land on `main`.

## Shared utilities (`supabase/functions/_shared/`)

| File | Purpose |
|---|---|
| `requireAuth.ts` | JWT validation middleware (used on every authed function) |
| `cors.ts` | CORS origin allow-list (exact match, no wildcards) |
| `validateSecrets.ts` | `requireSecrets()` startup check (per `CLAUDE.md` rule #11) |
| `featureFlags.ts` | Runtime kill switches via `feature_flags` table |
| `cronGuard.ts` | Cron secret validation (fail-closed) |
| `gemini.ts` | Gemini API client (streaming + non-streaming) |
| `vertexAuth.ts` | Vertex AI auth via service account |
| `contextBuilder.ts` | Rich AI context assembly (30 KB) |
| `functionExecutor.ts` | **Concierge tool dispatcher** (143 KB — main brain) |
| `voiceToolDeclarations.ts` | Voice concierge tool specs |
| `multimodalEmbeddings.ts` | Embedding generation |
| `notificationContentBuilder.ts` | Message templating |
| `notificationUtils.ts` | Notification delivery helpers |
| `fcmV1.ts` | Firebase Cloud Messaging v1 wrapper |
| `webPushUtils.ts` | Web push notification helpers |
| `smsTemplates.ts` | SMS templates |
| `circuitBreaker.ts` | Failure recovery |
| `rateLimitGuard.ts` | Rate-limit enforcement |
| `errorHandling.ts` | Unified error responses |
| `securityHeaders.ts` | Response header hardening |
| `security.ts` + `security/` | RLS/token/permission helpers |
| `tokenCrypto.ts`, `gmailTokenCrypto.ts` | Token encrypt/decrypt |
| `tripEntitlementPolicy.ts` | Trip access control logic |
| `conciergeUsage.ts`, `smartImportUsage.ts` | Quota tracking |
| `entitlementSelection.ts`, `entitlementUpsert.ts` | Entitlement updates |
| `superAdmins.ts` | Super-admin allow-list (server-side) |
| `ogUtils.ts`, `urlScraper.ts` | OG metadata helpers |
| `telemetry.ts` | Event tracking |
| `validation.ts` | Schema validation |
| `promptBuilder.ts`, `promptTypes.ts` | Prompt assembly |
| `aiUtils.ts`, `aiQualityTests.ts` | AI model helpers + asserts |
| `authHeaders.ts` | Bearer-token extraction |

## Function inventory (88)

Grouped by domain. Every function's directory exists under `supabase/functions/<name>/`. Lines below identify each function's `verify_jwt` setting per `supabase/config.toml`.

### Auth & identity (5)

| Name | `verify_jwt` | Purpose |
|---|---|---|
| `join-trip` | true | Accept an invite token, create membership |
| `approve-join-request` | true | Trip admin approves pending member |
| `accept-organization-invite` | true | Accept org invite token |
| `invite-organization-member` | true | Send org invite |
| `log-auth-event` | (default) | Auth telemetry sink |

### Trips & members (7)

`create-trip`, `get-trip-detail`, `get-trip-preview` (false), `generate-trip-preview` (false), `restore-trip`, `export-trip`, `link-trip-to-organization`.

### Chat / broadcasts / Stream (11)

| Name | `verify_jwt` | Purpose |
|---|---|---|
| `broadcasts-create` | (default) | Create broadcast row + fan-out |
| `broadcasts-fetch` | (default) | Pull broadcasts for trip |
| `broadcasts-react` | (default) | Reaction toggle |
| `stream-token` | true | Mint Stream Chat user token |
| `stream-webhook` | false | Stream-side events |
| `stream-setup-permissions` | true | Initial Stream role setup |
| `stream-canary-guard` | (default) | Parity / canary checks |
| `stream-ensure-membership` | (default) | Sync Stream channel membership |
| `stream-join-channel` | (default) | Add user to Stream channel |
| `stream-moderation-action` | (default) | Stream moderation API |
| `stream-reconcile-membership` | (default) | Periodic membership sync |
| `create-default-channels` | true | Seed trip channels |

### Calendar & events (5)

`calendar-sync`, `event-reminders` (false; cron), `message-scheduler`, `scrape-schedule`, `scrape-agenda`, `scrape-lineup`.

### AI concierge (10)

| Name | `verify_jwt` | Purpose |
|---|---|---|
| `lovable-concierge` | true | Main concierge text + tool-call dispatcher |
| `demo-concierge` | false | Public demo concierge (separate rate-limited endpoint) |
| `execute-concierge-tool` | (default) | Post-confirmation tool execution |
| `concierge-tts` | false | TTS for concierge readbacks |
| `gemini-tts` | (default) | General Gemini TTS |
| `google-tts` | (default) | Google Cloud TTS fallback |
| `gemini-voice-session` | false | Vertex AI Live session bootstrap |
| `gemini-voice-proxy` | false | Voice proxy bridge |
| `livekit-token` | false | Mint LiveKit room token |
| `place-grounding` | (default) | Ground AI responses with place data |

### AI infra / search / RAG (8)

`ai-answer`, `ai-features`, `ai-ingest`, `ai-search`, `artifact-ingest`, `artifact-search`, `generate-embeddings`, `batch-generate-embeddings` (false), `regenerate-all-embeddings` (false), `populate-search-index`.

### Smart import / parsing (6)

`gmail-auth`, `gmail-import-worker`, `document-processor`, `enhanced-ai-parser`, `file-ai-parser` _(via shared)_, `message-parser`, `process-receipt-ocr`, `receipt-parser`, `confirm-reservation-draft`.

### Media / uploads (3)

`file-upload`, `image-upload`, `image-proxy` (false), `upload-campaign-image`.

### Payments / billing (6)

| Name | `verify_jwt` | Purpose |
|---|---|---|
| `create-checkout` | true | Stripe checkout init |
| `customer-portal` | true | Stripe customer portal link |
| `fetch-invoices` | true | Stripe invoice list |
| `check-subscription` | true | Resolve current entitlement |
| `stripe-webhook` | false | Stripe webhook receiver |
| `revenuecat-webhook` | (default; signature-gated) | RC webhook receiver |
| `sync-revenuecat-entitlement` | true | Push RC state to DB |
| `payment-reminders` | (default; cron) | Schedule reminders |

### Notifications & push (9)

`create-notification`, `dispatch-notification-deliveries` (false; cron), `push-notifications`, `send-push`, `web-push-send`, `send-email-with-retry`, `daily-digest`, `event-reminders` (false), `share-preview`.

### Orgs / admin / ops (8)

`process-account-deletions`, `export-user-data`, `cleanup-staging-tables`, `verify-identity`, `delete-stale-locations`, `health`, `seed-demo-data`, `seed-carlton-social`, `seed-carlton-universe`, `seed-mock-messages`.

### Misc / integrations (5)

`google-maps-proxy`, `fetch-og-metadata`, `update-location`, `venue-enricher`.

## High-leverage deep-dives

### `lovable-concierge`

- **Size:** 2,155 lines (per `CLAUDE.md` tech-debt note).
- **Inputs:** Authenticated user, optional `tripId`, conversation history, user message.
- **Pipeline:** auth → rate-limit → query classification (18 classes) → selective tool loading (38 tools from `_shared/concierge/toolRegistry.ts`) → context build → prompt assembly → Gemini call with function calling → tool execution via capability tokens + `functionExecutor.ts` → usage tracking → response.
- **Tool single-source-of-truth:** `_shared/concierge/toolRegistry.ts` (memory #23).
- **Idempotency:** `concierge_tool_idempotency` table (memory #25).
- **5-file sync warning** (memory #26): registry + executor + confirm-handler + UI renderer + telemetry must all stay aligned. See `subsystems/ai-concierge.md`.

### `stripe-webhook`

- **`verify_jwt = false`** — webhook validation is signature-based (`STRIPE_WEBHOOK_SECRET`).
- Writes to `user_entitlements`, may touch `payment_audit_log`.
- Idempotency via `webhook_events` table (best practice).

### `gemini-voice-session` + `livekit-token`

- Both public (`verify_jwt = false`). Auth is via short-lived capability tokens minted server-side.
- Prereq: LiveKit voice agent deployed (`.github/workflows/deploy-agent.yml`) and room metadata seeded (memory #14).

### `gmail-import-worker`

- Long-running. Imports gmail threads → parses → produces `trip_artifacts` / `smart_import_candidates`.
- Memory #22: must persist partial state — never silently drop parsed items on retry.

## CI deploy contract

`.github/workflows/deploy-functions.yml`:
- Triggers on push to `main` with changes under `supabase/functions/**`.
- Uses Supabase CLI to push each function.
- Secrets validated against `_shared/validateSecrets.ts` at function startup.

## Mobile / PWA / Capacitor considerations

Edge functions are server-side; mobile shells call them the same way as web. The CORS allow-list (`_shared/cors.ts`) includes `http://localhost` and Lovable preview origins — see file for the full list. Native Capacitor builds run via custom scheme — those origins must be added if a function-direct call is needed (most go through `supabase-js`, which doesn't need CORS).

## Known risks

- **`functionExecutor.ts` is 143 KB.** Modifications without careful test coverage are high-risk. Cross-link `RISKS.md`.
- **`lovable-concierge` is 2,155 lines** (`CLAUDE.md` tech-debt). Tool additions silently break if any of the 5 sync points are missed.
- **Cron functions** (`event-reminders`, `dispatch-notification-deliveries`, `payment-reminders`, etc.) — must use `cronGuard.ts` to validate `CRON_SECRET`. Any function with no cron guard is a P0 (memory: DEBUG_PATTERNS #4).

## Source Refs

- `supabase/functions/` — 88 directories
- `supabase/functions/_shared/` — 40 shared utilities
- `supabase/config.toml:1-147` — `verify_jwt` per-function map
- `.github/workflows/deploy-functions.yml` — deploy pipeline
- `CLAUDE.md` — Supabase rule #11 (validateSecrets)
- `agent_memory.jsonl` #22, #23, #25, #26 — concierge tool sync rules
