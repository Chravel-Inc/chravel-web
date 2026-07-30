# AGENTIC BROWSER SCRIPT — Stripe Sandbox Billing E2E (Chravel)

> Paste this entire script into your Claude browser extension. You are operating in **Stripe Test mode**
> and the **Chravel web app** (Vercel preview or https://chravel.app). Do not paste secrets into chat.
> Redact `sk_`, `pk_`, `whsec_`, and full card numbers in screenshots.

## Preconditions (human must confirm before you start)

- [ ] Stripe dashboard toggle is **Test mode** (orange banner visible).
- [ ] Chravel test user is logged in (use a disposable test account, not production admin).
- [ ] Supabase project `jmjiyekmxwsxkfnqwyaa` edge functions are deployed (`stripe-webhook` v859+).
- [ ] You have access to Supabase Dashboard → Table Editor (read-only is fine) OR ask human to run SQL checks.

## Canonical test card numbers (Stripe Test mode)

| Scenario | Card number | Exp | CVC |
|---|---|---|---|
| Success | `4242 4242 4242 4242` | any future | any 3 digits |
| Decline (payment failed) | `4000 0000 0000 0341` | any future | any 3 digits |

---

## PHASE 1 — Stripe Dashboard setup verification (Test mode)

### 1.1 Webhook endpoint
1. Go to https://dashboard.stripe.com/test/webhooks
2. Record each endpoint URL. Confirm **one** points at:
   `https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/stripe-webhook`
3. Click into that endpoint. Confirm **Listening to** includes ALL of:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `charge.refunded`
4. Open **Recent deliveries**. Note pass/fail for last 10 events.
5. **If no test webhook exists:** STOP and tell human:
   > "Create a Test-mode webhook at the Supabase URL above with all 7 events, then add the signing secret as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets (or use a dedicated `STRIPE_WEBHOOK_SECRET_TEST` if you split test/live)."

### 1.2 Products & prices (Test mode)
1. Go to https://dashboard.stripe.com/test/products
2. Verify Explorer monthly product `prod_U73VxEnvEHbBrx` (or test-mode equivalent) exists and is Active.
3. Record the **Test mode** price ID for Explorer monthly — it may differ from live `price_1T8pOc…`.
4. **If test products are missing:** STOP and tell human to copy live products to test mode or create matching test products.

### 1.3 Customer Portal (Test mode)
1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Confirm portal is **Activated** with: cancel subscription, update payment method, view invoices.

---

## PHASE 2 — App E2E: Subscription purchase → active entitlement

### 2.1 Start checkout
1. In Chravel (logged in as test user), navigate to **Settings → Subscription** or open **Upgrade** modal.
2. Select **Explorer** monthly plan ($9.99).
3. Click **Subscribe** / **Upgrade** — should redirect to Stripe Checkout (test mode URL contains `/test/`).
4. Complete checkout with card `4242 4242 4242 4242`.
5. Return to Chravel success URL. Wait 10 seconds for webhook processing.

### 2.2 Verify in app
- [ ] UI shows Explorer tier active (not Free).
- [ ] No error toast about subscription check failure.

### 2.3 Verify in Stripe (Test mode)
1. https://dashboard.stripe.com/test/customers — find customer by test user email.
2. Confirm subscription status = **Active**.

### 2.4 Verify webhook fired
1. Stripe → Webhooks → your endpoint → Recent deliveries.
2. Find `checkout.session.completed` and `customer.subscription.created` — both should be **200**.

### 2.5 Verify in Supabase (ask human to run OR use Table Editor)
Human SQL (read-only):
```sql
SELECT plan, status, purchase_type, source, current_period_end
FROM user_entitlements
WHERE user_id = '<TEST_USER_UUID>'
ORDER BY purchase_type;

SELECT stripe_customer_id, subscription_status, subscription_product_id
FROM profiles
WHERE user_id = '<TEST_USER_UUID>';
```
**PASS criteria:** `user_entitlements` row with `purchase_type='subscription'`, `plan='explorer'`, `status IN ('active','trialing')`; `profiles.stripe_customer_id` NOT NULL.

---

## PHASE 3 — Cancel subscription (grace period)

1. Stripe Test → Customers → select test customer → Subscriptions → **Cancel subscription** (at period end OR immediately — note which).
2. Wait 10s. Check webhook `customer.subscription.deleted` or `updated` → 200.
3. Re-check Supabase:
```sql
SELECT plan, status, current_period_end FROM user_entitlements
WHERE user_id = '<TEST_USER_UUID>' AND purchase_type = 'subscription';
```
**PASS:** If canceled at period end: `status='canceled'` but `plan` still paid tier until `current_period_end`. If immediate: may downgrade to `free`.

---

## PHASE 4 — Payment failure (past_due grace)

> Use a **fresh** test user OR re-subscribe after cancel.

1. Start new Explorer subscription checkout.
2. Use decline card `4000 0000 0000 0341` OR subscribe with 4242 then in Stripe → Subscription → simulate failed invoice.
3. Stripe → send `invoice.payment_failed` webhook (or wait for auto-retry failure).
4. Verify Supabase:
```sql
SELECT plan, status FROM user_entitlements
WHERE user_id = '<TEST_USER_UUID>' AND purchase_type = 'subscription';
```
**PASS:** `status='past_due'` AND `plan` still `explorer` (not downgraded to free).

---

## PHASE 5 — Trip Pass purchase + refund correlation

### 5.1 Purchase Trip Pass
1. In Chravel, open **Trip Pass** modal (Explorer 45-day pass, ~$39.99).
2. Complete Stripe Checkout with `4242 4242 4242 4242`.
3. Verify:
```sql
SELECT plan, status, purchase_type, current_period_end
FROM user_entitlements
WHERE user_id = '<TEST_USER_UUID>' AND purchase_type = 'pass';
```
**PASS:** `plan='explorer'`, `status='active'`, `purchase_type='pass'`.

### 5.2 Refund Trip Pass (should revoke pass)
1. Stripe Test → Payments → find the Trip Pass payment → **Refund**.
2. Wait for `charge.refunded` webhook → 200.
3. Verify pass expired:
```sql
SELECT status FROM user_entitlements
WHERE user_id = '<TEST_USER_UUID>' AND purchase_type = 'pass';
```
**PASS:** `status='expired'`.

### 5.3 Negative control — subscription refund must NOT kill pass
> Only if user has BOTH active subscription AND pass (skip if not set up).

1. Refund a **subscription** invoice/charge (not the pass charge).
2. Verify pass entitlement unchanged (`status='active'`).

---

## PHASE 6 — Audit trail check

```sql
SELECT event_type, purchase_type, old_plan, new_plan, old_status, new_status, created_at
FROM entitlement_audit_log
WHERE user_id = '<TEST_USER_UUID>'
ORDER BY created_at DESC
LIMIT 10;
```
**PASS:** Rows exist for checkout, subscription update, and refund events from this session.

---

## Final report template

```
STRIPE SANDBOX E2E — Chravel Billing
Date: ___
Test user email: ___
Stripe mode: TEST

| Phase | Result | Notes |
|-------|--------|-------|
| 1 Webhook config | PASS/FAIL | |
| 2 Subscription purchase | PASS/FAIL | |
| 3 Cancel / grace | PASS/FAIL | |
| 4 Payment failed → past_due | PASS/FAIL | |
| 5a Trip Pass purchase | PASS/FAIL | |
| 5b Trip Pass refund → expired | PASS/FAIL | |
| 5c Sub refund leaves pass | PASS/FAIL/SKIP | |
| 6 Audit log rows | PASS/FAIL | |

Blockers for human:
- [ ] list any
```
