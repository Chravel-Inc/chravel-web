-- Seed GetStream feature flags
-- Enables Stream Chat as the messaging backend for all surfaces.
-- Kill-switch any flag to disable that surface within 60s (client cache TTL).

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('stream-chat-trip', true, 'Trip chat via GetStream — disable to kill-switch back to legacy'),
  ('stream-chat-channels', true, 'Pro role-based channels via GetStream'),
  ('stream-chat-broadcasts', true, 'Broadcasts via GetStream'),
  ('stream-chat-concierge', true, 'AI Concierge conversation persistence via GetStream')
ON CONFLICT (key) DO NOTHING;
