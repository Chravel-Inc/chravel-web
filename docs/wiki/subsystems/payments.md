# Payments

## Purpose
Three intertwined concerns:
1. **Subscriptions** — Pro/Explorer/Frequent Chraveler tiers via Stripe (web) or RevenueCat (iOS).
2. **Trip payment requests** — "you owe me $40 for dinner" workflow.
3. **Expense splitting** — multi-method settlements with optimistic locking (memory #16).

Strict SDK boundary (memory #6): **RevenueCat for iOS, Stripe for web.** Never mix.

## Entry Points
| File | Purpose |
|---|---|
| `src/billing/config.ts` | `TIER_ENTITLEMENTS` map |
| `src/billing/types.ts` | `SubscriptionTier`, `EntitlementId`, `PurchaseType` |
| `src/store/entitlementsStore.ts` | Single source of subscription truth |
| `src/services/entitlementService.ts` | Sync entitlements |
| `src/integrations/revenuecat/revenuecatClient.ts` | RC client |
| `src/integrations/revenuecat/types.ts` | RC types |
| `src/services/paymentProcessors/stripeProcessor.ts` | Stripe processor |
| `src/services/paymentService.ts` | Payment requests |
| `src/services/paymentBalanceService.ts` | Balance calc |
| `src/services/paymentErrors.ts` | Error taxonomy |
| `src/hooks/useRevenueCatSubscription.ts` | RC hook |
| `src/hooks/useConsumerSubscription.tsx` | Subscription context |
| `src/hooks/usePayments.ts` | Trip payments |
| `src/hooks/usePaymentSplits.ts` | Splits |
| `src/hooks/useBalanceSummary.ts` | Balances |

## Data Flow

**Subscription (web checkout):**
1. User taps Upgrade → `usePaywall` → `create-checkout` edge function.
2. User completes Stripe checkout → `stripe-webhook` (verify_jwt = false; signature-gated).
3. Webhook writes `user_entitlements`.
4. `check-subscription` reconciles into `entitlementsStore` on next refresh.

**Subscription (iOS):**
1. User taps Upgrade → RevenueCat SDK purchase.
2. RC posts to `revenuecat-webhook` (signature-gated).
3. Webhook calls `sync-revenuecat-entitlement` → writes `user_entitlements`.
4. `useRevenueCatSubscription` updates client-side state.

**Trip payment request:**
1. Creator opens payment composer → `usePayments.createRequest` → DB insert `payment_requests`.
2. Splits computed via `payment_split_patterns` or manual → `payment_splits` rows per participant.
3. `useBalanceSummary` recomputes balances.
4. Participants pay → `settlement_events` row + state transitions on `payment_splits` (pending → confirmed → settled).
5. Optimistic locking on `payment_splits.version` (memory #16).

## State Touched
- **Zustand:** `useEntitlementsStore` (plan, status, source, entitlements, computed booleans)
- **TanStack Query keys:**
  - `tripKeys.payments(tripId)` = `['tripPayments', tripId]`
  - `tripKeys.paymentBalances(tripId, userId)` = `['tripPaymentBalances', tripId, userId]`
- **Cache config:** payments `staleTime: 30s, gcTime: 5m, refetchOnWindowFocus: true` (`src/lib/queryKeys.ts:122-133`)

## Tables & RLS
| Table | Read | Write | Notes |
|---|---|---|---|
| `payment_requests` | trip members | creator + admins | |
| `payment_splits` | trip members | split participants (own) | Optimistic lock |
| `payment_request_messages` | trip members | members | Chat bridge |
| `payment_split_patterns` | self | self | User patterns |
| `settlement_events` | trip members | service | Audit |
| `enhanced_expenses` | trip members | creator + admins | |
| `expense_splits` | trip members | split participants | |
| `expense_categories` | trip members | service | Seeded |
| `receipts` / `trip_receipts` | trip members | uploader + admins | OCR'd receipts |
| `user_payment_methods` | self | self | Per-user cards |
| `user_entitlements` | self | service (webhooks) | Single source |
| `organization_billing` | org admins | service | B2B seats |
| `payment_audit_log` | service | service | Audit trail |
| `payment_reminders` | self | service | Cron-fired |

## Edge Functions Used
- `create-checkout` (Stripe checkout init)
- `customer-portal` (Stripe portal link)
- `fetch-invoices`
- `check-subscription`
- `stripe-webhook` (verify_jwt = false)
- `revenuecat-webhook` (signature-gated)
- `sync-revenuecat-entitlement`
- `payment-reminders` (cron)

## Demo vs Authenticated
- Demo `entitlementsStore.setDemoMode(true)` provides a fake "Pro" tier for preview.
- Demo paywall does NOT call Stripe/RC; tap upgrade in demo opens an exit-demo modal.
- Memory #27: mock trips bypass entitlement gates entirely.

## Mobile / PWA / Capacitor considerations
- **Strict boundary** (memory #6): iOS shell uses RevenueCat exclusively. Web/PWA uses Stripe. Never mix.
- Detected via `isInstalledApp()` (`src/utils/platformDetection.ts`).
- Apple In-App Purchase rules require RC for any subscription on iOS.

## Known Risks
- Memory #6: payment SDK boundary. Any subscription check in `usePaywall` etc. must dispatch to the correct processor.
- Memory #16: split state machine. New settlement states must update `payment_splits.version` and produce a `settlement_events` audit row.
- `stripe-webhook` and `revenuecat-webhook` are `verify_jwt = false` — signature validation is the only auth layer. Loss of signature secret is catastrophic.
- `payment-reminders` is cron; must use `cronGuard.ts`.
- Drift watchlist: `payment_splits.status` enum vs TS type union; `enhanced_expenses` column drift vs `Expense` interface.

## Source Refs
- `src/billing/` — config, types, providers (with `__tests__/`)
- `src/integrations/revenuecat/`
- `src/services/paymentProcessors/stripeProcessor.ts`
- `src/services/paymentService.ts`, `paymentBalanceService.ts`, `paymentErrors.ts`
- `src/hooks/useRevenueCatSubscription.ts`, `useConsumerSubscription.tsx`, `usePayments.ts`, `usePaymentSplits.ts`, `useBalanceSummary.ts`
- `src/store/entitlementsStore.ts`
- `supabase/functions/{create-checkout,customer-portal,check-subscription,fetch-invoices,stripe-webhook,revenuecat-webhook,sync-revenuecat-entitlement,payment-reminders}/`
- `src/lib/queryKeys.ts:48-50`
- `agent_memory.jsonl` #6, #16
- `docs/ACTIVE/SECURITY_FINDINGS.md` (payment-related)
- Diagram: [`../diagrams/payments-stripe-sequence.mmd`](../diagrams/payments-stripe-sequence.mmd)
