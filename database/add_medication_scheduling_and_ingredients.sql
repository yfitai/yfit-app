-- YFIT medication weekday scheduling and explicit combination ingredients.
-- Run this complete script once in the existing YFIT Supabase SQL Editor.
-- Additive only: existing medication details and dose logs are not changed.
-- NULL means the user has not configured a weekly schedule or ingredients.
BEGIN;

ALTER TABLE public.user_medications
  ADD COLUMN IF NOT EXISTS scheduled_weekdays smallint[];

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.user_medications'::regclass
      AND attname = 'scheduled_weekdays'
      AND NOT attisdropped
      AND atttypid = 'smallint[]'::regtype
  ) THEN
    RAISE EXCEPTION 'user_medications.scheduled_weekdays has an incompatible type; expected smallint[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_medications'::regclass
      AND conname = 'user_medications_scheduled_weekdays_structure_check'
  ) THEN
    ALTER TABLE public.user_medications
      ADD CONSTRAINT user_medications_scheduled_weekdays_structure_check
      CHECK (
        scheduled_weekdays IS NULL
        OR CASE
          WHEN array_ndims(scheduled_weekdays) IS DISTINCT FROM 1 THEN false
          ELSE cardinality(scheduled_weekdays) IN (1, 2)
            AND array_position(scheduled_weekdays, NULL::smallint) IS NULL
            AND scheduled_weekdays <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[]
            AND (
              cardinality(scheduled_weekdays) = 1
              OR scheduled_weekdays[array_lower(scheduled_weekdays, 1)]
                <> scheduled_weekdays[array_upper(scheduled_weekdays, 1)]
            )
        END
      ) NOT VALID;
  END IF;
END;
$migration$;

COMMENT ON COLUMN public.user_medications.scheduled_weekdays IS
  'Optional current weekly choices: Sunday=0 through Saturday=6. NULL means unspecified. UI requires one distinct day for Once weekly, two for Twice weekly; non-weekly uses NULL. No historical schedule is inferred from these choices.';

ALTER TABLE public.user_medications
  ADD COLUMN IF NOT EXISTS combination_ingredients jsonb;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.user_medications'::regclass
      AND attname = 'combination_ingredients'
      AND NOT attisdropped
      AND atttypid = 'jsonb'::regtype
  ) THEN
    RAISE EXCEPTION 'user_medications.combination_ingredients has an incompatible type; expected jsonb';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_medications'::regclass
      AND conname = 'user_medications_combination_ingredients_structure_check'
  ) THEN
    ALTER TABLE public.user_medications
      ADD CONSTRAINT user_medications_combination_ingredients_structure_check
      CHECK (
        combination_ingredients IS NULL
        OR CASE
          WHEN jsonb_typeof(combination_ingredients) = 'array'
            THEN jsonb_array_length(combination_ingredients) <= 20
          ELSE false
        END
      ) NOT VALID;
  END IF;
END;
$migration$;

COMMENT ON COLUMN public.user_medications.combination_ingredients IS
  'Optional explicit ingredient entries (maximum 20): {name, dosage: literal prescribed label strength, medication_id: selected catalog UUID or null}. NULL means no explicit ingredients. No free-text parsing, dose summing, automatic schedule change or clinical clearance.';

-- Constraints check future writes; NOT VALID avoids scanning legacy rows.
-- Do not delete these columns as rollback: that would discard future user choices.
-- No INSERT/UPDATE/DELETE, RLS changes, medication changes, or HTTP calls.
NOTIFY pgrst, 'reload schema';
COMMIT;
