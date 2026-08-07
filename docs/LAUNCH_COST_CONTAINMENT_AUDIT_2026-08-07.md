# Launch Cost Containment Audit — 2026-08-07

> **Audience:** bootstrapped founder preparing for public launch  
> **Scope:** repository-wide review of metered vendors, edge functions, storage, database/realtime,
> notifications, background jobs, retries, feature flags, and existing usage controls  
> **Evidence boundary:** this is a source-code audit. It does **not** prove the current settings in
> Google Cloud, Lovable, Supabase, Vercel, Stream, LiveKit, Resend, RevenueCat, Stripe, PostHog, or
> Sentry. Dashboard steps below are therefore launch requirements, not assumptions.

## 1. Founder answer

Yes, Chravel can be launched without accepting an uncapped `$300,000` surprise, but **the repo is
not yet a complete financial circuit breaker**.

The good news:

- The main text Concierge is authenticated, rate-limited, has per-trip request allowances for Free
  and Explorer, and has monthly token budgets for those tiers.
- Realtime voice is behind a server-side feature flag and is currently seeded off.
- Smart Import gives Free users five lifetime imports and records them atomically.
- Images in the canonical upload path are compressed to about 1 MB / 1920 px, account/trip limits
  exist in the client, notification email fan-out defaults off, and retention jobs prune several
  high-churn tables.
- There is a distributed database rate limiter. It fails closed when the limiter RPC fails.

The launch-blocking gaps:

1. **No cross-vendor global dollar ceiling exists.** Google budgets are alerts, not a payment stop.
   Every metered vendor needs its own hard quota/spend control plus an app-level kill switch.
2. **TTS and STT are authenticated but unmetered inside Chravel.** A signed-in user can repeatedly
   generate up to 4,000 characters of speech or upload 25 MiB transcriptions without a local rate or
   monthly allowance.
3. **Paid Concierge is unlimited.** `frequent_chraveler` has neither a trip-query limit nor a token
   budget by default. A compromised or obsessive paid account can consume unbounded inference.
4. **The token-budget lookup fails open.** A database/read failure allows the AI call. This favors
   availability over founder solvency.
5. **Several paid AI/import/Maps paths lack a distributed limiter or paid-usage budget.** Most have
   auth and/or product allowances, but they do not share one cost ledger or global circuit breaker.
6. **Media quotas are client-side and fail open.** Direct Storage API calls can bypass the UI quota;
   documents also have a separate direct upload path. Storage bucket object-size limits help with a
   single object, not aggregate account spend.
7. **The browser Maps “10k/day” monitor is not a global cap.** It is an in-memory counter per tab,
   resets on reload, and cannot protect a public browser key. Only Google Cloud API restrictions and
   quotas are authoritative.
8. **Forty deployed edge functions were previously identified as having no source in this repo.**
   Twenty-five reportedly use `verify_jwt=false`, including legacy AI/voice proxies. Until they are
   inventoried and undeployed, they are potential unauthenticated metered-key relays.

**Recommendation:** launch only after the P0 console controls and orphan-function shutdown are
complete. Keep expensive features available through graceful degradation, not by shutting down the
whole app: chat/calendar/tasks/polls/payments continue; AI voice, imports, enrichment, and uploads
can independently cool down.

## 2. What can increase the bill

