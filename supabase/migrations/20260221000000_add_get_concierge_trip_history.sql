-- Migration: Add get_concierge_trip_history RPC
-- Purpose: Returns the authenticated user's concierge chat history for a given trip,
--          formatted as alternating user/assistant message pairs for injection into
--          the AI Concierge prompt context.
-- Security: Uses auth.uid() — never trusts client-provided user_id.
--           RLS on ai_queries (auth.uid() = user_id) remains enforced.
--           EXECUTE granted to authenticated only (not anon).

CREATE OR REPLACE FUNCTION public.get_concierge_trip_history(
  p_trip_id TEXT,
  p_limit   INTEGER DEFAULT 10
)
RETURNS TABLE (
  role       TEXT,
  content    TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- For each row in ai_queries (one exchange = one user query + one assistant response),
  -- emit TWO output rows via CROSS JOIN LATERAL VALUES so the caller gets a flat
  -- chronological message list ready for use as chatHistory.
  --
  -- p_limit is the number of *exchanges* to return (each becomes 2 messages).
  --
  -- IMPORTANT: We want the MOST RECENT p_limit exchanges, not the oldest.
  -- Step 1: inner subquery orders DESC + LIMIT to get the newest exchanges.
  -- Step 2: outer query re-sorts those exchanges ASC so chatHistory is chronological.
  -- Step 3: CROSS JOIN emits user + assistant rows for each exchange.
  SELECT
    pair.role,
    pair.content,
    pair.created_at
  FROM (
    SELECT
      q.query_text,
      q.response_text,
      q.created_at
    FROM public.ai_queries q
    WHERE q.trip_id   = p_trip_id
      AND q.user_id   = auth.uid()
      AND q.query_text    IS NOT NULL
      AND q.response_text IS NOT NULL
    ORDER BY q.created_at DESC   -- newest first so LIMIT keeps the most recent exchanges
    LIMIT p_limit
  ) recent_exchanges
  CROSS JOIN LATERAL (
    VALUES
      ('user'::TEXT,      recent_exchanges.query_text,    recent_exchanges.created_at),
      ('assistant'::TEXT, recent_exchanges.response_text, recent_exchanges.created_at)
  ) AS pair(role, content, created_at)
  ORDER BY pair.created_at ASC, pair.role DESC;
  -- Final ASC sort: restore chronological order for chatHistory injection.
  -- Secondary sort on role DESC: 'user' > 'assistant' alphabetically,
  -- so user message appears before assistant when timestamps are equal.
$$;

-- Grant EXECUTE to authenticated users only. Anon cannot call this function.
--
-- Revoking from `anon` alone is NOT sufficient: Postgres grants EXECUTE on a new function to PUBLIC
-- by default, and `anon` inherits that. Supabase ALSO ships ALTER DEFAULT PRIVILEGES granting it to
-- anon explicitly, so both the implicit PUBLIC grant and the explicit anon grant must be revoked.
-- (This is the same trap that left check_invite_code_exists anon-callable through three separate
-- migrations that each only revoked from one of the two.)
REVOKE EXECUTE ON FUNCTION public.get_concierge_trip_history(TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_concierge_trip_history(TEXT, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_concierge_trip_history(TEXT, INTEGER) TO authenticated;

-- Composite index so the RPC lookup stays fast as ai_queries grows.
-- Covers the WHERE (trip_id, user_id) filter and ORDER BY created_at in one scan.
CREATE INDEX IF NOT EXISTS idx_ai_queries_trip_user_created
  ON public.ai_queries (trip_id, user_id, created_at ASC);
