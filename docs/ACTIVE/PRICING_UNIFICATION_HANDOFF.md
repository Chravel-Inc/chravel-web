# Pricing Unification — Handoff / Verification Needed

Branch `claude/brave-maxwell-G6N6z`, PR #664. Last commit observed: `42b9fe4`
("feat(pricing): single-source pricing display, collapse RevenueCat config, fold events into Frequent Chraveler").

The work session ended with **corrupted terminal output**, so the committed state of the UI
components below could NOT be confirmed. **Verify these before trusting the branch.**

## CONFIRMED done (typecheck + build + 15 parity tests passed at least once)
- `src/billing/pricingDisplay.ts` — NEW: formats all prices from `billing/config.ts` (CONSUMER_PRICE_DISPLAY, TRIP_PASS_DISPLAY, monthlyPriceLabel).
- `src/types/consumer.ts` `CONSUMER_PRICING` — derives prices from `BILLING_PRODUCTS`/`TRIP_PASS_PRODUCTS`.
- `src/types/pro.ts` `SUBSCRIPTION_TIERS` — `price` derives from `BILLING_PRODUCTS`.
- `src/billing/entitlements.ts` `FEATURE_LIMITS.event_creation` = Free 3 / Explorer 3 / FC -1 / Pro -1.
- `src/utils/featureTiers.ts` — free `eventsLimit:3`+`freeEventsLimit:3`, explorer `eventsLimit:3`, FC `eventsLimit:-1`; removed a duplicate `canCreateEvents` key in FC.
- Deleted dead `src/config/revenuecat.ts` + `src/config/revenuecat.test.ts` (RevenueCat collapse; web=Stripe, RC native-only). No production importers existed.
- `src/billing/__tests__/pricingParity.test.ts` — extended (15 tests) to lock CONSUMER_PRICING/SUBSCRIPTION_TIERS/pricingDisplay + event-limit invariants.

## ⚠️ MUST VERIFY (state uncertain due to corrupted output)
Run: `git show HEAD:src/components/UpgradeModal.tsx | grep -nE "CONSUMER_PRICE_DISPLAY|'9.99'|'events'|setSelectedPlan\('events'\)"`

Expected AFTER my edits (if they committed):
- imports `CONSUMER_PRICE_DISPLAY, TRIP_PASS_DISPLAY` from `@/billing/pricingDisplay`
- NO hardcoded `'9.99'/'19.99'/'8.25'/'16.58'/'Save $20'/'$39.99 for 45 days'` — all replaced with `CONSUMER_PRICE_DISPLAY[selectedPlan].*` / `TRIP_PASS_DISPLAY[selectedPlan].label`
- `activeTab` type is `'plans' | 'pro'` (Events TAB removed); the paid Events pricing block (Events Free $0 / Plus $29 / Pro $199) removed
- FC features include "Unlimited events"; Explorer features include "Up to 3 events"

If the committed UpgradeModal still shows hardcoded values / an `'events'` tab, **the edits did not persist and must be re-applied.** Same check for these other components (should import from `@/billing/pricingDisplay` and have NO `$9.99`-style literals):
- `src/components/conversion/PricingSection.tsx`
- `src/components/conversion/TripPassModal.tsx`
- `src/components/consumer/ConsumerBillingSection.tsx`
- `src/components/native/NativeSubscriptionPaywall.tsx`
- `src/components/trip/TripExportModal.tsx`

Quick sweep: `grep -rnE "\$[0-9]+(\.[0-9]{2})?" src/components/{UpgradeModal,conversion/PricingSection,conversion/TripPassModal,consumer/ConsumerBillingSection,native/NativeSubscriptionPaywall,trip/TripExportModal}.tsx | grep -v '\$0\b'` → should return (almost) nothing.

Also confirm the commit actually contains these files: `git show --stat HEAD` (and earlier commits on the branch). If the "6 files changed" diffstat was the whole commit, the component edits were NOT committed.

## Still TODO this phase (not done)
- Events: the `useEventCreationGate` already routes upgrade → Frequent Chraveler and reads `eventsLimit`; confirm DB `profiles.free_event_limit` default supports a 3-event cap (may need a migration — app constant says 3).
- The 3 dashboard UPDATE browser-agent scripts are in the plan file `/root/.claude/plans/comprehensive-payment-stateful-mochi.md` (Stripe / RevenueCat / App Store Connect) — move them into `docs/ACTIVE/` if they should live in the repo.
- Pre-existing, UNRELATED test failures (do not block this work): `useStreamTripChat.pin`, `useTripTasks`, `useTripBasecamp.offline`, `useTripDetailData`, `NativeSettings` (fails with "useAuth must be used within an AuthProvider" — a test-harness issue, not pricing).

## Validation last seen GREEN
`npm run typecheck` ✓ · `npm run build` ✓ · `vitest run src/billing/__tests__/pricingParity.test.ts` → 15/15 ✓ (after the featureTiers duplicate-key fix).
