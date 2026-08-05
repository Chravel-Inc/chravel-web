-- Remove stale feature-flag rows that no code reads.
--
-- stream-chat-* (seeded 20260410050000_seed_stream_chat_feature_flags): Stream
-- transport selection moved to the VITE_STREAM_CHAT_DISABLED env switch
-- (src/services/stream/streamTransportGuards.ts) and the stream_changes_canary
-- key (streamCanary.ts). Nothing reads these four keys in src/ or
-- supabase/functions/.
--
-- voice_note_transcripts (seeded 20260713040000): never read anywhere; the
-- shipped voice-notes surface keys off chat_voice_notes instead.
--
-- Idempotent: DELETE of specific keys; re-run is a no-op.

DELETE FROM public.feature_flags
WHERE key IN (
  'stream-chat-trip',
  'stream-chat-channels',
  'stream-chat-broadcasts',
  'stream-chat-concierge',
  'voice_note_transcripts'
);
