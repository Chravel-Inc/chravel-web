-- User Safety Features: Block Users + Report Content
-- Required for Google Play Store approval (communication app safety requirements)

-- ============================================================
-- 1. user_blocks — allows users to block other users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_no_self_block CHECK (blocker_id != blocked_id),
  CONSTRAINT user_blocks_unique UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON public.user_blocks FOR SELECT
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can create their own blocks"
  ON public.user_blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can remove their own blocks"
  ON public.user_blocks FOR DELETE
  USING (blocker_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks (blocked_id);

-- ============================================================
-- 2. content_reports — allows users to report users/content
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trip_id text REFERENCES public.trips(id) ON DELETE SET NULL,
  message_id uuid,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_reports_no_self_report CHECK (reporter_id != reported_user_id)
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.content_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports"
  ON public.content_reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON public.content_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_user ON public.content_reports (reported_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports (status);
