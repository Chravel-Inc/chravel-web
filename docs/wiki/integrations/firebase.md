# Firebase (FCM)

## Why we use it
**Push notifications only** via Firebase Cloud Messaging v1. Not used for auth, DB, hosting, or storage — Supabase covers those.

## Where it's initialized
- Server-side wrapper: `supabase/functions/_shared/fcmV1.ts` (4.6 KB)
- Web push paired with native push: `supabase/functions/_shared/webPushUtils.ts`
- Token storage: `push_device_tokens`, `push_tokens` tables

## API surface used
- `POST` to `https://fcm.googleapis.com/v1/projects/{project_id}/messages:send` with service-account-derived bearer token.
- Token registration: client posts FCM token from native shell -> stored against user.

## Env vars
| Var | Side | Purpose |
|---|---|---|
| `FCM_SERVICE_ACCOUNT_JSON` | edge | Service account credentials (JSON-encoded) |
| `FCM_PROJECT_ID` | edge | GCP project ID |
| `VITE_VAPID_PUBLIC_KEY` | client | Web push VAPID public key |
| `VAPID_PRIVATE_KEY` | edge | Web push VAPID private key |

## Failure modes & retry behavior
- Token unregistered -> mark `push_device_tokens.is_active = false`.
- Quota / rate limit -> log + back off.
- Dual-path dedup (memory #10): same user can have multiple registered tokens (iOS + web); fan-out logic in `notificationUtils.ts` must dedupe to one delivery per user per logical notification.

## Cost / quota notes
- FCM is free at standard volumes. Watch token churn.

## Source Refs
- `supabase/functions/_shared/fcmV1.ts`
- `supabase/functions/_shared/webPushUtils.ts`
- `supabase/functions/_shared/notificationUtils.ts`
- `supabase/functions/{send-push,push-notifications,web-push-send}/`
- DB tables: `push_device_tokens`, `push_tokens`, `web_push_subscriptions`
- `agent_memory.jsonl` #10 — dual-path dedup
