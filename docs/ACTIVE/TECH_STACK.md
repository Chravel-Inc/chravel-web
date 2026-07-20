# Chravel Tech Stack (Compliance / Vendor Questionnaire Reference)

> **Purpose:** Canonical answer to "What does your tech stack look like?" for compliance
> vendors (Vanta), security questionnaires, and diligence calls.
> **Last verified:** 2026-07-20, by full repo sweep (package.json, all 14 GitHub Actions
> workflows, `vercel.json` CSP allowlist, `render.yaml`, `.env.example` /
> `.env.production.example`, and `Deno.env.get()` usage across ~95 Supabase edge functions
> via `scripts/check-env-coverage.ts`).
> **Hygiene rule:** this doc lists vendor names and env-var *names* only — never values,
> keys, or non-public hostnames.

---

## 1. Quick Answers (the four things Vanta asks)

| Question | Answer |
| --- | --- |
| **Cloud provider** | Multi-cloud, PaaS-first: **Supabase** (Postgres, Auth, Storage, Edge Functions — AWS-backed), **Vercel** (frontend hosting + serverless API routes), **Google Cloud** (Maps, Vision OCR, Text-to-Speech, Vertex/FCM, Gemini), **Render** (link-preview microservice), plus a minor direct **AWS** integration (Textract OCR fallback). No self-managed servers. |
| **Identity provider** | Workforce: **Google Workspace** (chravelapp.com accounts; SaaS access via Google sign-in). Customer-facing product auth: **Supabase Auth** — email/password, Google OAuth, Sign in with Apple. |
| **Version control** | **GitHub** (`Chravel-Inc` organization). CI/CD via GitHub Actions with CodeQL SAST, Gitleaks secret scanning, and required status checks. |
| **Task tracker** | **GitHub Issues/PRs** (engineering work) + **Notion** (planning and documentation). |

---

## 2. Application Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + Vite 5 (SWC) + TypeScript, single-page app |
| Server state | TanStack Query 5 (+ IndexedDB persistence) |
| Client state | Zustand 5 |
| UI | Tailwind CSS 3 + shadcn/ui (Radix primitives) |
| Routing | React Router DOM 6 |
| Validation | Zod 4 |
| PWA | Workbox-generated service worker + web manifest (installable) |
| iOS | Native wrapper of the same web app; native builds ship from the separate `chravel-mobile` repository via Fastlane → TestFlight / App Store Connect (bundle id `com.chravel.app`) |
| macOS | SwiftUI desktop shell (`macos/`) talking to the same Supabase backend |
| Runtime pinning | Node 22, normalized across `engines` (≥22), `.nvmrc`, all CI workflows, and Render |

No Python services, no GraphQL, no traditional application server.

## 3. Hosting & Infrastructure

