-- Add CURRENT weekly choices without changing frequencies, doses, or log history.
-- NULL is an unspecified schedule, never a default or inferred weekday.
-- Run separately through the authorized schema deployment process.
BEGIN;

ALTER TABLE public.user_medications
  ADD COLUMN IF NOT EXISTS scheduled_weekdays smallint[];

-- ADD IF NOT EXISTS cannot establish an already-existing column's SQL type.
-- Fail safely on an incompatible type; never cast or rewrite patient values.
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.user_medications'::regclass
      AND attname = 'scheduled_weekdays'
      AND NOT attisdropped
      AND atttypid = 'smallint[]'::regtype
  ) THEN
    RAISE EXCEPTION 'user_medications.scheduled_weekdays exists with an incompatible type; expected smallint[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_medications'::regclass
      AND conname = 'user_medications_scheduled_weekdays_structure_check'
  ) THEN
    ALTER TABLE public.user_medications
      ADD CONSTRAINT user_medications_scheduled_weekdays_structure_check
      CHECK (
        scheduled_weekdays IS NULL
        OR CASE
          -- CASE prevents array_position being called on a multidimensional
          -- array. Empty arrays have NULL dimensions and are also rejected.
          WHEN array_ndims(scheduled_weekdays) IS DISTINCT FROM 1 THEN false
          ELSE
            cardinality(scheduled_weekdays) IN (1, 2)
            AND array_position(scheduled_weekdays, NULL::smallint) IS NULL
            AND scheduled_weekdays <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[]
            AND (
              cardinality(scheduled_weekdays) = 1
              OR scheduled_weekdays[array_lower(scheduled_weekdays, 1)]
                 <> scheduled_weekdays[array_upper(scheduled_weekdays, 1)]
            )
        END
      ) NOT VALID;
      -- NOT VALID does not scan or rewrite existing patient rows. It still
      -- checks new/updated values. NULL legacy schedules remain valid. A later
      -- validation, if desired, is a separate authorized deployment action.
  END IF;
END;
$migration$;

COMMENT ON COLUMN public.user_medications.scheduled_weekdays IS
  'Optional current weekly schedule: Sunday=0 through Saturday=6. NULL means unspecified; never infer weekdays from old logs or start_date. UI requires one distinct day for Once weekly and two for Twice weekly, and uses NULL for non-weekly frequencies. This column does not version historical schedules.';

-- Deliberately structural only: do not couple the CHECK to frequency, so old
-- clients can change frequency without invalidating otherwise valid arrays.
-- No backfill/default, frequency changes, log edits, RLS changes, or HTTP calls.
NOTIFY pgrst, 'reload schema';
COMMIT;
