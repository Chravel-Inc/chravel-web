# Chravel Google Play Data Safety Mapping

**Last Updated:** April 14, 2026
**Scope:** Google Play Console → App content → Data safety

## 1) Data Collected (Play form alignment)

| Data Type | Collected | Shared with Third Parties | Purpose |
|---|---|---|---|
| Name | Yes | No (processor-only paths) | Account management, app functionality |
| Email address | Yes | No (processor-only paths) | Account management, support |
| User IDs / Device identifiers | Yes | Yes (PostHog, Sentry) | Analytics, diagnostics |
| Messages (chat content) | Yes | Yes (Stream) | App functionality (messaging) |
| Photos / videos / files | Yes | No (processor-only storage path) | App functionality |
| Audio data (voice sessions) | Yes | Yes (LiveKit) | App functionality |
| Precise location | Yes (in-use only) | Yes (Google Maps services) | Maps and places features |
| Purchase history / entitlement status | Yes | Yes (RevenueCat, Stripe where applicable) | Subscription functionality |
| App interactions / usage telemetry | Yes | Yes (PostHog) | Analytics |
| Crash logs / diagnostics | Yes | Yes (Sentry) | Diagnostics and reliability |

## 2) SDK and Service Mapping

| SDK / Service | Data Categories | Shared | Notes |
|---|---|---|---|
| `@supabase/supabase-js` | Account, trip content, user content | Processor path | Primary backend |
| `posthog-js` | App interactions, device metadata | Yes | Product analytics |
| `@sentry/react` | Crash logs, diagnostics, device metadata | Yes | Error monitoring |
| `stream-chat` | Messages, channel metadata, user IDs | Yes | UGC chat transport |
| `livekit-client` | Audio/session metadata | Yes | Voice sessions only during active use |
| `@revenuecat/purchases-js` | Purchase/entitlement status | Yes | Subscription entitlement orchestration |
| `@googlemaps/js-api-loader` | Location queries | Yes | Maps and places |
| Stripe web checkout (web path) | Purchase data | Yes | Web billing path only |

## 3) Play Console Answering Notes

- Mark **location** as collected **only while app is in use** (not background).
- Mark **audio** as collected only during **active voice session use**.
- Mark data handling as **encrypted in transit**.
- Mark account deletion as available via in-app deletion flow and public deletion URL.

## 4) Required Console Follow-through (Human)

1. Open Google Play Console → **App content** → **Data safety**.
2. Enter responses using the tables above.
3. Save draft and run console validation checks.
4. Publish the updated Data Safety declaration with the same release train as policy updates.

