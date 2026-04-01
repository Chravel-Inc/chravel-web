import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireSecrets } from '../_shared/validateSecrets.ts';

// RevenueCat event types that affect subscription state
const SUBSCRIPTION_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'CANCELLATION',
  'UNCANCELLATION',
  'BILLING_ISSUE',
  'SUBSCRIBER_ALIAS',
  'EXPIRATION',
  'TRANSFER',
  'SUBSCRIPTION_PAUSED',
  'SUBSCRIPTION_EXTENDED',
  'REFUND',
]);

// Entitlement ID → plan mapping (must match RevenueCat dashboard + constants/revenuecat.ts)
const ENTITLEMENT_TO_PLAN: Record<string, string> = {
  chravel_explorer: 'explorer',
  chravel_frequent_chraveler: 'frequent-chraveler',
  chravel_pro_starter: 'pro-starter',
  chravel_pro_growth: 'pro-growth',
  chravel_pro_enterprise: 'pro-enterprise',
};

const PLAN_PRIORITY = [
  'free',
  'explorer',
  'frequent-chraveler',
  'pro-starter',
  'pro-growth',
  'pro-enterprise',
];

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  original_app_user_id?: string;
  expiration_at_ms?: number;
  purchased_at_ms?: number;
  period_type?: string;
  entitlement_ids?: string[];
  product_id?: string;
  store?: string;
  environment?: string;
}

interface RevenueCatWebhookPayload {
  event: RevenueCatEvent;
  api_version: string;
}

serve(async req => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Validate secrets at startup
  const { REVENUECAT_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = requireSecrets([
    'REVENUECAT_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]);

  // RevenueCat authentication: dashboard-configured Authorization header sent verbatim.
  // Docs: https://www.revenuecat.com/docs/integrations/webhooks/overview#security
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== REVENUECAT_WEBHOOK_SECRET) {
    console.error('[rc-webhook] Invalid or missing Authorization header');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const rawBody = await req.text();

  let payload: RevenueCatWebhookPayload;
  try {
    const parsed = JSON.parse(rawBody);
    // Guard: ensure top-level event object exists before destructuring
    if (!parsed || typeof parsed !== 'object' || !parsed.event || !parsed.event.type) {
      return new Response(JSON.stringify({ error: 'Invalid payload: missing event' }), {
        status: 400,
      });
    }
    payload = parsed as RevenueCatWebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { event } = payload;

  // Skip events that don't affect subscription state
  if (!SUBSCRIPTION_EVENTS.has(event.type)) {
    console.log(`[rc-webhook] Skipping non-subscription event: ${event.type}`);
    return new Response(JSON.stringify({ success: true, skipped: true }), { status: 200 });
  }

  // Use original_app_user_id (Supabase user UUID) as the authoritative user ID
  const userId = event.original_app_user_id || event.app_user_id;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.warn(`[rc-webhook] Non-UUID app_user_id: ${userId} — skipping`);
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'non_uuid_user' }), {
      status: 200,
    });
  }

  console.log(`[rc-webhook] Processing ${event.type} for user: ${userId}`);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Derive plan from active entitlements
  let plan = 'free';
  let status: string;
  let currentPeriodEnd: string | null = null;
  const entitlementIds: string[] = event.entitlement_ids || [];

  for (const entitlementId of entitlementIds) {
    const mappedPlan = ENTITLEMENT_TO_PLAN[entitlementId];
    if (mappedPlan && PLAN_PRIORITY.indexOf(mappedPlan) > PLAN_PRIORITY.indexOf(plan)) {
      plan = mappedPlan;
    }
  }

  if (event.expiration_at_ms) {
    currentPeriodEnd = new Date(event.expiration_at_ms).toISOString();
  }

  // Map event type to subscription status.
  // SUBSCRIPTION_PAUSED: Google Play concept — access is retained until EXPIRATION fires.
  // Do NOT revoke on pause; keep active so user retains access until the period ends.
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'SUBSCRIPTION_EXTENDED':
    case 'PRODUCT_CHANGE':
    case 'SUBSCRIPTION_PAUSED': // access retained until EXPIRATION
      status = event.period_type === 'TRIAL' ? 'trialing' : 'active';
      break;
    case 'CANCELLATION':
      status = 'canceled';
      break;
    case 'BILLING_ISSUE':
      // Grace period: user retains access while RevenueCat retries billing.
      status = 'past_due';
      break;
    case 'EXPIRATION':
    case 'REFUND':
      status = 'expired';
      plan = 'free';
      break;
    default:
      status = 'active';
  }

  // Idempotency guard: skip write if nothing changed
  const { data: existing } = await serviceClient
    .from('user_entitlements')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .eq('source', 'revenuecat')
    .maybeSingle();

  const normalizedPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null;
  const existingPeriodEnd = existing?.current_period_end
    ? new Date(existing.current_period_end).toISOString()
    : null;

  if (
    existing &&
    existing.plan === plan &&
    existing.status === status &&
    existingPeriodEnd === normalizedPeriodEnd
  ) {
    console.log(`[rc-webhook] No change for user ${userId} — skipping DB write`);
    return new Response(JSON.stringify({ success: true, synced: false, reason: 'no_change' }), {
      status: 200,
    });
  }

  const { error: upsertError } = await serviceClient.from('user_entitlements').upsert(
    {
      user_id: userId,
      source: 'revenuecat',
      plan,
      status,
      purchase_type: 'subscription',
      current_period_end: currentPeriodEnd,
      entitlements: entitlementIds,
      revenuecat_customer_id: event.app_user_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (upsertError) {
    console.error(`[rc-webhook] Upsert error for user ${userId}:`, upsertError);
    // Return 500 so RevenueCat retries
    return new Response(JSON.stringify({ error: 'Database update failed' }), { status: 500 });
  }

  console.log(`[rc-webhook] Synced user ${userId}: plan=${plan}, status=${status}`);

  return new Response(JSON.stringify({ success: true, synced: true, plan, status }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
