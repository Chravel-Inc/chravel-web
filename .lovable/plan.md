# Explorer Trip Pass: 45 days → 30 days

Change the Explorer Trip Pass access window from 45 days to 30 days everywhere — code, copy, settings, backend grant, store parity snapshots, and the ASC/Play refresh docs. Price stays $39.99. The Frequent Chraveler Pass stays 90 days / $74.99. Store product IDs (`com.chravel.trippass.explorer`, `com.chravel.trippass.frequent`) are immutable and do not change.

## One flag before we ship

At 30 days, $39.99 buys the same month that a $9.99/mo Explorer subscription buys. You chose to keep $39.99, so the copy needs to earn that gap: the pass is framed as "one-time, no auto-renew, no card kept on file" rather than as a cheaper month. I'll keep that framing front and center and will not add any "better value" or "save vs monthly" language, which would be false at this price. Raising the value (e.g. bundling FC-level features into the Explorer Pass) or lowering the price later is a one-line change in `src/billing/config.ts`.

## Source of truth

`TRIP_PASS_PRODUCTS` in `src/billing/config.ts` is the single numeric source. Everything downstream (`pricingDisplay.ts`, `consumer.ts`, PricingSection, TripPassModal, billing settings, DevBillingPreview) already derives duration from it, so most surfaces update automatically once the number changes.

## Changes

### 1. Rename the key and set the duration
- `src/billing/config.ts` — rename `pass-explorer-45` → `pass-explorer-30`, set `durationDays: 30`, rename to `Explorer Trip Pass (30 days)`.
- `src/constants/stripe.ts` — same key rename, `durationDays: 30`, name update in the legacy `TRIP_PASS_PLANS` map. Stripe product/price IDs are unchanged (price is unchanged).
- `src/constants/revenuecat.ts` — `REVENUECAT_PRICING.tripPasses.explorer.durationDays: 30`, rename the `explorerPass45` key to `explorerPass30` (its value, the Apple product ID, is unchanged), and update the 45-day comments.

### 2. Update every key reference
`src/billing/pricingDisplay.ts`, `src/types/consumer.ts`, `src/components/conversion/PricingSection.tsx`, `src/components/conversion/TripPassModal.tsx`, `src/components/consumer/ConsumerBillingSection.tsx`, plus the parity tests (`iap-parity.test.ts`, `pricingParity.test.ts`) and `scripts/validate-iap-parity.mjs`.

### 3. Backend grant + legacy compatibility
- `supabase/functions/create-checkout/index.ts` — add `pass-explorer-30` to the price-ID, duration (30), and tier maps. Keep `pass-explorer-45` as a legacy alias mapping to the same Stripe price and tier so any in-flight checkout or cached client still resolves; its duration entry stays 45 so a session already created is honored as sold.
- `supabase/functions/stripe-webhook/index.ts` — the duration comes from session metadata; change the hardcoded fallback `|| '45'` to `'30'`.
- No database migration needed: existing passes store an absolute `current_period_end`, so already-purchased 45-day windows are unaffected.

### 4. Hardcoded copy
- `PricingSection.tsx` FAQ: "the whole trip window (45 or 90 days)" → "(30 or 90 days)".
- Any remaining literal "45 days" strings in trip-pass copy get derived from `TRIP_PASS_DISPLAY` instead of hardcoded.

### 5. Store parity artifacts + docs
- `appstore/IAP_PARITY_CHECKLIST.md` — row 7 duration → 30 days, reference name → `Explorer Trip Pass — 30 Days`, and the 45/90 mentions in the Play + RevenueCat rows.
- `docs/agentic/app-store-connect-trippass-copy-refresh.md` and `docs/agentic/google-play-console-iap-parity-refresh.md` — regenerate the paste-ready Explorer Pass display name, description, and review copy for 30 days.
- `docs/agentic/app-store-connect-iap-review-screenshots.md` — confirmed-values line.
- `appstore/asc-products.json` / `playstore/play-products.json` unchanged (product IDs are the same).

## Manual store work you'll do after this

Neither store stores the duration for these products — it's a backend grant — so this is a **copy-only** update in ASC and Play Console:
- ASC: change the Explorer Trip Pass Display Name / Reference Name and the localized description to say 30 days.
- Play Console: change the managed in-app product name/description to say 30 days.
- RevenueCat: nothing to change (no duration field for non-renewing/one-time products; the grant length is ours).

The refreshed paste-ready strings will be in the two agentic docs above.

## Verification

`npm run iap:parity` (exit 0), `bunx vitest run src/billing`, `npm run typecheck`, and a grep confirming no `45`-day trip-pass literals remain outside historical audit docs.
