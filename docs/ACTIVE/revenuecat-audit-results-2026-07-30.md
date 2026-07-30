# RevenueCat Dashboard Audit Results — 2026-07-30

> Script: `docs/ACTIVE/revenuecat-audit-browser-agent.md` (Section B — RevenueCat only)
> Code SoT: `src/constants/revenuecat.ts` + `src/billing/config.ts`
> Automated code parity: `npm run iap:parity` + `src/billing/__tests__/iap-parity.test.ts`

## Executive answers (dashboard leg)

| Question | Answer | Evidence |
|---|---|---|
| Bundle ID matches between ASC and RevenueCat? | **UNKNOWN** | Dashboard login required — not audited |
| All 5 entitlement IDs present in RevenueCat? | **UNKNOWN** | Dashboard login required |
| All 8 canonical Product IDs present in RevenueCat? | **UNKNOWN** | Dashboard login required |
| All 8 in current Offering? | **UNKNOWN** | Dashboard login required |
| Webhook target = `…/functions/v1/revenuecat-webhook`? | **UNKNOWN** | Dashboard login required |
| Code ↔ `constants/revenuecat.ts` in sync? | **YES** | `npm run iap:parity` exit 0 (2026-07-30) |

**Status:** Dashboard audit **BLOCKED** — `https://app.revenuecat.com` redirected to `/login`; no authenticated session in the cloud agent environment.

---

## Code-side parity (verified)

`npm run iap:parity` confirms:

- All 8 Apple product IDs in `billing/config.ts` ↔ `REVENUECAT_PRODUCTS` ↔ `REQUIRED_IOS_PRODUCT_IDS`
- All 5 entitlement IDs in `REVENUECAT_ENTITLEMENTS`
- Prices/durations in `REVENUECAT_PRICING` match `BILLING_PRODUCTS` / `TRIP_PASS_PRODUCTS`
- `appstore/asc-products.json` and `playstore/play-products.json` match `REQUIRED_IOS_PRODUCT_IDS` exactly

### Entitlements expected in RevenueCat dashboard

| Entitlement ID | Chravel tier | Attached products (expected) |
|---|---|---|
| `chravel_explorer` | explorer | `com.chravel.explorer.monthly`, `.annual`, `com.chravel.trippass.explorer` |
| `chravel_frequent_chraveler` | frequent-chraveler | `com.chravel.frequentchraveler.monthly`, `.annual`, `com.chravel.trippass.frequent` |
| `chravel_pro_starter` | pro-starter | `com.chravel.pro.starter.monthly` |
| `chravel_pro_growth` | pro-growth | `com.chravel.pro.growth.monthly` |
| `chravel_pro_enterprise` | pro-enterprise | (contact-sales; may exist unattached to offering) |

Defaults match `REVENUECAT_ENTITLEMENTS` in `src/constants/revenuecat.ts` (overridable via `VITE_REVENUECAT_*_ENTITLEMENT_ID` env vars).

### Product parity table

| Product ID | Code | RevenueCat (dashboard) | Entitlement (expected) |
|---|---|---|---|
| `com.chravel.explorer.monthly` | ✓ | ? | `chravel_explorer` |
| `com.chravel.explorer.annual` | ✓ | ? | `chravel_explorer` |
| `com.chravel.frequentchraveler.monthly` | ✓ | ? | `chravel_frequent_chraveler` |
| `com.chravel.frequentchraveler.annual` | ✓ | ? | `chravel_frequent_chraveler` |
| `com.chravel.pro.starter.monthly` | ✓ | ? | `chravel_pro_starter` |
| `com.chravel.pro.growth.monthly` | ✓ | ? | `chravel_pro_growth` |
| `com.chravel.trippass.explorer` | ✓ | ? | `chravel_explorer` (45-day grant) |
| `com.chravel.trippass.frequent` | ✓ | ? | `chravel_frequent_chraveler` (90-day grant) |

---

## Mismatch summary

### Critical (dashboard unverified)

- RevenueCat dashboard not inspected — cannot confirm products/entitlements/offerings/webhook are configured.

### High (pending human completion)

- Complete Section B of `revenuecat-audit-browser-agent.md` while signed in.
- Confirm iOS app Bundle ID in RevenueCat matches App Store Connect (`com.chravel.app` per `APP_STORE_READINESS_AUDIT.md`).
- Confirm all 8 products are in the **current** Offering.
- Confirm webhook URL host ends with `/functions/v1/revenuecat-webhook` and Authorization header is set (do not copy value).

### Medium

- RevenueCat displayed an incident banner during the blocked attempt: *"Newly created apps error with 'The key is not valid or is not compatible with the Bundle ID of your app'"* — verify iOS API key ↔ Bundle ID pairing after login.

---

## Human operator checklist

1. Sign in at [RevenueCat](https://app.revenuecat.com) → open the Chravel project.
2. **Project settings → Apps** — confirm iOS Bundle ID = ASC Bundle ID.
3. **Entitlements** — confirm all 5 IDs above exist; each has the products listed.
4. **Offerings** — note which offering is `current`; confirm all 8 product IDs appear as packages.
5. **Integrations** — App Store Connect = Active.
6. **Webhooks** — target host contains `revenuecat-webhook`; Authorization header configured.
7. Update this file: change `?` → `✓` or `✗` in the table; set executive YES/NO answers.

## AGENTIC BROWSER SCRIPT (paste to a signed-in browser agent)

```
1. Go to https://app.revenuecat.com and open the Chravel project.
2. Project settings → Apps → record iOS Bundle ID (redact API keys).
3. Entitlements → for each ID in [chravel_explorer, chravel_frequent_chraveler, chravel_pro_starter, chravel_pro_growth, chravel_pro_enterprise], list attached product identifiers.
4. Offerings → record current offering ID; list every package identifier → product identifier.
5. Products → confirm these 8 IDs exist: com.chravel.explorer.monthly, com.chravel.explorer.annual, com.chravel.frequentchraveler.monthly, com.chravel.frequentchraveler.annual, com.chravel.pro.starter.monthly, com.chravel.pro.growth.monthly, com.chravel.trippass.explorer, com.chravel.trippass.frequent.
6. Webhooks → record URL host only; confirm path includes revenuecat-webhook.
7. Return YES/NO for the 5 executive questions at top of docs/ACTIVE/revenuecat-audit-results-2026-07-30.md and fill the Product parity table (Code column already ✓).
READ-ONLY. Do not paste secrets.
```
