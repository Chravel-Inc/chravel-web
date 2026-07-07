## Context

App Store rejected build 2.0(60) under Guideline 2.1(b): the 7 IAP products aren't attached to the version submission and each is missing its required **App Review Screenshot** in App Store Connect. The repo already has a dev-only capture surface (`src/pages/DevBillingPreview.tsx`) and a documented workflow (`docs/agentic/app-store-connect-iap-review-screenshots.md`) — but the actual PNGs are not committed. No app code changes are needed.

## What I'll do (headless browser, in-sandbox)

Use Playwright against the running Vite dev server (`http://localhost:8080`) to render `DevBillingPreview` and `TripPassModal` with an iOS WKWebView user-agent + `?app_context=native` so `isIOSNativeShell()` returns true and CTAs render as "Subscribe with Apple" / "Buy with Apple" (guideline 3.1.1). Viewport `390×844` at `deviceScaleFactor 3.31` → exact **1290×2796** PNGs (iPhone 6.9", well above Apple's 640×920 floor).

Capture the 7 required screenshots, each framed on its own product/CTA:

| # | File | Product Apple ID | Route |
|---|------|------------------|-------|
| 1 | iap-01-frequent-monthly.png | com.chravel.frequentchraveler.monthly | `/dev/billing-preview?app_context=native&highlight=frequent-monthly` |
| 2 | iap-02-explorer-annual.png | com.chravel.explorer.annual | `…&highlight=explorer-annual` |
| 3 | iap-03-frequent-annual.png | com.chravel.frequentchraveler.annual | `…&highlight=frequent-annual` |
| 4 | iap-04-pro-starter-monthly.png | com.chravel.pro.starter.monthly | `…&highlight=pro-starter` |
| 5 | iap-05-pro-growth-monthly.png | com.chravel.pro.growth.monthly | `…&highlight=pro-growth` |
| 6 | iap-06-trippass-explorer.png | com.chravel.trippass.explorer | `…&trippass=1&highlight=explorer-pass` |
| 7 | iap-07-trippass-frequent.png | com.chravel.trippass.frequent | `…&trippass=1&highlight=frequent-pass` |

Delivery locations (all downloadable from chat):
- `/mnt/documents/iap-screenshots/iap-01…iap-07.png` (individual files, each with a `<presentation-artifact>` link)
- `/mnt/documents/chravel-iap-screenshots-v3.zip` (bundled)
- Also mirrored to `appstore/iap-screenshots/` in the repo for regeneration.

Post-capture QA on every PNG: dimensions == 1290×2796, target product visible, CTA reads "Subscribe with Apple" or "Buy with Apple" (not "Subscribe"/"Buy" — that would be a rejection risk). If `DevBillingPreview` doesn't currently render a distinct card for one of the 7 IDs (e.g. Pro tier cards or the two Trip Pass variants), I'll flag it and make the smallest possible additive change to `DevBillingPreview.tsx` only (no shared component edits) so the capture is possible — reported explicitly in delivery.

## What you'll do (Claude for Chrome extension in App Store Connect)

I'll deliver a paste-ready **Claude for Chrome** agent prompt (you sign into https://appstoreconnect.apple.com first, then hand the tab to Claude). The prompt will:

1. **Per-product upload loop** — for each of the 7 IAP IDs above:
   a. Navigate to Apps → Chravel → Monetization → In-App Purchases and Subscriptions.
   b. Open the product by exact Apple ID (fail loudly if not found — no fuzzy match).
   c. Verify Reference Name, Duration, and **US price** match the canonical matrix (Explorer $9.99/mo·$99/yr, Frequent Chraveler $19.99/mo·$199/yr, Pro Starter $49/mo, Pro Growth $99/mo, Explorer Trip Pass $39.99/45d, Frequent Chraveler Trip Pass $74.99/90d). Report mismatches, do NOT auto-edit price.
   d. In App Review Information, upload the matching PNG to **Review Screenshot** (replace if one exists).
   e. Paste standardized Review Notes: *"Screenshot captured from the in-app Settings → Billing panel showing this product on the paywall. CTA reads 'Subscribe with Apple' (or 'Buy with Apple' for Trip Passes) because the app uses StoreKit / RevenueCat for all iOS purchases. No external payment links are present."*
   f. Save; confirm status flips from "Missing Metadata" → "Ready to Submit".

2. **Attach to version 2.0** — on App Store → iOS App → 2.0 Prepare for Submission, scroll to *In-App Purchases and Subscriptions*, add all 7 IAPs, save. This is the specific fix Apple asked for; adding them here submits them **with** the existing binary — no new build required.

3. **Resubmit for review** — click Add for Review → Submit to App Review. Screenshot the confirmation.

4. **Final report** — Claude replies with: per-product status table, screenshot of the version's IAP attach list, and submission confirmation ID.

## Deliverables in chat at end of build

1. Seven individual `<presentation-artifact>` PNG downloads.
2. One `chravel-iap-screenshots-v3.zip` download.
3. QA report (per-product: dimensions ✅, CTA copy ✅, product visible ✅).
4. Paste-ready Claude for Chrome prompt with the full loop + resubmit steps.
5. Note on the "new binary" phrasing in Apple's email: attaching the IAPs to the current version usually suffices; if reviewer explicitly wants a new build, you can bump `CFBundleVersion` to 61 and re-archive — I'll include the exact 2-line change if needed but won't do it unprompted.

## Out of scope

- No changes to prices, product IDs, RevenueCat config, or shared paywall components.
- No new binary upload / Fastlane run.
- No writes to App Store Connect from my side (I can't reach it — that's why you drive Claude for Chrome).
