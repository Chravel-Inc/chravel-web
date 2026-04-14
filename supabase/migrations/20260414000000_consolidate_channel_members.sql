-- =============================================================================
-- Migration: Consolidate channel_members — retire trip_channel_members
-- =============================================================================
--
-- PROBLEM:
--   Two separate channel membership tables exist for the same trip_channels FK:
--
--   1. trip_channel_members (Jan 2025, migration 20250120000001)
--      • Created by the original channels system
--      • Still written to by:
--          - sync_channel_memberships_trigger on trip_members
--          - sync_channel_on_role_change trigger on user_trip_roles
--          - sync_user_channel_memberships() called by sync_channels_on_role_access_change
--      • Still referenced by RLS policies on trip_chat_messages and trip_channels
--
--   2. channel_members (Oct 2025, migration 20251020230349)
--      • Created by the RBAC channel system
--      • Written to by sync_channel_memberships_on_role_change_trigger (Mar 2026)
--      • READ by ALL active code: services, webhook, ChannelChatView
--
--   Result: DB triggers silently populate trip_channel_members (which nothing reads);
--   RLS policies guard against trip_channel_members (which is never populated by
--   active flows); channel_members is the single source of truth for membership
--   in every code path but is unguarded by RLS on trip_chat_messages.
--
-- FIX:
--   1. Migrate any data from trip_channel_members → channel_members
--   2. Redirect all sync functions/triggers to write channel_members
--   3. Drop the redundant sync_channel_on_role_change trigger (superseded by
--      sync_channel_memberships_on_role_change_trigger from 20260315000003)
--   4. Replace all RLS policy references to trip_channel_members with channel_members
--   5. Update get_channel_permissions() to use channel_members
--   6. Drop trip_channel_members table and its artifacts
-- =============================================================================

-- =============================================================================
-- STEP 1: Migrate existing data
-- =============================================================================

-- Copy any trip_channel_members rows that are not already in channel_members.
-- We cannot copy the `role` field (channel_members has no role column), but no
-- active code reads trip_channel_members.role so it carries no functional value.
INSERT INTO public.channel_members (channel_id, user_id, joined_at)
SELECT tcm.channel_id, tcm.user_id, tcm.joined_at
FROM public.trip_channel_members tcm
WHERE NOT EXISTS (
  SELECT 1
  FROM public.channel_members cm
  WHERE cm.channel_id = tcm.channel_id
  AND cm.user_id = tcm.user_id
)
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- =============================================================================
-- STEP 2: Redirect sync_channel_memberships() to channel_members
--
-- This function is called by:
--   • sync_channel_memberships_trigger (fires on trip_members INSERT/UPDATE/DELETE)
--   • sync_channels_on_role_access_change trigger (fires on channel_role_access)
-- Both still called at runtime; updating the body is sufficient — no trigger
-- changes needed for these two.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_channel_memberships()
RETURNS TRIGGER AS $$
DECLARE
  channel_record RECORD;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Add user to role-based channels whose role_filter matches their role
    FOR channel_record IN
      SELECT tc.id, tc.role_filter
      FROM trip_channels tc
      WHERE tc.trip_id = NEW.trip_id
      AND tc.channel_type = 'role'
      AND tc.role_filter->>'role' = NEW.role
    LOOP
      INSERT INTO public.channel_members (channel_id, user_id)
      VALUES (channel_record.id, NEW.user_id)
      ON CONFLICT (channel_id, user_id) DO NOTHING;
    END LOOP;
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.channel_members cm
    WHERE cm.user_id = OLD.user_id
    AND cm.channel_id IN (
      SELECT id FROM trip_channels WHERE trip_id = OLD.trip_id
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 3: Redirect sync_user_channel_memberships() to channel_members
--
-- This function is called by:
--   • trigger_sync_channel_on_role_change (fires on user_trip_roles)
--   • trigger_sync_channels_on_role_access_change (fires on channel_role_access)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_user_channel_memberships(
  p_trip_id TEXT,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_channel RECORD;
BEGIN
  FOR v_channel IN
    SELECT tc.id AS channel_id
    FROM trip_channels tc
    WHERE tc.trip_id = p_trip_id
    AND tc.is_archived = false
  LOOP
    IF EXISTS (
      SELECT 1
      FROM user_trip_roles utr
      INNER JOIN channel_role_access cra ON cra.role_id = utr.role_id
      WHERE utr.trip_id = p_trip_id
      AND utr.user_id = p_user_id
      AND cra.channel_id = v_channel.channel_id
    ) THEN
      INSERT INTO public.channel_members (channel_id, user_id)
      VALUES (v_channel.channel_id, p_user_id)
      ON CONFLICT (channel_id, user_id) DO NOTHING;
    ELSE
      DELETE FROM public.channel_members
      WHERE channel_id = v_channel.channel_id
      AND user_id = p_user_id;
    END IF;
  END LOOP;
END;
$$;

-- =============================================================================
-- STEP 4: Drop the redundant trigger on user_trip_roles
--
-- sync_channel_on_role_change (from 20260113) called sync_user_channel_memberships()
-- which wrote to trip_channel_members. The newer trigger added in 20260315000003
-- (sync_channel_memberships_on_role_change_trigger) correctly writes to
-- channel_members and is the authoritative handler. We can safely drop the old one.
-- Note: trigger_sync_channel_on_role_change() function is kept because
-- sync_user_channel_memberships() is now correct and still used by the
-- channel_role_access trigger.
-- =============================================================================

DROP TRIGGER IF EXISTS sync_channel_on_role_change ON public.user_trip_roles;

-- =============================================================================
-- STEP 5: Update RLS policies on trip_channels that check trip_channel_members
-- =============================================================================

-- Drop the old viewer policy that checks trip_channel_members
DROP POLICY IF EXISTS "Users can view channels they are members of or trip admins can view all"
  ON public.trip_channels;

-- Recreate it referencing channel_members
CREATE POLICY "Users can view channels they are members of or trip admins can view all"
ON public.trip_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = trip_channels.id
    AND cm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM trip_members tm
    WHERE tm.trip_id = trip_channels.trip_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'organizer', 'owner')
  )
);

