# Stripe

## Why we use it
Web checkout for consumer subscription tiers (Explorer, Frequent Chraveler). Customer portal for self-service. Stripe is the **web side** of the payment SDK boundary (memory #6); iOS uses RevenueCat instead.

## Where it's initialized
- Client publishable key: `VITE_STRIPE_PUBLISHABLE_KEY` (`.env.example`).
- Server-side secret: `STRIPE_SECRET_KEY` (edge function secret; not exposed to client).
- Webhook secret: `STRIPE_WEBHOOK_SECRET` (validates incoming events).

Client wrapper: `src/services/paymentProcessors/stripeProcessor.ts`.

## API surface used
- `create-checkout` edge function — `stripe.checkout.sessions.create({...})`
- `customer-portal` edge function — `stripe.billingPortal.sessions.create({...})`
- `fetch-invoices` edge function — `stripe.invoices.list({...})`
- `stripe-webhook` (verify_jwt = false) — receives `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, etc.

## Env vars
| Var | Side | Purpose |
|---|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | client | Publishable key |
| `STRIPE_SECRET_KEY` | edge | Server API |
| `STRIPE_WEBHOOK_SECRET` | edge | Signature validation |

## Failure modes & retry behavior
- Webhook signature mismatch -> 400, request not processed (correct: Stripe will retry).
- Idempotency via `webhook_events` table — re-deliveries become no-ops.
- Client-side checkout init failure -> error toast + telemetry (PostHog event); no retry (user re-tries manually).
- Customer portal session expiry handled by Stripe redirect.

## Cost / quota notes
- Per-charge fee + per-active-subscription. Stripe usage stays in line with active-subscriber count.
- No batch limits hit at current scale; `fetch-invoices` paginates if needed.

## Source Refs
- `src/services/paymentProcessors/stripeProcessor.ts`
- `supabase/functions/{create-checkout,customer-portal,fetch-invoices,stripe-webhook}/`
- `src/store/entitlementsStore.ts` — single source of truth post-webhook
- `supabase/config.toml:33-38, 70-71, 73-74` — `verify_jwt` settings
- `agent_memory.jsonl` #6 — payment SDK boundary
- Diagram: [`../diagrams/payments-stripe-sequence.mmd`](../diagrams/payments-stripe-sequence.mmd)
