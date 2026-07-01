# Browser-Agent Script — Create Missing Google Play Subscriptions (Chravel)

> Paste this to a browser agent with access to the Chravel Google Play Console
> (`ChravelApp: Plan Group Trips` → Monetize with Play → Products → Subscriptions).
> **This script CREATES data.** Subscription products and base plans can be
> **deactivated later but never deleted** once created — treat every create
> action as irreversible. Stop and ask the human at every checkpoint marked
> ⏸️. Do not touch any product not explicitly listed below. No API keys or
> payment credentials are needed or should be entered anywhere in this flow.

## Goal

1. Confirm the exact, non-truncated product IDs of the 3 existing subscriptions.
2. Add an auto-renewing base plan + price to those 3 (they currently show
   **0 active base plans**, meaning none of them are actually purchasable yet).
3. Create 7 new subscription products with base plans + prices.

## Canonical values to build from (source: `src/billing/config.ts`, `src/constants/revenuecat.ts` in the `chravel-web` repo)

| Tier | Monthly price | Annual price |
|---|---|---|
| Explorer (consumer) | $9.99 | $99 |
| Frequent Chraveler (consumer) | $19.99 | $199 |
| Starter Pro (B2B) | $49 | $490 |
| Growth Pro (B2B) | $99 | $990 |
| Enterprise (B2B) | custom / contact sales — **no default price**, see Step B checkpoint | custom / contact sales |

## Step 0 — Preflight (read-only, do this first)

For each of the 3 existing rows on the Subscriptions page, click **View subscription** and record:
- The full, non-truncated product ID (the list view truncates it).
- Confirm "Active base plans: 0" as shown on the list.

Report back the 3 full IDs before proceeding. **⏸️ Checkpoint:** if any of the 3 IDs does NOT
follow the pattern `com.chravel.app.<tier-segment>.<monthly|annual>` (e.g. if the Frequent
Chraveler segment is spelled differently than expected), stop and tell the human what you found —
do not guess the convention for the new products in Step B until this is confirmed.

Expected (unconfirmed until Step 0 completes):
- Explorer Annual → `com.chravel.app.explorer.annual`
- Frequent Chraveler Annual → `com.chravel.app.frequent.annual`
- Frequent Chraveler Monthly → `com.chravel.app.frequent.monthly`

## Step A — Add base plans to the 3 existing subscriptions

These products already exist but have no base plan, so nothing is sellable yet. For each:

1. Open the subscription → **Base plans and offers** → **Add base plan**.
2. Type: **Auto-renewing**.
3. Billing period: 1 month for the Monthly product, 1 year for the Annual products.
4. Price (set for your base currency, let Play auto-convert others unless the human says otherwise):
   - Explorer Annual → $99/yr
   - Frequent Chraveler Annual → $199/yr
   - Frequent Chraveler Monthly → $19.99/mo
5. **⏸️ Checkpoint:** show the human the base plan summary (ID, period, price) before clicking
   **Activate**. Only activate after explicit confirmation.

## Step B — Create 7 new subscription products

Use the tier segment confirmed in Step 0 (assume `explorer` / `pro.starter` / `pro.growth` /
`pro.enterprise` unless Step 0 showed otherwise). For each row below: **Create subscription** →
enter Product ID + Name → **Base plans and offers** → **Add base plan** (auto-renewing, matching
period) → set price → **⏸️ show the human the full config and wait for confirmation before
activating**.

| Product ID | Name | Base plan period | Price |
|---|---|---|---|
| `com.chravel.app.explorer.monthly` | Explorer Monthly | 1 month | $9.99 |
| `com.chravel.app.pro.starter.monthly` | Starter Pro Monthly | 1 month | $49 |
| `com.chravel.app.pro.starter.annual` | Starter Pro Annual | 1 year | $490 |
| `com.chravel.app.pro.growth.monthly` | Growth Pro Monthly | 1 month | $99 |
| `com.chravel.app.pro.growth.annual` | Growth Pro Annual | 1 year | $990 |
| `com.chravel.app.pro.enterprise.monthly` | Enterprise Monthly | 1 month | **⏸️ no default — ask the human for the real price; do not enter $0, Play Console will reject it or misrepresent the plan** |
| `com.chravel.app.pro.enterprise.annual` | Enterprise Annual | 1 year | **⏸️ same as above** |

Notes:
- These 6 Pro-tier products and Explorer Monthly are being created **ahead of** Android billing
  actually being implemented in the app (`GOOGLE_BILLING_ENABLED` is currently `false` in the
  codebase, and Pro tiers are Stripe-web-only today) — that's expected and intentional per the
  human's instruction, not a bug to flag.
- Do **not** create anything for `explorer.pass45` or `frequentchraveler.pass90` — those are
  one-time Trip Pass products and belong under **Monetize with Play → Products → In-app
  products**, a different page from Subscriptions. Out of scope for this script.

## Output

- A table: Product ID · Name · Base plan period · Price · Status (already-existed /
  base-plan-added / created-and-activated / created-pending-price / skipped).
- Explicit confirmation of the Step 0 findings (did the existing 3 IDs match the assumed
  convention?).
- Any checkpoint where you stopped and why.
