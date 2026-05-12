# RevenueCat

## Why we use it
iOS subscription management. Apple App Store rules require IAP for any consumable/subscription on iOS — RevenueCat wraps that. The **iOS side** of the payment SDK boundary (memory #6); web uses Stripe.

## Where it's initialized
- Client wrapper: `src/integrations/revenuecat/revenuecatClient.ts`
- Types: `src/integrations/revenuecat/types.ts`
- Entitlement constants: `src/constants/revenuecat.ts`
- Hook: `src/hooks/useRevenueCatSubscription.ts`
- Web SDK: `@revenuecat/purchases-js` 1.23.0 (`package.json:79`) — chunked separately (`vite.config.ts:66`, 808 KB, only loaded at paywall)

## API surface used
- Configure SDK on app boot for iOS / Android shells.
- `purchases.getCustomerInfo()` — current entitlements.
- `purchases.purchasePackage(...)` — buy a package.
- Webhooks → `revenuecat-webhook` (signature-gated) → `sync-revenuecat-entitlement` → DB `user_entitlements`.

## Env vars
| Var | Side | Purpose |
|---|---|---|
| `VITE_REVENUECAT_API_KEY` | client | Generic key |
| `VITE_REVENUECAT_IOS_API_KEY` | client | iOS-specific key |
| `VITE_REVENUECAT_ANDROID_API_KEY` | client | Android-specific key |
| `VITE_REVENUECAT_EXPLORER_ENTITLEMENT_ID` | client | Explorer tier ID |
| `VITE_REVENUECAT_FREQUENT_CHRAVELER_ENTITLEMENT_ID` | client | Frequent Chraveler tier ID |
| `VITE_REVENUECAT_ENABLED` | client | Feature flag (off in dev) |
| `REVENUECAT_WEBHOOK_AUTH` | edge | Webhook signature secret |

## Failure modes & retry behavior
- Webhook signature mismatch -> reject; RC retries with backoff.
- iOS purchase failures surface a user-facing error; client retries on user action.
- Entitlement reconciliation runs on every app boot via `check-subscription` to catch any missed webhook.

## Cost / quota notes
- RC tiers itself by tracked-trackable revenue (TTR). Stays within free tier at low scale.

## Source Refs
- `src/integrations/revenuecat/revenuecatClient.ts`, `types.ts`
- `src/constants/revenuecat.ts`
- `src/hooks/useRevenueCatSubscription.ts`
- `supabase/functions/{revenuecat-webhook,sync-revenuecat-entitlement,check-subscription}/`
- `src/store/entitlementsStore.ts` — sink
- `vite.config.ts:66` — chunk separation
- `agent_memory.jsonl` #6
