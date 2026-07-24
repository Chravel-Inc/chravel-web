/**
 * Canonical Stripe checkout / billing-portal invocations.
 *
 * `create-checkout` and `customer-portal` were invoked inline from six-plus
 * components with copy-pasted `supabase.functions.invoke(...) + throw on error`
 * boilerplate (service-layer drift). These wrappers are the single place those
 * two edge functions are called; callers still own their request body and their
 * response handling (url open, no_subscription messaging, toasts) so behavior is
 * unchanged. Both throw on a transport/function error, exactly like the inline
 * calls did.
 */

import { supabase } from '@/integrations/supabase/client';

export interface CheckoutSessionResponse {
  url?: string | null;
  [key: string]: unknown;
}

export interface CustomerPortalResponse {
  url?: string | null;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

/** Invoke the create-checkout edge function. Throws on error; returns its data. */
export async function createCheckoutSession(
  body: Record<string, unknown>,
): Promise<CheckoutSessionResponse> {
  const { data, error } = await supabase.functions.invoke('create-checkout', { body });
  if (error) throw error;
  return data as CheckoutSessionResponse;
}

/** Invoke the customer-portal edge function. Throws on error; returns its data. */
export async function openCustomerPortal(): Promise<CustomerPortalResponse> {
  const { data, error } = await supabase.functions.invoke('customer-portal');
  if (error) throw error;
  return data as CustomerPortalResponse;
}