- **Vercel** — production frontend (`chravel.app`) + serverless preview/OG routes (`api/invite-preview.ts`, `api/trip-preview.ts`).
- **Supabase** — managed Postgres, Auth, Realtime, Storage, and ~95 Deno edge functions (project ref `jmjiyekmxwsxkfnqwyaa`).
- **Google Cloud** — project `the-travel-app-467106` (Maps Platform, Vision, TTS, Vertex service account for FCM, Gemini API).
- **Render** — `chravel-unfurl` Docker service serves `p.chravel.app` in production (confirmed 2026-07-20: DNS CNAMEs to `chravel-unfurl-s58a.onrender.com`, fronted by Render's Cloudflare CDN edge). A Cloudflare Worker build of the same code exists as a dormant portable alternate (`unfurl/wrangler.toml`) — it is **not** deployed.
- **GitHub Pages** — internal codebase atlas only (no customer data).
- **Domains** — `chravel.app` (product), `chravelapp.com` (marketing redirect), `cdn.chravel.app`, `p.chravel.app`.

## 4. Data Layer

- Supabase Postgres with **756 Row-Level Security policies** — authorization is enforced at the database, not the client.
- Supabase Realtime (websockets) for live trip collaboration; Supabase Storage for media.
- Schema migrations are version-controlled in `supabase/migrations/` with CI drift detection (`scripts/check-schema-drift.ts`) against generated TypeScript types.

## 5. Authentication (product)

- **Supabase Auth**: email/password, **Google OAuth**, and **Sign in with Apple** (web OAuth + native `signInWithIdToken` on iOS).
- Every edge function is gated by shared auth middleware (`_shared/requireAuth.ts`); user JWTs flow through RLS for all reads.
- Gmail OAuth tokens for Smart Import are encrypted at rest (`GMAIL_TOKEN_ENCRYPTION_KEY`) with signed OAuth state.

## 6. AI Providers (three active)

| Provider | Use | Path |
| --- | --- | --- |
| **Google Gemini** | Text concierge, parsing, embeddings | Direct (`generativelanguage.googleapis.com`) |
| **Lovable AI Gateway** | Model fallback + speech-to-text / text-to-speech | `ai.gateway.lovable.dev` |
| **OpenAI Realtime** (via **Vercel AI Gateway**) | Voice concierge (`openai/gpt-realtime-2`) | `ai-gateway.vercel.sh`, tokens minted server-side |

## 7. Payments

- **Stripe** — web checkout, customer portal, invoices, subscription webhooks.
- **RevenueCat** — iOS in-app purchases and entitlement sync (webhook-driven).
- **Venmo** — deeplink convenience only for peer-to-peer trip expenses; **no card data ever touches Chravel infrastructure** (fully tokenized by Stripe/RevenueCat).
- Hard boundary: Stripe on web, RevenueCat on iOS — never mixed.

## 8. Communications & Messaging

- **Email:** Resend (primary) with SendGrid (automatic fallback) via `send-email-with-retry`.
- **Push:** APNs (iOS), Firebase Cloud Messaging (Android/web), Web Push/VAPID (browsers).
- **SMS:** none — no SMS provider is integrated.
- **In-app chat:** GetStream (Stream Chat) for trip messaging, with server-side token minting, webhook moderation, and a config-parity CI check.

## 9. Observability & QA

- **Sentry** — frontend error tracking.
- **PostHog** — product analytics (US cloud, `us.i.posthog.com`).
- **Codecov** — test coverage reporting in CI.
- **Testing:** Vitest (~249 specs, 4 CI shards) + Playwright E2E (PR smoke suite, full suite on main, nightly staging run).

## 10. Security & CI/CD Controls

- **GitHub Actions** pipeline: lint (warning budget), typecheck, Prettier, npm audit, migration lint, bundle-size gate.
- **CodeQL** SAST and **Gitleaks** secret scanning on every push.
- Drift gates: DB schema ↔ generated types, permission matrix, Stream config parity, edge-function env coverage.
- **CSP** enforced via `vercel.json` with violation reporting to report-uri.com.
- Operational runbooks on file: `SECRET_ROTATION.md`, `INCIDENT_RESPONSE.md`, `ROLLBACK_RUNBOOK.md`, `DISASTER_RECOVERY.md`.

## 11. Other Integrations / Sub-processor Candidates

| Vendor | Use |
| --- | --- |
| Google Maps Platform | Maps, Places, Geocoding (server-proxied key) |
| Google Cloud Vision + AWS Textract | Receipt OCR (primary + fallback) |
| Google Cloud Text-to-Speech | Voice output |
| Gmail API + Google OAuth | Smart Import of reservations from user email (opt-in) |
| Firecrawl + Jina AI Reader | URL/link content extraction |
| Google Custom Search / Search Console, SEMrush | SEO tooling (internal dashboard) |
| Lovable.dev | Original scaffold platform; AI gateway still in use |
| report-uri.com | CSP violation reporting |
| deno.land / esm.sh | Runtime dependency CDNs for edge functions |

## 12. Workforce Tooling (company-side)

- **Google Workspace** — identity provider, email, calendar (chravelapp.com).
- **GitHub Issues/PRs + Notion** — task tracking and planning.
- **Slack** — internal communications.
- **Brex** — corporate finance/cards.
- **Asana** — provisioned but secondary to GitHub/Notion.

---

## Appendix: Known Discrepancies (keep honest for audits)

1. **Native mobile pipeline** lives in the separate `chravel-mobile` repo; `ios-release.yml` describes it as Expo/EAS while `CLAUDE.md` says Capacitor — confirm the current wrapper before stating it in an audit.
2. **Edge functions load dependencies from deno.land/esm.sh at runtime** — relevant to supply-chain questions; pinning is via versioned import URLs.

Resolved 2026-07-20: Mixpanel and Google Analytics were never wired and their placeholders
have been removed from the env templates and `scripts/validate-env.ts`; Node is normalized
to 22 across `engines`, CI workflows, and Render; `p.chravel.app` is confirmed served by
Render (DNS CNAME → `chravel-unfurl-s58a.onrender.com`), with the Cloudflare Worker as an
undeployed alternate.
