
-- Restore access to non-identifier subscription fields (needed by client tier gating).
GRANT SELECT (subscription_product_id, subscription_status, subscription_end)
  ON public.profiles TO authenticated;

-- Stripe identifiers remain revoked (from previous migration): stripe_customer_id, stripe_subscription_id.
