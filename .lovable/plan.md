## Goal
Produce 7 App Review screenshots (one per IAP product) sized for iPhone 6.7" (1290×2796), saved to `/mnt/documents/` so you can download them, plus a paste-ready Agentic Browser script that walks App Store Connect and uploads the correct file to each product.

## What I'll generate
One PNG per product, each a realistic in-app paywall mock highlighting that specific plan (name + exact price + "Subscribe" / "Get Pass" CTA), styled in Chravel's black-and-gold theme so it matches the live app.

| # | File | Product ID | Plan shown | Price |
|---|------|------------|------------|-------|
| 1 | `iap-01-frequent-monthly.png` | com.chravel.app.frequent.monthly | Frequent Chraveler | $19.99/mo |
| 2 | `iap-02-explorer-annual.png` | com.chravel.app.explorer.annual | Annual Explorer | $99.99/yr |
| 3 | `iap-03-frequent-annual.png` | com.chravel.app.frequent.annual | Annual Frequent Chraveler | $199.99/yr |
| 4 | `iap-04-pro-starter-monthly.png` | com.chravel.app.pro.starter.monthly | Starter Pro | $49.99/mo |
| 5 | `iap-05-pro-growth-monthly.png` | com.chravel.app.pro.growth.monthly | Growth Pro | $99.99/mo |
| 6 | `iap-06-trippass-explorer.png` | com.chravel.app.trippass.explorer | Explorer Trip Pass | $39.99 |
| 7 | `iap-07-trippass-frequent.png` | com.chravel.app.trippass.frequent | Frequent Chraveler Trip Pass | $74.99 |

All files written to `/mnt/documents/iap-screenshots/`, plus a `chravel-iap-screenshots.zip` bundle. Each rendered at 1290×2796 (well above Apple's 640×920 minimum and reusable for any device size).

## How I'll build them
Pure Python + Pillow composite (same pipeline as the existing marketing screenshots under `appstore/scripts/`):
- Black background with subtle gold radial vignette
- Chravel wordmark at top
- Headline ("Choose your plan" / "Unlock this trip")
- Three plan cards with the target plan highlighted in gold and a clear price badge
- Prominent CTA matching App Review's expectation ("Subscribe" for auto-renewables, "Get Pass" for non-renewing)
- Apple-required footer line for auto-renewable products: auto-renew disclosure + Terms/Privacy links

No app changes, no Playwright needed — these are static review assets, not live app screenshots, which is what App Store Connect expects for the "App Review screenshot" slot.

## Agentic Browser script
After the PNGs exist, I'll write `docs/agentic/app-store-connect-iap-review-screenshots.md` containing a paste-ready script that:
1. Opens App Store Connect → Apps → ChravelApp → Subscriptions (Group 22200648) and Non-Renewing Subscriptions
2. For each product (by exact Apple ID from the table above), opens it, scrolls to "App Review Information → Review Screenshot", uploads the matching file from `iap-screenshots/`, and clicks Save
3. After all 7, navigates to the in-progress App Store version and confirms each product no longer shows "Missing Metadata"
4. Treats credentials as secret per the browser-use rules — never echoes them

## Deliverables
- `/mnt/documents/iap-screenshots/iap-01..07-*.png` (7 files)
- `/mnt/documents/chravel-iap-screenshots.zip`
- `docs/agentic/app-store-connect-iap-review-screenshots.md` (the script)
- `<presentation-artifact>` tags for the zip and the script so you can download both

## Out of scope
- No changes to live paywall code, RevenueCat config, or product metadata
- Not enabling Apple IAP (`APPLE_IAP_ENABLED` stays as-is)
- Not submitting the app version — only moving the 7 products from "Missing Metadata" to "Ready to Submit"
