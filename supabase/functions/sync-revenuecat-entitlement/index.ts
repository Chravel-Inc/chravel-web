import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { USER_ENTITLEMENT_CONFLICT_TARGET } from '../_shared/entitlementUpsert.ts';
import { createMissingSecretResponse, requireSecret } from '../_shared/validateSecrets.ts';
import { deriveRevenueCatSyncStates, type RevenueCatSubscriberResponse } from './syncState.ts';

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const revenueCatSecretKey = requireSecret('REVENUECAT_SECRET_API_KEY', /^sk_/);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('[sync-rc] Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subscriberResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
      {
        headers: {
          Authorization: `Bearer ${revenueCatSecretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!subscriberResponse.ok) {
      const errorBody = await subscriberResponse.text();
      console.error('[sync-rc] RevenueCat subscriber lookup failed', {
        userId: user.id,
        status: subscriberResponse.status,
        body: errorBody.slice(0, 500),
      });

      return new Response(
        JSON.stringify({ error: 'Failed to verify RevenueCat entitlement state' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const customerInfo = (await subscriberResponse.json()) as RevenueCatSubscriberResponse;
    const derivedStates = deriveRevenueCatSyncStates(customerInfo);

    console.log('[sync-rc] Syncing verified entitlements for user:', user.id);
    console.log(
      '[sync-rc] Active entitlements by purchase type:',
      derivedStates.map(state => ({
        purchaseType: state.purchaseType,
        entitlements: state.entitlementIds,
      })),
    );

    const revenueCatCustomerId =
      derivedStates[0]?.revenueCatCustomerId ??
      customerInfo.subscriber.original_app_user_id ??
      null;

    // Use service role client to upsert (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingRows, error: existingRowsError } = await serviceClient
      .from('user_entitlements')
      .select('plan, status, current_period_end, purchase_type, entitlements')
      .eq('user_id', user.id)
      .eq('source', 'revenuecat');

    if (existingRowsError) {
      console.error('[sync-rc] Failed to load existing entitlement rows:', existingRowsError);
      return new Response(JSON.stringify({ error: 'Failed to sync entitlements' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const existingByPurchaseType = new Map(
      (existingRows ?? []).map(row => [row.purchase_type, row] as const),
    );

    const statesToPersist = derivedStates.filter(
      state => state.entitlementIds.length > 0 || existingByPurchaseType.has(state.purchaseType),
    );

    const rowsToUpsert = statesToPersist.filter(state => {
      const existing = existingByPurchaseType.get(state.purchaseType);
      const normalizedPeriodEnd = state.currentPeriodEnd
        ? new Date(state.currentPeriodEnd).toISOString()
        : null;
      const existingPeriodEnd = existing?.current_period_end
        ? new Date(existing.current_period_end).toISOString()
        : null;
      const normalizedEntitlements = [...state.entitlementIds].sort();
      const existingEntitlements = Array.isArray(existing?.entitlements)
        ? [...existing.entitlements].sort()
        : [];

      return !(
        existing &&
        existing.plan === state.plan &&
        existing.status === state.status &&
        existingPeriodEnd === normalizedPeriodEnd &&
        existingEntitlements.length === normalizedEntitlements.length &&
        existingEntitlements.every(
          (entitlementId, index) => entitlementId === normalizedEntitlements[index],
        )
      );
    });

    if (rowsToUpsert.length === 0) {
      console.log('[sync-rc] No change detected — skipping DB write');
      return new Response(
        JSON.stringify({
          success: true,
          synced: false,
          reason: 'no_change',
          entitlements: statesToPersist.map(state => ({
            purchaseType: state.purchaseType,
            plan: state.plan,
            status: state.status,
            currentPeriodEnd: state.currentPeriodEnd,
            entitlementIds: state.entitlementIds,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { error: upsertError } = await serviceClient.from('user_entitlements').upsert(
      rowsToUpsert.map(state => ({
        user_id: user.id,
        source: 'revenuecat',
        plan: state.plan,
        status: state.status,
        purchase_type: state.purchaseType,
        current_period_end: state.currentPeriodEnd,
        entitlements: state.entitlementIds,
        revenuecat_customer_id: revenueCatCustomerId ?? user.id,
        updated_at: new Date().toISOString(),
      })),
      {
        onConflict: USER_ENTITLEMENT_CONFLICT_TARGET,
      },
    );

    if (upsertError) {
      console.error('[sync-rc] Upsert error:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to sync entitlements' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(
      '[sync-rc] Successfully synced:',
      rowsToUpsert.map(state => ({
        purchaseType: state.purchaseType,
        plan: state.plan,
        status: state.status,
        entitlements: state.entitlementIds,
      })),
    );

    return new Response(
      JSON.stringify({
        success: true,
        synced: true,
        entitlements: rowsToUpsert.map(state => ({
          purchaseType: state.purchaseType,
          plan: state.plan,
          status: state.status,
          currentPeriodEnd: state.currentPeriodEnd,
          entitlementIds: state.entitlementIds,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Missing required secret: REVENUECAT_SECRET_API_KEY') ||
        error.message.includes('Secret REVENUECAT_SECRET_API_KEY has invalid format'))
    ) {
      return createMissingSecretResponse(error, corsHeaders);
    }

    console.error('[sync-rc] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
