-- Seed Stream Chat feature flags
-- Enable GetStream Chat as the messaging transport for all surfaces.
-- Kill switch: UPDATE feature_flags SET enabled = false WHERE key = 'stream-chat-trip';

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('stream-chat-trip', true, 'Stream Chat for trip messaging — primary chat transport'),
  ('stream-chat-channels', true, 'Stream Chat for pro role-based channels'),
  ('stream-chat-broadcasts', true, 'Stream Chat for broadcast announcements'),
  ('stream-chat-concierge', true, 'Stream Chat for AI concierge history persistence')
ON CONFLICT (key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description;
