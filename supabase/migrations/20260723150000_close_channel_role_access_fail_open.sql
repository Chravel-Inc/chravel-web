-- Close the can_access_channel fail-open on role-restricted-but-public channels (2026-07-23)
--
-- PROBLEM: can_access_channel granted access via its "open channel" branch to ANY
-- active trip member whenever tc.is_private = false — even when the channel carried
-- channel_role_access restriction rows. A channel created/updated with a required
-- role but is_private = false (a reachable state via channelService.createChannel /
-- updateChannel) was therefore readable/joinable by every member, silently defeating
-- "leadership/organizers-only" channels. (No channels are in this shape today, so
-- this is a latent-hole fix with zero impact on current access.)
--
-- FIX: a channel is "open" only if is_private = false AND it has NO channel_role_access
-- rows. Presence of any role-access row makes the channel role-restricted regardless
-- of the is_private flag; access then flows solely through the role branch (branch 1)
-- and the creator/full-admin branch (branch 3). Also adds an active-status filter to
-- the member join (a departed member must not retain channel access) — defense in depth,
-- matching is_active_trip_member (status IS NULL OR 'active').
--
-- This only narrows channel read/join access — it cannot cause Trip-Not-Found, auth
-- desync, an RLS read leak, or payment-state drift.
--
-- REVERSAL: CREATE OR REPLACE the previous definition (drop the NOT EXISTS
-- channel_role_access guard and the tm.status filter from branch 2).

CREATE OR REPLACE FUNCTION public.can_access_channel(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Branch 1: user holds a PRIMARY role that this channel grants access to.
  SELECT EXISTS (
    SELECT 1
    FROM public.trip_channels tc
    INNER JOIN public.channel_role_access cra ON cra.channel_id = tc.id
    INNER JOIN public.user_trip_roles utr
      ON utr.trip_id = tc.trip_id
      AND utr.role_id = cra.role_id
      AND utr.user_id = _user_id
      AND utr.is_primary = true
    WHERE tc.id = _channel_id
  )
  -- Branch 2: channel is genuinely OPEN — is_private = false AND it carries NO role
  -- restrictions. A channel with any channel_role_access row is role-restricted even
  -- if is_private = false (this is the fail-open that is being closed).
  OR EXISTS (
    SELECT 1
    FROM public.trip_channels tc
    INNER JOIN public.trip_members tm
      ON tm.trip_id = tc.trip_id
      AND tm.user_id = _user_id
      AND (tm.status IS NULL OR tm.status = 'active')
    WHERE tc.id = _channel_id
      AND tc.is_private = false
      AND NOT EXISTS (
        SELECT 1 FROM public.channel_role_access cra2 WHERE cra2.channel_id = tc.id
      )
  )
  -- Branch 3: trip creator / full trip admin always have access.
  OR EXISTS (
    SELECT 1
    FROM public.trip_channels tc
    INNER JOIN public.trips t ON t.id = tc.trip_id
    WHERE tc.id = _channel_id
      AND (
        t.created_by = _user_id
        OR public.is_full_trip_admin(_user_id, tc.trip_id)
      )
  );
$function$;
