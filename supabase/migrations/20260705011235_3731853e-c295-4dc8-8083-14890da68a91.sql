
-- 1. gmail_accounts: block user-initiated INSERT/UPDATE (tokens must be written by service role only)
DROP POLICY IF EXISTS "Users can insert own gmail accounts" ON public.gmail_accounts;
DROP POLICY IF EXISTS "Users can update own gmail accounts" ON public.gmail_accounts;

CREATE POLICY "Block direct client INSERT on gmail_accounts"
  ON public.gmail_accounts FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Block direct client UPDATE on gmail_accounts"
  ON public.gmail_accounts FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

-- 2. profiles: revoke column-level SELECT on Stripe/subscription identifiers
REVOKE SELECT (stripe_customer_id, stripe_subscription_id, subscription_product_id, subscription_status, subscription_end)
  ON public.profiles FROM anon, authenticated;

-- 3. user_entitlements: revoke column-level SELECT on billing customer identifiers
REVOKE SELECT (stripe_customer_id, revenuecat_customer_id)
  ON public.user_entitlements FROM anon, authenticated;
