# Chravel Cost Stack Audit + Financial Projection Model (2026-05-14)

## Scope
This audit inventories third-party services referenced in the codebase and maps them to cost behaviors. It also provides a scenario model for 100 / 1,000 / 10,000 / 100,000 MAU using explicit assumptions.

## 1) Third-party service inventory detected in repo

| Service | Evidence | Feature surface | Runtime status |
|---|---|---|---|
| Supabase (DB/Auth/Storage/Realtime/Edge Functions) | `@supabase/supabase-js`, many `supabase/functions/*`, `src/integrations/supabase/*` | Core app data, auth, notifications, AI orchestration, storage, realtime | Active |
| Vercel (hosting/serverless routes) | `api/*.ts` with `@vercel/node`, `vercel.json` references in comments | Preview/share routes and edge web endpoints | Active |
| Google Maps Platform | `@googlemaps/js-api-loader`, `src/config/maps.ts`, `google-maps-proxy` function | Places/maps/search UX | Active |
| Google Gemini API | `GEMINI_API_KEY`, `gemini-*` functions, parser/smart import | AI concierge + import extraction + TTS/voice | Active |
| OpenAI API (Realtime voice session path) | `create-openai-realtime-session`, env keys in `.env.example` | Voice concierge (provider-switchable) | Active/feature-flagged |
| LiveKit | `livekit-client`, `livekit-token` function, `VITE_LIVEKIT_WS_URL` | Alternate voice transport/session infra | Active/feature-flagged |
| Stream (GetStream Chat) | `stream-chat`, `stream-token`, `stream-webhook`, parity scripts | Chat/messaging infrastructure | Active |
| Stripe | `create-checkout`, `stripe-webhook`, publishable + secret env keys | Subscriptions/payments | Active |
| RevenueCat | `@revenuecat/purchases-js`, `sync-revenuecat-entitlement` | Mobile IAP entitlement sync | Active |
| PostHog | `posthog-js`, `VITE_POSTHOG_API_KEY` | Product analytics | Active (env-gated) |
| Sentry | `@sentry/react`, `VITE_SENTRY_DSN` | Error monitoring | Active (env-gated) |
| Mixpanel | `VITE_MIXPANEL_TOKEN` | Optional analytics | Optional |
| Google OAuth / Gmail API | `gmail-auth`, `gmail-import-worker`, `GOOGLE_CLIENT_*` | Gmail import + OAuth connect | Active |
| SendGrid | `SENDGRID_API_KEY` usage in `push-notifications` function | Email notifications | Active/secret-gated |
| Resend | `RESEND_API_KEY` in `.env.example` | Alternate email provider path | Configured but unclear active usage |
| Firebase/FCM + APNS | `FCM_SERVER_KEY`, `APNS_*` in env docs | Push notifications | Active/secret-gated |
| AWS (S3/Textract keys listed) | AWS secrets documented in `.env.example` | Document/ocr pipeline potential | Possibly partial/legacy |
| Firecrawl | `FIRECRAWL_API_KEY` in `.env.example` | Smart import/web extraction | Configured/optional |
| Lovable AI gateway | `LOVABLE_API_KEY`, provider fallback docs | AI fallback routing | Active fallback |

## 2) Cost classification by service

- **Supabase:** hybrid (fixed plan + DB compute scaling + storage + egress + edge invocations + MAU thresholds).
- **Vercel:** hybrid (seat + bandwidth + function execution/invocation).
- **Google Maps:** usage-based (per map load/request SKU).
- **Gemini / OpenAI:** usage-based (tokens/audio/realtime minutes depending endpoint).
- **LiveKit:** usage-based + plan floor (participant-minutes/egress).
- **Stream:** MAU + message/feature caps by plan tier.
- **Stripe:** per-transaction percentage + fixed fee.
- **RevenueCat:** subscription rev-share / tracked-revenue-based (plan dependent).
- **PostHog/Mixpanel/Sentry:** event/session/MTU based (plan specific).
- **SendGrid/Resend:** monthly volume tiers + overage per email.
- **FCM/APNS:** provider infra free, but implementation incurs surrounding compute/ops costs.

## 3) Public pricing references (official links)
- OpenAI API pricing: https://openai.com/api/pricing/ (checked 2026-05-14)
- Supabase pricing: https://supabase.com/pricing (checked 2026-05-14)
- Vercel pricing: https://vercel.com/pricing (checked 2026-05-14)
- Google Maps Platform pricing: https://mapsplatform.google.com/pricing/ (checked 2026-05-14)
- Stripe pricing: https://stripe.com/pricing (checked 2026-05-14)
- Stream Chat pricing: https://getstream.io/chat/pricing/ (checked 2026-05-14)
- LiveKit pricing: https://livekit.io/pricing (checked 2026-05-14)
- RevenueCat pricing: https://www.revenuecat.com/pricing/ (checked 2026-05-14)
- PostHog pricing: https://posthog.com/pricing (checked 2026-05-14)
- Sentry pricing: https://sentry.io/pricing/ (checked 2026-05-14)
- Mixpanel pricing: https://mixpanel.com/pricing/ (checked 2026-05-14)
- SendGrid pricing: https://sendgrid.com/pricing/ (checked 2026-05-14)
- Resend pricing: https://resend.com/pricing (checked 2026-05-14)
- Google AI (Gemini) pricing: https://ai.google.dev/pricing (checked 2026-05-14)