| Surface | Vendor/meter | Trigger | Current repo control | Residual exposure | Launch posture |
|---|---|---|---|---|---|
| Text Concierge | Gemini or Lovable AI Gateway; Maps tools | prompts, context, output tokens, searches | auth; 20 req/min/user; Free 3 and Explorer 25 queries/trip; monthly Free/Explorer token budgets; `ai_concierge` server flag | paid tier unlimited; budget read fails open; no project-dollar breaker | **Amber** — add paid cap + global breaker |
| Read-aloud TTS | Lovable gateway → OpenAI TTS | characters/audio generated | auth; 4,000-char request max | no requests/min, chars/day, monthly budget, cache, or feature flag in function | **Red** |
| Speech-to-text | Lovable gateway → OpenAI transcription | audio minutes/bytes | auth; 25 MiB/request | no requests/min, minutes/day, monthly budget, or feature flag in function | **Red** |
| Realtime voice | Vertex/Gemini/LiveKit path | session minutes, audio tokens, participants | auth; 5 session creations/5 min; server flag `concierge_realtime_voice` seeded off | session-creation limit is not a duration/minute budget; vendor session could remain live | **Amber while off; Red if enabled** |
| Concierge tools | Gemini + Maps + web fetch | model tool selection and repeated calls | text Concierge parent limiter; tool executor 30/min/user; conditional tool registry | tools can multiply one user request into multiple paid calls; no per-tool dollar ceiling | **Amber** |
| Smart Import | Gemini, Firecrawl, Gmail APIs | URL/attachment parsing and retries | auth in functions; Free five lifetime imports via atomic RPC | Explorer/Frequent unlimited; no global daily cap; scraping vendors have separate credits | **Amber** |
| Embeddings/RAG | Gemini embeddings, DB/vector storage | uploads, ingestion, refresh cron | selected ingest/search functions rate-limited; retention for transient records | bulk regeneration/cron and document paths can fan out; vectors grow DB | **Amber** |
| Google Maps JS/Places | Google Maps Platform SKU calls | map loads, autocomplete, search, photos, geocode | browser cache; OSM fallback; server proxy 100/min/user | browser counter is per tab; public key abuse if restrictions/quotas are wrong | **Red until console verified** |
| Server Maps/enrichment | Maps/Places APIs | proxy, venue enrichment, AI grounding | auth on current functions; proxy 100/min/user | `venue-enricher` and `place-grounding` have no local limiter; one request may fan out | **Amber** |
| Receipt/document OCR | AWS Textract and/or AI parsing | uploaded receipt/document pages | auth/validation varies; document processor 10/min/user | page count, paid-plan and monthly-cost caps are not consistently enforced | **Red/Amber** |
| Trip media | Supabase Storage + egress | uploads, views, downloads | canonical images compressed; client plan/count quotas; RLS paths; MIME checks | aggregate quota bypassable; quota checks fail open; videos/documents uncompressed; public URLs amplify egress | **Red** |
| Voice notes | Supabase Storage + Stream attachment fetch | recordings and playback | auth/RLS path; client quota | one-year signed URLs; files counted through client only; repeated playback drives egress | **Amber** |
| Chat media/chat MAU | Stream | monthly active users, messages, attachments | authenticated Stream token/membership controls; Stream feature flags | MAU price steps and attachment transfer; no app-wide message/attachment allowance | **Amber** |
| Database/Auth | Supabase | MAU, DB size/compute, API and auth traffic | RLS/index hardening; retention; account/trip product limits | abusive reads/writes still consume compute/egress; rate limiting covers only selected edges | **Amber** |
| Realtime | Supabase/Stream | concurrent sockets and event fan-out | trip-scoped filters in current code; reconnect handling | event spikes and large trips increase fan-out/connections | **Amber** |
| Email | Resend | invitations and notification delivery | emails default off; eligible-category gating; send function 5/min/user | cron fan-out and retries need vendor daily ceiling; invite amplification still costs | **Amber** |
| Push | APNs/FCM (delivery free), Supabase compute | fan-out, retries, delivery rows | preferences; category gates; claimed delivery queue | direct delivery is cheap, but DB writes/function invocations scale with fan-out | **Green/Amber** |
| Hosting | Vercel | bandwidth, functions, image optimization, build minutes | static SPA/PWA; service worker cache | no repo-enforced account spend limit; public preview endpoints can be scraped | **Amber until console verified** |
| Analytics/errors | PostHog/Sentry | events, sessions, replays, errors | providers only initialize when keys exist; telemetry service centralizes config | viral sessions or an error loop can cross quotas quickly | **Amber** |
| Payments | Stripe/RevenueCat | transactions, webhook/function traffic | signature/auth and idempotency paths; billing kill switch | processing fees scale with revenue (healthy); retry storms affect compute/logs | **Green/Amber** |
| Preview/proxy endpoints | Vercel + Supabase Edge | bot/link unfurls, image proxying | preview rate limits and caching in selected paths | public bot traffic is attacker-controlled; ensure CDN caching and quotas | **Amber** |
| Cron/background work | Supabase Edge/DB + vendors | reminders, dispatch, retention, embedding refresh | cron auth; queue claiming; retention | a stuck retry/fan-out loop can multiply calls without per-run work ceilings | **Amber** |

