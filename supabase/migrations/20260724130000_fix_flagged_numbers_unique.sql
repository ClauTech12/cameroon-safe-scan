-- Fix: flagged_numbers.phone_number is supposed to be UNIQUE (per the
-- original migration), but the live constraint appears to be missing --
-- causing "no unique or exclusion constraint matching ON CONFLICT" when
-- the app upserts a flag status. This migration is idempotent and safe
-- to run even if the constraint is partially present or absent.

-- 1) De-duplicate any existing rows for the same phone_number, keeping
--    the most recently updated one, before we can safely add UNIQUE.
DELETE FROM public.flagged_numbers a
USING public.flagged_numbers b
WHERE a.phone_number = b.phone_number
  AND a.ctid <> b.ctid
  AND (a.updated_at, a.id) < (b.updated_at, b.id);

-- 2) Add the UNIQUE constraint if it isn't already there.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.flagged_numbers'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE public.flagged_numbers
      ADD CONSTRAINT flagged_numbers_phone_number_key UNIQUE (phone_number);
  END IF;
END $$;
