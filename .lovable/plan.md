## What I got wrong

Previous screenshots were composed images I built with Python/PIL — decorative "cards" on a black-and-gold canvas that are not from the actual app. They never opened the app, never went to Settings → Billing, and the text was tiny and unreadable. That's not what App Store review needs.

You showed me exactly the right page: **Settings → Billing** (`ConsumerBillingSection`), showing "Frequent-Chraveler / Premium Features Active / $19.99/month", Billing Period toggle (Monthly / Annual), and Available Plans (Free, Explorer, Frequent Chraveler…).

## What I'll do instead

### 1. Capture from the real running app via Playwright
Drive the local dev server (`http://localhost:8080`) with headless Chromium at iPhone-native `1290×2796`:
- Open the app.
- Restore the managed Supabase session if `LOVABLE_BROWSER_AUTH_STATUS=injected`. If it's `signed_out`, stop and ask you to sign in to the preview once (as `ccamechi@gmail.com` per your screenshot) so I can inject the session — I will not invent credentials.
- Open Settings → Personal Settings → **Billing** (the same panel in your screenshot).
- Interact to reveal each product, then screenshot the visible viewport (not full-page, per the browser-use rules).

### 2. Seven captures, each from the real Billing UI

| # | File | What's on screen |
|---|---|---|
| 1 | `iap-01-frequent-monthly.png` | Billing Period = **Monthly**, Frequent Chraveler card expanded showing `$19.99/month` + features + "Subscribe with Apple — Frequent Chraveler" CTA |
| 2 | `iap-02-explorer-annual.png` | Billing Period = **Annual**, Explorer card expanded showing `$99/yr ($8.25/mo)` + CTA |
| 3 | `iap-03-frequent-annual.png` | Billing Period = **Annual**, Frequent Chraveler card expanded showing `$199/yr ($16.58/mo)` + CTA |
| 4 | `iap-04-pro-starter-monthly.png` | Organization Plans → **Starter Pro** expanded, `$49/month` + CTA |
| 5 | `iap-05-pro-growth-monthly.png` | Organization Plans → **Growth Pro** expanded, `$99/month` + CTA |
| 6 | `iap-06-trippass-explorer.png` | TripPassModal open, **Explorer Trip Pass** card visible with `$39.99` / 45 days / "Buy with Apple" or "Get Trip Pass" |
| 7 | `iap-07-trippass-frequent.png` | TripPassModal open, **Frequent Chraveler Trip Pass** visible with `$74.99` / 90 days / CTA |

For Pro (4, 5) I'll force the iOS-native CTA copy ("Subscribe with Apple — …") by setting the userAgent to iPhone before rendering, so the screenshot matches what an Apple reviewer sees in the app on iOS.

For Trip Passes (6, 7) same iPhone UA so the button reads "Buy with Apple".

### 3. Pricing parity check (Settings ↔ marketing PricingSection)
Both `ConsumerBillingSection` and `PricingSection` already read from a single source of truth (`src/billing/config.ts` → `CONSUMER_PRICE_DISPLAY` + `TRIP_PASS_DISPLAY` + `SUBSCRIPTION_TIERS`). I'll:
- Diff the numbers rendered on `/` (marketing) against Settings → Billing.
- Report any drift.
- If numbers already agree (expected), no code change; if they drift, propose a single-line fix in the drifting component only. No refactors.

### 4. Quality gate before I deliver
- Contact sheet of all 7 PNGs.
- OCR each PNG; require the product name and the exact price string to appear in the extracted text.
- Zoom-inspect at least one crop per screenshot to confirm the CTA button is readable.
- Regenerate any that fail.

### 5. Deliverables (versioned, won't overwrite the bad ones)
- `/mnt/documents/iap-screenshots-v3/iap-01…iap-07.png`
- `/mnt/documents/chravel-iap-screenshots-v3.zip`
- Short QA note listing the exact text I verified on each screenshot
- Updated `docs/agentic/app-store-connect-iap-review-screenshots.md` if filenames change (they won't unless capture forces it)

## Definition of done

- All 7 images are captured from the actual Settings → Billing UI (or the Trip Pass modal launched from it), matching the reference screenshot you sent.
- Every image legibly shows product name, price/period, and the visible CTA.
- Settings pricing verified to match the marketing PricingSection, with drift (if any) fixed.

## What I need from you before I start

One thing only: confirm the Supabase preview session for `ccamechi@gmail.com` is active in the Lovable preview (the app in the right pane). If it isn't, sign in once and tell me — I'll inject that session into Playwright and proceed. No credentials needed in chat.