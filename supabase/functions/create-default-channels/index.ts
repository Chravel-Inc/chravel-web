import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

/**
 * Deprecated edge function.
 *
 * Historical implementation targeted legacy `trip_channels` / `trip_channel_members`
 * schema fields and could create inconsistent channel state.
 *
 * Keep this function deployed as a hard fail response so existing clients/operators
 * get an explicit migration signal instead of silently writing invalid data.
 */
serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: 'create-default-channels is deprecated',
      reason:
        'This endpoint targeted legacy schema and has been disabled for production safety. Use current channel provisioning flow.',
    }),
    {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