## 3. Controls that are real today

### 3.1 Distributed request limiting

`_shared/rateLimitGuard.ts` requires a Supabase client and refuses to silently fall back to an
in-memory counter. Its underlying `checkRateLimit` uses the database RPC and fails closed. Current
callers include the main Concierge, Concierge tool execution, Maps proxy, realtime voice session
creation, document processing, embedding generation, artifact search, email, joins, broadcasts, and
public previews.

This is useful abuse protection, but a request count is not a cost budget. One request can contain a
large prompt, long audio, many document pages, or several tool calls.

### 3.2 Concierge product allowances

- Free: 3 queries per trip and 100,000 tokens/user/month by default.
- Explorer: 25 queries per trip and 600,000 tokens/user/month by default.
- Frequent Chraveler: unlimited unless
  `CONCIERGE_FREQUENT_MONTHLY_TOKEN_BUDGET` is explicitly set to a positive number.
- The usage check sums rows from `concierge_usage`; it does not reserve tokens atomically before the
  call. Concurrent requests can overshoot the boundary.
- When the usage query errors, it allows the request.

### 3.3 Feature flags and degradation levers

Server-side checks exist for `ai_concierge`, `concierge_realtime_voice`, and billing checkout.
Stream chat has feature flags. Notification channels have preferences and email defaults off. These
are valuable kill switches, but they are not one unified cost-control plane and not every paid
function consults one.

### 3.4 Media optimization and retention

The canonical upload path checks tier/account limits and compresses non-GIF images to `maxSizeMB: 1`
and `maxWidthOrHeight: 1920`. Data-retention jobs prune expired limiter rows and selected transient
data. Those controls reduce ordinary usage, but aggregate storage quotas must be enforced on the
server/storage boundary to stop a modified client.

## 4. Why a single global cap is not enough

There is no universal switch that stops all vendors at `$X` without also breaking essential
features. Use three layers:

1. **Vendor hard guardrails:** API quotas, usage limits, spend management, prepaid credits, key
   restrictions, and alerts in each console.
2. **Chravel cost ledger:** reserve estimated units before the paid operation, record actual units
   after it, and reject when user/feature/global windows are exhausted.
3. **Server-side feature flags:** disable only the cost center that is burning money and return a
   friendly degraded response.

Google Cloud explicitly warns that budgets do not cap usage. A budget alert may arrive after usage
is incurred. Google quotas/API restrictions are the preventive layer; budget alerts are detection.
Official references:

