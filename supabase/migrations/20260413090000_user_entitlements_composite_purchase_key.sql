-- Switch user_entitlements uniqueness from user-only to (user_id, purchase_type)
-- so subscription and pass entitlements can coexist for the same user.

BEGIN;

-- 1) Backfill/normalize purchase_type for legacy rows.
UPDATE public.user_entitlements
SET purchase_type = CASE
  WHEN purchase_type IN ('subscription', 'pass') THEN purchase_type
  ELSE 'subscription'
END
WHERE purchase_type IS NULL OR purchase_type NOT IN ('subscription', 'pass');

-- 2) Safety check: enforce no duplicate rows on the new composite key.
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, purchase_type
    FROM public.user_entitlements
    GROUP BY user_id, purchase_type
    HAVING COUNT(*) > 1
  ) dupes;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      USING MESSAGE = 'Aborting migration: duplicate user_entitlements rows for (user_id, purchase_type). Resolve duplicates before applying composite PK.';
  END IF;
END $$;

-- 3) Replace PK constraint.
ALTER TABLE public.user_entitlements
  DROP CONSTRAINT IF EXISTS user_entitlements_pkey;

ALTER TABLE public.user_entitlements
  ADD CONSTRAINT user_entitlements_pkey PRIMARY KEY (user_id, purchase_type);

-- 4) Add explicit index for purchase_type-targeted reads.
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_purchase_type
  ON public.user_entitlements(user_id, purchase_type);

COMMIT;