-- =============================================================================
-- STEP 6: Update RLS policies on trip_chat_messages that check trip_channel_members
-- =============================================================================

-- Drop all old policies that reference trip_channel_members on trip_chat_messages
DROP POLICY IF EXISTS "Users can view channel messages from channels they are members of"
  ON public.trip_chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to channels they are members of"
  ON public.trip_chat_messages;
DROP POLICY IF EXISTS "Channel members can post to trip channels"
  ON public.trip_chat_messages;

-- Also drop the UPDATE/DELETE policies that had combined checks
DROP POLICY IF EXISTS "Users can update their own messages" ON public.trip_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.trip_chat_messages;

-- Recreate channel SELECT policy against channel_members
CREATE POLICY "Users can view channel messages from channels they are members of"
ON public.trip_chat_messages FOR SELECT
USING (
  channel_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = trip_chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Recreate channel INSERT policy against channel_members
-- (chat_mode does not restrict channel posting — channels have their own access model)
CREATE POLICY "Channel members can post to trip channels"
ON public.trip_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  channel_id IS NOT NULL
  AND auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = trip_chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Recreate UPDATE policy combining main-chat and channel checks against channel_members
CREATE POLICY "Users can update their own messages"
ON public.trip_chat_messages FOR UPDATE
USING (
  user_id = auth.uid()
  AND (
    (channel_id IS NULL AND EXISTS (
      SELECT 1 FROM trip_members tm
      WHERE tm.trip_id = trip_chat_messages.trip_id
      AND tm.user_id = auth.uid()
    ))
    OR
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = trip_chat_messages.channel_id
      AND cm.user_id = auth.uid()
    ))
  )
);

-- Recreate DELETE policy combining main-chat and channel checks against channel_members
CREATE POLICY "Users can delete their own messages"
ON public.trip_chat_messages FOR DELETE
USING (
  user_id = auth.uid()
  AND (
    (channel_id IS NULL AND EXISTS (
      SELECT 1 FROM trip_members tm
      WHERE tm.trip_id = trip_chat_messages.trip_id
      AND tm.user_id = auth.uid()
    ))
    OR
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = trip_chat_messages.channel_id
      AND cm.user_id = auth.uid()
    ))
  )
);

-- =============================================================================
-- STEP 7: Update get_channel_permissions() to use channel_members
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_channel_permissions(
  channel_id_param UUID,
  user_id_param UUID
)
RETURNS TABLE(
  can_read  BOOLEAN,
  can_write BOOLEAN,
  can_manage BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = channel_id_param
      AND cm.user_id = user_id_param
    ) AS can_read,
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = channel_id_param
      AND cm.user_id = user_id_param
    ) AS can_write,
    EXISTS (
      SELECT 1 FROM trip_channels tc
      JOIN trip_members tm ON tm.trip_id = tc.trip_id
      WHERE tc.id = channel_id_param
      AND tm.user_id = user_id_param
      AND tm.role IN ('admin', 'organizer', 'owner')
    ) AS can_manage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 8: Drop all RLS policies on trip_channel_members, then drop the table
--
-- Dropping the table with CASCADE removes dependent indexes and constraints.
-- RLS policies are dropped explicitly first to avoid pg_depend issues with
-- some Postgres versions.
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own memberships and channel members can view all members"
  ON public.trip_channel_members;
DROP POLICY IF EXISTS "Trip admins can manage channel memberships"
  ON public.trip_channel_members;

DROP TABLE IF EXISTS public.trip_channel_members CASCADE;

-- =============================================================================
-- STEP 9: Add a functional index on channel_members to match the access pattern
--         used in the updated RLS policies (channel_id + user_id lookups)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_channel_members_channel_user
  ON public.channel_members (channel_id, user_id);

COMMENT ON TABLE public.channel_members IS
'Canonical channel membership table. Supersedes the retired trip_channel_members table.
Populated by:
  • sync_channel_memberships_trigger (trip_members changes)
  • sync_channel_memberships_on_role_change_trigger (user_trip_roles changes, 20260315000003)
  • trigger_sync_channel_on_role_change / trigger_sync_channels_on_role_access_change (channel_role_access changes)
  • channelService.ts on channel creation (creator auto-member)
  • streamMembershipSync.ts on trip join/leave (Stream-side)';