- [Google Cloud budgets](https://cloud.google.com/billing/docs/how-to/budgets)
- [Google Cloud quotas](https://cloud.google.com/docs/quota)
- [Google Maps usage and billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Supabase spend cap](https://supabase.com/docs/guides/platform/spend-cap)
- [Vercel spend management](https://vercel.com/docs/pricing/spend-management)

## 5. Recommended launch ceilings

These are intentionally conservative bootstrapped defaults, not vendor promises. Tune them after two
weeks of real telemetry.

| Window | Warning | Soft degradation | Hard stop | Action |
|---|---:|---:|---:|---|
| Total variable infrastructure/month | 50% of founder budget | 70% | 90% | preserve 10% for auth/chat/payment recovery traffic |
| Any paid feature/day | 50% of daily allocation | 75% | 90% | degrade that feature only |
| Text Concierge/user/day | 10 requests | 20 | 30 | cached/short answer, then reset next UTC day |
| Text Concierge/paid user/month | — | 500k tokens | 1M tokens initially | never ship an unlimited default |
| TTS/user/day | 5 reads or 10k chars | 10/20k | 15/30k | disable read-aloud, leave text intact |
| STT/user/day | 5 minutes | 10 | 15 | fall back to typing |
| Realtime voice/user/month | 15 minutes | 30 | 45 | end sessions cleanly, fall back to text |
| Smart Import/paid user/month | 10 | 20 | 30 | manual calendar entry remains available |
| Maps/server user/day | 25 paid SKU calls | 50 | 75 | cached results, saved places, OSM/deep-link fallback |
| Media/free user | current plan allowance | 80% bytes | 100% bytes | allow delete/download, block new upload |
| Media object | client UX limit | — | bucket `file_size_limit` | reject before transfer when possible |
| Email/user/day | 10 | 20 | 30 | in-app/push remain available |
| Email/global/day | 50% vendor allowance | 75% | 90% | pause nonessential categories |

Set the total founder budget explicitly. Example: if the maximum survivable variable spend is
`$1,000/month`, use `$500` warning, `$700` degradation, and `$900` hard stop. Do **not** set the hard
stop at the full cash limit because metering, alerting, retries, and vendor reporting are delayed.

## 6. Graceful degradation contract

Every cost rejection should return a stable error code, a retry/reset time, and a safe alternative.

| Feature stopped | User-facing response | Still works |
|---|---|---|
| Text AI | “Concierge is resting for this usage period. Your trip tools are still available.” | chat, calendar, tasks, polls, saved places |
| TTS | “Read aloud is temporarily unavailable. You can still read and copy the answer.” | text Concierge |
| STT/realtime voice | “Voice is paused right now. Continue by typing.” | typed prompt and all trip data |
| Maps/Places | show saved/cached places, address text, and external Maps deep link | basecamp and saved links |
| Smart Import/OCR | “Import is paused. Add this manually instead.” | normal event/payment creation |
| Media upload | “Upload limit reached. Existing media remains available; remove files or upgrade.” | viewing, downloading, deleting |
| Email | suppress nonessential mail and use in-app notification | invitations via copied link; in-app/push |
| Analytics/replay | silently sample/drop | all product behavior |

Never degrade auth, account deletion, purchases/entitlement repair, webhook verification, or access to
the user's existing data because a discretionary AI/media budget is exhausted.

## 7. Minimal implementation plan

### Repository implementation status — 2026-08-07

- **Voice P0 implemented in repo:** TTS and STT now require independent fail-closed server flags,
  distributed request limits, atomic daily/monthly reservations before provider invocation, bounded
  upstream timeouts, cancellation propagation, stable degradation codes, and reservation release on
  provider failure. Realtime voice remains off by default, reserves five-minute session blocks before
  minting a paid token, and receives a server-authored five-minute client disconnect deadline.
- **P1 foundation implemented:** `cost_usage_ledger`, `reserve_cost_units`, and
  `finalize_cost_units` are the canonical atomic cost ledger for voice. Their feature enum is
  intentionally narrow until each additional paid path is migrated and tested.
- **P2 voice optimization implemented:** realtime setup no longer performs a paid throwaway preflight
  mint before the SDK's real mint.
- **Paid text P0 implemented in repo:** every authenticated Gemini/Lovable text path now reserves an
  estimated token amount atomically before inference, accumulates actual usage across tool follow-ups,
  commits a conservative estimate for ambiguous provider failures, and releases only if no provider
  invocation began. Free/Explorer monthly and per-trip allowances are unchanged; Frequent Chraveler
  now defaults to 1,000,000 tokens/month instead of unlimited.
- **Deployment still required:** apply migration
  `20260807120000_cost_usage_ledger_and_voice_controls.sql` and deploy the four changed voice edge
  functions. Until that happens, production behavior has not changed.
- **Realtime limitation:** a browser timer is not a hostile-client server disconnect. Realtime voice
  therefore remains launch-disabled (`concierge_realtime_voice=false` and
  `cost_voice_realtime=false`) until the provider/proxy can enforce server-side socket termination.
  Do not enable both flags based only on the client timer.

The remaining P0 items below are separate production-critical phases. They are not implied complete
by the shared voice/text ledger.

### P0 — before public announcement

1. **Set console guardrails.** Complete every checklist in §8. A dashboard screenshot/export should
   be attached to the launch ticket because source code cannot prove these settings.
2. **Remove orphaned deployed functions.** Export 7-day logs/config, archive source if recoverable,
   then undeploy the 40 repo-orphan endpoints in the waves documented in
   `docs/SCALE_HARDENING_2026-08.md`; begin with legacy AI/voice proxies.
3. **Cap every voice path.** Add distributed per-user request limits, daily/monthly character or
   audio-minute budgets, maximum session duration, `AbortController` cleanup, and server-side flags
   to TTS/STT/realtime functions.
4. **Remove “unlimited” inference.** Set `CONCIERGE_FREQUENT_MONTHLY_TOKEN_BUDGET` to a conservative
   positive value immediately; change budget evaluation to fail closed for paid inference and use an
   atomic reserve/finalize operation to prevent concurrency overshoot.
5. **Enforce media quotas server-side.** Move aggregate byte/count enforcement into an atomic RPC or
   upload-ticket edge function, set bucket MIME/object-size limits, and make all documents/images/
   videos use that one path. Keep the existing client checks for fast UX only.
6. **Restrict Google keys.** Separate browser and server keys. Browser key: exact production/test
   referrers plus only required browser APIs. Server key: no referrer use, only required web-service
   APIs, stored only as an edge secret. Apply API/SKU daily quotas that fit the founder budget.

### P1 — first week after launch

1. Add a `cost_usage_ledger` with atomic `reserve_cost_units` / `finalize_cost_units` RPCs keyed by
   user, feature, provider, UTC day, and billing month.
2. Add `cost_control_state` thresholds for warning/degrade/stop and flags such as
   `cost_ai_text`, `cost_ai_voice`, `cost_maps`, `cost_import`, `cost_media_upload`, and
   `cost_email`. Evaluate server-side before touching a vendor.
3. Instrument vendor request count, estimated units, actual tokens/bytes/duration, latency, status,
   cache hit, retry count, user, trip, and feature. Never log prompt/media contents or secrets.
4. Add an admin “Cost controls” panel with 24-hour/month usage, threshold status, last trip reason,
   and one-tap per-feature stop/resume. Audit every operator change.
5. Add anomaly alerts: spend velocity >2× seven-day baseline, one user >5% of daily paid usage,
   retries >10%, storage/egress >75%, and provider 429/402 spikes.

### P2 — after two weeks of production data

1. Replace estimated units with billing-export reconciliation and calculate cost per activated user,
   paid user, trip, AI request, voice minute, media GB, and event attendee.
2. Adjust plan allowances so gross margin remains safe at p95 usage—not just average usage.
3. Add cache/deduplication for identical TTS text, geocodes, Place Details, OG metadata, and document
   fingerprints where provider terms permit it.
4. Define event surge packs and admin-set trip budgets so a 50,000-attendee event cannot consume the
   consumer-wide monthly pool.

## 8. External console runbooks

### 8.1 Google Cloud / Maps

**Human checklist**

- Create budget alerts at 25/50/75/90/100% and route them to at least two channels.
- Remember: budget alerts do not stop usage.
- Set daily/per-minute quotas per enabled Maps/Places/Geocoding API.
- Use separate browser/server keys; restrict both by application and API.
- Disable APIs not found in the production call inventory.
- Enable billing export and review costs by SKU daily for launch week.

**AGENTIC BROWSER SCRIPT**

1. Open Google Cloud Console and select the production Chravel project.
2. Go to **Billing → Budgets & alerts → Create budget**.
3. Scope to this project; enter the founder-approved monthly variable budget.
4. Add actual-spend thresholds at 25%, 50%, 75%, 90%, and 100%; add forecasted-spend alerts.
5. Add founder email and the launch alert channel; save.
6. Go to **APIs & Services → Enabled APIs & services**; export the list.
7. Open each Maps/Places/Geocoding API → **Quotas & System Limits**.
8. Set daily and per-minute quotas derived from §5; request no quota increase during launch week.
9. Go to **Credentials**; open the browser key.
10. Choose **Websites**, add exact production and approved preview referrers, and restrict to required
    Maps JavaScript/Places APIs; save.
11. Open/create the server key; restrict it to required web-service APIs and the strongest supported
    server application restriction; store it only as `GOOGLE_MAPS_API_KEY` in Supabase secrets.
12. Go to **Billing → Billing export** and enable detailed usage cost export.

### 8.2 Supabase

**Human checklist**

- Verify Spend Cap is on where supported and understand which categories remain chargeable.
- Set budget alerts, storage/egress/database/realtime monitoring, and MFA on the founder account.
- Verify bucket public/private state, file-size/MIME limits, and retention cron health.
- Compare deployed functions to the 94 source directories and undeploy approved orphans.

**AGENTIC BROWSER SCRIPT**

1. Open the production Supabase organization and project.
2. Go to **Organization Billing → Usage/Spend Cap**; enable the cap and alerts where available.
3. Record included quotas and overage behavior for egress, cached egress, storage, database size,
   MAU, realtime connections/messages, and edge invocations.
4. Go to **Storage**; inspect every bucket's public state, object-size limit, MIME allowlist, and RLS.
5. Go to **Edge Functions**; export deployed names and compare to `supabase/functions/*`.
6. Inspect 7-day logs for each orphan; archive evidence, then delete approved legacy AI/voice proxies.
7. Go to **Database → Cron Jobs**; confirm rate-limit cleanup and retention jobs succeed.
8. Go to **Logs/Reports**; create alerts at 50/75/90% for storage, egress, DB, realtime, and functions.
9. Go to account security and enable MFA for every production administrator.

### 8.3 Lovable AI / OpenAI / Gemini / LiveKit

**Human checklist**

- Confirm which account is actually billed for every route.
- Apply the lowest hard project usage limit/prepaid balance supported.
- Set `CONCIERGE_FREQUENT_MONTHLY_TOKEN_BUDGET` before launch.
- Keep realtime voice off until minute budgets and maximum duration ship.
- Rotate/remove keys held by orphaned functions.

**AGENTIC BROWSER SCRIPT**

1. Open each provider workspace referenced by production secrets.
2. Select **Usage/Billing/Limits** and set a monthly hard limit below the founder survival budget.
3. Add 50/75/90% notifications to founder email and the launch alert channel.
4. Export the last 30 days by model/project/key.
5. Disable unused models/projects/keys and rotate any key accessible to an orphan endpoint.
6. In Supabase **Edge Functions → Secrets**, set a positive
   `CONCIERGE_FREQUENT_MONTHLY_TOKEN_BUDGET` and confirm Free/Explorer defaults.
7. In Chravel feature flags, verify `concierge_realtime_voice=false`.
8. Run one text request, TTS request, and rejected voice request; confirm usage appears in the
   intended provider account only.

### 8.4 Vercel, Stream, Resend, PostHog, Sentry

**Human checklist**

- Vercel: enable spend management and alerts; cap/suppress expensive optional features before core
  hosting where the plan supports it.
- Stream: confirm contracted MAU/storage/transfer tier and rate-limit settings; alert before step-up.
- Resend: set daily sending limit/alerts; retain email default-off and category eligibility.
- PostHog/Sentry: cap session replay/sampling and error/event ingestion; prevent an error loop from
  becoming a second incident.

**AGENTIC BROWSER SCRIPT**

1. Open Vercel team **Settings → Billing/Spend Management**; set warning and maximum thresholds from
   §5, then verify alert recipients.
2. Open Stream **Billing/Usage**; record MAU, messages, attachment storage/transfer, plan boundary,
   and the next-tier price. Configure available rate/usage alerts.
3. Open Resend **Usage/Billing**; set the lowest practical daily cap and 50/75/90% alerts.
4. Open PostHog **Billing & limits**; set event/session replay limits and a conservative replay
   sample rate.
5. Open Sentry **Subscription/Spend allocation**; cap errors, transactions, replays, and attachments;
   configure spike alerts.
6. Export screenshots/CSVs from all five and attach them to the launch checklist.

## 9. Verification checklist

### Automated

- [ ] Every paid edge function has authentication or an explicitly documented webhook/cron guard.
- [ ] Every user-triggered paid edge function has distributed request limiting.
- [ ] Every variable-unit operation reserves budget before vendor invocation.
- [ ] TTS/STT/realtime voice tests cover 429, daily/monthly exhaustion, feature-off, cancellation,
  upstream timeout, and no ledger charge on rejected calls.
- [ ] Media tests prove a modified client cannot exceed aggregate bytes/counts.
- [ ] Static test fails if a paid provider call is added without a cost-control declaration.
- [ ] Kill-switch tests prove only the expensive feature degrades.

### Manual launch drill

1. Set each discretionary feature's threshold to zero in staging.
2. Confirm AI text, voice, Maps, import, upload, and email each show the designed fallback.
3. Confirm login, trip access, chat, calendar, tasks, polls, payments, data export, and account
   deletion still work.
4. Trigger a warning threshold and verify both alert channels receive it.
5. Trigger a hard threshold and verify the vendor is not called.
6. Restore thresholds and confirm recovery needs no redeploy.
7. Rehearse the emergency order: voice → imports/OCR → Maps enrichment → TTS/STT → text AI → media
   uploads → nonessential email. Never start by disabling the whole app.

## 10. Operating cadence for a solo founder

- **Launch day:** check provider dashboards at start, +1h, +4h, and end of day.
- **First week:** daily 10-minute review of spend, spend velocity, p95 user, errors/retries, storage,
  egress, and feature flags.
- **Thereafter:** weekly until variable cost per active user and p95 behavior are stable for a month.
- **Incident threshold:** any provider projects >2× expected daily spend, one user consumes >5% of a
  daily pool, or an unexplained retry/error spike occurs. Disable that feature first, then diagnose.
- **Cash rule:** never raise a vendor quota because users hit it until the matching revenue/gross
  margin and abuse distribution are understood.

## 11. Evidence map

| Finding | Repository evidence |
|---|---|
| Distributed limiter | `supabase/functions/_shared/rateLimitGuard.ts`, `supabase/functions/_shared/security.ts` |
| Concierge limits/token budgets | `supabase/functions/_shared/concierge/usagePolicy.ts`, `supabase/functions/lovable-concierge/index.ts` |
| TTS lacks local budget | `supabase/functions/concierge-voice-tts/index.ts` |
| STT lacks local budget | `supabase/functions/concierge-stt/index.ts` |
| Voice flag/session creation limit | `supabase/functions/realtime-voice-session/index.ts`, `supabase/migrations/20260711210646_disable_realtime_voice_for_app_store.sql` |
| Smart Import allowance | `supabase/functions/_shared/smartImportUsage.ts` |
| Browser-only Maps monitor | `src/services/googlePlacesNew.ts`, `src/config/maps.ts` |
| Client-side media quota/compression | `src/services/uploadService.ts`, `src/services/mediaService.ts` |
| Notification channel defaults | `supabase/functions/_shared/notificationUtils.ts`, `supabase/functions/_shared/notificationDispatchPolicy.ts` |
| Retention | `supabase/migrations/20260805120200_data_retention_jobs.sql` |
| Orphan deployed functions | `docs/SCALE_HARDENING_2026-08.md` |

## 12. Risk score

- **Before this audit:** **58/100**. Several good local controls exist, but a viral event can still
  reach unmetered voice, unlimited paid AI, bypassable storage quotas, a browser Maps key, or legacy
  deployed endpoints. Dashboard caps are unverified.
- **After this audit/documentation:** **72/100**. The exposure, shutdown order, conservative budgets,
  and exact operator actions are now explicit and testable. This is not 90+ because documentation
  cannot configure external vendors or implement the shared cost ledger/server-side media quota.
- **Target after P0:** **90/100**. Hard vendor quotas, orphan removal, voice/AI caps, and server-side
  media enforcement provide a safe launch boundary.
- **Target after P1:** **96/100**. One cost-control plane, anomaly alerts, and graceful degradation
  make spend containment observable and operable without a redeploy.

---

This report supersedes the control recommendations—but not the historical pricing model—in
`docs/cost-audit/chravel-cost-audit.md`. Pricing and plan allowances change; verify vendor consoles
and current official documentation before using any dollar estimate in a financing decision.