> Note: Exact contracted rates are unknown without billing dashboards.

## 4) Missing billing data (requires dashboard access)
1. Actual plan tiers and committed spend for Supabase/Vercel/Stream/LiveKit/PostHog/Sentry/Stripe/RevenueCat.
2. Actual per-feature usage baselines (tokens per AI request, avg voice session minutes, message fanout multiplier, avg media size).
3. Region, egress, and overage terms for Supabase and Vercel.
4. Whether email is SendGrid-only, Resend-only, or dual-path in production.
5. Whether OpenAI or Gemini is the production default for voice/text today.
6. Any enterprise discounts or prepaid credits.

## 5) Cost drivers by feature
- **AI Concierge text:** Gemini/OpenAI token spend + Supabase edge compute.
- **Voice Concierge:** OpenAI Realtime or Gemini Live tokens/audio + LiveKit minutes if enabled.
- **Chat/Broadcasts:** Stream MAU/message volume + notification fanout (email/SMS/push).
- **Places/Maps:** map loads + Places/autocomplete/geocoding requests.
- **Media:** Supabase storage GB growth + egress.
- **Auth + Core app:** Supabase MAU/auth/storage/realtime compute.
- **Payments:** Stripe transaction fee take-rate drag.
- **Smart import (Gmail/docs):** Gmail API + AI parsing tokens + OCR/processing.

## 6) Scenario projection model

### Baseline assumptions
- MAU scenarios: 100 / 1,000 / 10,000 / 100,000
- Per MAU/month: 50 text AI requests, 10 voice sessions, 30 chat messages, 5 uploads, 10 map searches, 2 smart imports, 1 trip created.
- Placeholder rate variables (replace with actual dashboard values):
  - `C_ai_text` = blended cost per text AI request
  - `C_voice_session` = blended cost per voice session
  - `C_chat_msg` = incremental chat/message cost
  - `C_upload` = storage+egress per upload
  - `C_map_search` = map/place request cost
  - `C_import` = smart import processing cost
  - `C_trip_create` = marginal backend cost per trip creation
  - `Fixed_monthly` = sum of base subscriptions/plan floors/seats

### Formula
`Monthly Cost = Fixed_monthly + MAU*(50*C_ai_text + 10*C_voice_session + 30*C_chat_msg + 5*C_upload + 10*C_map_search + 2*C_import + 1*C_trip_create)`

### Output table (expression form)
| MAU | Variable unit bundle per user | Total monthly cost |
|---:|---|---|
| 100 | `B = 50*C_ai_text + ... + C_trip_create` | `Fixed_monthly + 100*B` |
| 1,000 | `B` | `Fixed_monthly + 1,000*B` |
| 10,000 | `B` | `Fixed_monthly + 10,000*B` |
| 100,000 | `B` | `Fixed_monthly + 100,000*B` |

### Unit economics outputs
- **Cost per MAU** = `Monthly Cost / MAU`
- **Cost per trip created** = `Monthly Cost / (MAU*1)`
- **Cost per AI interaction** = `C_ai_text` (or blended including overhead)
- **Cost per voice session** = `C_voice_session`

## 7) Recommended cost monitoring strategy
1. Add a warehouse-style monthly cost mart keyed by provider + feature + environment.
2. Log per-request metadata for AI/voice/map/smart-import to compute true `C_*` coefficients.
3. Set provider budget alarms at 50/75/90% of monthly budget.
4. Add hard rate limits for high-variance features (voice, OCR, AI imports).
5. Track gross margin dashboards: revenue vs infra/API costs by cohort.
6. Add pre-launch kill switches for each expensive integration.

## 8) Prioritized margin risks
1. **Voice usage spikes** (highest variance; realtime audio is expensive).
2. **AI smart-import token bloat** (long documents/emails can explode token costs).
3. **Maps request amplification** (autocomplete/session misuse).
4. **Chat fanout + notifications** (email/SMS can compound quickly).
5. **Storage/egress drift** (media-heavy trips, no lifecycle policy).
6. **Plan cliff events** (Supabase/Vercel/Stream/analytics tier jumps).

## 9) Next actions (founder/ops)
1. Export last 90 days invoices from Supabase, Vercel, Stripe, Stream, LiveKit, OpenAI/Google AI.
2. Fill variable rates into this model and run sensitivity bounds (low/base/high).
3. Confirm production provider toggles (Gemini vs OpenAI vs LiveKit paths).
4. Implement monthly margin review with alert thresholds.
