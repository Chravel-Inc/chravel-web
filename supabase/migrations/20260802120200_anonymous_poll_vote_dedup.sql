-- B9: Anonymous polls had zero vote deduplication.
-- Dedup was derived entirely from each option's `voters` jsonb array, but that array is only
-- populated for NON-anonymous polls (writing voter ids into it would break anonymity). So on an
-- anonymous poll every click incremented the tally, single-select was bypassed, and votes could
-- not be removed — i.e. unlimited ballot stuffing.
--
-- Fix: track vote identity in a PRIVATE ledger table used only for dedup. RLS is enabled with no
-- policies (deny-all to clients) and table grants are revoked, so no client can read who voted;
-- only the SECURITY DEFINER vote functions (which run as the table owner and bypass RLS) touch it.
-- The `voters` array is still maintained for non-anonymous polls for display. This is a new,
-- isolated table (no read path for clients) and the function changes only tighten access.
--
-- Also adds the active-membership filter (status IS NULL OR 'active') to all three vote functions,
-- closing the related gap where a member who left a trip could still cast/remove votes.

-- 1) Private dedup ledger -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poll_vote_ledger (
  poll_id uuid NOT NULL REFERENCES public.trip_polls(id) ON DELETE CASCADE,
  option_id text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, option_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_vote_ledger_poll_user
  ON public.poll_vote_ledger (poll_id, user_id);

ALTER TABLE public.poll_vote_ledger ENABLE ROW LEVEL SECURITY;
-- Deny-all to clients: no policies + explicit revoke. Only definer functions read/write it.
REVOKE ALL ON public.poll_vote_ledger FROM anon, authenticated;

-- 2) Backfill existing NON-anonymous votes so already-cast votes remain deduplicated ------------
INSERT INTO public.poll_vote_ledger (poll_id, option_id, user_id)
SELECT p.id, opt->>'id', (voter #>> '{}')::uuid
FROM public.trip_polls p
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.options::jsonb, '[]'::jsonb)) AS opt
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(opt->'voters', '[]'::jsonb)) AS voter
WHERE jsonb_typeof(COALESCE(opt->'voters', '[]'::jsonb)) = 'array'
  AND opt ? 'id'
  AND (voter #>> '{}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT DO NOTHING;

-- 3) vote_on_poll -------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vote_on_poll(p_poll_id uuid, p_option_id text, p_user_id uuid, p_current_version integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_poll public.trip_polls%ROWTYPE;
  v_options jsonb;
  v_idx integer;
  v_option jsonb;
  v_found boolean := false;
  v_voters jsonb;
  v_already_voted_any boolean := false;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized vote request';
  END IF;

  SELECT * INTO v_poll FROM public.trip_polls WHERE id = p_poll_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.trip_id = v_poll.trip_id
      AND tm.user_id = p_user_id
      AND (tm.status IS NULL OR tm.status = 'active')
  ) THEN
    RAISE EXCEPTION 'You must be a trip member to vote';
  END IF;

  IF v_poll.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'This poll is closed';
  END IF;

  IF v_poll.deadline_at IS NOT NULL AND v_poll.deadline_at <= now() THEN
    RAISE EXCEPTION 'Voting deadline has passed';
  END IF;

  IF p_current_version IS NOT NULL AND v_poll.version IS NOT NULL AND p_current_version <> v_poll.version THEN
    RAISE EXCEPTION 'Poll has been modified by another user. Please refresh and try again.';
  END IF;

  -- Dedup via the private ledger — works for anonymous polls too (voters array stays empty).
  SELECT EXISTS (
    SELECT 1 FROM public.poll_vote_ledger WHERE poll_id = p_poll_id AND user_id = p_user_id
  ) INTO v_already_voted_any;

  IF v_already_voted_any AND COALESCE(v_poll.allow_vote_change, true) = false THEN
    RAISE EXCEPTION 'Vote changes are not allowed for this poll';
  END IF;

  IF v_already_voted_any AND COALESCE(v_poll.allow_multiple, false) = false THEN
    RAISE EXCEPTION 'This poll only allows one option per voter';
  END IF;

  -- Already voted this exact option → idempotent no-op.
  IF EXISTS (
    SELECT 1 FROM public.poll_vote_ledger
    WHERE poll_id = p_poll_id AND option_id = p_option_id AND user_id = p_user_id
  ) THEN
    RETURN;
  END IF;

  v_options := COALESCE(v_poll.options::jsonb, '[]'::jsonb);

  FOR v_idx IN 0..GREATEST(jsonb_array_length(v_options) - 1, 0) LOOP
    v_option := v_options -> v_idx;
    IF v_option ->> 'id' = p_option_id THEN
      v_found := true;
      v_voters := COALESCE(v_option -> 'voters', '[]'::jsonb);

      v_option := jsonb_set(
        v_option, '{votes}',
        to_jsonb(COALESCE((v_option ->> 'votes')::integer, (v_option ->> 'voteCount')::integer, 0) + 1)
      );

      IF NOT COALESCE(v_poll.is_anonymous, false) THEN
        v_option := jsonb_set(v_option, '{voters}', v_voters || to_jsonb(p_user_id::text));
      END IF;

      v_option := v_option - 'voteCount';
      v_options := jsonb_set(v_options, ARRAY[v_idx::text], v_option);
      EXIT;
    END IF;
  END LOOP;

  IF NOT v_found THEN
    RAISE EXCEPTION 'Option not found in poll';
  END IF;

  INSERT INTO public.poll_vote_ledger (poll_id, option_id, user_id)
  VALUES (p_poll_id, p_option_id, p_user_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.trip_polls
  SET options = v_options,
      total_votes = COALESCE(total_votes, 0) + 1,
      version = COALESCE(version, 0) + 1,
      updated_at = now()
  WHERE id = p_poll_id;
END;
$function$;

-- 4) vote_on_poll_batch -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vote_on_poll_batch(p_poll_id uuid, p_option_ids text[], p_user_id uuid, p_current_version integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_poll public.trip_polls%ROWTYPE;
  v_options jsonb;
  v_idx integer;
  v_option jsonb;
  v_voters jsonb;
  v_option_id text;
  v_selected_count integer;
  v_user_votes integer := 0;
  v_vote_delta integer := 0;
  v_matched boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized vote request';
  END IF;

  IF p_option_ids IS NULL OR array_length(p_option_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one option must be selected';
  END IF;

  SELECT * INTO v_poll FROM public.trip_polls WHERE id = p_poll_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.trip_id = v_poll.trip_id
      AND tm.user_id = p_user_id
      AND (tm.status IS NULL OR tm.status = 'active')
  ) THEN
    RAISE EXCEPTION 'You must be a trip member to vote';
  END IF;

  IF v_poll.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'This poll is closed';
  END IF;

  IF v_poll.deadline_at IS NOT NULL AND v_poll.deadline_at <= now() THEN
    RAISE EXCEPTION 'Voting deadline has passed';
  END IF;

  IF p_current_version IS NOT NULL AND v_poll.version IS NOT NULL AND p_current_version <> v_poll.version THEN
    RAISE EXCEPTION 'Poll has been modified by another user. Please refresh and try again.';
  END IF;

  v_selected_count := array_length(p_option_ids, 1);
  IF v_selected_count > 1 AND COALESCE(v_poll.allow_multiple, false) = false THEN
    RAISE EXCEPTION 'This poll only allows one option per voter';
  END IF;

  SELECT count(*) INTO v_user_votes
  FROM public.poll_vote_ledger WHERE poll_id = p_poll_id AND user_id = p_user_id;

  IF v_user_votes > 0 AND COALESCE(v_poll.allow_vote_change, true) = false THEN
    RAISE EXCEPTION 'Vote changes are not allowed for this poll';
  END IF;

  IF v_user_votes > 0 AND COALESCE(v_poll.allow_multiple, false) = false THEN
    RAISE EXCEPTION 'This poll only allows one option per voter';
  END IF;

  v_options := COALESCE(v_poll.options::jsonb, '[]'::jsonb);

  FOREACH v_option_id IN ARRAY p_option_ids LOOP
    v_matched := false;

    FOR v_idx IN 0..GREATEST(jsonb_array_length(v_options) - 1, 0) LOOP
      v_option := v_options -> v_idx;

      IF v_option ->> 'id' = v_option_id THEN
        v_matched := true;

        IF NOT EXISTS (
          SELECT 1 FROM public.poll_vote_ledger
          WHERE poll_id = p_poll_id AND option_id = v_option_id AND user_id = p_user_id
        ) THEN
          v_voters := COALESCE(v_option -> 'voters', '[]'::jsonb);

          v_option := jsonb_set(
            v_option, '{votes}',
            to_jsonb(COALESCE((v_option ->> 'votes')::integer, (v_option ->> 'voteCount')::integer, 0) + 1)
          );

          IF NOT COALESCE(v_poll.is_anonymous, false) THEN
            v_option := jsonb_set(v_option, '{voters}', v_voters || to_jsonb(p_user_id::text));
          END IF;

          v_option := v_option - 'voteCount';
          v_options := jsonb_set(v_options, ARRAY[v_idx::text], v_option);

          INSERT INTO public.poll_vote_ledger (poll_id, option_id, user_id)
          VALUES (p_poll_id, v_option_id, p_user_id)
          ON CONFLICT DO NOTHING;

          v_vote_delta := v_vote_delta + 1;
        END IF;

        EXIT;
      END IF;
    END LOOP;

    IF NOT v_matched THEN
      RAISE EXCEPTION 'Option not found in poll';
    END IF;
  END LOOP;

  IF v_vote_delta = 0 THEN
    RETURN;
  END IF;

  UPDATE public.trip_polls
  SET options = v_options,
      total_votes = COALESCE(total_votes, 0) + v_vote_delta,
      version = COALESCE(version, 0) + 1,
      updated_at = now()
  WHERE id = p_poll_id;
END;
$function$;

-- 5) remove_vote_from_poll ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_vote_from_poll(p_poll_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_poll public.trip_polls%ROWTYPE;
  v_options jsonb;
  v_idx integer;
  v_option jsonb;
  v_voters jsonb;
  v_removed integer := 0;
  v_option_id text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized vote removal request';
  END IF;

  SELECT * INTO v_poll FROM public.trip_polls WHERE id = p_poll_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.trip_id = v_poll.trip_id
      AND tm.user_id = p_user_id
      AND (tm.status IS NULL OR tm.status = 'active')
  ) THEN
    RAISE EXCEPTION 'You must be a trip member to update votes';
  END IF;

  IF COALESCE(v_poll.allow_vote_change, true) = false THEN
    RAISE EXCEPTION 'Vote changes are not allowed for this poll';
  END IF;

  v_options := COALESCE(v_poll.options::jsonb, '[]'::jsonb);

  -- Remove each option the user voted on (per the ledger), decrementing counts and stripping
  -- the voter from the array when present (non-anonymous polls).
  FOR v_option_id IN
    SELECT option_id FROM public.poll_vote_ledger
    WHERE poll_id = p_poll_id AND user_id = p_user_id
  LOOP
    FOR v_idx IN 0..GREATEST(jsonb_array_length(v_options) - 1, 0) LOOP
      v_option := v_options -> v_idx;
      IF v_option ->> 'id' = v_option_id THEN
        v_voters := COALESCE(v_option -> 'voters', '[]'::jsonb);
        IF v_voters ? p_user_id::text THEN
          v_voters := (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(v_voters) elem
            WHERE elem::text <> ('"' || p_user_id::text || '"')
          );
          v_option := jsonb_set(v_option, '{voters}', v_voters);
        END IF;

        v_option := jsonb_set(
          v_option, '{votes}',
          to_jsonb(GREATEST(COALESCE((v_option ->> 'votes')::integer, (v_option ->> 'voteCount')::integer, 0) - 1, 0))
        );
        v_option := v_option - 'voteCount';
        v_options := jsonb_set(v_options, ARRAY[v_idx::text], v_option);
        v_removed := v_removed + 1;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;

  DELETE FROM public.poll_vote_ledger WHERE poll_id = p_poll_id AND user_id = p_user_id;

  IF v_removed > 0 THEN
    UPDATE public.trip_polls
    SET options = v_options,
        total_votes = GREATEST(COALESCE(total_votes, 0) - v_removed, 0),
        version = COALESCE(version, 0) + 1,
        updated_at = now()
    WHERE id = p_poll_id;
  END IF;
END;
$function$;
