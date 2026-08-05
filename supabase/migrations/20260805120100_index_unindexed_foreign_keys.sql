-- Scale hardening 2/3: add the missing index behind every unindexed foreign key.
--
-- THE PROBLEM
-- Postgres automatically indexes a PRIMARY KEY and a UNIQUE constraint, but NOT a FOREIGN KEY. The
-- index on a FK column is the child's responsibility, and 43 of them were missing. Two costs:
--
--   1. Every DELETE or key-UPDATE on the parent must prove no child row references it. Without an
--      index that is a sequential scan of the entire child table, per parent row. Deleting one trip
--      currently cascades through ~20 child tables, most of them unindexed.
--   2. Ordinary joins and lookups on those columns fall back to sequential scans.
--
-- Both are free today (no table exceeds ~700 rows) and become the dominant cost the moment chat
-- messages, notifications and payment splits grow — which is precisely what launching is meant to do.
--
-- The list is not hand-written: it was generated from pg_constraint/pg_index by selecting every
-- single-column FK in `public` with no index whose leading column matches, so it cannot drift from
-- reality or miss one.
--
-- NOTE ON CONCURRENTLY: these are plain CREATE INDEX, which takes a brief ACCESS EXCLUSIVE lock,
-- because a migration runs inside a transaction and CREATE INDEX CONCURRENTLY cannot. At current
-- volumes each index builds in milliseconds. Once any of these tables reaches millions of rows,
-- build future indexes with CONCURRENTLY outside a transaction instead.
--
-- Regression scope: additive indexes only. Indexes change performance, never results — no policy,
-- predicate, trip fetch, auth path or payment state is touched. Fully idempotent.

CREATE INDEX IF NOT EXISTS idx_ai_queries_user_id ON public.ai_queries (user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_user_id ON public.campaign_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_category_assignments_task_id ON public.category_assignments (task_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_trip_id ON public.content_reports (trip_id);
CREATE INDEX IF NOT EXISTS idx_event_agenda_items_created_by ON public.event_agenda_items (created_by);
CREATE INDEX IF NOT EXISTS idx_event_lineup_members_created_by ON public.event_lineup_members (created_by);
CREATE INDEX IF NOT EXISTS idx_event_qa_questions_answered_by_user_id ON public.event_qa_questions (answered_by_user_id);
CREATE INDEX IF NOT EXISTS idx_event_qa_questions_user_id ON public.event_qa_questions (user_id);
CREATE INDEX IF NOT EXISTS idx_event_qa_upvotes_user_id ON public.event_qa_upvotes (user_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_created_by ON public.event_tasks (created_by);
CREATE INDEX IF NOT EXISTS idx_event_tasks_event_id ON public.event_tasks (event_id);
CREATE INDEX IF NOT EXISTS idx_game_schedules_organization_id ON public.game_schedules (organization_id);
CREATE INDEX IF NOT EXISTS idx_game_schedules_trip_id ON public.game_schedules (trip_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_invited_by ON public.organization_invites (invited_by);
CREATE INDEX IF NOT EXISTS idx_organization_members_invited_by ON public.organization_members (invited_by);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_organization_seats_assigned_member_id ON public.organization_seats (assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_organization_subscription_links_billing_record_id ON public.organization_subscription_links (billing_record_id);
CREATE INDEX IF NOT EXISTS idx_organization_team_members_organization_member_id ON public.organization_team_members (organization_member_id);
CREATE INDEX IF NOT EXISTS idx_organization_teams_created_by ON public.organization_teams (created_by);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_actor_user_id ON public.payment_audit_log (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_payment_message_id ON public.payment_audit_log (payment_message_id);
CREATE INDEX IF NOT EXISTS idx_payment_split_patterns_participant_id ON public.payment_split_patterns (participant_id);
CREATE INDEX IF NOT EXISTS idx_payment_split_patterns_user_id ON public.payment_split_patterns (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_confirmed_by ON public.payment_splits (confirmed_by);
CREATE INDEX IF NOT EXISTS idx_pro_trip_organizations_created_by ON public.pro_trip_organizations (created_by);
CREATE INDEX IF NOT EXISTS idx_pro_trip_organizations_organization_id ON public.pro_trip_organizations (organization_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_items_created_by ON public.recommendation_items (created_by);
CREATE INDEX IF NOT EXISTS idx_show_schedules_organization_id ON public.show_schedules (organization_id);
CREATE INDEX IF NOT EXISTS idx_show_schedules_trip_id ON public.show_schedules (trip_id);
CREATE INDEX IF NOT EXISTS idx_smart_import_usage_trip_id ON public.smart_import_usage (trip_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_granted_by ON public.super_admins (granted_by);
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins (user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_by ON public.task_assignments (assigned_by);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON public.task_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_trip_base_camps_created_by ON public.trip_base_camps (created_by);
CREATE INDEX IF NOT EXISTS idx_trip_chat_messages_reply_to_id ON public.trip_chat_messages (reply_to_id);
CREATE INDEX IF NOT EXISTS idx_trip_link_index_message_id ON public.trip_link_index (message_id);
CREATE INDEX IF NOT EXISTS idx_trip_media_index_message_id ON public.trip_media_index (message_id);
CREATE INDEX IF NOT EXISTS idx_trip_pending_actions_resolved_by ON public.trip_pending_actions (resolved_by);
CREATE INDEX IF NOT EXISTS idx_trip_personal_base_camps_user_id ON public.trip_personal_base_camps (user_id);
CREATE INDEX IF NOT EXISTS idx_trip_personal_basecamps_user_id ON public.trip_personal_basecamps (user_id);
CREATE INDEX IF NOT EXISTS idx_trip_polls_closed_by ON public.trip_polls (closed_by);
