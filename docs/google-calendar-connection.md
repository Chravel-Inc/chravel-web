# Google Calendar Connection (Scope A: OAuth + encrypted token storage)

This feature lets a user connect their Google Calendar via OAuth. Tokens are
AES-256-GCM encrypted at rest and never exposed to the frontend. It mirrors the
Gmail Smart Import OAuth flow exactly.

**Status:** connection foundation only — it stores refreshable, encrypted
credentials. It does **not** yet sync calendar events (that's a follow-up; see
"Next" below). Shipped **off** behind the `google_calendar_sync` feature flag.

## Architecture

| Layer | File |
| --- | --- |
| Token store | `supabase/migrations/20260721010000_google_calendar_accounts.sql` — `google_calendar_accounts` table (encrypted `access_token`/`refresh_token`, RLS select/delete-own, service-role writes) + token-free `google_calendar_accounts_safe` view |
| OAuth edge function | `supabase/functions/calendar-auth/index.ts` — `connect` / `callback` / `disconnect`; PKCE + HMAC-signed state; encrypts via `_shared/gmailTokenCrypto.ts` |
| Frontend API | `src/features/calendar/api/googleCalendarAuth.ts` |
| OAuth callback route | `/api/google-calendar/oauth/callback` → `src/pages/GoogleCalendarCallbackPage.tsx` |
| Settings UI | `src/features/calendar/components/GoogleCalendarSettings.tsx` (Settings → Integrations) |

Tokens are keyed by a dedicated `CALENDAR_TOKEN_ENCRYPTION_KEY` (separate from
`GMAIL_TOKEN_ENCRYPTION_KEY`) so the two token stores are cryptographically
isolated. The shared Google OAuth app (`GOOGLE_CLIENT_ID/SECRET`,
`OAUTH_STATE_SIGNING_SECRET`) is reused.

## Enablement runbook (all external, none flip on automatically)

1. **Google Cloud Console** (project `the-travel-app-467106`):
   - Enable the **Google Calendar API**.
   - Add `https://chravel.app/api/google-calendar/oauth/callback` (and any
     preview origins) to the OAuth client's Authorized redirect URIs.
   - Add the `.../auth/calendar.readonly` scope to the OAuth consent screen.
     This is a **sensitive scope** and requires Google's OAuth verification /
     security assessment before production use — start this early.
2. **Supabase secrets** (Dashboard → Edge Functions → Secrets):
   - `CALENDAR_TOKEN_ENCRYPTION_KEY` = `openssl rand -base64 32`.
   - Optionally `GOOGLE_CALENDAR_REDIRECT_URI` (defaults to the production URL).
   - `GOOGLE_ADDITIONAL_REDIRECT_URIS` for preview/staging origins.
3. **Deploy** the migration and the `calendar-auth` edge function.
4. **verify_jwt:** the function is JWT-gated by the platform default and in-code
   (`auth.getUser()` → 401). For parity with `gmail-auth`, optionally add
   `[functions.calendar-auth]\nverify_jwt = true` to `supabase/config.toml`
   (protected file — edit manually).
5. **Flip the flag** `google_calendar_sync` to enabled in `public.feature_flags`
   once Google verification is complete and test users are added.

## Verification

- Unit: `src/features/calendar/api/__tests__/googleCalendarAuth.test.ts` (redirect
  path + no Gmail-route collision).
- Migration validated by a `BEGIN/ROLLBACK` dry-run against prod (2026-07-21).
- Manual (staging, after Console setup): Settings → Integrations → Connect Google
  Calendar → consent → returns connected; row in `google_calendar_accounts` has
  `access_token` prefixed `enc:v1:`; disconnect removes the row and revokes at
  Google.

## Next (event sync — separate PR)

Sync needs a product decision: a user's Google Calendar is per-user, but Chravel
events (`trip_events`) are per-trip. One-way import into a chosen trip can reuse
the dead `calendar_event_mappings` / `calendar_sync_events` scaffolding. Refresh
logic (mirror `_shared/gmailTokenManager.ts`) is added with sync, when the tokens
are first actually used.
