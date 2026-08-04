ALTER VIEW public.billing_webhook_ops_dashboard SET (security_invoker = true);

REVOKE ALL ON public.billing_webhook_ops_dashboard FROM anon, authenticated;
GRANT SELECT ON public.billing_webhook_ops_dashboard TO service_role;