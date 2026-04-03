-- Add per-trip hero rendering preference for cover images.
-- Backward compatible: existing trips default to 'cover'.
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS cover_display_mode TEXT NOT NULL DEFAULT 'cover'
CHECK (cover_display_mode IN ('cover', 'contain'));

UPDATE public.trips
SET cover_display_mode = 'cover'
WHERE cover_display_mode IS NULL;
