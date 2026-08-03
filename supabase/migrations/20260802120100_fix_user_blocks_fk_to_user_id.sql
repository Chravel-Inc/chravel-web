-- B13: Block User was broken (Apple 1.2 safety requirement).
-- user_blocks.blocker_id / blocked_id were declared FOREIGN KEY ... REFERENCES profiles(id),
-- where profiles.id is a random surrogate PK (gen_random_uuid()) distinct from profiles.user_id.
-- Every code path (userSafetyService, getBlockedUserProfiles, the TripChat filter) stores and
-- reads auth.uid() = profiles.user_id in these columns, so the insert failed the FK for
-- essentially every user (id = user_id held for only 1 of 117 profiles).
--
-- Repoint both FKs to profiles(user_id) (which is UNIQUE), matching what the application uses.
-- This corrects data integrity only; it does not affect trip access, auth, or reads.
-- Idempotent: DROP IF EXISTS then re-ADD, so re-running is safe.

ALTER TABLE public.user_blocks DROP CONSTRAINT IF EXISTS user_blocks_blocker_id_fkey;
ALTER TABLE public.user_blocks DROP CONSTRAINT IF EXISTS user_blocks_blocked_id_fkey;

-- Drop any rows that referenced the old surrogate PK and would not satisfy the corrected FK
-- (these are semantically wrong — they point at a profiles.id, not the blocked/blocking user).
DELETE FROM public.user_blocks
WHERE blocker_id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
   OR blocked_id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL);

ALTER TABLE public.user_blocks
  ADD CONSTRAINT user_blocks_blocker_id_fkey
  FOREIGN KEY (blocker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.user_blocks
  ADD CONSTRAINT user_blocks_blocked_id_fkey
  FOREIGN KEY (blocked_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
