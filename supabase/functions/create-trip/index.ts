import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { CreateTripSchema, validateInput } from '../_shared/validation.ts';
import { sanitizeErrorForClient, logError } from '../_shared/errorHandling.ts';
import {
  evaluateTripCreationPermission,
  resolveEffectiveTripPlan,
} from '../_shared/tripEntitlementPolicy.ts';

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const validation = validateInput(CreateTripSchema, requestBody);

    if (!validation.success) {
      logError('CREATE_TRIP_VALIDATION', validation.error, { userId: user.id });
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      name,
      description,
      destination,
      start_date,
      end_date,
      trip_type,
      cover_image_url,
      enabled_features,
      card_color,
      organizer_display_name,
      privacy_mode,
      ai_access_enabled,
      allow_explorer_pro_trip,
      category,
    } = validation.data;

    // Get legacy counters + fallback profile subscription fields.
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'subscription_status, subscription_product_id, free_pro_trips_used, free_events_used, free_pro_trip_limit, free_event_limit',
      )
      .eq('user_id', user.id)
      .single();

    const { data: entitlement } = await supabase
      .from('user_entitlements')
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .eq('purchase_type', 'subscription')
      .maybeSingle();

    // Super admin bypass - hardcoded founders + env var extension
    const FOUNDER_EMAILS = [
      'ccamechi@gmail.com',
      'christian@chravelapp.com',
      'demo@chravelapp.com',
      'phil@philquist.com',
      'darren.hartgee@gmail.com',
    ];
    const envAdminEmails = (Deno.env.get('SUPER_ADMIN_EMAILS') || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const allSuperAdmins = [...new Set([...FOUNDER_EMAILS, ...envAdminEmails])];
    const authEmail = user.email?.toLowerCase();
    const isSuperAdmin = authEmail ? allSuperAdmins.includes(authEmail) : false;

    // Resolve the effective trip type
    const effectiveTripType = trip_type || 'consumer';
    const effectivePlan = resolveEffectiveTripPlan({
      entitlement: entitlement ?? null,
      legacyProfile: profile ?? null,
    });

    if (!isSuperAdmin) {
      const { count: consumerActiveCount, error: countError } = await supabase
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('is_archived', false)
        .eq('trip_type', 'consumer');
      if (countError) throw countError;

      const creationPolicy = evaluateTripCreationPermission({
        plan: effectivePlan,
        tripType: effectiveTripType,
        explorerProTripOverride: allow_explorer_pro_trip ?? false,
        counts: {
          consumerActiveCount: consumerActiveCount || 0,
          freeProTripsUsed: profile?.free_pro_trips_used || 0,
          freeEventsUsed: profile?.free_events_used || 0,
          freeProTripLimit: profile?.free_pro_trip_limit || 1,
          freeEventLimit: profile?.free_event_limit || 1,
        },
      });

      if (!creationPolicy.allowed && creationPolicy.errorCode) {
        const errorCode = creationPolicy.errorCode;
        const messageByCode: Record<string, string> = {
          TRIP_LIMIT_REACHED: 'Free plan supports up to 3 active consumer trips.',
          UPGRADE_REQUIRED_PRO_TRIP: 'Upgrade to create more Pro trips!',
          UPGRADE_REQUIRED_EVENT: 'Upgrade to create unlimited Events!',
          EXPLORER_PRO_TRIP_REQUIRES_EXPLICIT_OVERRIDE:
            'Explorer plan cannot create Pro trips without explicit override.',
        };

        return new Response(
          JSON.stringify({
            error: errorCode,
            message: messageByCode[errorCode] || 'Trip creation is not allowed for your plan.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Default features per trip type (all features enabled for MVP)
    const DEFAULT_FEATURES_BY_TYPE: Record<string, string[]> = {
      consumer: ['chat', 'calendar', 'concierge', 'media', 'payments', 'places', 'polls', 'tasks'],
      pro: [
        'chat',
        'calendar',
        'concierge',
        'media',
        'payments',
        'places',
        'polls',
        'tasks',
        'team',
      ],
      event: ['agenda', 'calendar', 'chat', 'concierge', 'lineup', 'media', 'polls', 'tasks'],
    };

    const defaultFeatures =
      DEFAULT_FEATURES_BY_TYPE[effectiveTripType] || DEFAULT_FEATURES_BY_TYPE['consumer'];

    // Create trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name,
        description,
        destination,
        start_date,
        end_date,
        trip_type: effectiveTripType,
        cover_image_url,
        card_color,
        organizer_display_name,
        privacy_mode: privacy_mode || 'standard',
        ai_access_enabled: ai_access_enabled ?? true,
        created_by: user.id,
        enabled_features: enabled_features || defaultFeatures,
        // Event trips default to restrictive chat/media modes; consumer/pro default to open.
        // Explicit per-type defaults prevent reliance on table-level DEFAULT which applies globally.
        chat_mode: effectiveTripType === 'event' ? 'broadcasts' : 'everyone',
        media_upload_mode: effectiveTripType === 'event' ? 'admin_only' : 'everyone',
        // Persist Pro trip category as JSONB array
        ...(effectiveTripType === 'pro' && category
          ? { categories: [{ type: 'pro_category', value: category }] }
          : {}),
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Note: Trip creator is automatically added as admin member by the
    // ensure_creator_is_member database trigger - no manual insert needed

    // Increment taste test usage for free users (skip for super admins)
    if (!isSuperAdmin) {
      const freeProTripsUsed = profile?.free_pro_trips_used || 0;
      const freeEventsUsed = profile?.free_events_used || 0;
      const isFreeTier = effectivePlan === 'free';

      if (isFreeTier && trip_type === 'pro') {
        await supabase
          .from('profiles')
          .update({ free_pro_trips_used: freeProTripsUsed + 1 })
          .eq('user_id', user.id);
      } else if (isFreeTier && trip_type === 'event') {
        await supabase
          .from('profiles')
          .update({ free_events_used: freeEventsUsed + 1 })
          .eq('user_id', user.id);
      }
    }

    console.log(`Trip created: ${trip.id} by user ${user.id}, type: ${effectiveTripType}`);

    return new Response(JSON.stringify({ success: true, trip }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logError('CREATE_TRIP', error);
    return new Response(JSON.stringify({ error: sanitizeErrorForClient(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
